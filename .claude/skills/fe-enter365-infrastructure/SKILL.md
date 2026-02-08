# Enter365 Infrastructure

## Overview

Infrastructure provides cross-cutting concerns: events, logging, DI, errors, feature flags, and performance monitoring.

Location: `src/infrastructure/`

## Modules

| Module | Purpose | Import |
|--------|---------|--------|
| `events` | Pub/sub event bus | `import { eventBus, useEventBus } from '@/infrastructure'` |
| `logger` | Structured logging | `import { logger, useLogger } from '@/infrastructure'` |
| `container` | Dependency injection | `import { container, useService } from '@/infrastructure'` |
| `errors` | 8 custom error types + guards | `import { AppError, isApiError } from '@/infrastructure'` |
| `features` | Feature flags | `import { featureFlags, useFeatureFlag } from '@/infrastructure'` |
| `performance` | Perf monitoring | `import { performanceMonitor, usePerformance } from '@/infrastructure'` |
| `types` | Generic type utilities | `import type { PaginatedResponse } from '@/infrastructure'` |
| `bootstrap` | Init + cleanup | `import { bootstrapInfrastructure, cleanupInfrastructure } from '@/infrastructure'` |

## Event Bus

### Purpose
Decoupled pub/sub communication for observability and cross-component events.

### Event Catalog (24 events, 8 categories)

```typescript
interface EventCatalog {
  // Document lifecycle (4)
  'document:created': { documentType: DocumentType; id: number }
  'document:updated': { documentType: DocumentType; id: number; changes: string[] }
  'document:deleted': { documentType: DocumentType; id: number }
  'document:status-changed': { documentType: DocumentType; id: number; from: string; to: string }

  // Form events (4)
  'form:submitted': { formName: string; success: boolean }
  'form:validation-failed': { formName: string; errors: Record<string, string[]> }
  'form:autosave-triggered': { formName: string }
  'form:field-changed': { formName: string; field: string }

  // API events (3)
  'api:request-started': { method: string; url: string }
  'api:request-completed': { method: string; url: string; status: number; duration: number }
  'api:request-failed': { method: string; url: string; status: number; error: string }

  // User events (3)
  'user:logged-in': { userId: number }
  'user:logged-out': { userId: number }
  'user:action': { action: string; context?: Record<string, unknown> }

  // Navigation events (1)
  'navigation:route-changed': { from: string; to: string }

  // Error events (3)
  'error:unhandled': { error: Error; context?: string }
  'error:api': { status: number; message: string; url: string }
  'error:validation': { formName: string; errors: Record<string, string[]> }

  // UI events (3)
  'ui:modal-opened': { modalName: string }
  'ui:modal-closed': { modalName: string }
  'ui:notification-shown': { type: string; message: string }

  // Workflow events (3)
  'workflow:transition-started': { workflow: string; from: string; to: string }
  'workflow:transition-completed': { workflow: string; from: string; to: string }
  'workflow:transition-blocked': { workflow: string; from: string; event: string; reason: string }
}
```

### Usage
```typescript
import { eventBus } from '@/infrastructure'

// Emit events
eventBus.emit('document:created', {
  documentType: 'quotation',
  id: 123,
})

// Subscribe to events
const unsubscribe = eventBus.on('document:created', (payload, meta) => {
  console.log(`Document created: ${payload.documentType} #${payload.id}`)
  console.log(`Timestamp: ${meta.timestamp}`)
})

// Cleanup
onUnmounted(() => unsubscribe())

// Vue composable (auto-cleanup on component unmount)
import { useEventBus } from '@/infrastructure'

const { emit, on, once } = useEventBus()
on('document:updated', handleUpdate)
```

### Types
```typescript
type AppEvent<T> = { payload: T; meta: EventMeta }
type EventMeta = { timestamp: number; source?: string }
type EventHandler<T> = (payload: T, meta: EventMeta) => void
type Unsubscribe = () => void
type EventName = keyof EventCatalog
type EventPayload<E extends EventName> = EventCatalog[E]
```

## Logger

### Log Levels
```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
```

### Usage
```typescript
import { logger, useLogger } from '@/infrastructure'

