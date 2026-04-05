/**
 * Structured Task Packets — Siempre Swarm
 *
 * Replaces raw prompt strings with typed, validated task payloads.
 * A TaskPacket can be logged, retried, diffed, and routed —
 * none of which work reliably with a naked string.
 *
 * The packet forces the caller to define what "done" looks like
 * before dispatching. This prevents scope creep, enables structured
 * retry, and gives the review layer something concrete to evaluate.
 *
 * Inspired by claw-code's task_packet.rs.
 */

import type { DepartmentId } from '../departments/types.js';
import type { EscalationPolicy } from '../recovery/recipes.js';

// ---------------------------------------------------------------------------
// Task Packet
// ---------------------------------------------------------------------------

export interface TaskPacket {
  /** Unique identifier — set by the orchestrator, not the caller */
  id?: string;

  /** What the task should accomplish — the "why" */
  objective: string;

  /** The raw prompt / detailed instructions — the "what" */
  prompt: string;

  /** Scope constraints */
  scope: TaskScope;

  /** How to evaluate whether the task succeeded */
  acceptance: AcceptanceCriteria;

  /** What to do when things go wrong */
  escalation: EscalationPolicy;

  /** Priority level — affects routing and queue position */
  priority: 'low' | 'normal' | 'high' | 'critical';

  /** Optional: force routing to a specific department/agent */
  routing?: {
    department?: DepartmentId;
    agentId?: string;
  };

  /** Optional: files this task will touch (for governance locks) */
  files?: string[];

  /** Optional: metadata for logging and replay */
  metadata?: Record<string, unknown>;
}

export interface TaskScope {
  /** Which department domain this belongs to */
  domain: DepartmentId | 'cross_cutting';

  /** Brief description of boundaries — what's in/out of scope */
  boundaries: string;

  /** Maximum cost allowed for this task (USD) */
  maxCost?: number;

  /** Maximum time allowed (ms) before timeout */
  timeoutMs?: number;
}

export interface AcceptanceCriteria {
  /** Human-readable description of what "done" looks like */
  definition: string;

  /** Specific checks the review layer should apply */
  checks: string[];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a TaskPacket before dispatch. Catches common mistakes
 * that would otherwise surface as confusing runtime errors.
 */
export function validatePacket(packet: TaskPacket): ValidationResult {
  const errors: string[] = [];

  if (!packet.objective || packet.objective.trim().length === 0) {
    errors.push('objective is required — what should this task accomplish?');
  }

  if (!packet.prompt || packet.prompt.trim().length === 0) {
    errors.push('prompt is required — the detailed instructions for the agent');
  }

  if (!packet.scope) {
    errors.push('scope is required — define domain and boundaries');
  } else {
    if (!packet.scope.domain) {
      errors.push('scope.domain is required — which department domain?');
    }
    if (!packet.scope.boundaries || packet.scope.boundaries.trim().length === 0) {
      errors.push('scope.boundaries is required — what is in/out of scope?');
    }
    if (packet.scope.maxCost !== undefined && packet.scope.maxCost <= 0) {
      errors.push('scope.maxCost must be positive');
    }
    if (packet.scope.timeoutMs !== undefined && packet.scope.timeoutMs <= 0) {
      errors.push('scope.timeoutMs must be positive');
    }
  }

  if (!packet.acceptance) {
    errors.push('acceptance is required — define what "done" looks like');
  } else {
    if (!packet.acceptance.definition || packet.acceptance.definition.trim().length === 0) {
      errors.push('acceptance.definition is required');
    }
    if (!packet.acceptance.checks || packet.acceptance.checks.length === 0) {
      errors.push('acceptance.checks must have at least one check');
    }
  }

  if (!packet.escalation) {
    errors.push('escalation is required — what happens when things fail?');
  }

  if (!packet.priority) {
    errors.push('priority is required');
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Builders — convenience for creating packets from common patterns
// ---------------------------------------------------------------------------

/**
 * Create a task packet from a raw prompt string.
 * This is the migration path — takes the old-style string prompt and
 * wraps it in a structured packet with sensible defaults.
 */
export function fromPrompt(prompt: string, department?: DepartmentId): TaskPacket {
  return {
    objective: prompt.slice(0, 120) + (prompt.length > 120 ? '...' : ''),
    prompt,
    scope: {
      domain: department ?? 'cross_cutting',
      boundaries: 'Standard task scope — agent determines boundaries',
    },
    acceptance: {
      definition: 'Task completed as described in prompt',
      checks: ['Output addresses the original prompt', 'No factual errors or hallucinations'],
    },
    escalation: 'alert_human',
    priority: 'normal',
    routing: department ? { department } : undefined,
  };
}

/**
 * Create a pricing task packet with domain-specific defaults.
 */
export function pricingPacket(
  objective: string,
  prompt: string,
  market?: string
): TaskPacket {
  return {
    objective,
    prompt,
    scope: {
      domain: 'pricing',
      boundaries: market
        ? `Scoped to ${market} market pricing only`
        : 'General pricing across all markets',
      maxCost: 0.01,
    },
    acceptance: {
      definition: 'Pricing analysis complete with FOB, SRP, and margin calculations',
      checks: [
        'All numbers are plausible and internally consistent',
        'State excise taxes are accounted for where applicable',
        'Three-tier system (shipments, depletions, warehouse OH) is referenced',
      ],
    },
    escalation: 'alert_human',
    priority: 'normal',
    routing: { department: 'pricing' },
  };
}

/**
 * Create a sales intel task packet with domain-specific defaults.
 */
export function salesIntelPacket(
  objective: string,
  prompt: string,
  market?: string
): TaskPacket {
  return {
    objective,
    prompt,
    scope: {
      domain: 'sales_intel',
      boundaries: market
        ? `Scoped to ${market} market intelligence`
        : 'Cross-market sales intelligence',
      maxCost: 0.01,
    },
    acceptance: {
      definition: 'Intelligence report with sourced data points',
      checks: [
        'Data sources are identified',
        'Shipments AND depletions AND warehouse OH are reported where available',
        'Trends are directional, not speculative',
      ],
    },
    escalation: 'alert_human',
    priority: 'normal',
    routing: { department: 'sales_intel' },
  };
}
