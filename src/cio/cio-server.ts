/**
 * CIO — Chief Information Officer Agent
 * =======================================
 * Always-on Opus-powered service on Optimus.
 * Single source of truth for all sessions, agents, and platforms.
 *
 * Endpoints:
 *   POST /cio/report   — Session reports events (decisions, discoveries, corrections)
 *   POST /cio/query    — Session asks for context
 *   POST /cio/correct  — Alex/Solace corrects a piece of knowledge
 *   GET  /cio/briefing — Morning briefing
 *   GET  /cio/timeline — Chronological event view
 *   GET  /cio/status   — Health check
 *
 * Port: 8100 (Tailscale-accessible)
 */

import express from 'express';
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { tenantPath } from '../tenant/resolver.js';

// ─── Config ───────────────────────────────────

const PORT = parseInt(process.env.CIO_PORT || '8100');
const DB_DIR = tenantPath('memory');
const DB_PATH = join(DB_DIR, 'cio.db');
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const OPUS_MODEL = 'anthropic/claude-opus-4';
const MEMORY_DIR = join(homedir(), '.claude/projects/-Users-alexl/memory');

// ─── Database ─────────────────────────────────

if (!existsSync(DB_DIR)) mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS cio_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    device TEXT,
    agent TEXT,
    event_type TEXT NOT NULL,
    summary TEXT NOT NULL,
    details TEXT,
    tags TEXT,
    importance INTEGER DEFAULT 5,
    timestamp TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cio_context (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_by TEXT,
    updated_at TEXT NOT NULL,
    history TEXT DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS cio_corrections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wrong_claim TEXT NOT NULL,
    correct_info TEXT NOT NULL,
    corrected_by TEXT,
    timestamp TEXT NOT NULL,
    applied_to TEXT DEFAULT '[]'
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS cio_events_fts USING fts5(
    summary, details, tags, content=cio_events, content_rowid=id
  );

  CREATE TRIGGER IF NOT EXISTS cio_events_ai AFTER INSERT ON cio_events BEGIN
    INSERT INTO cio_events_fts(rowid, summary, details, tags)
    VALUES (new.id, new.summary, new.details, new.tags);
  END;
`);

// ─── LLM Calls ────────────────────────────────

async function callLLM(model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  if (!OPENROUTER_KEY) {
    return '[CIO] No OpenRouter key configured. Running in offline mode.';
  }

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://siempretequila.com',
      'X-Title': 'Siempre CIO Agent',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    }),
  });

  const data = await resp.json() as any;
  return data.choices?.[0]?.message?.content || '[CIO] No response from model.';
}

const CIO_SYSTEM = `You are the Chief Information Officer (CIO) of Siempre Spirits' AI infrastructure.
You are the single source of truth across all sessions, agents, platforms, and devices.

Your job:
1. When queried, synthesize relevant knowledge from events, context, corrections, and memory files
2. Always cite your sources (which session reported it, when)
3. Flag when information might be stale
4. Be concise but complete — the agent querying you needs actionable context, not essays
5. If you don't know something, say so. Never fabricate.

Company: Siempre Spirits Limited — Canadian-Mexican tequila company. CEO: Alex Lacroix. COO: Monica Sanita.
Key systems: Dashboard v3, Data Vault, Reporting Pipeline, Siempre Swarm, GAWD, FieldKit, Combobulator, ReviewShield.
Agents: Solace (Claude Opus, primary), Rook (OpenClaw), Pepe (WhatsApp), Orion (Optimus OpenClaw).`;

// ─── Memory File Reader ───────────────────────

function readMemoryFiles(): string {
  try {
    if (!existsSync(MEMORY_DIR)) return '';
    const files = readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md') && f !== 'MEMORY.md');
    const summaries: string[] = [];
    for (const file of files.slice(0, 30)) {
      const content = readFileSync(join(MEMORY_DIR, file), 'utf-8');
      const firstLines = content.split('\n').slice(0, 5).join('\n');
      summaries.push(`[${file}] ${firstLines}`);
    }
    return summaries.join('\n---\n');
  } catch {
    return '';
  }
}

// ─── Express App ──────────────────────────────

const app = express();
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/cio/status', (_req, res) => {
  const eventCount = (db.prepare('SELECT COUNT(*) as c FROM cio_events').get() as any).c;
  const contextCount = (db.prepare('SELECT COUNT(*) as c FROM cio_context').get() as any).c;
  const lastEvent = db.prepare('SELECT timestamp, summary FROM cio_events ORDER BY id DESC LIMIT 1').get() as any;

  res.json({
    status: 'online',
    agent: 'CIO',
    model: OPUS_MODEL,
    events_stored: eventCount,
    context_keys: contextCount,
    last_event: lastEvent || null,
    uptime_seconds: Math.floor(process.uptime()),
    has_openrouter_key: !!OPENROUTER_KEY,
  });
});

// Report events
app.post('/cio/report', (req, res) => {
  const { session_id, platform, device, agent, events, context_updates } = req.body;

  if (!session_id || !platform || !events?.length) {
    return res.status(400).json({ error: 'Missing session_id, platform, or events' });
  }

  const now = new Date().toISOString();
  const insertEvent = db.prepare(`
    INSERT INTO cio_events (session_id, platform, device, agent, event_type, summary, details, tags, importance, timestamp, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertedIds: number[] = [];
  const insertMany = db.transaction(() => {
    for (const event of events) {
      const result = insertEvent.run(
        session_id, platform, device || null, agent || null,
        event.type, event.summary, event.details || null,
        JSON.stringify(event.tags || []), event.importance || 5,
        event.timestamp || now, now
      );
      insertedIds.push(result.lastInsertRowid as number);
    }

    if (context_updates?.length) {
      const upsert = db.prepare(`
        INSERT INTO cio_context (key, value, updated_by, updated_at, history)
        VALUES (?, ?, ?, ?, '[]')
        ON CONFLICT(key) DO UPDATE SET
          history = json_insert(cio_context.history, '$[#]', json_object('value', cio_context.value, 'at', cio_context.updated_at)),
          value = excluded.value,
          updated_by = excluded.updated_by,
          updated_at = excluded.updated_at
      `);
      for (const ctx of context_updates) {
        upsert.run(ctx.key, ctx.value, session_id, now);
      }
    }
  });

  insertMany();

  console.log(`[CIO] Report from ${platform}/${agent || 'unknown'}: ${events.length} events`);
  res.json({ received: insertedIds.length, ids: insertedIds });
});

