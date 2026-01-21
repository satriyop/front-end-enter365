/**
 * Vue Composable for Event Bus
 *
 * Provides automatic cleanup on component unmount.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useEventBus } from '@/infrastructure/events'
 *
 * const { on, emit } = useEventBus()
 *
 * // Subscribe - automatically cleaned up on unmount
 * on('document:created', (event) => {
 *   console.log('Document created:', event.payload.id)
 * })
 *
 * // Emit an event
 * function handleSave() {
 *   emit('document:created', { documentType: 'quotation', id: 123 })
 * }
 * </script>
 * ```
 */

import { onUnmounted, getCurrentInstance } from 'vue'
import { eventBus } from './EventBus'
import type {
  EventCatalog,
  EventHandler,
  EventMeta,
  Unsubscribe,
  EventName,
} from './types'

export interface UseEventBusReturn {
  /**
   * Subscribe to an event - auto-cleanup on component unmount
   */
  on: <K extends EventName>(
    eventType: K,
    handler: EventHandler<EventCatalog[K]>
  ) => Unsubscribe

  /**
   * Subscribe to multiple events - auto-cleanup on component unmount
   */
  onMany: <K extends EventName>(
    eventTypes: K[],
    handler: EventHandler<EventCatalog[K]>
  ) => Unsubscribe

  /**
   * Subscribe once - auto-cleanup on component unmount
   */
  once: <K extends EventName>(
    eventType: K,
    handler: EventHandler<EventCatalog[K]>
  ) => Unsubscribe

  /**
   * Subscribe to all events - auto-cleanup on component unmount
   */
  onAny: (handler: EventHandler<unknown>) => Unsubscribe

  /**
   * Emit an event
   */
  emit: <K extends EventName>(
    eventType: K,
    payload: EventCatalog[K],
    meta?: EventMeta
  ) => void

  /**
   * Get readonly event history
   */
  history: typeof eventBus.history
}

/**
 * Use the event bus with automatic cleanup
 */
export function useEventBus(): UseEventBusReturn {
  const subscriptions: Unsubscribe[] = []
  const instance = getCurrentInstance()

  /**
   * Track subscription for cleanup
   */
  function trackSubscription(unsubscribe: Unsubscribe): Unsubscribe {
    subscriptions.push(unsubscribe)
    return () => {
      unsubscribe()
      const index = subscriptions.indexOf(unsubscribe)
      if (index > -1) {
        subscriptions.splice(index, 1)
      }
    }
  }

  /**
   * Subscribe to an event
   */
  function on<K extends EventName>(
    eventType: K,
    handler: EventHandler<EventCatalog[K]>
  ): Unsubscribe {
    const unsubscribe = eventBus.on(eventType, handler)
    return trackSubscription(unsubscribe)
  }

  /**
   * Subscribe to multiple events
   */
  function onMany<K extends EventName>(
    eventTypes: K[],
    handler: EventHandler<EventCatalog[K]>
  ): Unsubscribe {
    const unsubscribe = eventBus.onMany(eventTypes, handler)
    return trackSubscription(unsubscribe)
  }

  /**
   * Subscribe once
   */
  function once<K extends EventName>(
    eventType: K,
    handler: EventHandler<EventCatalog[K]>
  ): Unsubscribe {
    const unsubscribe = eventBus.once(eventType, handler)
    return trackSubscription(unsubscribe)
  }

  /**
   * Subscribe to all events
   */
  function onAny(handler: EventHandler<unknown>): Unsubscribe {
    const unsubscribe = eventBus.onAny(handler)
    return trackSubscription(unsubscribe)
  }

  /**
   * Emit an event
   */
  function emit<K extends EventName>(
    eventType: K,
    payload: EventCatalog[K],
    meta?: EventMeta
  ): void {
    // Auto-add component name as source if available
    const componentName = instance?.type?.__name || instance?.type?.name
    const enrichedMeta: EventMeta = {
      ...meta,
      source: meta?.source || componentName,
    }
    eventBus.emit(eventType, payload, enrichedMeta)
  }

  // Auto-cleanup on unmount (only if we're in a component context)
  if (instance) {
    onUnmounted(() => {
      subscriptions.forEach((unsubscribe) => unsubscribe())
      subscriptions.length = 0
    })
  }

  return {
    on,
    onMany,
    once,
    onAny,
    emit,
    history: eventBus.history,
  }
}

/**
 * Direct access to the event bus (for non-component code)
 * Use useEventBus() in components for automatic cleanup
 */
export { eventBus } from './EventBus'
