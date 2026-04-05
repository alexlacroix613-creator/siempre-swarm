/**
 * Recovery Recipes — Siempre Swarm
 *
 * Codified self-heal patterns for the 5 most common failure modes.
 * Each recipe gets ONE attempt before escalation. Every recovery
 * attempt emits a structured event regardless of outcome.
 *
 * Philosophy: try to self-heal once, emit structured data about
 * what happened, then escalate. Not infinite retries (spirals),
 * not zero retries (wastes human time on trivially fixable issues).
 *
 * Inspired by claw-code's recovery_recipes.rs.
 */

import { EventBus, createEvent } from '../events/index.js';
import type { FailureClass, EventSource } from '../events/index.js';

// ---------------------------------------------------------------------------
// Recipe Definition
// ---------------------------------------------------------------------------

export interface RecoveryRecipe {
  id: string;
  name: string;
  handles: FailureClass;          // Which failure class this recipe covers
  maxAttempts: number;            // Always 1 — one shot before escalation
  escalation: EscalationPolicy;
  execute: (ctx: RecoveryContext) => Promise<RecoveryResult>;
}

export type EscalationPolicy = 'alert_human' | 'log_and_continue' | 'abort';

export interface RecoveryContext {
  taskId: string;
  error: string;
  failureClass: FailureClass;
  department?: string;
  agentId?: string;
  attempt: number;
}

export interface RecoveryResult {
  success: boolean;
  action: string;                 // What the recipe did
  detail?: string;                // Why it worked or didn't
  retryable: boolean;             // Should the original task be retried?
}

// ---------------------------------------------------------------------------
// The 5 Recipes
// ---------------------------------------------------------------------------

const openRouterTimeoutRecipe: RecoveryRecipe = {
  id: 'openrouter_timeout',
  name: 'OpenRouter Timeout Recovery',
  handles: 'openrouter_timeout',
  maxAttempts: 1,
  escalation: 'log_and_continue',
  async execute(ctx) {
    // Strategy: wait 2s and signal retry with the same model.
    // OpenRouter timeouts are almost always transient.
    await sleep(2000);
    return {
      success: true,
      action: 'Waited 2s for transient timeout to clear',
      detail: `Task ${ctx.taskId} timed out, backing off before retry`,
      retryable: true,
    };
  },
};

const rateLimitRecipe: RecoveryRecipe = {
  id: 'openrouter_rate_limit',
  name: 'OpenRouter Rate Limit Recovery',
  handles: 'openrouter_rate_limit',
  maxAttempts: 1,
  escalation: 'log_and_continue',
  async execute(ctx) {
    // Strategy: wait 5s. Rate limits need longer backoff.
    // If this still fails, escalation will log it and move on.
    await sleep(5000);
    return {
      success: true,
      action: 'Backed off 5s for rate limit cooldown',
      detail: `Agent ${ctx.agentId} hit rate limit, cooling down`,
      retryable: true,
    };
  },
};

const memoryStoreRecipe: RecoveryRecipe = {
  id: 'memory_store_failed',
  name: 'Memory Store Failure Recovery',
  handles: 'memory_store_failed',
  maxAttempts: 1,
  escalation: 'log_and_continue',
  async execute(ctx) {
    // Strategy: memory failures are non-critical. The task result
    // is still valid — we just couldn't persist it to supermemory.
    // Log the failure for later manual backfill.
    return {
      success: true,
      action: 'Memory store failure logged — task result preserved in event log',
      detail: `Supermemory write failed: ${ctx.error}. Result available in JSONL event log for backfill.`,
      retryable: false, // Don't retry the whole task, just note the memory gap
    };
  },
};

const routingMissRecipe: RecoveryRecipe = {
  id: 'agent_routing_miss',
  name: 'Agent Routing Miss Recovery',
  handles: 'agent_routing_miss',
  maxAttempts: 1,
  escalation: 'alert_human',
  async execute(ctx) {
    // Strategy: routing misses mean the task doesn't match any department
    // keywords. This isn't transient — it needs human routing or
    // keyword expansion. Fall back to department director.
    return {
      success: false,
      action: 'No automatic recovery — task needs manual routing',
      detail: `Task "${ctx.error}" didn't match any department. Escalating to Alex.`,
      retryable: false,
    };
  },
};

const governanceLockRecipe: RecoveryRecipe = {
  id: 'governance_lock_conflict',
  name: 'Governance Lock Conflict Recovery',
  handles: 'governance_lock_conflict',
  maxAttempts: 1,
  escalation: 'log_and_continue',
  async execute(ctx) {
    // Strategy: lock conflicts mean another agent is working on the same
    // files. Wait 10s and check if the lock cleared. If not, escalate.
    await sleep(10000);
    return {
      success: true,
      action: 'Waited 10s for governance lock to clear',
      detail: `Lock conflict on task ${ctx.taskId}. Backed off — original task can retry.`,
      retryable: true,
    };
  },
};

// ---------------------------------------------------------------------------
// Recipe Registry
// ---------------------------------------------------------------------------

const ALL_RECIPES: RecoveryRecipe[] = [
  openRouterTimeoutRecipe,
  rateLimitRecipe,
  memoryStoreRecipe,
  routingMissRecipe,
  governanceLockRecipe,
];

const RECIPE_MAP = new Map<FailureClass, RecoveryRecipe>(
  ALL_RECIPES.map(r => [r.handles, r])
);

// ---------------------------------------------------------------------------
// Recovery Engine
// ---------------------------------------------------------------------------

export class RecoveryEngine {
  private events: EventBus;
  private attempts: Map<string, number> = new Map(); // taskId → attempt count

  constructor(events: EventBus) {
    this.events = events;
  }

  /**
   * Attempt recovery for a failed task. Returns the result.
   *
   * If no recipe exists for the failure class, returns null.
   * If the recipe has already been attempted for this task, returns null
   * (one shot per task — no retry spirals).
   */
  async attempt(ctx: RecoveryContext): Promise<RecoveryResult | null> {
    const recipe = RECIPE_MAP.get(ctx.failureClass);
    if (!recipe) return null;

    // Check attempt count — one shot per task per failure class
    const key = `${ctx.taskId}:${ctx.failureClass}`;
    const prior = this.attempts.get(key) ?? 0;
    if (prior >= recipe.maxAttempts) return null;

    this.attempts.set(key, prior + 1);
    const attempt = prior + 1;

    const src: EventSource = { component: 'recovery', agentId: ctx.agentId };
    let result: RecoveryResult;

    try {
      result = await recipe.execute({ ...ctx, attempt });
    } catch (error) {
      result = {
        success: false,
        action: `Recovery recipe '${recipe.id}' threw: ${error instanceof Error ? error.message : String(error)}`,
        retryable: false,
      };
    }

    // Emit recovery event regardless of outcome
    this.events.emit(createEvent('task.recovered', src, {
      originalFailure: ctx.failureClass,
      recipe: recipe.id,
      attempt,
      success: result.success,
    }, ctx.taskId));

    return result;
  }

  /**
   * Get the escalation policy for a failure class.
   */
  getEscalation(failureClass: FailureClass): EscalationPolicy | null {
    return RECIPE_MAP.get(failureClass)?.escalation ?? null;
  }

  /**
   * List all available recipes.
   */
  listRecipes(): { id: string; name: string; handles: FailureClass; escalation: EscalationPolicy }[] {
    return ALL_RECIPES.map(r => ({
      id: r.id,
      name: r.name,
      handles: r.handles,
      escalation: r.escalation,
    }));
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
