/**
 * Local Memory Backend — SQLite + FTS5 keyword search.
 *
 * Zero cost, unlimited usage, works offline.
 * Stores under the active tenant's memory dir (see src/tenant/resolver.ts).
 *
 * Features:
 * - Namespaced memory (same containerTag pattern as supermemory)
 * - Keyword search (SQLite FTS5)
 * - Memory versioning (updates create new versions)
 * - Importance scoring
 * - No external dependencies at runtime
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tenantPath } from '../tenant/resolver.js';

const DB_DIR = tenantPath('memory');
const DB_PATH = join(DB_DIR, 'memory.db');

export interface LocalMemory {
  id: string;
  namespace: string;
  content: string;
  metadata: Record<string, unknown>;
  importance: number;
  version: number;
  isLatest: boolean;
  createdAt: string;
  updatedAt: string;
  accessCount: number;
  lastAccessedAt: string | null;
}

export interface LocalSearchResult {
  id: string;
  namespace: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
  matchType: 'keyword' | 'exact';
}

export class LocalMemoryStore {
  private db: InstanceType<typeof Database>;

  constructor(dbPath?: string) {
    const path = dbPath || DB_PATH;
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        namespace TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT DEFAULT '{}',
        importance REAL DEFAULT 0.5,
        version INTEGER DEFAULT 1,
        is_latest INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        access_count INTEGER DEFAULT 0,
        last_accessed_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_memories_namespace ON memories(namespace);
      CREATE INDEX IF NOT EXISTS idx_memories_latest ON memories(is_latest);
      CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance DESC);
    `);

    // FTS5 for keyword search
    this.db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        content,
        namespace,
        content_rowid='rowid'
      );
    `);

    // Trigger to keep FTS in sync
    this.db.exec(`
      CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts(rowid, content, namespace)
        VALUES (NEW.rowid, NEW.content, NEW.namespace);
      END;
    `);
  }

  /**
   * Store a memory in a namespace.
   */
  store(entry: {
    content: string;
    namespace: string;
    metadata?: Record<string, unknown>;
    importance?: number;
    customId?: string;
  }): string {
    const id = entry.customId || `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    this.db.prepare(`
      INSERT INTO memories (id, namespace, content, metadata, importance, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      entry.namespace,
      entry.content,
      JSON.stringify(entry.metadata || {}),
      entry.importance ?? 0.5,
      now,
      now
    );

    return id;
  }

  /**
   * Store multiple memories at once (transactional).
   */
  storeBatch(entries: Array<{
    content: string;
    namespace: string;
    metadata?: Record<string, unknown>;
    importance?: number;
  }>): number {
    const insert = this.db.prepare(`
      INSERT INTO memories (id, namespace, content, metadata, importance, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = this.db.transaction((items: typeof entries) => {
      const now = new Date().toISOString();
      for (const entry of items) {
        const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        insert.run(id, entry.namespace, entry.content, JSON.stringify(entry.metadata || {}), entry.importance ?? 0.5, now, now);
      }
      return items.length;
    });

    return tx(entries);
  }

  /**
   * Search memories by keyword across one or more namespaces.
   */
  search(query: string, options?: {
    namespaces?: string[];
    limit?: number;
    minImportance?: number;
  }): LocalSearchResult[] {
    const limit = options?.limit ?? 10;
    const minImportance = options?.minImportance ?? 0;

    let results: LocalSearchResult[] = [];

    // FTS5 keyword search
    try {
      const ftsQuery = query.split(/\s+/).map(w => `"${w}"`).join(' OR ');
      let sql = `
        SELECT m.id, m.namespace, m.content, m.metadata, m.importance,
               rank AS score
        FROM memories_fts fts
        JOIN memories m ON m.rowid = fts.rowid
        WHERE memories_fts MATCH ?
          AND m.is_latest = 1
          AND m.importance >= ?
      `;
      const params: unknown[] = [ftsQuery, minImportance];

      if (options?.namespaces && options.namespaces.length > 0) {
        sql += ` AND m.namespace IN (${options.namespaces.map(() => '?').join(',')})`;
        params.push(...options.namespaces);
      }

      sql += ` ORDER BY rank LIMIT ?`;
      params.push(limit);

      const rows = this.db.prepare(sql).all(...params) as any[];
      results = rows.map(r => ({
        id: r.id,
        namespace: r.namespace,
        content: r.content,
        metadata: JSON.parse(r.metadata || '{}'),
        score: Math.abs(r.score),
        matchType: 'keyword' as const,
      }));
    } catch {
      // FTS query failed — fall back to LIKE search
      let sql = `
        SELECT id, namespace, content, metadata, importance
        FROM memories
        WHERE content LIKE ?
          AND is_latest = 1
          AND importance >= ?
      `;
      const params: unknown[] = [`%${query}%`, minImportance];

      if (options?.namespaces && options.namespaces.length > 0) {
        sql += ` AND namespace IN (${options.namespaces.map(() => '?').join(',')})`;
        params.push(...options.namespaces);
      }

      sql += ` ORDER BY importance DESC LIMIT ?`;
      params.push(limit);

      const rows = this.db.prepare(sql).all(...params) as any[];
      results = rows.map(r => ({
        id: r.id,
        namespace: r.namespace,
        content: r.content,
        metadata: JSON.parse(r.metadata || '{}'),
        score: r.importance,
        matchType: 'exact' as const,
      }));
    }

    // Update access counts
    const updateAccess = this.db.prepare(
      `UPDATE memories SET access_count = access_count + 1, last_accessed_at = ? WHERE id = ?`
    );
    const now = new Date().toISOString();
    for (const r of results) {
      updateAccess.run(now, r.id);
    }

    return results;
  }

  /**
   * Get all memories in a namespace.
   */
  list(namespace: string, options?: { limit?: number; offset?: number }): LocalMemory[] {
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const rows = this.db.prepare(`
      SELECT * FROM memories
      WHERE namespace = ? AND is_latest = 1
      ORDER BY importance DESC, created_at DESC
      LIMIT ? OFFSET ?
    `).all(namespace, limit, offset) as any[];

    return rows.map(r => ({
      ...r,
      metadata: JSON.parse(r.metadata || '{}'),
      isLatest: !!r.is_latest,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      accessCount: r.access_count,
      lastAccessedAt: r.last_accessed_at,
    }));
  }

  /**
   * Update a memory (creates new version, marks old as not latest).
   */
  update(id: string, content: string, metadata?: Record<string, unknown>): string {
    const existing = this.db.prepare(`SELECT * FROM memories WHERE id = ?`).get(id) as any;
    if (!existing) throw new Error(`Memory not found: ${id}`);

    const now = new Date().toISOString();
    this.db.prepare(`UPDATE memories SET is_latest = 0 WHERE id = ?`).run(id);

    const newId = `${id}-v${existing.version + 1}`;
    this.db.prepare(`
      INSERT INTO memories (id, namespace, content, metadata, importance, version, is_latest, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      newId, existing.namespace, content,
      JSON.stringify(metadata || JSON.parse(existing.metadata || '{}')),
      existing.importance, existing.version + 1, existing.created_at, now
    );

    return newId;
  }

  /**
   * Soft-delete a memory (mark as not latest, keep for history).
   */
  forget(id: string): void {
    this.db.prepare(`UPDATE memories SET is_latest = 0 WHERE id = ?`).run(id);
  }

  /**
   * Get namespace statistics.
   */
  stats(): Record<string, { count: number; latestCount: number }> {
    const rows = this.db.prepare(`
      SELECT namespace,
             COUNT(*) as total,
             SUM(CASE WHEN is_latest = 1 THEN 1 ELSE 0 END) as latest
      FROM memories
      GROUP BY namespace
      ORDER BY namespace
    `).all() as any[];

    const result: Record<string, { count: number; latestCount: number }> = {};
    for (const r of rows) {
      result[r.namespace] = { count: r.total, latestCount: r.latest };
    }
    return result;
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.db.close();
  }
}
