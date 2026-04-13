/**
 * Events — Siempre Swarm
 *
 * Public API for the event system. Import from here.
 */

export { EventBus, createEvent } from './bus.js';
export type {
  SwarmEvent,
  EventSource,
  AnySwarmEvent,
  EventType,
  EventPayload,
  FailureClass,
  BlockerClass,
  // Task lifecycle
  TaskCreatedEvent,
  TaskRoutedEvent,
  TaskBlockedEvent,
  TaskExecutingEvent,
  TaskCompletedEvent,
  TaskFailedEvent,
  TaskReviewedEvent,
  TaskRecoveredEvent,
  // Agent lifecycle
  AgentSpawnedEvent,
  AgentReadyEvent,
  AgentDoneEvent,
  // System
  GovernanceLockEvent,
  MemoryStoreEvent,
  RouterDecisionEvent,
} from './types.js';
