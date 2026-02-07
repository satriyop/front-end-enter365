/**
 * Logger Tests
 *
 * Tests the Logger class: level filtering, transport dispatch,
 * prefix, global context, and child loggers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { LogEntry, LogTransport } from '../types'

// We need to import the Logger class, but it's not exported directly.
// The module exports a singleton `logger`. We'll test via the singleton
// and create fresh instances by importing the class path.

// Mock import.meta.env.DEV to control default level
vi.stubEnv('DEV', true)

function createMockTransport(name = 'mock'): LogTransport & { entries: LogEntry[] } {
  const entries: LogEntry[] = []
  return {
    name,
    log: vi.fn((entry: LogEntry) => {
      entries.push(entry)
    }),
    entries,
  }
}

// Since Logger is not directly exported, we test via the exported singleton
// and its methods. We can add a transport and observe what it receives.
import { logger } from '../Logger'

describe('Logger', () => {
  let transport: ReturnType<typeof createMockTransport>

  beforeEach(() => {
    transport = createMockTransport()
    // Remove any previously added transports
    logger.removeTransport('mock')
    logger.addTransport(transport)
    // Set to debug so all levels pass
    logger.setLevel('debug')
  })

  describe('log methods', () => {
    it('debug sends to transport', () => {
      logger.debug('Debug message')

      expect(transport.log).toHaveBeenCalledTimes(1)
      expect(transport.entries[0]!.level).toBe('debug')
      expect(transport.entries[0]!.message).toBe('Debug message')
    })

    it('info sends to transport', () => {
      logger.info('Info message')

      expect(transport.entries[0]!.level).toBe('info')
      expect(transport.entries[0]!.message).toBe('Info message')
    })

    it('warn sends to transport', () => {
      logger.warn('Warning message')

      expect(transport.entries[0]!.level).toBe('warn')
      expect(transport.entries[0]!.message).toBe('Warning message')
    })

    it('error sends to transport with error object', () => {
      const error = new Error('Something broke')
      logger.error('Error occurred', error)

      expect(transport.entries[0]!.level).toBe('error')
      expect(transport.entries[0]!.message).toBe('Error occurred')
      expect(transport.entries[0]!.error).toBe(error)
    })

    it('includes context in log entry', () => {
      logger.info('User action', { userId: 42, action: 'login' })

      expect(transport.entries[0]!.context).toEqual(
        expect.objectContaining({ userId: 42, action: 'login' }),
      )
    })

    it('includes timestamp', () => {
      const before = new Date()
      logger.info('Timestamp test')
      const after = new Date()

      const timestamp = transport.entries[0]!.timestamp
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })
  })

  describe('level filtering', () => {
    it('filters out levels below minimum', () => {
      logger.setLevel('warn')

      logger.debug('Should not appear')
      logger.info('Should not appear')
      logger.warn('Should appear')
      logger.error('Should appear')

      expect(transport.log).toHaveBeenCalledTimes(2)
      expect(transport.entries[0]!.level).toBe('warn')
      expect(transport.entries[1]!.level).toBe('error')
    })

    it('error level only logs errors', () => {
      logger.setLevel('error')

      logger.debug('No')
      logger.info('No')
      logger.warn('No')
      logger.error('Yes')

      expect(transport.log).toHaveBeenCalledTimes(1)
    })

    it('debug level logs everything', () => {
      logger.setLevel('debug')

      logger.debug('Yes')
      logger.info('Yes')
      logger.warn('Yes')
      logger.error('Yes')

      expect(transport.log).toHaveBeenCalledTimes(4)
    })
  })

  describe('logLevel method', () => {
    it('logs with explicit level', () => {
      logger.logLevel('warn', 'Explicit warning')

      expect(transport.entries[0]!.level).toBe('warn')
      expect(transport.entries[0]!.message).toBe('Explicit warning')
    })
  })

  describe('global context', () => {
    it('includes global context in all logs', () => {
      logger.setContext({ app: 'enter365', version: '1.0' })
      logger.info('Test')

      expect(transport.entries[0]!.context).toEqual(
        expect.objectContaining({ app: 'enter365', version: '1.0' }),
      )
    })

    it('merges call context with global context', () => {
      logger.setContext({ app: 'enter365' })
      logger.info('Test', { userId: 1 })

      expect(transport.entries[0]!.context).toEqual(
        expect.objectContaining({ app: 'enter365', userId: 1 }),
      )
    })

    // Clean up global context after test
    afterEach(() => {
      logger.setContext({})
    })
  })

  describe('child logger', () => {
    it('creates child with additional context', () => {
      const child = logger.child({ module: 'quotation' })
      child.info('Child log')

      expect(transport.entries[0]!.context).toEqual(
        expect.objectContaining({ module: 'quotation' }),
      )
    })

    it('child shares parent transports', () => {
      const child = logger.child({ scope: 'test' })
      child.info('Shared transport')

      // Same transport receives the log
      expect(transport.log).toHaveBeenCalledTimes(1)
    })

    it('child inherits parent level', () => {
      logger.setLevel('error')
      const child = logger.child({ scope: 'test' })

      child.debug('Should not appear')
      child.info('Should not appear')
      child.error('Should appear')

      expect(transport.log).toHaveBeenCalledTimes(1)
    })
  })

  describe('transport management', () => {
    it('sends to multiple transports', () => {
      const transport2 = createMockTransport('second')
      logger.addTransport(transport2)

      logger.info('Multi-transport')

      expect(transport.log).toHaveBeenCalledTimes(1)
      expect(transport2.log).toHaveBeenCalledTimes(1)

      logger.removeTransport('second')
    })

    it('removeTransport removes by name', () => {
      logger.removeTransport('mock')
      logger.info('After removal')

      expect(transport.log).not.toHaveBeenCalled()

      // Re-add for other tests
      logger.addTransport(transport)
    })

    it('handles transport errors gracefully', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const badTransport: LogTransport = {
        name: 'bad',
        log: () => {
          throw new Error('Transport failure')
        },
      }

      logger.addTransport(badTransport)
      logger.info('Should not throw')

      // Should not throw, but log to console.error
      expect(errorSpy).toHaveBeenCalled()

      logger.removeTransport('bad')
      errorSpy.mockRestore()
    })
  })
})
