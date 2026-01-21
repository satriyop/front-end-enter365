# Phase 1: Foundation & Core Infrastructure

## Overview

This phase establishes the foundational systems that all subsequent refactoring builds upon. Without these foundations, later phases cannot achieve proper observability, testability, or loose coupling.

**Prerequisites:** None - this is the starting point.

**Deliverables:**
1. Event Bus system for publish/subscribe communication
2. Logger service with structured logging
3. Service Container for dependency injection
4. Type system improvements (error types, strict generics)
5. Error boundary components

---

## 1.1 Event Bus System

### Why We Need This

Currently, there's no way to:
- Track user actions across the application
- Implement cross-cutting concerns (analytics, audit logging)
- Communicate between unrelated components without prop drilling
- React to events from composables in parent components

### Design

```typescript
// src/infrastructure/events/types.ts
export interface AppEvent<T = unknown> {
  type: string
  payload: T
  timestamp: Date
  meta?: {
    userId?: number
    correlationId?: string
    source?: string
  }
}

// Strongly typed event catalog
export interface EventCatalog {
  // Document lifecycle events
  'document:created': { documentType: string; id: number }
  'document:updated': { documentType: string; id: number; changes: string[] }
  'document:deleted': { documentType: string; id: number }
  'document:status-changed': { documentType: string; id: number; from: string; to: string }

  // Form events
  'form:submitted': { formName: string; success: boolean }
  'form:validation-failed': { formName: string; errors: string[] }
  'form:autosave-triggered': { formName: string }

  // API events
  'api:request-started': { endpoint: string; method: string }
  'api:request-completed': { endpoint: string; method: string; duration: number }
  'api:request-failed': { endpoint: string; method: string; error: string }

  // User interaction events
  'user:logged-in': { userId: number }
  'user:logged-out': { reason: 'manual' | 'timeout' | 'forced' }
  'user:action': { action: string; target: string }

  // Navigation events
  'navigation:route-changed': { from: string; to: string }

  // Error events
  'error:unhandled': { error: Error; context: string }
  'error:api': { endpoint: string; statusCode: number; message: string }
}
```

### Implementation

```typescript
// src/infrastructure/events/EventBus.ts
import { ref, readonly } from 'vue'
import type { EventCatalog, AppEvent } from './types'

type EventHandler<T> = (event: AppEvent<T>) => void | Promise<void>
type Unsubscribe = () => void

class EventBus {
  private handlers = new Map<string, Set<EventHandler<unknown>>>()
  private eventHistory = ref<AppEvent[]>([])
  private maxHistorySize = 100

  /**
   * Subscribe to an event type
   */
  on<K extends keyof EventCatalog>(
    eventType: K,
    handler: EventHandler<EventCatalog[K]>
  ): Unsubscribe {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }

    const handlerSet = this.handlers.get(eventType)!
    handlerSet.add(handler as EventHandler<unknown>)

    return () => {
      handlerSet.delete(handler as EventHandler<unknown>)
    }
  }

  /**
   * Subscribe to multiple event types with same handler
   */
  onMany<K extends keyof EventCatalog>(
    eventTypes: K[],
    handler: EventHandler<EventCatalog[K]>
  ): Unsubscribe {
    const unsubscribes = eventTypes.map((type) => this.on(type, handler))
    return () => unsubscribes.forEach((unsub) => unsub())
  }

  /**
   * Subscribe to an event type, automatically unsubscribe after first emit
   */
  once<K extends keyof EventCatalog>(
    eventType: K,
    handler: EventHandler<EventCatalog[K]>
  ): Unsubscribe {
    const unsub = this.on(eventType, (event) => {
      handler(event)
      unsub()
    })
    return unsub
  }

  /**
   * Emit an event
   */
  emit<K extends keyof EventCatalog>(
    eventType: K,
    payload: EventCatalog[K],
    meta?: AppEvent['meta']
  ): void {
    const event: AppEvent<EventCatalog[K]> = {
      type: eventType,
      payload,
      timestamp: new Date(),
      meta,
    }

    // Store in history (for debugging/dev tools)
    this.eventHistory.value = [
      event,
      ...this.eventHistory.value.slice(0, this.maxHistorySize - 1),
    ]

    // Call handlers
    const handlers = this.handlers.get(eventType)
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event)
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error)
        }
      })
    }

    // Global wildcard handlers
    const wildcardHandlers = this.handlers.get('*')
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(event))
    }
  }

  /**
   * Get readonly event history (for debugging)
   */
  get history() {
    return readonly(this.eventHistory)
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear(): void {
    this.handlers.clear()
  }
}

// Singleton instance
export const eventBus = new EventBus()
```

