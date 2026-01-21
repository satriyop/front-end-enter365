/**
 * Workflow Configuration Tests
 *
 * Tests for workflow configuration validity and consistency.
 */

import { describe, it, expect } from 'vitest'
import {
  quotationWorkflow,
  invoiceWorkflow,
  billWorkflow,
  purchaseOrderWorkflow,
  workOrderWorkflow,
  solarProposalWorkflow,
} from '../workflows'
import type { WorkflowConfig } from '../types'

describe('Workflow Configurations', () => {
  const workflows = [
    quotationWorkflow,
    invoiceWorkflow,
    billWorkflow,
    purchaseOrderWorkflow,
    workOrderWorkflow,
    solarProposalWorkflow,
  ]

  describe.each(workflows)('$documentType workflow', (workflow: WorkflowConfig) => {
    it('has a valid document type', () => {
      expect(workflow.documentType).toBeTruthy()
      expect(typeof workflow.documentType).toBe('string')
    })

    it('has at least one action', () => {
      expect(workflow.actions.length).toBeGreaterThan(0)
    })

    it('all actions have required properties', () => {
      workflow.actions.forEach((action) => {
        expect(action.name).toBeTruthy()
        expect(action.label).toBeTruthy()
        expect(Array.isArray(action.allowedFromStatuses)).toBe(true)
        expect(action.allowedFromStatuses.length).toBeGreaterThan(0)
      })
    })

    it('all actions have unique names', () => {
      const names = workflow.actions.map((a) => a.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('destructive actions require confirmation', () => {
      workflow.actions.forEach((action) => {
        if (action.variant === 'destructive') {
          expect(action.requiresConfirmation).toBe(true)
        }
      })
    })

    it('actions with confirmation have confirmation message', () => {
      workflow.actions.forEach((action) => {
        if (action.requiresConfirmation) {
          expect(action.confirmationMessage).toBeTruthy()
        }
      })
    })
  })

  describe('quotationWorkflow specific', () => {
    it('has submit action from draft', () => {
      const submit = quotationWorkflow.actions.find((a) => a.name === 'submit')
      expect(submit).toBeDefined()
      expect(submit?.allowedFromStatuses).toContain('draft')
    })

    it('has approve action from submitted', () => {
      const approve = quotationWorkflow.actions.find((a) => a.name === 'approve')
      expect(approve).toBeDefined()
      expect(approve?.allowedFromStatuses).toContain('submitted')
    })

    it('has convert action from approved', () => {
      const convert = quotationWorkflow.actions.find((a) => a.name === 'convert')
      expect(convert).toBeDefined()
      expect(convert?.allowedFromStatuses).toContain('approved')
      expect(convert?.requiresConfirmation).toBe(true)
    })

    it('cannot cancel converted quotations', () => {
      const cancel = quotationWorkflow.actions.find((a) => a.name === 'cancel')
      expect(cancel).toBeDefined()
      expect(cancel?.allowedFromStatuses).not.toContain('converted')
    })
  })

  describe('invoiceWorkflow specific', () => {
    it('has send action from draft', () => {
      const send = invoiceWorkflow.actions.find((a) => a.name === 'send')
      expect(send).toBeDefined()
      expect(send?.allowedFromStatuses).toContain('draft')
    })

    it('has record_payment action from sent states', () => {
      const recordPayment = invoiceWorkflow.actions.find((a) => a.name === 'record_payment')
      expect(recordPayment).toBeDefined()
      expect(recordPayment?.allowedFromStatuses).toContain('sent')
      expect(recordPayment?.allowedFromStatuses).toContain('partial')
      expect(recordPayment?.allowedFromStatuses).toContain('overdue')
    })

    it('void only from draft', () => {
      const voidAction = invoiceWorkflow.actions.find((a) => a.name === 'void')
      expect(voidAction).toBeDefined()
      expect(voidAction?.allowedFromStatuses).toEqual(['draft'])
      expect(voidAction?.requiresConfirmation).toBe(true)
    })
  })

  describe('workOrderWorkflow specific', () => {
    it('has start action from draft', () => {
      const start = workOrderWorkflow.actions.find((a) => a.name === 'start')
      expect(start).toBeDefined()
      expect(start?.allowedFromStatuses).toContain('draft')
      expect(start?.targetStatus).toBe('in_progress')
    })

    it('supports pause/resume cycle', () => {
      const pause = workOrderWorkflow.actions.find((a) => a.name === 'pause')
      const resume = workOrderWorkflow.actions.find((a) => a.name === 'resume')

      expect(pause).toBeDefined()
      expect(pause?.allowedFromStatuses).toContain('in_progress')
      expect(pause?.targetStatus).toBe('on_hold')

      expect(resume).toBeDefined()
      expect(resume?.allowedFromStatuses).toContain('on_hold')
      expect(resume?.targetStatus).toBe('in_progress')
    })

    it('can only complete from in_progress', () => {
      const complete = workOrderWorkflow.actions.find((a) => a.name === 'complete')
      expect(complete).toBeDefined()
      expect(complete?.allowedFromStatuses).toEqual(['in_progress'])
    })
  })
})
