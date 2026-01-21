/**
 * Event Bus Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { eventBus } from '../EventBus'

describe('EventBus', () => {
  beforeEach(() => {
    eventBus.clear()
    eventBus.clearHistory()
    eventBus.enable()
  })

  describe('on', () => {
    it('should subscribe to an event and receive it', () => {
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

    it('should include timestamp in event', () => {
      const handler = vi.fn()
      eventBus.on('document:created', handler)

      const before = new Date()
      eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
      const after = new Date()

      const event = handler.mock.calls[0]![0]
      expect(event.timestamp).toBeInstanceOf(Date)
      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime())
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(after.getTime())
    })

    it('should include meta in event', () => {
      const handler = vi.fn()
      eventBus.on('document:created', handler)

      eventBus.emit(
        'document:created',
        { documentType: 'quotation', id: 1 },
        { userId: 123, source: 'QuotationForm' }
      )

      const event = handler.mock.calls[0]![0]
      expect(event.meta).toEqual({ userId: 123, source: 'QuotationForm' })
    })
  })

  describe('unsubscribe', () => {
    it('should unsubscribe when calling returned function', () => {
      const handler = vi.fn()
      const unsubscribe = eventBus.on('document:created', handler)

      eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
      expect(handler).toHaveBeenCalledTimes(1)

      unsubscribe()

      eventBus.emit('document:created', { documentType: 'quotation', id: 2 })
      expect(handler).toHaveBeenCalledTimes(1) // Still 1, not called again
    })
  })

  describe('once', () => {
    it('should only receive the first event', () => {
      const handler = vi.fn()
      eventBus.once('document:created', handler)

      eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
      eventBus.emit('document:created', { documentType: 'quotation', id: 2 })
      eventBus.emit('document:created', { documentType: 'quotation', id: 3 })

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: { documentType: 'quotation', id: 1 },
        })
      )
    })

    it('should be cancellable before event fires', () => {
      const handler = vi.fn()
      const unsubscribe = eventBus.once('document:created', handler)

      unsubscribe()

      eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('onMany', () => {
    it('should subscribe to multiple events', () => {
      const handler = vi.fn()
      eventBus.onMany(['document:created', 'document:updated'], handler)

      eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
      eventBus.emit('document:updated', { documentType: 'quotation', id: 1, changes: ['status'] })

      expect(handler).toHaveBeenCalledTimes(2)
    })

    it('should unsubscribe from all events', () => {
      const handler = vi.fn()
      const unsubscribe = eventBus.onMany(['document:created', 'document:updated'], handler)

      unsubscribe()

      eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
      eventBus.emit('document:updated', { documentType: 'quotation', id: 1, changes: ['status'] })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('onAny (wildcard)', () => {
    it('should receive all events', () => {
      const handler = vi.fn()
      eventBus.onAny(handler)

      eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
      eventBus.emit('document:deleted', { documentType: 'quotation', id: 1 })
      eventBus.emit('form:submitted', { formName: 'quotation', success: true })

      expect(handler).toHaveBeenCalledTimes(3)
    })
  })

  describe('multiple handlers', () => {
    it('should call all handlers for same event', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      eventBus.on('document:created', handler1)
      eventBus.on('document:created', handler2)
      eventBus.on('document:created', handler3)

      eventBus.emit('document:created', { documentType: 'quotation', id: 1 })

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
      expect(handler3).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    it('should not throw if handler throws', () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error')
      })
      const normalHandler = vi.fn()

      eventBus.on('document:created', errorHandler)
      eventBus.on('document:created', normalHandler)

      expect(() => {
        eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
      }).not.toThrow()

      // Other handlers should still be called
      expect(normalHandler).toHaveBeenCalled()
    })

    it('should handle async handler errors gracefully', async () => {
      const asyncErrorHandler = vi.fn(async () => {
        throw new Error('Async error')
      })

      eventBus.on('document:created', asyncErrorHandler)

      expect(() => {
        eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
      }).not.toThrow()
    })
  })

  describe('history', () => {
    it('should track event history', () => {
      eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
      eventBus.emit('document:updated', { documentType: 'quotation', id: 1, changes: ['status'] })

      expect(eventBus.history.value).toHaveLength(2)
      // Most recent first
      expect(eventBus.history.value[0]!.type).toBe('document:updated')
      expect(eventBus.history.value[1]!.type).toBe('document:created')
    })

    it('should limit history size', () => {
      // Emit more than MAX_HISTORY_SIZE events
      for (let i = 0; i < 150; i++) {
        eventBus.emit('document:created', { documentType: 'quotation', id: i })
      }

      expect(eventBus.history.value.length).toBeLessThanOrEqual(100)
    })
  })

  describe('enable/disable', () => {
    it('should not emit events when disabled', () => {
      const handler = vi.fn()
      eventBus.on('document:created', handler)

      eventBus.disable()
      eventBus.emit('document:created', { documentType: 'quotation', id: 1 })

      expect(handler).not.toHaveBeenCalled()
    })

    it('should emit events after re-enabling', () => {
      const handler = vi.fn()
      eventBus.on('document:created', handler)

      eventBus.disable()
      eventBus.emit('document:created', { documentType: 'quotation', id: 1 })

      eventBus.enable()
      eventBus.emit('document:created', { documentType: 'quotation', id: 2 })

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })

  describe('clear', () => {
    it('should remove all handlers', () => {
      const handler = vi.fn()
      eventBus.on('document:created', handler)
      eventBus.on('document:updated', handler)

      eventBus.clear()

      eventBus.emit('document:created', { documentType: 'quotation', id: 1 })
      eventBus.emit('document:updated', { documentType: 'quotation', id: 1, changes: [] })

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('listenerCount', () => {
    it('should return correct count', () => {
      expect(eventBus.listenerCount('document:created')).toBe(0)

      const unsub1 = eventBus.on('document:created', vi.fn())
      expect(eventBus.listenerCount('document:created')).toBe(1)

      const unsub2 = eventBus.on('document:created', vi.fn())
      expect(eventBus.listenerCount('document:created')).toBe(2)

      unsub1()
      expect(eventBus.listenerCount('document:created')).toBe(1)

      unsub2()
      expect(eventBus.listenerCount('document:created')).toBe(0)
    })
  })
})