// Direct usage
logger.debug('Debug message', { context: 'data' })
logger.info('User logged in', { userId: 123 })
logger.warn('Deprecated API called', { endpoint: '/old-api' })
logger.error('Failed to save', error, { documentId: 456 })

// Vue composable (auto-prefixes with component name)
const log = useLogger()
log.info('Component mounted')  // [MyComponent] Component mounted
```

### Configuration
```typescript
import { logger, ConsoleTransport, LOG_LEVELS } from '@/infrastructure'

logger.addTransport(new ConsoleTransport({
  minLevel: import.meta.env.DEV ? 'debug' : 'warn',
  colorize: true,
}))
```

### Types
```typescript
interface LogEntry {
  level: LogLevel
  message: string
  data?: Record<string, unknown>
  error?: Error
  timestamp: number
}

interface LogTransport {
  log(entry: LogEntry): void
}

interface LoggerOptions {
  transports?: LogTransport[]
  minLevel?: LogLevel
}
```

## Dependency Injection Container

### Service Tokens
```typescript
export const ServiceTokens = {
  Calculation: Symbol('CalculationService'),
  Status: Symbol('StatusService'),
  Pricing: Symbol('PricingService'),
  Export: Symbol('ExportService'),
} as const
```

### Registration
```typescript
import { container, ServiceTokens } from '@/infrastructure'

// Register singleton
container.register(ServiceTokens.Calculation, () => calculationService, 'singleton')

// Register transient (new instance each time)
container.register(ServiceTokens.Export, () => new ExportService(), 'transient')
```

### Usage
```typescript
import { useService, createServiceHook, ServiceTokens } from '@/infrastructure'

// In components
const calcService = useService(ServiceTokens.Calculation)
const result = calcService.calculate(items)

// Create typed hook
const useCalculationService = createServiceHook(ServiceTokens.Calculation)
```

### Types
```typescript
type ServiceFactory<T> = () => T
type ServiceLifetime = 'singleton' | 'transient'
type ServiceToken = symbol
```

## Error Types (8 classes)

### Error Hierarchy
```typescript
// Base error
class AppError extends Error {
  code: string
  context?: Record<string, unknown>
}

// Validation with field-specific errors
class ValidationError extends AppError {
  fieldErrors: Record<string, string[]>
  getFieldError(field: string): string | undefined
  getFieldErrors(field: string): string[]
  getErrorFields(): string[]
  hasFieldError(field: string): boolean
}

// HTTP errors
class ApiError extends AppError {
  statusCode: number
  endpoint?: string
}

// Resource not found
class NotFoundError extends AppError {
  resourceType?: string
  resourceId?: string | number
}

// Auth failures
class AuthenticationError extends AppError {
  // codes: 'invalid_credentials', 'session_expired', 'token_invalid', 'unauthorized'
}

// Authorization errors
class PermissionError extends AppError {
  requiredPermission?: string
}

// Connection issues
class NetworkError extends AppError {}

// Operation timeouts
class TimeoutError extends AppError {
  timeoutMs?: number
}
```

### Type Guards (11 functions)
```typescript
import {
  // Type guards
  isAppError,
  isValidationError,
  isApiError,
  isNotFoundError,
  isAuthenticationError,
  isPermissionError,
  isNetworkError,

  // Message extraction
  getErrorMessage,           // (error, fallback?) => string

  // Validation helpers
  extractValidationErrors,   // (error) => Record<string, string[]> | null
  flattenValidationErrors,   // (errors) => string[]
  getFirstValidationError,   // (error, field?) => string | null

  // Error metadata
  getErrorCode,              // (error) => string | undefined
  getStatusCode,             // (error) => number | null
} from '@/infrastructure'
```

### Error Handling Pattern
```typescript
try {
  await saveDocument()
} catch (error) {
  if (isValidationError(error)) {
    const fieldErrors = extractValidationErrors(error)
    // { email: ['Email is required'] }
  } else if (isApiError(error) && error.statusCode === 404) {
    router.push({ name: 'not-found' })
  } else if (isNetworkError(error)) {
    toast.error('Connection lost. Please check your internet.')
  } else {
    toast.error(getErrorMessage(error))
  }
}
```

## Feature Flags

### Configuration
```typescript
// src/config/featureFlags.ts
export const featureFlagsConfig: FeatureFlagsConfig = {
  flags: {
    'page:quotation-form-v2': {
      name: 'Quotation Form V2',
      description: 'Use refactored quotation form',
      enabled: false,
      enabledForUsers: [1, 2],
      rolloutPercentage: 10,
    },
  },
}
```

### Usage
```typescript
import { featureFlags, useFeatureFlag, useFeatureFlags, featureFlagComponent } from '@/infrastructure'

