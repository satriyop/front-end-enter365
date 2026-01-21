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
| `errors` | Custom error types | `import { AppError, isApiError } from '@/infrastructure'` |
| `features` | Feature flags | `import { featureFlags, useFeatureFlag } from '@/infrastructure'` |
| `performance` | Perf monitoring | `import { performanceMonitor, usePerformance } from '@/infrastructure'` |

## Event Bus

### Purpose
Decoupled pub/sub communication for observability and cross-component events.

### Event Catalog
```typescript
// Defined in src/infrastructure/events/types.ts
interface EventCatalog {
  // Document lifecycle
  'document:created': { documentType: DocumentType; id: number }
  'document:updated': { documentType: DocumentType; id: number; changes: string[] }
  'document:deleted': { documentType: DocumentType; id: number }
  'document:status-changed': { documentType: DocumentType; id: number; from: string; to: string }

  // User actions
  'user:logged-in': { userId: number }
  'user:logged-out': { userId: number }

  // Errors
  'error:unhandled': { error: Error; context?: string }
  'error:api': { status: number; message: string; url: string }

  // Performance
  'perf:slow-operation': { name: string; duration: number }
}
```

### Usage
```typescript
// Emit events
import { eventBus } from '@/infrastructure'

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

// Vue composable
import { useEventBus } from '@/infrastructure'

const { emit, on, once } = useEventBus()

// Auto-cleanup on component unmount
on('document:updated', handleUpdate)
```

### Adding New Events
```typescript
// 1. Add to EventCatalog in types.ts
interface EventCatalog {
  'my:new-event': { data: string }
}

// 2. Emit the event
eventBus.emit('my:new-event', { data: 'value' })
```

## Logger

### Purpose
Structured logging with log levels and transports.

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
// In bootstrap.ts
import { logger, ConsoleTransport, LOG_LEVELS } from '@/infrastructure'

logger.addTransport(new ConsoleTransport({
  minLevel: import.meta.env.DEV ? 'debug' : 'warn',
  colorize: true,
}))
```

## Dependency Injection Container

### Purpose
Manage service instances with lifecycle control.

### Service Tokens
```typescript
// src/infrastructure/container/types.ts
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
import { calculationService } from '@/services/calculation'

// Register singleton
container.register(ServiceTokens.Calculation, () => calculationService, 'singleton')

// Register transient (new instance each time)
container.register(ServiceTokens.Export, () => new ExportService(), 'transient')
```

### Usage
```typescript
import { useService, ServiceTokens } from '@/infrastructure'

// In components
const calcService = useService(ServiceTokens.Calculation)
const result = calcService.calculate(items)
```

## Error Types

### Custom Errors
```typescript
import {
  AppError,
  ValidationError,
  ApiError,
  NotFoundError,
  AuthenticationError,
  PermissionError,
  NetworkError,
} from '@/infrastructure'

// Throwing
throw new ValidationError('Invalid input', {
  email: ['Email is required'],
  password: ['Password too short'],
})

throw new ApiError('Server error', 500, { endpoint: '/api/users' })
```

### Type Guards
```typescript
import {
  isAppError,
  isValidationError,
  isApiError,
  isNotFoundError,
  getErrorMessage,
  extractValidationErrors,
} from '@/infrastructure'

try {
  await saveDocument()
} catch (error) {
  if (isValidationError(error)) {
    const fieldErrors = extractValidationErrors(error)
    // { email: ['Email is required'] }
  } else if (isApiError(error) && error.statusCode === 404) {
    router.push({ name: 'not-found' })
  } else {
    toast.error(getErrorMessage(error))
  }
}
```

## Feature Flags

### Purpose
Safe, incremental feature rollouts with A/B testing support.

### Configuration
```typescript
// src/config/featureFlags.ts
export const featureFlagsConfig: FeatureFlagsConfig = {
  flags: {
    'page:quotation-form-v2': {
      name: 'Quotation Form V2',
      description: 'Use refactored quotation form',
      enabled: false,
      enabledForUsers: [1, 2],  // Test users
      rolloutPercentage: 10,   // 10% of other users
    },
  },
}
```

### Usage
```typescript
import { featureFlags, useFeatureFlag } from '@/infrastructure'

// Direct check
if (featureFlags.isEnabled('page:quotation-form-v2')) {
  // Use new implementation
}

// Vue composable
const { isEnabled } = useFeatureFlag('page:quotation-form-v2')

// In template
<NewForm v-if="isEnabled" />
<LegacyForm v-else />

// Conditional component loading
import { featureFlagComponent } from '@/infrastructure'

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

### Purpose
Track operation durations and identify slow operations.

### Usage
```typescript
import { performanceMonitor, usePerformance } from '@/infrastructure'

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

// Get metrics
const summary = performanceMonitor.getSummary()
// { 'api-call': { count: 10, avg: 150, max: 500, min: 50 } }
```

## Bootstrap

### Initialization
```typescript
// src/main.ts
import { bootstrapInfrastructure } from '@/infrastructure'
import { featureFlagsConfig } from '@/config/featureFlags'

// Initialize before app creation
bootstrapInfrastructure({
  logLevel: import.meta.env.DEV ? 'debug' : 'warn',
  featureFlags: featureFlagsConfig,
})

const app = createApp(App)
// ...
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