// Query the CIO
app.post('/cio/query', async (req, res) => {
  const { query, tags, max_results = 10 } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing query' });
  }

  // Search events via FTS
  const searchTerms = query.replace(/[^\w\s]/g, ' ').trim();
  const ftsResults = searchTerms ? db.prepare(`
    SELECT e.id, e.session_id, e.platform, e.agent, e.event_type, e.summary, e.details, e.tags, e.importance, e.timestamp
    FROM cio_events_fts f
    JOIN cio_events e ON f.rowid = e.id
    WHERE cio_events_fts MATCH ?
    ORDER BY e.importance DESC, e.timestamp DESC
    LIMIT ?
  `).all(searchTerms, max_results) as any[] : [];

  // Fall back to recent events if FTS returns nothing
  const recentEvents = ftsResults.length === 0 ? db.prepare(`
    SELECT id, session_id, platform, agent, event_type, summary, details, tags, importance, timestamp
    FROM cio_events
    ORDER BY importance DESC, timestamp DESC
    LIMIT ?
  `).all(max_results) as any[] : [];

  const events = ftsResults.length > 0 ? ftsResults : recentEvents;

  // Get relevant context keys
  const contextRows = db.prepare('SELECT key, value, updated_at FROM cio_context ORDER BY updated_at DESC LIMIT 20').all() as any[];

  // Get recent corrections
  const corrections = db.prepare('SELECT wrong_claim, correct_info, timestamp FROM cio_corrections ORDER BY timestamp DESC LIMIT 5').all() as any[];

  // Read memory files for additional context
  const memoryContext = readMemoryFiles();

  // Build prompt for Opus
  const contextBlock = [
    '## Recent Events',
    events.map(r => `- [${r.timestamp}] (${r.platform}/${r.agent}) ${r.summary}`).join('\n') || 'No matching events.',
    '',
    '## Current Context',
    contextRows.map(r => `- ${r.key}: ${r.value} (updated ${r.updated_at})`).join('\n') || 'No context stored.',
    '',
    '## Recent Corrections',
    corrections.map(r => `- WRONG: "${r.wrong_claim}" → CORRECT: "${r.correct_info}"`).join('\n') || 'No corrections.',
    '',
    '## Memory Files (summaries)',
    memoryContext.slice(0, 3000) || 'No memory files found.',
  ].join('\n');

  const answer = await callLLM(
    OPUS_MODEL,
    CIO_SYSTEM,
    `Context available to you:\n${contextBlock}\n\nQuery: ${query}\n\nProvide a concise, sourced answer.`
  );

  res.json({
    answer,
    sources: events.map(r => ({ session: r.session_id, event: r.summary, timestamp: r.timestamp })),
    context: contextRows.slice(0, 5),
    corrections: corrections.slice(0, 3),
  });
});