// Direct check
if (featureFlags.isEnabled('page:quotation-form-v2')) { ... }

// Vue composable
const { isEnabled } = useFeatureFlag('page:quotation-form-v2')

// Multiple flags
const { isEnabled: isV2, isEnabled: hasDarkMode } = useFeatureFlags()

// In template
<NewForm v-if="isEnabled" />
<LegacyForm v-else />

// Conditional component loading
const QuotationForm = featureFlagComponent(
  'page:quotation-form-v2',
  () => import('./QuotationFormV2.vue'),
  () => import('./QuotationForm.vue')
)
```

### Flag Naming Convention
- `infra:*` - Infrastructure features
- `service:*` - Service layer features
- `component:*` - UI component features
- `page:*` - Page-level migrations
- `feature:*` - Cross-cutting features

## Performance Monitoring

### Usage
```typescript
import { performanceMonitor, usePerformance, useComponentLifecycle } from '@/infrastructure'

// Direct usage
performanceMonitor.mark('data-load')
const data = await fetchData()
const duration = performanceMonitor.measure('data-load')

// Async measurement
const result = await performanceMonitor.measureAsync('api-call', async () => {
  return await api.get('/data')
})

// Vue composable
const { track, trackAsync } = usePerformance()
await trackAsync('fetchProducts', async () => {
  return await api.get('/products')
})

// Component lifecycle tracking
useComponentLifecycle()  // auto-tracks mount/unmount durations

// Get metrics
const summary = performanceMonitor.getSummary()
// { 'api-call': { count: 10, avg: 150, max: 500, min: 50 } }
```

### Types
```typescript
interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
}

interface PerformanceSummary {
  [name: string]: {
    count: number
    avg: number
    max: number
    min: number
  }
}
```

## Type Utilities

```typescript
import type {
  RequireKeys, OptionalKeys,
  WithId, WithTimestamps, WithSoftDelete,
  PaginatedResponse, ListResponse, SingleResponse, MutationResult,
  PaginatedFilters,
  DocumentType, DocumentStatus,
  LookupItem, SelectOption,
  DeepPartial, Nullable, Maybe,
} from '@/infrastructure'
```

## Bootstrap

### Initialization
```typescript
// src/main.ts
import { bootstrapInfrastructure, cleanupInfrastructure } from '@/infrastructure'
import { featureFlagsConfig } from '@/config/featureFlags'

// Initialize before app creation
bootstrapInfrastructure({
  logLevel: import.meta.env.DEV ? 'debug' : 'warn',
  featureFlags: featureFlagsConfig,
})

const app = createApp(App)
// ...

// Cleanup on app unmount (optional)
app.onUnmount(() => cleanupInfrastructure())
```

### Options
```typescript
interface BootstrapOptions {
  logLevel?: LogLevel
  featureFlags?: FeatureFlagsConfig
}
```

## Global Error Handler
```typescript
// In main.ts
app.config.errorHandler = (err, instance, info) => {
  logger.error('Vue error', err as Error, { info })
  eventBus.emit('error:unhandled', {
    error: err as Error,
    context: info,
  })
}
```
