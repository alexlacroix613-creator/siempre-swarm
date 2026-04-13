#!/usr/bin/env node
/**
 * Session Check-out — End-of-session state persistence.
 *
 * Stores what we did, what's pending, and what was learned.
 * This feeds the next session's Morning Briefing.
 *
 * Usage:
 *   npx tsx src/ops/session-checkout.ts \
 *     --did "Built pricing pipeline" --did "Fixed Virginia agent routing" \
 *     --pending "Test creative pipeline end-to-end" \
 *     --decision "Tim uses Opus, non-negotiable" \
 *     --learned "Free models fabricate details in comms — need review layer"
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const SESSION_DIR = join(homedir(), '.siempre-swarm', 'sessions');

interface SessionRecord {
  sessionId: string;
  lastSessionDate: string;
  whatWeDid: string[];
  whatsPending: string[];
  decisionsLogged: string[];
  lessonsLearned: string[];
  qualitySummary?: string;
}

function main() {
  const args = process.argv.slice(2);

  const whatWeDid: string[] = [];
  const whatsPending: string[] = [];
  const decisions: string[] = [];
  const lessons: string[] = [];

  let i = 0;
  while (i < args.length) {
    switch (args[i]) {
      case '--did':
        whatWeDid.push(args[++i]);
        break;
      case '--pending':
        whatsPending.push(args[++i]);
        break;
      case '--decision':
        decisions.push(args[++i]);
        break;
      case '--learned':
        lessons.push(args[++i]);
        break;
      default:
        i++;
        continue;
    }
    i++;
  }

  if (whatWeDid.length === 0 && whatsPending.length === 0) {
    console.log('Usage: session-checkout --did "..." --pending "..." --decision "..." --learned "..."');
    console.log('  --did       What was accomplished this session');
    console.log('  --pending   What needs to happen next');
    console.log('  --decision  Key decisions made (for reference)');
    console.log('  --learned   Lessons learned (feed into memory)');
    return;
  }

  if (!existsSync(SESSION_DIR)) mkdirSync(SESSION_DIR, { recursive: true });

  const now = new Date();
  const sessionId = `session-${now.toISOString().replace(/[:.]/g, '-')}`;

  const record: SessionRecord = {
    sessionId,
    lastSessionDate: now.toISOString(),
    whatWeDid,
    whatsPending,
    decisionsLogged: decisions,
    lessonsLearned: lessons,
  };

  const filename = `${sessionId}.json`;
  writeFileSync(join(SESSION_DIR, filename), JSON.stringify(record, null, 2));

  console.log(`\nSession checked out: ${filename}`);
  console.log(`  Completed: ${whatWeDid.length} items`);
  console.log(`  Pending: ${whatsPending.length} items`);
  console.log(`  Decisions: ${decisions.length}`);
  console.log(`  Lessons: ${lessons.length}`);
  console.log(`\nStored at: ${SESSION_DIR}/${filename}`);
}

main();