### Vue Composable Wrapper

```typescript
// src/infrastructure/events/useEventBus.ts
import { onUnmounted } from 'vue'
import { eventBus } from './EventBus'
import type { EventCatalog, AppEvent } from './types'

export function useEventBus() {
  const subscriptions: (() => void)[] = []

  /**
   * Subscribe to event - auto-cleanup on component unmount
   */
  function on<K extends keyof EventCatalog>(
    eventType: K,
    handler: (event: AppEvent<EventCatalog[K]>) => void
  ) {
    const unsub = eventBus.on(eventType, handler)
    subscriptions.push(unsub)
    return unsub
  }

  /**
   * Emit event with automatic source tagging
   */
  function emit<K extends keyof EventCatalog>(
    eventType: K,
    payload: EventCatalog[K]
  ) {
    eventBus.emit(eventType, payload)
  }

  // Auto-cleanup on unmount
  onUnmounted(() => {
    subscriptions.forEach((unsub) => unsub())
  })

  return {
    on,
    emit,
    once: eventBus.once.bind(eventBus),
    history: eventBus.history,
  }
}
```

### File Structure

```
src/infrastructure/
├── events/
│   ├── index.ts           # Re-exports
│   ├── types.ts           # Event catalog and types
│   ├── EventBus.ts        # Core event bus class
│   ├── useEventBus.ts     # Vue composable
│   └── __tests__/
│       └── EventBus.test.ts
```

---

## 1.2 Logger Service

### Why We Need This

Current codebase uses `console.log` scattered throughout. We need:
- Structured logging with levels
- Context enrichment (user, route, component)
- Environment-aware output (dev vs prod)
- Easy integration with external services (Sentry, etc.)

### Design

```typescript
// src/infrastructure/logger/types.ts
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  context?: Record<string, unknown>
  tags?: string[]
  error?: Error
}

export interface LoggerOptions {
  level: LogLevel
  prefix?: string
  context?: Record<string, unknown>
}

export interface LogTransport {
  log(entry: LogEntry): void | Promise<void>
}
```

### Implementation

```typescript
// src/infrastructure/logger/Logger.ts
import type { LogLevel, LogEntry, LogTransport, LoggerOptions } from './types'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

class Logger {
  private transports: LogTransport[] = []
  private minLevel: LogLevel = 'info'
  private globalContext: Record<string, unknown> = {}

  constructor(options?: Partial<LoggerOptions>) {
    if (options?.level) this.minLevel = options.level
    if (options?.context) this.globalContext = options.context
  }

  /**
   * Add a transport (console, remote, etc.)
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport)
  }

  /**
   * Set global context that appears in all logs
   */
  setContext(context: Record<string, unknown>): void {
    this.globalContext = { ...this.globalContext, ...context }
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, unknown>): Logger {
    const child = new Logger({ level: this.minLevel })
    child.transports = this.transports
    child.globalContext = { ...this.globalContext, ...context }
    return child
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel]
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context: { ...this.globalContext, ...context },
      error,
    }

    this.transports.forEach((transport) => {
      try {
        transport.log(entry)
      } catch (e) {
        console.error('Logger transport error:', e)
      }
    })
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error)
  }
}

export const logger = new Logger({
  level: import.meta.env.DEV ? 'debug' : 'warn',
})
```

### Console Transport (Development)

```typescript
// src/infrastructure/logger/transports/ConsoleTransport.ts
import type { LogTransport, LogEntry } from '../types'

export class ConsoleTransport implements LogTransport {
  private styles: Record<string, string> = {
    debug: 'color: gray',
    info: 'color: blue',
    warn: 'color: orange',
    error: 'color: red; font-weight: bold',
  }

  log(entry: LogEntry): void {
    const { level, message, timestamp, context, error } = entry
    const time = timestamp.toISOString().slice(11, 23)

    console.groupCollapsed(
      `%c[${time}] [${level.toUpperCase()}] ${message}`,
      this.styles[level]
    )

    if (context && Object.keys(context).length > 0) {
      console.log('Context:', context)
    }

    if (error) {
      console.error('Error:', error)
    }

    console.groupEnd()
  }
}
```

### Sentry Transport (Production)

