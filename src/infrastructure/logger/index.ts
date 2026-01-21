/**
 * Logger Module
 *
 * Structured logging with transport support.
 *
 * @example
 * ```ts
 * // In a Vue component
 * import { useLogger } from '@/infrastructure/logger'
 *
 * const log = useLogger()
 * log.info('Component mounted')
 * log.error('Operation failed', error, { userId: 123 })
 * ```
 *
 * @example
 * ```ts
 * // Outside components
 * import { logger } from '@/infrastructure/logger'
 *
 * logger.info('Server request completed', { endpoint: '/api/users', duration: 150 })
 * ```
 */

// Core
export { logger } from './Logger'
export { useLogger } from './useLogger'

// Transports
export { ConsoleTransport } from './transports/ConsoleTransport'

// Types
export type {
  LogLevel,
  LogEntry,
  LogTransport,
  LoggerOptions,
} from './types'
export { LOG_LEVELS } from './types'
