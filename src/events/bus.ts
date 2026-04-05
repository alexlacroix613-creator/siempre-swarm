/**
 * Event Bus — Siempre Swarm
 *
 * In-memory pub/sub with JSONL persistence. Every event flows through here.
 * Subscribers can filter by event type. The JSONL log enables replay,
 * debugging, and post-mortem analysis.
 *
 * Design choice: single global bus, not per-task. The swarm is small enough
 * that a global bus is simpler and lets cross-cutting subscribers (like the
 * recovery engine) see everything without wiring.
 */

import { appendFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { AnySwarmEvent, EventType, EventSource } from './types.js';

type Listener = (event: AnySwarmEvent) => void;
type TypedListener<T extends EventType> = (event: Extract<AnySwarmEvent, { type: T }>) => void;

export class EventBus {
  private listeners: Map<string, Listener[]> = new Map();
  private globalListeners: Listener[] = [];
  private logPath: string | null = null;
  private eventCount = 0;

  constructor(options?: { logDir?: string }) {
    if (options?.logDir) {
      if (!existsSync(options.logDir)) {
        mkdirSync(options.logDir, { recursive: true });
      }
      const date = new Date().toISOString().slice(0, 10);
      this.logPath = join(options.logDir, `events-${date}.jsonl`);
    }
  }

  /**
   * Emit an event. Notifies all matching subscribers and persists to JSONL.
   */
  emit(event: AnySwarmEvent): void {
    this.eventCount++;

    // Persist first — if the subscriber throws, we still have the record
    if (this.logPath) {
      try {
        appendFileSync(this.logPath, JSON.stringify(event) + '\n');
      } catch {
        // Log write failure shouldn't break the system
      }
    }

    // Notify type-specific listeners
    const typed = this.listeners.get(event.type);
    if (typed) {
      for (const fn of typed) fn(event);
    }

    // Notify global listeners
    for (const fn of this.globalListeners) fn(event);
  }

  /**
   * Subscribe to a specific event type.
   */
  on<T extends EventType>(type: T, listener: TypedListener<T>): () => void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener as Listener);
    this.listeners.set(type, list);

    // Return unsubscribe function
    return () => {
      const current = this.listeners.get(type);
      if (current) {
        this.listeners.set(type, current.filter(fn => fn !== listener));
      }
    };
  }

  /**
   * Subscribe to all events.
   */
  onAll(listener: Listener): () => void {
    this.globalListeners.push(listener);
    return () => {
      this.globalListeners = this.globalListeners.filter(fn => fn !== listener);
    };
  }

  /**
   * Get total events emitted in this session.
   */
  getEventCount(): number {
    return this.eventCount;
  }

  /**
   * Get the JSONL log path (for debugging/replay).
   */
  getLogPath(): string | null {
    return this.logPath;
  }
}

// ---------------------------------------------------------------------------
// Event Factory — convenience for creating events with consistent structure
// ---------------------------------------------------------------------------

export function createEvent<T extends EventType>(
  type: T,
  source: EventSource,
  payload: Extract<AnySwarmEvent, { type: T }>['payload'],
  taskId?: string
): Extract<AnySwarmEvent, { type: T }> {
  return {
    type,
    timestamp: new Date().toISOString(),
    source,
    taskId,
    payload,
  } as Extract<AnySwarmEvent, { type: T }>;
}
