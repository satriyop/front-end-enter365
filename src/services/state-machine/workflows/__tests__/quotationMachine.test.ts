/**
 * Quotation Workflow Tests
 *
 * Tests the quotation lifecycle:
 * draft → submitted → approved → converted (final)
 *   ↓        ↓           ↓
 * cancelled rejected   expired (final)
 *
 * Key business rules:
 * - Cannot submit with zero amount
 * - Cannot convert an expired quotation
 * - REJECT stores reason, REVISE clears it
 * - CONVERT stores invoiceId
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StateMachine } from '../../StateMachine'
import {
  quotationMachineConfig,
  createQuotationMachine,
  type QuotationContext,
  type QuotationEvent,
} from '../quotationMachine'

function createMachine(contextOverrides: Partial<QuotationContext> = {}) {
  const config = createQuotationMachine({
    id: 1,
    contactId: 10,
    totalAmount: 500000,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    ...contextOverrides,
  })
  return new StateMachine<QuotationContext, QuotationEvent>(config)
}

describe('quotationMachine', () => {
  let machine: StateMachine<QuotationContext, QuotationEvent>

  beforeEach(() => {
    machine = createMachine()
  })

  describe('config', () => {
    it('has id "quotation"', () => {
      expect(quotationMachineConfig.id).toBe('quotation')
    })

    it('starts in draft', () => {
      expect(quotationMachineConfig.initial).toBe('draft')
    })

    it('has 7 states', () => {
      expect(Object.keys(quotationMachineConfig.states)).toHaveLength(7)
    })
  })

  describe('createQuotationMachine', () => {
    it('merges context with defaults', () => {
      const config = createQuotationMachine({ id: 42, totalAmount: 100000 })

      expect(config.context.id).toBe(42)
      expect(config.context.totalAmount).toBe(100000)
      expect(config.context.contactId).toBe(0) // default
    })

    it('preserves machine config', () => {
      const config = createQuotationMachine({ id: 1 })

      expect(config.id).toBe('quotation')
      expect(config.initial).toBe('draft')
      expect(config.states).toBe(quotationMachineConfig.states)
    })
  })

  describe('draft state', () => {
    it('starts in draft', () => {
      expect(machine.value).toBe('draft')
      expect(machine.done).toBe(false)
    })

    it('has SUBMIT and CANCEL transitions', () => {
      const transitions = machine.getAvailableTransitions()

      expect(transitions).toContain('SUBMIT')
      expect(transitions).toContain('CANCEL')
    })

    it('can cancel from draft', async () => {
      const result = await machine.transition({ type: 'CANCEL' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('cancelled')
      expect(machine.done).toBe(true)
    })
  })

  describe('SUBMIT guard', () => {
    it('allows submit when totalAmount > 0', async () => {
      const result = await machine.transition({ type: 'SUBMIT' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('submitted')
    })

    it('blocks submit when totalAmount is 0', async () => {
      machine = createMachine({ totalAmount: 0 })

      const result = await machine.transition({ type: 'SUBMIT' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot submit quotation with zero amount')
      expect(machine.value).toBe('draft')
    })

    it('canTransition reflects guard', () => {
      expect(machine.canTransition('SUBMIT')).toBe(true)

      machine = createMachine({ totalAmount: 0 })
      expect(machine.canTransition('SUBMIT')).toBe(false)
    })
  })

  describe('submitted state', () => {
    beforeEach(async () => {
      await machine.transition({ type: 'SUBMIT' })
    })

    it('is in submitted state', () => {
      expect(machine.value).toBe('submitted')
    })

    it('has APPROVE, REJECT, and CANCEL transitions', () => {
      const transitions = machine.getAvailableTransitions()

      expect(transitions).toContain('APPROVE')
      expect(transitions).toContain('REJECT')
      expect(transitions).toContain('CANCEL')
    })

    it('can approve', async () => {
      const result = await machine.transition({ type: 'APPROVE' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('approved')
    })

    it('can cancel', async () => {
      const result = await machine.transition({ type: 'CANCEL' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('cancelled')
    })
  })

  describe('REJECT action', () => {
    beforeEach(async () => {
      await machine.transition({ type: 'SUBMIT' })
    })

    it('transitions to rejected', async () => {
      const result = await machine.transition({ type: 'REJECT', reason: 'Too expensive' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('rejected')
    })

    it('stores rejection reason in context', async () => {
      await machine.transition({ type: 'REJECT', reason: 'Price too high' })

      expect(machine.context.rejectionReason).toBe('Price too high')
    })
  })

  describe('rejected state', () => {
    beforeEach(async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'REJECT', reason: 'Needs revision' })
    })

    it('has REVISE and CANCEL transitions', () => {
      const transitions = machine.getAvailableTransitions()

      expect(transitions).toContain('REVISE')
      expect(transitions).toContain('CANCEL')
    })

    it('REVISE returns to draft', async () => {
      const result = await machine.transition({ type: 'REVISE' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('draft')
    })

    it('REVISE clears rejection reason', async () => {
      expect(machine.context.rejectionReason).toBe('Needs revision')

      await machine.transition({ type: 'REVISE' })

      expect(machine.context.rejectionReason).toBeUndefined()
    })
  })

  describe('approved state', () => {
    beforeEach(async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })
    })

    it('has CONVERT, EXPIRE, and CANCEL transitions', () => {
      const transitions = machine.getAvailableTransitions()

      expect(transitions).toContain('CONVERT')
      expect(transitions).toContain('EXPIRE')
      expect(transitions).toContain('CANCEL')
    })
  })

  describe('CONVERT guard and action', () => {
    beforeEach(async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })
    })

    it('allows convert when not expired', async () => {
      const result = await machine.transition({ type: 'CONVERT', invoiceId: 99 })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('converted')
      expect(machine.done).toBe(true)
    })

    it('stores converted invoice ID', async () => {
      await machine.transition({ type: 'CONVERT', invoiceId: 123 })

      expect(machine.context.convertedInvoiceId).toBe(123)
    })

    it('allows convert when validUntil is null (no expiry)', async () => {
      machine = createMachine({ validUntil: null })
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })

      const result = await machine.transition({ type: 'CONVERT' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('converted')
    })

    it('blocks convert when quotation is expired', async () => {
      machine = createMachine({ validUntil: new Date('2020-01-01') })
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })

      const result = await machine.transition({ type: 'CONVERT' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot convert expired quotation')
    })
  })

  describe('EXPIRE guard', () => {
    it('allows expire when validUntil is in the past', async () => {
      machine = createMachine({ validUntil: new Date('2020-01-01') })
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })

      const result = await machine.transition({ type: 'EXPIRE' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('expired')
      expect(machine.done).toBe(true)
    })

    it('blocks expire when validUntil is in the future', async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })

      const result = await machine.transition({ type: 'EXPIRE' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Quotation has not expired yet')
    })

    it('blocks expire when validUntil is null', async () => {
      machine = createMachine({ validUntil: null })
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })

      const result = await machine.transition({ type: 'EXPIRE' })

      expect(result.success).toBe(false)
    })
  })

  describe('final states', () => {
    it('converted is final', async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })
      await machine.transition({ type: 'CONVERT' })

      expect(machine.done).toBe(true)
      expect(machine.getAvailableTransitions()).toHaveLength(0)
    })

    it('expired is final', async () => {
      machine = createMachine({ validUntil: new Date('2020-01-01') })
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })
      await machine.transition({ type: 'EXPIRE' })

      expect(machine.done).toBe(true)
      expect(machine.getAvailableTransitions()).toHaveLength(0)
    })

    it('cancelled is final', async () => {
      await machine.transition({ type: 'CANCEL' })

      expect(machine.done).toBe(true)
      expect(machine.getAvailableTransitions()).toHaveLength(0)
    })
  })

  describe('full lifecycle: draft → submitted → approved → converted', () => {
    it('completes the happy path', async () => {
      expect(machine.value).toBe('draft')

      await machine.transition({ type: 'SUBMIT' })
      expect(machine.value).toBe('submitted')

      await machine.transition({ type: 'APPROVE' })
      expect(machine.value).toBe('approved')

      await machine.transition({ type: 'CONVERT', invoiceId: 42 })
      expect(machine.value).toBe('converted')
      expect(machine.done).toBe(true)
      expect(machine.context.convertedInvoiceId).toBe(42)
    })
  })

  describe('revision cycle: draft → submitted → rejected → draft → submitted', () => {
    it('allows resubmission after revision', async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'REJECT', reason: 'Fix pricing' })

      expect(machine.value).toBe('rejected')
      expect(machine.context.rejectionReason).toBe('Fix pricing')

      await machine.transition({ type: 'REVISE' })
      expect(machine.value).toBe('draft')
      expect(machine.context.rejectionReason).toBeUndefined()

      const result = await machine.transition({ type: 'SUBMIT' })
      expect(result.success).toBe(true)
      expect(machine.value).toBe('submitted')
    })
  })
})
