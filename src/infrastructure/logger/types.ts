/**
 * Logger Type Definitions
 */

/**
 * Log levels from least to most severe
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * Numeric values for log levels (for comparison)
 */
export const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * A single log entry
 */
export interface LogEntry {
  /** Log level */
  level: LogLevel
  /** Log message */
  message: string
  /** When the log was created */
  timestamp: Date
  /** Additional context data */
  context?: Record<string, unknown>
  /** Tags for categorization */
  tags?: string[]
  /** Associated error (if any) */
  error?: Error
}

/**
 * Logger configuration options
 */
export interface LoggerOptions {
  /** Minimum level to log */
  level: LogLevel
  /** Prefix for all log messages */
  prefix?: string
  /** Default context added to all logs */
  context?: Record<string, unknown>
}

/**
 * Log transport interface
 * Transports handle the actual output of log entries
 */
export interface LogTransport {
  /** Transport name (for identification) */
  name: string
  /** Process a log entry */
  log(entry: LogEntry): void | Promise<void>
}