```typescript
// src/infrastructure/logger/transports/SentryTransport.ts
import * as Sentry from '@sentry/vue'
import type { LogTransport, LogEntry } from '../types'

export class SentryTransport implements LogTransport {
  log(entry: LogEntry): void {
    if (entry.level === 'error' && entry.error) {
      Sentry.captureException(entry.error, {
        extra: entry.context,
        tags: { message: entry.message },
      })
    } else if (entry.level === 'warn' || entry.level === 'error') {
      Sentry.addBreadcrumb({
        message: entry.message,
        level: entry.level === 'warn' ? 'warning' : 'error',
        data: entry.context,
      })
    }
  }
}
```

### Vue Composable

```typescript
// src/infrastructure/logger/useLogger.ts
import { getCurrentInstance } from 'vue'
import { logger } from './Logger'

export function useLogger(componentName?: string) {
  const instance = getCurrentInstance()
  const name = componentName || instance?.type.__name || 'Anonymous'

  return logger.child({ component: name })
}
```

---

## 1.3 Service Container (Dependency Injection)

### Why We Need This

Current code directly imports concrete implementations. For testability and flexibility, we need:
- Swap implementations (e.g., mock API in tests)
- Configure services at app startup
- Manage singleton vs transient services

### Design

```typescript
// src/infrastructure/container/types.ts
export type ServiceFactory<T> = () => T
export type ServiceLifetime = 'singleton' | 'transient'

export interface ServiceDescriptor<T> {
  factory: ServiceFactory<T>
  lifetime: ServiceLifetime
  instance?: T
}
```

### Implementation

```typescript
// src/infrastructure/container/Container.ts
import type { ServiceDescriptor, ServiceFactory, ServiceLifetime } from './types'

class ServiceContainer {
  private services = new Map<string, ServiceDescriptor<unknown>>()

  /**
   * Register a service
   */
  register<T>(
    token: string,
    factory: ServiceFactory<T>,
    lifetime: ServiceLifetime = 'singleton'
  ): void {
    this.services.set(token, { factory, lifetime })
  }

  /**
   * Resolve a service
   */
  resolve<T>(token: string): T {
    const descriptor = this.services.get(token) as ServiceDescriptor<T> | undefined

    if (!descriptor) {
      throw new Error(`Service not registered: ${token}`)
    }

    if (descriptor.lifetime === 'singleton') {
      if (!descriptor.instance) {
        descriptor.instance = descriptor.factory()
      }
      return descriptor.instance
    }

    return descriptor.factory()
  }

  /**
   * Check if service is registered
   */
  has(token: string): boolean {
    return this.services.has(token)
  }

  /**
   * Clear all services (for testing)
   */
  clear(): void {
    this.services.clear()
  }
}

export const container = new ServiceContainer()

// Service tokens
export const ServiceTokens = {
  CalculationService: 'CalculationService',
  ValidationService: 'ValidationService',
  WorkflowService: 'WorkflowService',
  ExportService: 'ExportService',
  Logger: 'Logger',
  EventBus: 'EventBus',
} as const
```

### Vue Composable

```typescript
// src/infrastructure/container/useService.ts
import { container } from './Container'

export function useService<T>(token: string): T {
  return container.resolve<T>(token)
}

// Type-safe service hook generator
export function createServiceHook<T>(token: string) {
  return () => useService<T>(token)
}
```

### Bootstrap Configuration

```typescript
// src/infrastructure/bootstrap.ts
import { container, ServiceTokens } from './container/Container'
import { eventBus } from './events/EventBus'
import { logger } from './logger/Logger'
import { ConsoleTransport } from './logger/transports/ConsoleTransport'
import { SentryTransport } from './logger/transports/SentryTransport'

export function bootstrapInfrastructure(): void {
  // Configure logger
  if (import.meta.env.DEV) {
    logger.addTransport(new ConsoleTransport())
  } else {
    logger.addTransport(new SentryTransport())
  }

  // Register core services
  container.register(ServiceTokens.Logger, () => logger, 'singleton')
  container.register(ServiceTokens.EventBus, () => eventBus, 'singleton')

  // Wire up event → logger integration
  eventBus.on('*', (event) => {
    logger.debug(`Event: ${event.type}`, event.payload as Record<string, unknown>)
  })
}
```

---

## 1.4 Type System Improvements

### Error Types

