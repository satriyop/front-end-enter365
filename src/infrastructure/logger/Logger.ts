/**
 * Logger Service
 *
 * Structured logging with multiple transport support.
 *
 * @example
 * ```ts
 * import { logger } from '@/infrastructure/logger'
 *
 * logger.info('User logged in', { userId: 123 })
 * logger.error('Failed to save', new Error('Network error'), { retries: 3 })
 * ```
 */

import type { LogLevel, LogEntry, LogTransport, LoggerOptions } from './types'
import { LOG_LEVELS } from './types'

class Logger {
  private transports: LogTransport[] = []
  private minLevel: LogLevel
  private globalContext: Record<string, unknown>
  private prefix?: string

  constructor(options?: Partial<LoggerOptions>) {
    this.minLevel = options?.level ?? (import.meta.env.DEV ? 'debug' : 'warn')
    this.globalContext = options?.context ?? {}
    this.prefix = options?.prefix
  }

  /**
   * Add a transport for log output
   */
  addTransport(transport: LogTransport): void {
    this.transports.push(transport)
  }

  /**
   * Remove a transport by name
   */
  removeTransport(name: string): void {
    this.transports = this.transports.filter((t) => t.name !== name)
  }

  /**
   * Set minimum log level
   */
  setLevel(level: LogLevel): void {
    this.minLevel = level
  }

  /**
   * Set global context that appears in all logs
   */
  setContext(context: Record<string, unknown>): void {
    this.globalContext = { ...this.globalContext, ...context }
  }

  /**
   * Create a child logger with additional context
   * Useful for request-scoped or component-scoped logging
   */
  child(context: Record<string, unknown>): Logger {
    const child = new Logger({
      level: this.minLevel,
      prefix: this.prefix,
      context: { ...this.globalContext, ...context },
    })
    // Share transports with parent
    child.transports = this.transports
    return child
  }

  /**
   * Check if a level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel]
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message: this.prefix ? `[${this.prefix}] ${message}` : message,
      timestamp: new Date(),
      context: { ...this.globalContext, ...context },
      error,
    }

    // Send to all transports
    for (const transport of this.transports) {
      try {
        const result = transport.log(entry)
        // Handle async transports silently
        if (result instanceof Promise) {
          result.catch((err) => {
            console.error(`Logger transport "${transport.name}" error:`, err)
          })
        }
      } catch (err) {
        console.error(`Logger transport "${transport.name}" error:`, err)
      }
    }
  }

  /**
   * Log a debug message (development only by default)
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context)
  }

  /**
   * Log an info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context)
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context)
  }

  /**
   * Log an error message
   */
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>
  ): void {
    this.log('error', message, context, error)
  }

  /**
   * Log with explicit level
   */
  logLevel(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    this.log(level, message, context)
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger()
