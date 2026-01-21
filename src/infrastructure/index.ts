/**
 * Infrastructure Module
 *
 * Core infrastructure services for the application:
 * - Event Bus: Publish/subscribe for loose coupling
 * - Logger: Structured logging with transports
 * - Container: Dependency injection
 * - Performance: Performance monitoring and metrics
 * - Feature Flags: Safe, incremental feature rollouts
 * - Errors: Custom error types and guards
 *
 * @example
 * ```ts
 * // Bootstrap in main.ts
 * import { bootstrapInfrastructure } from '@/infrastructure'
 *
 * bootstrapInfrastructure()
 * ```
 *
 * @example
 * ```ts
 * // Use in components
 * import { useEventBus, useLogger } from '@/infrastructure'
 *
 * const { emit } = useEventBus()
 * const log = useLogger()
 *
 * log.info('Something happened')
 * emit('document:created', { documentType: 'quotation', id: 1 })
 * ```
 */

// Bootstrap
export { bootstrapInfrastructure, cleanupInfrastructure } from './bootstrap'
export type { BootstrapOptions } from './bootstrap'

// Events
export { eventBus, useEventBus } from './events'
export type {
  AppEvent,
  EventMeta,
  EventCatalog,
  EventHandler,
  Unsubscribe,
  EventName,
  EventPayload,
  UseEventBusReturn,
} from './events'

// Logger
export { logger, useLogger, ConsoleTransport } from './logger'
export type { LogLevel, LogEntry, LogTransport, LoggerOptions } from './logger'
export { LOG_LEVELS } from './logger'

// Container
export { container, useService, createServiceHook, ServiceTokens } from './container'
export type { ServiceFactory, ServiceLifetime, ServiceToken } from './container'

// Performance
export { performanceMonitor, usePerformance, useComponentLifecycle } from './performance'
export type { PerformanceMetric, PerformanceSummary } from './performance'

// Feature Flags
export { featureFlags, useFeatureFlag, useFeatureFlags, featureFlagComponent } from './features'
export type { FeatureFlag, FeatureFlagsConfig, FeatureFlagName } from './features'

// Errors
export {
  AppError,
  ValidationError,
  ApiError,
  NotFoundError,
  AuthenticationError,
  PermissionError,
  NetworkError,
  TimeoutError,
  isAppError,
  isValidationError,
  isApiError,
  isNotFoundError,
  isAuthenticationError,
  isPermissionError,
  isNetworkError,
  getErrorMessage,
  extractValidationErrors,
  flattenValidationErrors,
  getFirstValidationError,
  getErrorCode,
  getStatusCode,
} from './errors'

// Types
export type {
  RequireKeys,
  OptionalKeys,
  WithId,
  WithTimestamps,
  WithSoftDelete,
  PaginatedResponse,
  ListResponse,
  SingleResponse,
  MutationResult,
  PaginatedFilters,
  DocumentType,
  DocumentStatus,
  LookupItem,
  SelectOption,
  DeepPartial,
  Nullable,
  Maybe,
} from './types'
