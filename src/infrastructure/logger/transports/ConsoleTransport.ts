/**
 * Console Transport
 *
 * Outputs logs to browser console with colors and formatting.
 * Useful for development.
 */

import type { LogTransport, LogEntry, LogLevel } from '../types'

/**
 * Console styling for different log levels
 */
const LEVEL_STYLES: Record<LogLevel, string> = {
  debug: 'color: #9CA3AF; font-weight: normal',
  info: 'color: #3B82F6; font-weight: normal',
  warn: 'color: #F59E0B; font-weight: bold',
  error: 'color: #EF4444; font-weight: bold',
}

/**
 * Console icons for different log levels
 */
const LEVEL_ICONS: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
}

export class ConsoleTransport implements LogTransport {
  readonly name = 'console'

  private useColors: boolean
  private collapsed: boolean

  constructor(options?: { useColors?: boolean; collapsed?: boolean }) {
    this.useColors = options?.useColors ?? true
    this.collapsed = options?.collapsed ?? true
  }

  log(entry: LogEntry): void {
    const { level, message, timestamp, context, error } = entry
    const time = timestamp.toISOString().slice(11, 23)
    const levelUpper = level.toUpperCase().padEnd(5)

    const hasExtra = (context && Object.keys(context).length > 0) || error

    if (hasExtra && this.collapsed) {
      // Use collapsed group for entries with extra data
      console.groupCollapsed(
        `%c${LEVEL_ICONS[level]} [${time}] ${levelUpper} %c${message}`,
        this.useColors ? LEVEL_STYLES[level] : '',
        'color: inherit'
      )

      if (context && Object.keys(context).length > 0) {
        console.log('%cContext:', 'color: #6B7280; font-weight: bold', context)
      }

      if (error) {
        console.error('%cError:', 'color: #EF4444; font-weight: bold', error)
      }

      console.groupEnd()
    } else {
      // Simple log for entries without extra data
      const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log

      if (this.useColors) {
        logFn(
          `%c${LEVEL_ICONS[level]} [${time}] ${levelUpper} %c${message}`,
          LEVEL_STYLES[level],
          'color: inherit',
          ...(hasExtra ? [{ context, error }] : [])
        )
      } else {
        logFn(
          `${LEVEL_ICONS[level]} [${time}] ${levelUpper} ${message}`,
          ...(hasExtra ? [{ context, error }] : [])
        )
      }
    }
  }
}
