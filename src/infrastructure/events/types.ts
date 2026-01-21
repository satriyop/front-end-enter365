/**
 * Event Bus Type Definitions
 *
 * Strongly-typed event catalog for application-wide events.
 * This enables TypeScript to catch typos and ensure correct payload shapes.
 */

/**
 * Base event structure
 */
export interface AppEvent<T = unknown> {
  type: string
  payload: T
  timestamp: Date
  meta?: EventMeta
}

/**
 * Event metadata for tracing and debugging
 */
export interface EventMeta {
  userId?: number
  correlationId?: string
  source?: string
}

/**
 * Event Catalog - All application events with their payload types
 *
 * Add new events here to ensure type safety throughout the application.
 */
export interface EventCatalog {
  // ─────────────────────────────────────────────────────────────
  // Document Lifecycle Events
  // ─────────────────────────────────────────────────────────────
  'document:created': {
    documentType: string
    id: number
  }

  'document:updated': {
    documentType: string
    id: number
    changes: string[]
  }

  'document:deleted': {
    documentType: string
    id: number
  }

  'document:status-changed': {
    documentType: string
    id: number
    from: string
    to: string
  }

  // ─────────────────────────────────────────────────────────────
  // Form Events
  // ─────────────────────────────────────────────────────────────
  'form:submitted': {
    formName: string
    success: boolean
  }

  'form:validation-failed': {
    formName: string
    errors: string[]
  }

  'form:autosave-triggered': {
    formName: string
  }

  'form:field-changed': {
    formName: string
    field: string
  }

  // ─────────────────────────────────────────────────────────────
  // API Events
  // ─────────────────────────────────────────────────────────────
  'api:request-started': {
    endpoint: string
    method: string
  }

  'api:request-completed': {
    endpoint: string
    method: string
    duration: number
    status: number
  }

  'api:request-failed': {
    endpoint: string
    method: string
    error: string
    status?: number
  }

  // ─────────────────────────────────────────────────────────────
  // User Events
  // ─────────────────────────────────────────────────────────────
  'user:logged-in': {
    userId: number
    email: string
  }

  'user:logged-out': {
    reason: 'manual' | 'timeout' | 'forced'
  }

  'user:action': {
    action: string
    target: string
    details?: Record<string, unknown>
  }

  // ─────────────────────────────────────────────────────────────
  // Navigation Events
  // ─────────────────────────────────────────────────────────────
  'navigation:route-changed': {
    from: string
    to: string
  }

  // ─────────────────────────────────────────────────────────────
  // Error Events
  // ─────────────────────────────────────────────────────────────
  'error:unhandled': {
    error: Error
    context: string
  }

  'error:api': {
    endpoint: string
    statusCode: number
    message: string
  }

  'error:validation': {
    formName: string
    errors: Record<string, string[]>
  }

  // ─────────────────────────────────────────────────────────────
  // UI Events
  // ─────────────────────────────────────────────────────────────
  'ui:modal-opened': {
    modalName: string
  }

  'ui:modal-closed': {
    modalName: string
  }

  'ui:notification-shown': {
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
  }

  // ─────────────────────────────────────────────────────────────
  // Workflow Events
  // ─────────────────────────────────────────────────────────────
  'workflow:transition-started': {
    machineId: string
    from: string
    event: string
  }

  'workflow:transition-completed': {
    machineId: string
    from: string
    to: string
    event: string
  }

  'workflow:transition-blocked': {
    machineId: string
    from: string
    event: string
    reason: string
  }
}

/**
 * Event handler function type
 */
export type EventHandler<T> = (event: AppEvent<T>) => void | Promise<void>

/**
 * Unsubscribe function returned when subscribing to events
 */
export type Unsubscribe = () => void

/**
 * Extract event names from catalog
 */
export type EventName = keyof EventCatalog

/**
 * Extract payload type for a specific event
 */
export type EventPayload<K extends EventName> = EventCatalog[K]
