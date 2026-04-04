#!/usr/bin/env node
/**
 * Siempre Swarm CLI — Quick interface for testing the orchestrator.
 *
 * Usage:
 *   npx tsx src/cli.ts task "Build me a Virginia pricing proposal"
 *   npx tsx src/cli.ts stats
 *   npx tsx src/cli.ts briefing
 *   npx tsx src/cli.ts agents
 *   npx tsx src/cli.ts search "pricing strategy"
 */

import { Orchestrator } from './orchestrator.js';
import { getAgentCount, getAllAgents, DEPARTMENTS } from './departments/registry.js';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || '';
const SUPERMEMORY_KEY = process.env.SUPERMEMORY_API_KEY || '';

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    printUsage();
    return;
  }

  switch (command) {
    case 'task': {
      if (!args[0]) { console.error('Usage: task "<prompt>"'); return; }
      if (!OPENROUTER_KEY) { console.error('Set OPENROUTER_API_KEY env var'); return; }

      const orchestrator = new Orchestrator({
        openRouterApiKey: OPENROUTER_KEY,
        supermemoryApiKey: SUPERMEMORY_KEY,
        projectDir: process.cwd(),
        verbose: true,
      });

      const prompt = args.join(' ');
      console.log(`\nProcessing: "${prompt}"\n`);

      const result = await orchestrator.processTask(prompt);

      console.log(`\n--- Result ---`);
      console.log(`Status: ${result.status}`);
      console.log(`Task ID: ${result.taskId}`);
      if (result.metadata) {
        console.log(`Department: ${result.metadata.department || 'none'}`);
        console.log(`Agent: ${result.metadata.agent || 'none'}`);
        console.log(`Model: ${result.metadata.model || result.metadata.suggestedModel || 'n/a'}`);
        console.log(`Tier: ${result.metadata.tier || 'n/a'}`);
        if (result.metadata.cost !== undefined) {
          console.log(`Cost: $${(result.metadata.cost as number).toFixed(6)}`);
        }
        if (result.metadata.latencyMs !== undefined) {
          console.log(`Latency: ${result.metadata.latencyMs}ms`);
        }
      }
      if (result.review) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`  PENDING REVIEW — Agent work needs Opus inspection`);
        console.log(`${'='.repeat(60)}`);
        console.log(`\n${result.review.summary}\n`);
        console.log(`--- Agent Output (for review) ---\n`);
        console.log(result.content);
        console.log(`\n--- Review Prompt (for Claude/Opus) ---\n`);
        console.log(result.review.reviewPrompt);
      } else {
        console.log(`\n--- Content ---\n`);
        console.log(result.content);
      }

      console.log(`\n--- Routing Stats ---`);
      console.log(orchestrator.getRoutingStats());
      break;
    }

    case 'agents': {
      const counts = getAgentCount();
      console.log(`\nSiempre Swarm — Agent Registry`);
      console.log(`${'='.repeat(50)}`);
      console.log(`Departments: ${counts.departments}`);
      console.log(`Directors: ${counts.directors}`);
      console.log(`Specialists: ${counts.agents}`);
      console.log(`Total: ${counts.total}`);
      console.log(`${'='.repeat(50)}\n`);

      for (const [id, dept] of Object.entries(DEPARTMENTS)) {
        console.log(`\n${dept.name} (${id})`);
        console.log(`  Director: ${dept.director.name} [${dept.director.modelTier}]`);
        console.log(`  Memory: ${dept.containerTag}`);
        for (const agent of dept.agents) {
          console.log(`  Agent: ${agent.name} [${agent.modelTier}] → ${agent.containerTag}`);
        }
      }
      break;
    }

    case 'briefing': {
      const orchestrator = new Orchestrator({
        openRouterApiKey: OPENROUTER_KEY,
        supermemoryApiKey: SUPERMEMORY_KEY,
        projectDir: process.cwd(),
      });

      const briefing = await orchestrator.getExecutiveBriefing();
      console.log(`\nExecutive Briefing — ${briefing.generatedAt}`);
      console.log(`${'='.repeat(50)}`);
      for (const dept of briefing.departments) {
        console.log(`\n${dept.department}: ${dept.summary}`);
        console.log(`  Completed: ${dept.completedTasks} | Pending: ${dept.pendingTasks} | Cost: $${dept.totalCost.toFixed(4)}`);
      }
      if (briefing.alerts.length > 0) {
        console.log(`\nAlerts:`);
        briefing.alerts.forEach(a => console.log(`  ⚠ ${a}`));
      }
      console.log(`\nTotal cost today: $${briefing.totalCostToday.toFixed(4)}`);
      console.log(`Tokens saved by routing: ${briefing.tokensSavedByRouting}%`);
      break;
    }

    case 'search': {
      if (!args[0]) { console.error('Usage: search "<query>"'); return; }
      if (!SUPERMEMORY_KEY) { console.error('Set SUPERMEMORY_API_KEY env var'); return; }

      const orchestrator = new Orchestrator({
        openRouterApiKey: OPENROUTER_KEY,
        supermemoryApiKey: SUPERMEMORY_KEY,
        projectDir: process.cwd(),
      });

      const results = await orchestrator.searchMemory(args.join(' '));
      console.log(`\nSearch results for: "${args.join(' ')}"`);
      console.log(`Found: ${results.length} results\n`);
      for (const r of results) {
        console.log(`[${(r as any).score?.toFixed(3) || '---'}] ${(r as any).content?.slice(0, 200) || JSON.stringify(r).slice(0, 200)}`);
        console.log('');
      }
      break;
    }

    case 'stats': {
      console.log(`\nRouting Statistics`);
      console.log(`${'='.repeat(50)}`);
      // Stats are per-session, so this only shows current run
      console.log('No tasks processed in this session yet.');
      console.log('Run some tasks first, then check stats.');
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
  }
}

function printUsage() {
  console.log(`
Siempre Swarm CLI

Commands:
  task "<prompt>"    Process a task through the swarm
  agents             List all departments and agents
  briefing           Get the executive briefing
  search "<query>"   Search across department memories
  stats              Show routing statistics

Environment:
  OPENROUTER_API_KEY     Required for task execution
  SUPERMEMORY_API_KEY    Required for memory operations

Examples:
  npx tsx src/cli.ts agents
  npx tsx src/cli.ts task "Summarize Virginia pricing requirements"
  npx tsx src/cli.ts search "Tennessee compliance"
  npx tsx src/cli.ts briefing
`);
}

main().catch(console.error);