```typescript
// src/infrastructure/errors/types.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(
    public readonly errors: Record<string, string[]>
  ) {
    super('Validation failed', 'VALIDATION_ERROR', { errors })
    this.name = 'ValidationError'
  }
}

export class ApiError extends AppError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly endpoint: string,
    public readonly response?: unknown
  ) {
    super(message, `API_ERROR_${statusCode}`, { endpoint, response })
    this.name = 'ApiError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string | number) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', { resource, id })
    this.name = 'NotFoundError'
  }
}

export class AuthenticationError extends AppError {
  constructor(reason: string) {
    super(`Authentication failed: ${reason}`, 'AUTH_ERROR', { reason })
    this.name = 'AuthenticationError'
  }
}
```

### Type Guards

```typescript
// src/infrastructure/errors/guards.ts
import { AppError, ValidationError, ApiError } from './types'

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) return error.message
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'An unexpected error occurred'
}

export function extractValidationErrors(error: unknown): Record<string, string[]> | null {
  if (isValidationError(error)) return error.errors

  // Handle Laravel validation response shape
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as any).response?.data?.errors === 'object'
  ) {
    return (error as any).response.data.errors
  }

  return null
}
```

### Strict Generic Types

```typescript
// src/infrastructure/types/generics.ts

/**
 * Make specific keys required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Document with ID (after creation)
 */
export type WithId<T> = T & { id: number }

/**
 * Pagination response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

/**
 * API mutation result
 */
export interface MutationResult<T> {
  data: T
  message?: string
}

/**
 * Filter params with pagination
 */
export interface PaginatedFilters {
  page?: number
  per_page?: number
  search?: string
}

/**
 * Document types enum
 */
export type DocumentType =
  | 'quotation'
  | 'invoice'
  | 'bill'
  | 'purchase_order'
  | 'delivery_order'
  | 'work_order'

/**
 * Document status (common across document types)
 */
export type DocumentStatus =
  | 'draft'
  | 'submitted'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
```

---

## 1.5 Error Boundary Components

### Vue Error Boundary

```vue
<!-- src/components/error/ErrorBoundary.vue -->
<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useEventBus } from '@/infrastructure/events/useEventBus'
import { getErrorMessage } from '@/infrastructure/errors/guards'
import { Button } from '@/components/ui'

interface Props {
  fallback?: 'default' | 'minimal' | 'none'
  onError?: (error: Error) => void
}

const props = withDefaults(defineProps<Props>(), {
  fallback: 'default',
})

const emit = defineEmits<{
  error: [error: Error]
}>()

const { emit: emitEvent } = useEventBus()

const error = ref<Error | null>(null)
const errorInfo = ref<string>('')

onErrorCaptured((err, instance, info) => {
  error.value = err
  errorInfo.value = info

  // Emit to event bus for logging
  emitEvent('error:unhandled', {
    error: err,
    context: `Component: ${instance?.$options.name || 'Unknown'}, Info: ${info}`,
  })

  // Call custom handler if provided
  props.onError?.(err)
  emit('error', err)

  // Prevent propagation
  return false
})

function retry() {
  error.value = null
  errorInfo.value = ''
}
</script>

<template>
  <slot v-if="!error" />

  <template v-else>
    <!-- Default fallback -->
    <div
      v-if="fallback === 'default'"
      class="p-8 text-center bg-destructive/10 rounded-lg border border-destructive/20"
    >
      <div class="text-destructive text-lg font-medium mb-2">
        Something went wrong
      </div>
      <p class="text-muted-foreground mb-4">
        {{ getErrorMessage(error) }}
      </p>
      <Button variant="outline" @click="retry">
        Try Again
      </Button>
    </div>

    <!-- Minimal fallback -->
    <div
      v-else-if="fallback === 'minimal'"
      class="p-4 text-destructive text-sm"
    >
      Error: {{ getErrorMessage(error) }}
      <button class="underline ml-2" @click="retry">Retry</button>
    </div>

    <!-- No fallback - just slot for custom handling -->
    <slot v-else name="error" :error="error" :retry="retry" />
  </template>
</template>
```

### API Error Handler

