/**
 * Purchase Order Workflow Tests
 *
 * Tests the PO lifecycle:
 * draft → submitted → approved → ordered → received (final)
 *   ↓        ↓           ↓                ↘
 * cancelled rejected   cancelled      partial_received
 *
 * Key business rules:
 * - SUBMIT requires totalAmount > 0 AND vendorId > 0
 * - REJECT stores reason, resubmit clears it
 * - RECEIVE_PARTIAL accumulates receivedAmount
 * - RECEIVE_PARTIAL guard: must stay below totalAmount
 * - RECEIVE_FULL sets receivedAmount = totalAmount
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StateMachine } from '../../StateMachine'
import {
  purchaseOrderMachineConfig,
  createPurchaseOrderMachine,
  type PurchaseOrderContext,
  type PurchaseOrderEvent,
} from '../purchaseOrderMachine'

function createMachine(contextOverrides: Partial<PurchaseOrderContext> = {}) {
  const config = createPurchaseOrderMachine({
    id: 1,
    vendorId: 5,
    totalAmount: 2000000,
    receivedAmount: 0,
    expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    ...contextOverrides,
  })
  return new StateMachine<PurchaseOrderContext, PurchaseOrderEvent>(config)
}

describe('purchaseOrderMachine', () => {
  let machine: StateMachine<PurchaseOrderContext, PurchaseOrderEvent>

  beforeEach(() => {
    machine = createMachine()
  })

  describe('config', () => {
    it('has id "purchase_order"', () => {
      expect(purchaseOrderMachineConfig.id).toBe('purchase_order')
    })

    it('starts in draft', () => {
      expect(purchaseOrderMachineConfig.initial).toBe('draft')
    })

    it('has 8 states', () => {
      // draft, submitted, approved, rejected, ordered, partial_received, received, cancelled
      expect(Object.keys(purchaseOrderMachineConfig.states)).toHaveLength(8)
    })
  })

  describe('createPurchaseOrderMachine', () => {
    it('merges context with defaults', () => {
      const config = createPurchaseOrderMachine({ id: 99, vendorId: 7 })

      expect(config.context.id).toBe(99)
      expect(config.context.vendorId).toBe(7)
      expect(config.context.totalAmount).toBe(0) // default
      expect(config.context.receivedAmount).toBe(0) // default
    })

    it('preserves machine config', () => {
      const config = createPurchaseOrderMachine({ id: 1 })

      expect(config.id).toBe('purchase_order')
      expect(config.initial).toBe('draft')
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
  })

  describe('SUBMIT guard', () => {
    it('allows submit when totalAmount > 0 AND vendorId > 0', async () => {
      const result = await machine.transition({ type: 'SUBMIT' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('submitted')
    })

    it('blocks submit when totalAmount is 0', async () => {
      machine = createMachine({ totalAmount: 0 })

      const result = await machine.transition({ type: 'SUBMIT' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('PO must have a vendor and amount')
    })

    it('blocks submit when vendorId is 0', async () => {
      machine = createMachine({ vendorId: 0 })

      const result = await machine.transition({ type: 'SUBMIT' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('PO must have a vendor and amount')
    })

    it('blocks submit when both are 0', async () => {
      machine = createMachine({ totalAmount: 0, vendorId: 0 })

      const result = await machine.transition({ type: 'SUBMIT' })

      expect(result.success).toBe(false)
    })

    it('canTransition reflects both guards', () => {
      expect(machine.canTransition('SUBMIT')).toBe(true)

      machine = createMachine({ vendorId: 0 })
      expect(machine.canTransition('SUBMIT')).toBe(false)

      machine = createMachine({ totalAmount: 0 })
      expect(machine.canTransition('SUBMIT')).toBe(false)
    })
  })

  describe('submitted state', () => {
    beforeEach(async () => {
      await machine.transition({ type: 'SUBMIT' })
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
      const result = await machine.transition({ type: 'REJECT', reason: 'Budget exceeded' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('rejected')
    })

    it('stores rejection reason', async () => {
      await machine.transition({ type: 'REJECT', reason: 'Wrong vendor' })

      expect(machine.context.rejectionReason).toBe('Wrong vendor')
    })
  })

  describe('rejected state', () => {
    beforeEach(async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'REJECT', reason: 'Fix items' })
    })

    it('has SUBMIT and CANCEL transitions', () => {
      const transitions = machine.getAvailableTransitions()

      expect(transitions).toContain('SUBMIT')
      expect(transitions).toContain('CANCEL')
    })

    it('resubmit clears rejection reason', async () => {
      expect(machine.context.rejectionReason).toBe('Fix items')

      await machine.transition({ type: 'SUBMIT' })

      expect(machine.context.rejectionReason).toBeUndefined()
      expect(machine.value).toBe('submitted')
    })
  })

  describe('approved state', () => {
    beforeEach(async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })
    })

    it('has SEND_TO_VENDOR and CANCEL transitions', () => {
      const transitions = machine.getAvailableTransitions()

      expect(transitions).toContain('SEND_TO_VENDOR')
      expect(transitions).toContain('CANCEL')
    })

    it('can send to vendor', async () => {
      const result = await machine.transition({ type: 'SEND_TO_VENDOR' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('ordered')
    })

    it('can cancel from approved', async () => {
      const result = await machine.transition({ type: 'CANCEL' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('cancelled')
    })
  })

  describe('ordered state', () => {
    beforeEach(async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })
      await machine.transition({ type: 'SEND_TO_VENDOR' })
    })

    it('has RECEIVE_PARTIAL, RECEIVE_FULL, and CANCEL transitions', () => {
      const transitions = machine.getAvailableTransitions()

      expect(transitions).toContain('RECEIVE_PARTIAL')
      expect(transitions).toContain('RECEIVE_FULL')
      expect(transitions).toContain('CANCEL')
    })

    it('RECEIVE_PARTIAL accumulates received amount', async () => {
      const result = await machine.transition({ type: 'RECEIVE_PARTIAL', amount: 500000 })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('partial_received')
      expect(machine.context.receivedAmount).toBe(500000)
    })

    it('RECEIVE_FULL sets receivedAmount to totalAmount', async () => {
      const result = await machine.transition({ type: 'RECEIVE_FULL' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('received')
      expect(machine.context.receivedAmount).toBe(2000000)
      expect(machine.done).toBe(true)
    })
  })

  describe('partial_received state', () => {
    beforeEach(async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })
      await machine.transition({ type: 'SEND_TO_VENDOR' })
      await machine.transition({ type: 'RECEIVE_PARTIAL', amount: 500000 })
    })

    it('is in partial_received', () => {
      expect(machine.value).toBe('partial_received')
      expect(machine.context.receivedAmount).toBe(500000)
    })

    it('has RECEIVE_PARTIAL and RECEIVE_FULL transitions', () => {
      const transitions = machine.getAvailableTransitions()

      expect(transitions).toContain('RECEIVE_PARTIAL')
      expect(transitions).toContain('RECEIVE_FULL')
    })

    it('accumulates additional partial receipt', async () => {
      const result = await machine.transition({ type: 'RECEIVE_PARTIAL', amount: 300000 })

      expect(result.success).toBe(true)
      expect(machine.context.receivedAmount).toBe(800000)
      expect(machine.value).toBe('partial_received')
    })

    it('blocks partial receipt that would exceed total', async () => {
      // Guard: receivedAmount + amount < totalAmount
      const result = await machine.transition({ type: 'RECEIVE_PARTIAL', amount: 1500001 })

      expect(result.success).toBe(false)
    })

    it('blocks partial receipt that equals total (use RECEIVE_FULL instead)', async () => {
      // Guard requires strict < totalAmount
      const result = await machine.transition({ type: 'RECEIVE_PARTIAL', amount: 1500000 })

      expect(result.success).toBe(false)
    })

    it('RECEIVE_FULL completes from partial', async () => {
      const result = await machine.transition({ type: 'RECEIVE_FULL' })

      expect(result.success).toBe(true)
      expect(machine.value).toBe('received')
      expect(machine.context.receivedAmount).toBe(2000000)
      expect(machine.done).toBe(true)
    })

    it('no CANCEL from partial_received', () => {
      const transitions = machine.getAvailableTransitions()

      expect(transitions).not.toContain('CANCEL')
    })
  })

  describe('final states', () => {
    it('received is final', async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })
      await machine.transition({ type: 'SEND_TO_VENDOR' })
      await machine.transition({ type: 'RECEIVE_FULL' })

      expect(machine.done).toBe(true)
      expect(machine.getAvailableTransitions()).toHaveLength(0)
    })

    it('cancelled is final', async () => {
      await machine.transition({ type: 'CANCEL' })

      expect(machine.done).toBe(true)
      expect(machine.getAvailableTransitions()).toHaveLength(0)
    })
  })

  describe('full lifecycle: draft → submitted → approved → ordered → received', () => {
    it('completes the happy path', async () => {
      expect(machine.value).toBe('draft')

      await machine.transition({ type: 'SUBMIT' })
      expect(machine.value).toBe('submitted')

      await machine.transition({ type: 'APPROVE' })
      expect(machine.value).toBe('approved')

      await machine.transition({ type: 'SEND_TO_VENDOR' })
      expect(machine.value).toBe('ordered')

      await machine.transition({ type: 'RECEIVE_FULL' })
      expect(machine.value).toBe('received')
      expect(machine.done).toBe(true)
      expect(machine.context.receivedAmount).toBe(2000000)
    })
  })

  describe('rejection cycle: submit → reject → resubmit → approve', () => {
    it('allows resubmission after rejection', async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'REJECT', reason: 'Wrong items' })

      expect(machine.value).toBe('rejected')
      expect(machine.context.rejectionReason).toBe('Wrong items')

      await machine.transition({ type: 'SUBMIT' })
      expect(machine.value).toBe('submitted')
      expect(machine.context.rejectionReason).toBeUndefined()

      const result = await machine.transition({ type: 'APPROVE' })
      expect(result.success).toBe(true)
      expect(machine.value).toBe('approved')
    })
  })

  describe('partial receiving flow', () => {
    it('receives in multiple batches then completes', async () => {
      await machine.transition({ type: 'SUBMIT' })
      await machine.transition({ type: 'APPROVE' })
      await machine.transition({ type: 'SEND_TO_VENDOR' })

      // First batch: 800,000
      await machine.transition({ type: 'RECEIVE_PARTIAL', amount: 800000 })
      expect(machine.context.receivedAmount).toBe(800000)
      expect(machine.value).toBe('partial_received')

      // Second batch: 400,000
      await machine.transition({ type: 'RECEIVE_PARTIAL', amount: 400000 })
      expect(machine.context.receivedAmount).toBe(1200000)
      expect(machine.value).toBe('partial_received')

      // Final: receive full remainder
      await machine.transition({ type: 'RECEIVE_FULL' })
      expect(machine.context.receivedAmount).toBe(2000000)
      expect(machine.value).toBe('received')
      expect(machine.done).toBe(true)
    })
  })
})
