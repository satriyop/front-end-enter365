/**
 * Quotation Workflow State Machine
 *
 * Defines the lifecycle states and transitions for quotations.
 * States: draft → submitted → approved → converted
 *         ↓         ↓           ↓
 *      cancelled  rejected    expired
 */

import type { MachineConfig } from '../types'
import { logger } from '@/infrastructure/logger'

export interface QuotationContext {
  id: number
  contactId: number
  totalAmount: number
  validUntil: Date | null
  rejectionReason?: string
  convertedInvoiceId?: number
}

export type QuotationEvent =
  | { type: 'SUBMIT' }
  | { type: 'APPROVE' }
  | { type: 'REJECT'; reason: string }
  | { type: 'CONVERT'; invoiceId?: number }
  | { type: 'CANCEL' }
  | { type: 'EXPIRE' }
  | { type: 'REVISE' }

export const quotationMachineConfig: MachineConfig<
  QuotationContext,
  QuotationEvent
> = {
  id: 'quotation',
  initial: 'draft',
  context: {
    id: 0,
    contactId: 0,
    totalAmount: 0,
    validUntil: null,
  },

  states: {
    draft: {
      label: 'Draft',
      description: 'Quotation is being prepared',
      on: {
        SUBMIT: {
          target: 'submitted',
          guard: (ctx) => ctx.totalAmount > 0,
          guardMessage: 'Cannot submit quotation with zero amount',
          actions: [
            (ctx) => {
              logger.info('Quotation submitted', { id: ctx.id })
            },
          ],
        },
        CANCEL: 'cancelled',
      },
    },

    submitted: {
      label: 'Submitted',
      description: 'Awaiting approval',
      onEnter: (ctx) => {
        logger.debug('Entered submitted state', { id: ctx.id })
      },
      on: {
        APPROVE: {
          target: 'approved',
          actions: [
            (ctx) => {
              logger.info('Quotation approved', { id: ctx.id })
            },
          ],
        },
        REJECT: {
          target: 'rejected',
          actions: [
            (ctx, event) => {
              if (event.type === 'REJECT') {
                ctx.rejectionReason = event.reason
              }
              logger.info('Quotation rejected', {
                id: ctx.id,
                reason: ctx.rejectionReason,
              })
            },
          ],
        },
        CANCEL: 'cancelled',
      },
    },

    approved: {
      label: 'Approved',
      description: 'Ready for conversion to invoice',
      on: {
        CONVERT: {
          target: 'converted',
          guard: (ctx) => !ctx.validUntil || new Date() <= ctx.validUntil,
          guardMessage: 'Cannot convert expired quotation',
          actions: [
            (ctx, event) => {
              if (event.type === 'CONVERT' && event.invoiceId) {
                ctx.convertedInvoiceId = event.invoiceId
              }
              logger.info('Quotation converted', {
                id: ctx.id,
                invoiceId: ctx.convertedInvoiceId,
              })
            },
          ],
        },
        EXPIRE: {
          target: 'expired',
          guard: (ctx) => ctx.validUntil !== null && new Date() > ctx.validUntil,
          guardMessage: 'Quotation has not expired yet',
        },
        CANCEL: 'cancelled',
      },
    },

    rejected: {
      label: 'Rejected',
      description: 'Quotation was rejected',
      on: {
        REVISE: {
          target: 'draft',
          actions: [
            (ctx) => {
              ctx.rejectionReason = undefined
              logger.info('Quotation revised', { id: ctx.id })
            },
          ],
        },
        CANCEL: 'cancelled',
      },
    },

    converted: {
      label: 'Converted',
      description: 'Converted to invoice',
      final: true,
    },

    expired: {
      label: 'Expired',
      description: 'Past validity date',
      final: true,
    },

    cancelled: {
      label: 'Cancelled',
      description: 'Quotation was cancelled',
      final: true,
    },
  },
}

/**
 * Create a quotation machine with initial context
 */
export function createQuotationMachine(context: Partial<QuotationContext>) {
  return {
    ...quotationMachineConfig,
    context: { ...quotationMachineConfig.context, ...context },
  }
}