```typescript
// src/infrastructure/errors/apiErrorHandler.ts
import { eventBus } from '@/infrastructure/events/EventBus'
import { logger } from '@/infrastructure/logger/Logger'
import { ApiError, AuthenticationError, ValidationError } from './types'
import type { AxiosError } from 'axios'

export function handleApiError(error: AxiosError): never {
  const { response, config } = error
  const endpoint = config?.url || 'unknown'
  const method = config?.method?.toUpperCase() || 'UNKNOWN'

  // Emit event for observability
  eventBus.emit('api:request-failed', {
    endpoint,
    method,
    error: error.message,
  })

  // Log the error
  logger.error(`API Error: ${method} ${endpoint}`, error, {
    statusCode: response?.status,
    data: response?.data,
  })

  if (!response) {
    throw new ApiError('Network error - please check your connection', 0, endpoint)
  }

  const { status, data } = response

  switch (status) {
    case 401:
      throw new AuthenticationError('Session expired')

    case 403:
      throw new ApiError('You do not have permission to perform this action', 403, endpoint)

    case 404:
      throw new ApiError('Resource not found', 404, endpoint)

    case 422:
      // Laravel validation errors
      if (data && typeof data === 'object' && 'errors' in data) {
        throw new ValidationError((data as any).errors)
      }
      throw new ApiError('Validation failed', 422, endpoint, data)

    case 500:
      throw new ApiError('Server error - please try again later', 500, endpoint)

    default:
      throw new ApiError(
        (data as any)?.message || `Request failed with status ${status}`,
        status,
        endpoint,
        data
      )
  }
}
```

---

## File Structure Summary

```
src/infrastructure/
├── index.ts                    # Re-exports everything
├── bootstrap.ts                # App initialization
│
├── events/
│   ├── index.ts
│   ├── types.ts                # Event catalog
│   ├── EventBus.ts             # Core implementation
│   ├── useEventBus.ts          # Vue composable
│   └── __tests__/
│       └── EventBus.test.ts
│
├── logger/
│   ├── index.ts
│   ├── types.ts
│   ├── Logger.ts
│   ├── useLogger.ts
│   └── transports/
│       ├── ConsoleTransport.ts
│       └── SentryTransport.ts
│
├── container/
│   ├── index.ts
│   ├── types.ts
│   ├── Container.ts
│   └── useService.ts
│
├── errors/
│   ├── index.ts
│   ├── types.ts               # Error classes
│   ├── guards.ts              # Type guards
│   └── apiErrorHandler.ts
│
└── types/
    ├── index.ts
    └── generics.ts
```

---

## Integration with main.ts

```typescript
// src/main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App.vue'
import router from './router'
import { bootstrapInfrastructure } from './infrastructure/bootstrap'

// Bootstrap infrastructure FIRST
bootstrapInfrastructure()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(VueQueryPlugin)

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  const { eventBus } = await import('./infrastructure/events')
  eventBus.emit('error:unhandled', {
    error: err as Error,
    context: `Component: ${instance?.$options?.name || 'Unknown'}, Info: ${info}`,
  })
}

app.mount('#app')
```

---

## Testing

### Event Bus Tests

```typescript
// src/infrastructure/events/__tests__/EventBus.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventBus } from '../EventBus'

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.clear()
  })

  it('should emit and receive events', () => {
    const handler = vi.fn()
    eventBus.on('document:created', handler)

    eventBus.emit('document:created', { documentType: 'quotation', id: 1 })

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'document:created',
        payload: { documentType: 'quotation', id: 1 },
      })
    )
  })

  it('should unsubscribe correctly', () => {
    const handler = vi.fn()
    const unsub = eventBus.on('document:created', handler)

    unsub()
    eventBus.emit('document:created', { documentType: 'quotation', id: 1 })

    expect(handler).not.toHaveBeenCalled()
  })

  it('should support once subscription', () => {
    const handler = vi.fn()
    eventBus.once('document:created', handler)

    eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
    eventBus.emit('document:created', { documentType: 'quotation', id: 2 })

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should track event history', () => {
    eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
    eventBus.emit('document:updated', { documentType: 'quotation', id: 1, changes: ['status'] })

    expect(eventBus.history.value).toHaveLength(2)
    expect(eventBus.history.value[0].type).toBe('document:updated')
  })
})
```

---

## Checklist

- [ ] Event bus implemented with TypeScript generics
- [ ] Logger service with console and Sentry transports
- [ ] Service container with singleton/transient support
- [ ] Error types (AppError, ValidationError, ApiError)
- [ ] Type guards for error handling
- [ ] ErrorBoundary component
- [ ] Bootstrap function for app initialization
- [ ] Tests for EventBus
- [ ] Tests for Container
- [ ] Integration with main.ts

---

## Next Phase

Once Phase 1 is complete, proceed to [Phase 2: Domain Services](./02-PHASE-DOMAIN-SERVICES.md) to build the calculation and workflow services that use this infrastructure.
