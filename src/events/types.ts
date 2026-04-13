/**
 * Typed Event Schema — Siempre Swarm
 *
 * Canonical event types for task lifecycle, agent state, and system health.
 * Inspired by claw-code's lane_events.rs — structured, serializable,
 * machine-readable state that replaces narrative log output.
 *
 * Every event has:
 *   - A typed name (dot-separated namespace)
 *   - A timestamp
 *   - A source (who emitted it)
 *   - A typed payload (specific to the event)
 *
 * Events are the foundation. Boot handshakes, recovery recipes,
 * and policy engines all emit and consume these.
 */

import type { DepartmentId } from '../departments/types.js';

// ---------------------------------------------------------------------------
// Base Event
// ---------------------------------------------------------------------------

export interface SwarmEvent<T extends string = string, P = unknown> {
  type: T;
  timestamp: string;           // ISO 8601
  source: EventSource;
  taskId?: string;             // Present for task-scoped events
  payload: P;
}

export interface EventSource {
  component: 'orchestrator' | 'agent' | 'router' | 'governance' | 'memory' | 'recovery';
  agentId?: string;
  department?: DepartmentId;
}

// ---------------------------------------------------------------------------
// Task Lifecycle Events
// ---------------------------------------------------------------------------

export type TaskCreatedEvent = SwarmEvent<'task.created', {
  prompt: string;
  category: string;
  tier: string;
}>;

export type TaskRoutedEvent = SwarmEvent<'task.routed', {
  department: DepartmentId;
  agentId: string;
  agentName: string;
  modelTier: string;
}>;

export type TaskBlockedEvent = SwarmEvent<'task.blocked', {
  reason: string;
  blocker: BlockerClass;
}>;

export type TaskExecutingEvent = SwarmEvent<'task.executing', {
  model: string;
  tier: string;
  inputTokens?: number;
}>;

export type TaskCompletedEvent = SwarmEvent<'task.completed', {
  model: string;
  cost: number;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  contentLength: number;
}>;

export type TaskFailedEvent = SwarmEvent<'task.failed', {
  error: string;
  failureClass: FailureClass;
  recoverable: boolean;
}>;

export type TaskReviewedEvent = SwarmEvent<'task.reviewed', {
  verdict: 'approve' | 'annotate' | 'revise' | 'redo';
  reviewer: string;
  notes?: string;
}>;

export type TaskRecoveredEvent = SwarmEvent<'task.recovered', {
  originalFailure: FailureClass;
  recipe: string;
  attempt: number;
  success: boolean;
}>;

// ---------------------------------------------------------------------------
// Agent Lifecycle Events
// ---------------------------------------------------------------------------

export type AgentSpawnedEvent = SwarmEvent<'agent.spawned', {
  agentId: string;
  department: DepartmentId;
  modelTier: string;
}>;

export type AgentReadyEvent = SwarmEvent<'agent.ready', {
  agentId: string;
  contextLoaded: boolean;
  memoryHits: number;
}>;

export type AgentDoneEvent = SwarmEvent<'agent.done', {
  agentId: string;
  tasksCompleted: number;
  totalCost: number;
}>;

// ---------------------------------------------------------------------------
// System Events
// ---------------------------------------------------------------------------

export type GovernanceLockEvent = SwarmEvent<'governance.lock', {
  action: 'acquired' | 'released' | 'conflict';
  files: string[];
  holder?: string;
}>;

export type MemoryStoreEvent = SwarmEvent<'memory.store', {
  containerTag: string;
  success: boolean;
  error?: string;
}>;

export type RouterDecisionEvent = SwarmEvent<'router.decision', {
  category: string;
  selectedModel: string;
  selectedTier: string;
  reason: string;
}>;

// ---------------------------------------------------------------------------
// Failure Classification
// ---------------------------------------------------------------------------

export type FailureClass =
  | 'openrouter_timeout'
  | 'openrouter_rate_limit'
  | 'openrouter_model_unavailable'
  | 'memory_store_failed'
  | 'memory_search_failed'
  | 'agent_routing_miss'
  | 'governance_lock_conflict'
  | 'invalid_task_packet'
  | 'context_overflow'
  | 'unknown';

export type BlockerClass =
  | 'governance_lock'
  | 'no_department_match'
  | 'no_agent_match'
  | 'rate_limit'
  | 'budget_exceeded';

// ---------------------------------------------------------------------------
// Union of All Events
// ---------------------------------------------------------------------------

export type AnySwarmEvent =
  | TaskCreatedEvent
  | TaskRoutedEvent
  | TaskBlockedEvent
  | TaskExecutingEvent
  | TaskCompletedEvent
  | TaskFailedEvent
  | TaskReviewedEvent
  | TaskRecoveredEvent
  | AgentSpawnedEvent
  | AgentReadyEvent
  | AgentDoneEvent
  | GovernanceLockEvent
  | MemoryStoreEvent
  | RouterDecisionEvent;

// ---------------------------------------------------------------------------
// Event Type Helpers
// ---------------------------------------------------------------------------

export type EventType = AnySwarmEvent['type'];

export type EventPayload<T extends EventType> = Extract<AnySwarmEvent, { type: T }>['payload'];
