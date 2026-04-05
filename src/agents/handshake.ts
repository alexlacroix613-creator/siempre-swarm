/**
 * Agent Boot Handshake — Siempre Swarm
 *
 * Formal readiness protocol for agent lifecycle. An agent doesn't receive
 * work until it confirms it's ready. Each state transition emits an event.
 *
 * State machine:
 *   Spawning → ContextLoading → Ready → Executing → Done | Failed
 *
 * The handshake gate prevents:
 *   - Sending work to agents whose context hasn't loaded
 *   - Wasting API calls on under-prepared agents
 *   - Silent failures where agents run without memory context
 *
 * Inspired by claw-code's worker_boot.rs state machine.
 */

import { EventBus, createEvent } from '../events/index.js';
import type { EventSource } from '../events/index.js';
import type { DepartmentId } from '../departments/types.js';

// ---------------------------------------------------------------------------
// Agent States
// ---------------------------------------------------------------------------

export type AgentState = 'spawning' | 'context_loading' | 'ready' | 'executing' | 'done' | 'failed';

export interface AgentHandshake {
  agentId: string;
  department: DepartmentId;
  state: AgentState;
  stateHistory: StateTransition[];
  contextChecks: ContextCheck[];
  spawnedAt: string;
  readyAt?: string;
  doneAt?: string;
}

interface StateTransition {
  from: AgentState;
  to: AgentState;
  timestamp: string;
  reason?: string;
}

interface ContextCheck {
  check: string;
  passed: boolean;
  detail?: string;
}

// ---------------------------------------------------------------------------
// Handshake Manager
// ---------------------------------------------------------------------------

export class HandshakeManager {
  private agents: Map<string, AgentHandshake> = new Map();
  private events: EventBus;

  constructor(events: EventBus) {
    this.events = events;
  }

  /**
   * Begin the handshake for a new agent. Returns the handshake handle.
   */
  spawn(agentId: string, department: DepartmentId): AgentHandshake {
    const handshake: AgentHandshake = {
      agentId,
      department,
      state: 'spawning',
      stateHistory: [],
      contextChecks: [],
      spawnedAt: new Date().toISOString(),
    };

    this.agents.set(agentId, handshake);

    this.events.emit(createEvent('agent.spawned', this.src(agentId, department), {
      agentId,
      department,
      modelTier: 'unknown', // Resolved during context loading
    }));

    return handshake;
  }

  /**
   * Run context checks and transition to ready (or failed).
   *
   * Context checks verify:
   *   1. System prompt is non-empty
   *   2. Memory namespace exists (if agent uses memory)
   *   3. Department is valid
   *
   * If all checks pass → Ready. If any critical check fails → Failed.
   */
  async loadContext(
    agentId: string,
    checks: { systemPrompt: string; memoryAvailable: boolean; modelTier: string }
  ): Promise<{ ready: boolean; failures: string[] }> {
    const h = this.requireAgent(agentId);
    this.transition(h, 'context_loading');

    const failures: string[] = [];

    // Check 1: System prompt
    const promptCheck: ContextCheck = {
      check: 'system_prompt',
      passed: checks.systemPrompt.length > 0,
      detail: checks.systemPrompt.length > 0
        ? `${checks.systemPrompt.length} chars`
        : 'Empty system prompt',
    };
    h.contextChecks.push(promptCheck);
    if (!promptCheck.passed) failures.push('Empty system prompt');

    // Check 2: Memory availability
    const memoryCheck: ContextCheck = {
      check: 'memory_available',
      passed: checks.memoryAvailable,
      detail: checks.memoryAvailable ? 'Memory namespace accessible' : 'Memory unavailable (non-critical)',
    };
    h.contextChecks.push(memoryCheck);
    // Memory is soft — we don't fail on it, just record it

    // Check 3: Model tier is known
    const tierCheck: ContextCheck = {
      check: 'model_tier',
      passed: ['free', 'budget', 'mid', 'top'].includes(checks.modelTier),
      detail: `Tier: ${checks.modelTier}`,
    };
    h.contextChecks.push(tierCheck);
    if (!tierCheck.passed) failures.push(`Unknown model tier: ${checks.modelTier}`);

    if (failures.length === 0) {
      this.transition(h, 'ready');
      h.readyAt = new Date().toISOString();

      this.events.emit(createEvent('agent.ready', this.src(agentId, h.department), {
        agentId,
        contextLoaded: true,
        memoryHits: checks.memoryAvailable ? 1 : 0,
      }));

      return { ready: true, failures: [] };
    } else {
      this.transition(h, 'failed', `Context checks failed: ${failures.join(', ')}`);
      return { ready: false, failures };
    }
  }

  /**
   * Mark agent as executing. Only valid from 'ready' state.
   */
  startExecution(agentId: string): void {
    const h = this.requireAgent(agentId);
    if (h.state !== 'ready') {
      throw new Error(`Agent ${agentId} cannot execute from state '${h.state}' — must be 'ready'`);
    }
    this.transition(h, 'executing');
  }

  /**
   * Mark agent as done.
   */
  complete(agentId: string, tasksCompleted: number, totalCost: number): void {
    const h = this.requireAgent(agentId);
    this.transition(h, 'done');
    h.doneAt = new Date().toISOString();

    this.events.emit(createEvent('agent.done', this.src(agentId, h.department), {
      agentId,
      tasksCompleted,
      totalCost,
    }));
  }

  /**
   * Mark agent as failed.
   */
  fail(agentId: string, reason: string): void {
    const h = this.requireAgent(agentId);
    this.transition(h, 'failed', reason);
    h.doneAt = new Date().toISOString();
  }

  /**
   * Check if an agent is ready to receive work.
   */
  isReady(agentId: string): boolean {
    const h = this.agents.get(agentId);
    return h?.state === 'ready';
  }

  /**
   * Get the current state of an agent.
   */
  getState(agentId: string): AgentHandshake | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all active agents (not done/failed).
   */
  getActive(): AgentHandshake[] {
    return [...this.agents.values()].filter(
      h => h.state !== 'done' && h.state !== 'failed'
    );
  }

  /**
   * Clean up completed/failed agent state.
   */
  cleanup(): number {
    let cleaned = 0;
    for (const [id, h] of this.agents) {
      if (h.state === 'done' || h.state === 'failed') {
        this.agents.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }

  // -------------------------------------------------------------------------
  // Private
  // -------------------------------------------------------------------------

  private transition(h: AgentHandshake, to: AgentState, reason?: string): void {
    h.stateHistory.push({
      from: h.state,
      to,
      timestamp: new Date().toISOString(),
      reason,
    });
    h.state = to;
  }

  private requireAgent(agentId: string): AgentHandshake {
    const h = this.agents.get(agentId);
    if (!h) throw new Error(`Agent ${agentId} not found in handshake manager`);
    return h;
  }

  private src(agentId: string, department: DepartmentId): EventSource {
    return { component: 'agent', agentId, department };
  }
}
