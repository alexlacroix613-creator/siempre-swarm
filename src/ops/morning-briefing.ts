#!/usr/bin/env node
/**
 * Morning Briefing — The Daily Standup
 *
 * Runs at session start. Scans all projects, checks deployments,
 * reads session memory, shows quality scores. Gives Opus a complete
 * picture before any work begins.
 *
 * Usage:
 *   npx tsx src/ops/morning-briefing.ts
 *
 * What it checks:
 *   1. Last session summary (what we did, what's pending)
 *   2. Git status across all repos (uncommitted work, recent commits)
 *   3. Deployment health (are live URLs responding?)
 *   4. Quality scores (how are the agents performing?)
 *   5. Pending tasks / blockers
 *   6. Calendar (if available — what's on today?)
 */

import { execFileSync } from 'child_process';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { LocalMemoryStore } from '../memory/local-memory.js';
import { QualityTracker } from '../governance/quality-tracker.js';
import { PRODUCT_TEAMS } from '../departments/product-teams.js';
import { DEPARTMENTS } from '../departments/registry.js';
import { tenantPath } from '../tenant/resolver.js';

const HOME = homedir();
const MEMORY_DIR = tenantPath('memory');

// ============================================================================
// GIT STATUS ACROSS REPOS
// ============================================================================

interface RepoStatus {
  name: string;
  path: string;
  branch: string;
  uncommittedFiles: number;
  lastCommit: string;
  lastCommitAge: string;
}

function checkRepo(name: string, path: string): RepoStatus | null {
  const fullPath = path.replace('~', HOME);
  if (!existsSync(join(fullPath, '.git'))) return null;

  try {
    const branch = execFileSync('git', ['branch', '--show-current'], { cwd: fullPath, encoding: 'utf-8' }).trim();
    const statusCount = execFileSync('git', ['status', '--short'], { cwd: fullPath, encoding: 'utf-8' }).trim().split('\n').filter(l => l.length > 0).length;
    const lastCommit = execFileSync('git', ['log', '-1', '--format=%s'], { cwd: fullPath, encoding: 'utf-8' }).trim();
    const lastCommitAge = execFileSync('git', ['log', '-1', '--format=%ar'], { cwd: fullPath, encoding: 'utf-8' }).trim();

    return { name, path: fullPath, branch, uncommittedFiles: statusCount, lastCommit, lastCommitAge };
  } catch {
    return null;
  }
}

// ============================================================================
// DEPLOYMENT HEALTH
// ============================================================================

interface DeployHealth {
  name: string;
  url: string;
  status: 'up' | 'down' | 'unknown';
  responseTime?: number;
}

async function checkDeployment(name: string, url: string): Promise<DeployHealth> {
  try {
    const start = Date.now();
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    return {
      name,
      url,
      status: response.ok ? 'up' : 'down',
      responseTime: Date.now() - start,
    };
  } catch {
    return { name, url, status: 'unknown' };
  }
}

// ============================================================================
// LAST SESSION
// ============================================================================

interface SessionSummary {
  lastSessionDate: string;
  whatWeDid: string[];
  whatsPending: string[];
  decisionsLogged: string[];
}

function getLastSession(): SessionSummary | null {
  const sessionDir = join(MEMORY_DIR, 'sessions');
  if (!existsSync(sessionDir)) return null;

  const files = readdirSync(sessionDir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) return null;

  try {
    const content = readFileSync(join(sessionDir, files[0]), 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// ============================================================================
// MAIN BRIEFING
// ============================================================================

async function generateBriefing(): Promise<string> {
  const lines: string[] = [
    '',
    '╔══════════════════════════════════════════════════════╗',
    '║          SIEMPRE SWARM — MORNING BRIEFING           ║',
    `║          ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
    '╚══════════════════════════════════════════════════════╝',
    '',
  ];

  // 1. Last session
  const lastSession = getLastSession();
  if (lastSession) {
    lines.push('── LAST SESSION ──');
    lines.push(`Date: ${lastSession.lastSessionDate}`);
    if (lastSession.whatWeDid.length > 0) {
      lines.push('Completed:');
      lastSession.whatWeDid.forEach(w => lines.push(`  ✓ ${w}`));
    }
    if (lastSession.whatsPending.length > 0) {
      lines.push('Pending:');
      lastSession.whatsPending.forEach(p => lines.push(`  ○ ${p}`));
    }
    lines.push('');
  }

  // 2. Git status across repos
  lines.push('── REPO STATUS ──');
  const repos: Array<[string, string]> = [
    ['Siempre Swarm', tenantPath('swarm')],
    ['Combobulator', '~/CLAUDE BRAIN/Combobulator'],
    ['FieldKit', '~/fieldkit'],
    ['GAWD', '~/CLAUDE BRAIN/GAWD'],
    ['ReviewShield', '~/CLAUDE BRAIN/ReviewShield'],
    ['Billy', '~/CLAUDE BRAIN/builds/billy-creative'],
  ];

  for (const [name, path] of repos) {
    const status = checkRepo(name, path);
    if (status) {
      const dirty = status.uncommittedFiles > 0 ? ` ⚠ ${status.uncommittedFiles} uncommitted` : '';
      lines.push(`  ${name}: ${status.branch}${dirty} — "${status.lastCommit}" (${status.lastCommitAge})`);
    }
  }
  lines.push('');

  // 3. Deployment health
  lines.push('── DEPLOYMENT HEALTH ──');
  const deployments: Array<[string, string]> = [
    ['Combobulator', 'https://combobulator.tech'],
    ['FieldKit', 'https://fieldkit-ai.netlify.app'],
    ['ReviewShield Landing', 'https://reviewshield-landing.netlify.app'],
    ['Incentive Planner', 'https://siempre-incentive-planner.netlify.app'],
  ];

  const healthChecks = await Promise.all(
    deployments.map(([name, url]) => checkDeployment(name, url))
  );

  for (const h of healthChecks) {
    const icon = h.status === 'up' ? '●' : h.status === 'down' ? '○' : '?';
    const time = h.responseTime ? ` (${h.responseTime}ms)` : '';
    lines.push(`  ${icon} ${h.name}: ${h.status}${time}`);
  }
  lines.push('');

  // 4. Quality scores
  lines.push('── AGENT QUALITY ──');
  try {
    const tracker = new QualityTracker();
    const report = tracker.formatReport();
    lines.push(report === 'No reviews recorded yet.' ? '  No reviews yet — tracking starts with first swarm task' : report);
    tracker.close();
  } catch {
    lines.push('  Quality database not initialized yet');
  }
  lines.push('');

  // 5. Swarm overview
  lines.push('── SWARM STATUS ──');
  const deptCount = Object.keys(DEPARTMENTS).length;
  const productCount = Object.keys(PRODUCT_TEAMS).length;
  lines.push(`  Departments: ${deptCount} | Product Teams: ${productCount}`);
  lines.push(`  Local memory: ${join(MEMORY_DIR, 'memory.db')}`);

  try {
    const memory = new LocalMemoryStore();
    const stats = memory.stats();
    const totalMemories = Object.values(stats).reduce((sum, s) => sum + s.latestCount, 0);
    const namespaces = Object.keys(stats).length;
    lines.push(`  Memories: ${totalMemories} across ${namespaces} namespaces`);
    memory.close();
  } catch {
    lines.push('  Memory database not initialized yet');
  }

  lines.push('');
  lines.push('═'.repeat(55));

  return lines.join('\n');
}

// CLI entry point
async function main() {
  const briefing = await generateBriefing();
  console.log(briefing);
}

main().catch(console.error);
