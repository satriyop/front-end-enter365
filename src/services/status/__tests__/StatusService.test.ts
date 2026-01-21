/**
 * StatusService Tests
 */

import { describe, it, expect } from 'vitest'
import { StatusService, statusService } from '../StatusService'
import { STATUS_REGISTRY } from '../statusRegistry'

describe('StatusService', () => {
  describe('getStatus', () => {
    it('returns correct status config for known status', () => {
      const status = statusService.getStatus('invoice', 'paid')

      expect(status.label).toBe('Paid')
      expect(status.variant).toBe('success')
      expect(status.description).toBe('Fully paid')
    })

    it('returns fallback for unknown status', () => {
      const status = statusService.getStatus('invoice', 'unknown_status')

      expect(status.label).toBe('unknown_status')
      expect(status.variant).toBe('secondary')
    })

    it('works for all document types', () => {
      // Test at least one status from each document type
      expect(statusService.getStatus('quotation', 'draft').label).toBe('Draft')
      expect(statusService.getStatus('invoice', 'sent').label).toBe('Sent')
      expect(statusService.getStatus('bill', 'pending').label).toBe('Pending')
      expect(statusService.getStatus('purchase_order', 'approved').label).toBe('Approved')
      expect(statusService.getStatus('delivery_order', 'delivered').label).toBe('Delivered')
      expect(statusService.getStatus('work_order', 'in_progress').label).toBe('In Progress')
      expect(statusService.getStatus('payment', 'completed').label).toBe('Completed')
      expect(statusService.getStatus('journal_entry', 'posted').label).toBe('Posted')
    })
  })

  describe('getLabel', () => {
    it('returns label for status', () => {
      expect(statusService.getLabel('quotation', 'submitted')).toBe('Submitted')
    })
  })

  describe('getVariant', () => {
    it('returns variant for status', () => {
      expect(statusService.getVariant('invoice', 'overdue')).toBe('destructive')
      expect(statusService.getVariant('invoice', 'paid')).toBe('success')
      expect(statusService.getVariant('invoice', 'draft')).toBe('secondary')
    })
  })

  describe('getDescription', () => {
    it('returns description for status', () => {
      expect(statusService.getDescription('quotation', 'draft')).toBe(
        'Not yet submitted for approval'
      )
    })
  })

  describe('getStatuses', () => {
    it('returns all statuses for document type', () => {
      const statuses = statusService.getStatuses('invoice')

      expect(statuses.length).toBeGreaterThan(0)
      expect(statuses.some((s) => s.value === 'draft')).toBe(true)
      expect(statuses.some((s) => s.value === 'paid')).toBe(true)
    })

    it('includes value property in each status', () => {
      const statuses = statusService.getStatuses('quotation')

      statuses.forEach((status) => {
        expect(status).toHaveProperty('value')
        expect(status).toHaveProperty('label')
        expect(status).toHaveProperty('variant')
      })
    })
  })

  describe('getSelectOptions', () => {
    it('returns options without "All" by default', () => {
      const options = statusService.getSelectOptions('invoice')

      expect(options[0]?.value).not.toBe('')
      expect(options.every((o) => o.value !== '')).toBe(true)
    })

    it('includes "All Status" option when requested', () => {
      const options = statusService.getSelectOptions('invoice', true)

      expect(options[0]?.value).toBe('')
      expect(options[0]?.label).toBe('All Status')
    })
  })

  describe('isActive', () => {
    it('returns true for active statuses', () => {
      expect(statusService.isActive('invoice', 'draft')).toBe(true)
      expect(statusService.isActive('invoice', 'sent')).toBe(true)
      expect(statusService.isActive('invoice', 'paid')).toBe(true)
    })

    it('returns false for inactive statuses', () => {
      expect(statusService.isActive('invoice', 'cancelled')).toBe(false)
      expect(statusService.isActive('invoice', 'void')).toBe(false)
      expect(statusService.isActive('quotation', 'rejected')).toBe(false)
    })
  })

  describe('isFinal', () => {
    it('returns true for final statuses', () => {
      expect(statusService.isFinal('invoice', 'paid')).toBe(true)
      expect(statusService.isFinal('work_order', 'completed')).toBe(true)
      expect(statusService.isFinal('delivery_order', 'delivered')).toBe(true)
      expect(statusService.isFinal('journal_entry', 'posted')).toBe(true)
    })

    it('returns false for non-final statuses', () => {
      expect(statusService.isFinal('invoice', 'draft')).toBe(false)
      expect(statusService.isFinal('invoice', 'sent')).toBe(false)
      expect(statusService.isFinal('quotation', 'submitted')).toBe(false)
    })
  })

  describe('isPending', () => {
    it('returns true for pending statuses', () => {
      expect(statusService.isPending('quotation', 'submitted')).toBe(true)
      expect(statusService.isPending('bill', 'pending')).toBe(true)
      expect(statusService.isPending('delivery_order', 'in_transit')).toBe(true)
      expect(statusService.isPending('work_order', 'in_progress')).toBe(true)
    })

    it('returns false for non-pending statuses', () => {
      expect(statusService.isPending('invoice', 'draft')).toBe(false)
      expect(statusService.isPending('invoice', 'paid')).toBe(false)
    })
  })

  describe('getBadgeProps', () => {
    it('returns props for Badge component', () => {
      const props = statusService.getBadgeProps('invoice', 'paid')

      expect(props.variant).toBe('success')
      expect(props.children).toBe('Paid')
    })
  })

  describe('custom registry', () => {
    it('allows overriding with custom registry', () => {
      const customService = new StatusService({
        invoice: {
          custom_status: {
            label: 'Custom Status',
            variant: 'info',
            description: 'A custom status',
          },
        },
      })

      const status = customService.getStatus('invoice', 'custom_status')

      expect(status.label).toBe('Custom Status')
      expect(status.variant).toBe('info')
    })

    it('merges with existing registry', () => {
      const customService = new StatusService({
        invoice: {
          custom: { label: 'Custom', variant: 'info' },
        },
      })

      // Should still have quotation statuses from original registry
      const quotationStatus = customService.getStatus('quotation', 'draft')
      expect(quotationStatus.label).toBe('Draft')
    })
  })

  describe('STATUS_REGISTRY completeness', () => {
    it('has all required document types', () => {
      const requiredTypes = [
        'quotation',
        'invoice',
        'bill',
        'purchase_order',
        'delivery_order',
        'work_order',
        'payment',
        'journal_entry',
      ]

      requiredTypes.forEach((type) => {
        expect(STATUS_REGISTRY).toHaveProperty(type)
        expect(
          Object.keys(STATUS_REGISTRY[type as keyof typeof STATUS_REGISTRY]).length
        ).toBeGreaterThan(0)
      })
    })

    it('all statuses have required properties', () => {
      Object.entries(STATUS_REGISTRY).forEach(([_docType, statuses]) => {
        Object.entries(statuses).forEach(([_statusKey, config]) => {
          const typedConfig = config as { label: string; variant: string }
          expect(typedConfig).toHaveProperty('label')
          expect(typedConfig).toHaveProperty('variant')
          expect(typeof typedConfig.label).toBe('string')
          expect(typedConfig.label.length).toBeGreaterThan(0)
        })
      })
    })
  })
})