// Corrections
app.post('/cio/correct', (req, res) => {
  const { wrong_claim, correct_info, corrected_by } = req.body;

  if (!wrong_claim || !correct_info) {
    return res.status(400).json({ error: 'Missing wrong_claim or correct_info' });
  }

  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO cio_corrections (wrong_claim, correct_info, corrected_by, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(wrong_claim, correct_info, corrected_by || 'alex', now);

  console.log(`[CIO] Correction recorded: "${wrong_claim}" → "${correct_info}"`);
  res.json({ id: result.lastInsertRowid, recorded: true });
});

// Morning briefing
app.get('/cio/briefing', async (_req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const recentEvents = db.prepare(`
    SELECT session_id, platform, agent, event_type, summary, importance, timestamp
    FROM cio_events
    WHERE timestamp > ?
    ORDER BY importance DESC, timestamp DESC
    LIMIT 20
  `).all(since) as any[];

  const pendingContext = db.prepare('SELECT key, value, updated_at FROM cio_context ORDER BY updated_at DESC LIMIT 10').all() as any[];

  const eventsBlock = recentEvents.map(e =>
    `- [${e.event_type}] (${e.platform}/${e.agent}, importance ${e.importance}) ${e.summary}`
  ).join('\n') || 'No events in the last 24 hours.';

  const answer = await callLLM(
    OPUS_MODEL,
    CIO_SYSTEM,
    `Generate a morning briefing. Here's what happened in the last 24 hours:\n\n${eventsBlock}\n\nCurrent context:\n${pendingContext.map(c => `${c.key}: ${c.value}`).join('\n')}\n\nFormat: bullet points, most important first. Flag anything that needs Alex's attention.`
  );

  res.json({ briefing: answer, event_count: recentEvents.length, since });
});

// Timeline
app.get('/cio/timeline', (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const events = db.prepare(`
    SELECT id, session_id, platform, device, agent, event_type, summary, importance, timestamp
    FROM cio_events
    WHERE timestamp > ?
    ORDER BY timestamp DESC
    LIMIT 100
  `).all(since) as any[];

  res.json({ events, days, count: events.length });
});

// ─── Start ────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  const eventCount = (db.prepare('SELECT COUNT(*) as c FROM cio_events').get() as any).c;
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║   CIO — Chief Information Officer         ║');
  console.log('║   Siempre Swarm Intelligence Layer        ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log(`║   Port: ${PORT}                              ║`);
  console.log(`║   Events: ${String(eventCount).padEnd(32)}║`);
  console.log(`║   Model: Opus                             ║`);
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');
});

export { app, db };
