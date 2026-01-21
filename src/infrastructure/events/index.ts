/**
 * Event Bus Module
 *
 * Provides a type-safe publish/subscribe system for application-wide events.
 *
 * @example
 * ```ts
 * // In a Vue component
 * import { useEventBus } from '@/infrastructure/events'
 *
 * const { on, emit } = useEventBus()
 *
 * on('document:created', (event) => {
 *   console.log('Created:', event.payload)
 * })
 *
 * emit('document:created', { documentType: 'quotation', id: 1 })
 * ```
 *
 * @example
 * ```ts
 * // Outside components (services, utils)
 * import { eventBus } from '@/infrastructure/events'
 *
 * eventBus.emit('api:request-completed', {
 *   endpoint: '/quotations',
 *   method: 'GET',
 *   duration: 123,
 *   status: 200,
 * })
 * ```
 */

// Core
export { eventBus } from './EventBus'
export { useEventBus, type UseEventBusReturn } from './useEventBus'

// Types
export type {
  AppEvent,
  EventMeta,
  EventCatalog,
  EventHandler,
  Unsubscribe,
  EventName,
  EventPayload,
} from './types'
