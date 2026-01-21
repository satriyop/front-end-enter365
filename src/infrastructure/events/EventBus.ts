/**
 * Event Bus Implementation
 *
 * A type-safe publish/subscribe event system for application-wide communication.
 * Enables loose coupling between components and provides observability.
 *
 * @example
 * ```ts
 * // Subscribe to an event
 * const unsubscribe = eventBus.on('document:created', (event) => {
 *   console.log(`Document ${event.payload.id} created`)
 * })
 *
 * // Emit an event
 * eventBus.emit('document:created', { documentType: 'quotation', id: 123 })
 *
 * // Unsubscribe when done
 * unsubscribe()
 * ```
 */

import { ref, readonly, type Ref } from 'vue'
import type {
  EventCatalog,
  AppEvent,
  EventHandler,
  EventMeta,
  Unsubscribe,
  EventName,
} from './types'

/**
 * Maximum number of events to keep in history (for debugging)
 */
const MAX_HISTORY_SIZE = 100

/**
 * Wildcard event type for catching all events
 */
const WILDCARD = '*'

class EventBus {
  private handlers = new Map<string, Set<EventHandler<unknown>>>()
  private _history: Ref<AppEvent[]> = ref([])
  private _enabled = true

  /**
   * Subscribe to a specific event type
   *
   * @param eventType - The event type to listen for
   * @param handler - Function to call when event is emitted
   * @returns Unsubscribe function
   */
  on<K extends EventName>(
    eventType: K,
    handler: EventHandler<EventCatalog[K]>
  ): Unsubscribe {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }

    const handlerSet = this.handlers.get(eventType)!
    handlerSet.add(handler as EventHandler<unknown>)

    // Return unsubscribe function
    return () => {
      handlerSet.delete(handler as EventHandler<unknown>)
      if (handlerSet.size === 0) {
        this.handlers.delete(eventType)
      }
    }
  }

  /**
   * Subscribe to multiple event types with the same handler
   *
   * @param eventTypes - Array of event types to listen for
   * @param handler - Function to call when any event is emitted
   * @returns Unsubscribe function that removes all subscriptions
   */
  onMany<K extends EventName>(
    eventTypes: K[],
    handler: EventHandler<EventCatalog[K]>
  ): Unsubscribe {
    const unsubscribes = eventTypes.map((type) => this.on(type, handler))

    return () => {
      unsubscribes.forEach((unsub) => unsub())
    }
  }

  /**
   * Subscribe to an event type, automatically unsubscribe after first emit
   *
   * @param eventType - The event type to listen for
   * @param handler - Function to call when event is emitted
   * @returns Unsubscribe function (can be called to cancel before event fires)
   */
  once<K extends EventName>(
    eventType: K,
    handler: EventHandler<EventCatalog[K]>
  ): Unsubscribe {
    const unsubscribe = this.on(eventType, (event) => {
      unsubscribe()
      handler(event)
    })
    return unsubscribe
  }

  /**
   * Subscribe to ALL events (wildcard listener)
   * Useful for logging, analytics, or debugging
   *
   * @param handler - Function to call for every event
   * @returns Unsubscribe function
   */
  onAny(handler: EventHandler<unknown>): Unsubscribe {
    if (!this.handlers.has(WILDCARD)) {
      this.handlers.set(WILDCARD, new Set())
    }

    const handlerSet = this.handlers.get(WILDCARD)!
    handlerSet.add(handler)

    return () => {
      handlerSet.delete(handler)
      if (handlerSet.size === 0) {
        this.handlers.delete(WILDCARD)
      }
    }
  }

  /**
   * Emit an event to all subscribers
   *
   * @param eventType - The event type to emit
   * @param payload - The event payload (type-checked against EventCatalog)
   * @param meta - Optional metadata (userId, correlationId, source)
   */
  emit<K extends EventName>(
    eventType: K,
    payload: EventCatalog[K],
    meta?: EventMeta
  ): void {
    if (!this._enabled) return

    const event: AppEvent<EventCatalog[K]> = {
      type: eventType,
      payload,
      timestamp: new Date(),
      meta,
    }

    // Add to history
    this._history.value = [
      event as AppEvent,
      ...this._history.value.slice(0, MAX_HISTORY_SIZE - 1),
    ]

    // Call type-specific handlers
    const typeHandlers = this.handlers.get(eventType)
    if (typeHandlers) {
      typeHandlers.forEach((handler) => {
        this.safeCall(handler, event as AppEvent)
      })
    }

    // Call wildcard handlers
    const wildcardHandlers = this.handlers.get(WILDCARD)
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => {
        this.safeCall(handler, event as AppEvent)
      })
    }
  }

  /**
   * Safely call a handler, catching any errors
   */
  private safeCall(handler: EventHandler<unknown>, event: AppEvent): void {
    try {
      const result = handler(event)
      // Handle async handlers
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error(`Error in async event handler for ${event.type}:`, error)
        })
      }
    } catch (error) {
      console.error(`Error in event handler for ${event.type}:`, error)
    }
  }

  /**
   * Get readonly event history (most recent first)
   */
  get history() {
    return readonly(this._history)
  }

  /**
   * Check if event bus is enabled
   */
  get enabled(): boolean {
    return this._enabled
  }

  /**
   * Enable the event bus
   */
  enable(): void {
    this._enabled = true
  }

  /**
   * Disable the event bus (events will be silently dropped)
   */
  disable(): void {
    this._enabled = false
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear()
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this._history.value = []
  }

  /**
   * Get subscriber count for an event type
   */
  listenerCount(eventType: EventName | typeof WILDCARD): number {
    return this.handlers.get(eventType)?.size ?? 0
  }

  /**
   * Get all event types with active subscribers
   */
  eventTypes(): string[] {
    return Array.from(this.handlers.keys())
  }
}

/**
 * Singleton event bus instance
 */
export const eventBus = new EventBus()
