/**
 * Invoice Workflow State Machine
 *
 * Defines the lifecycle states and transitions for invoices.
 * States: draft → sent → partial → paid
 *         ↓       ↓        ↓
 *      cancelled void   overdue
 */

import type { MachineConfig } from '../types'
import { logger } from '@/infrastructure/logger'

export interface InvoiceContext {
  id: number
  contactId: number
  totalAmount: number
  paidAmount: number
  dueDate: Date
}

export type InvoiceEvent =
  | { type: 'SEND' }
  | { type: 'RECORD_PAYMENT'; amount: number }
  | { type: 'MARK_OVERDUE' }
  | { type: 'VOID' }
  | { type: 'CANCEL' }

export const invoiceMachineConfig: MachineConfig<InvoiceContext, InvoiceEvent> =
  {
    id: 'invoice',
    initial: 'draft',
    context: {
      id: 0,
      contactId: 0,
      totalAmount: 0,
      paidAmount: 0,
      dueDate: new Date(),
    },

    states: {
      draft: {
        label: 'Draft',
        description: 'Invoice is being prepared',
        on: {
          SEND: {
            target: 'sent',
            guard: (ctx) => ctx.totalAmount > 0,
            guardMessage: 'Cannot send invoice with zero amount',
            actions: [
              (ctx) => {
                logger.info('Invoice sent', { id: ctx.id })
              },
            ],
          },
          CANCEL: 'cancelled',
        },
      },

      sent: {
        label: 'Sent',
        description: 'Invoice sent to customer',
        on: {
          RECORD_PAYMENT: {
            target: 'payment_check',
            actions: [
              (ctx, event) => {
                if (event.type === 'RECORD_PAYMENT') {
                  ctx.paidAmount += event.amount
                  logger.info('Payment recorded', {
                    id: ctx.id,
                    amount: event.amount,
                    total: ctx.paidAmount,
                  })
                }
              },
            ],
          },
          MARK_OVERDUE: {
            target: 'overdue',
            guard: (ctx) => new Date() > ctx.dueDate,
            guardMessage: 'Invoice is not yet overdue',
          },
          VOID: 'void',
        },
      },

      // Internal state to check if fully paid
      payment_check: {
        label: 'Processing',
        description: 'Checking payment status',
        onEnter: async () => {
          // This is a transient state - the machine will immediately transition
        },
        on: {
          // These transitions happen automatically based on guard
        },
      },

      partial: {
        label: 'Partial',
        description: 'Partially paid',
        on: {
          RECORD_PAYMENT: {
            target: 'payment_check',
            actions: [
              (ctx, event) => {
                if (event.type === 'RECORD_PAYMENT') {
                  ctx.paidAmount += event.amount
                  logger.info('Additional payment recorded', {
                    id: ctx.id,
                    amount: event.amount,
                    total: ctx.paidAmount,
                  })
                }
              },
            ],
          },
          MARK_OVERDUE: {
            target: 'overdue',
            guard: (ctx) => new Date() > ctx.dueDate,
            guardMessage: 'Invoice is not yet overdue',
          },
          VOID: 'void',
        },
      },

      overdue: {
        label: 'Overdue',
        description: 'Payment is past due',
        on: {
          RECORD_PAYMENT: {
            target: 'payment_check',
            actions: [
              (ctx, event) => {
                if (event.type === 'RECORD_PAYMENT') {
                  ctx.paidAmount += event.amount
                  logger.info('Late payment recorded', {
                    id: ctx.id,
                    amount: event.amount,
                    total: ctx.paidAmount,
                  })
                }
              },
            ],
          },
          VOID: 'void',
        },
      },

      paid: {
        label: 'Paid',
        description: 'Fully paid',
        final: true,
        onEnter: (ctx) => {
          logger.info('Invoice fully paid', {
            id: ctx.id,
            total: ctx.totalAmount,
          })
        },
      },

      void: {
        label: 'Void',
        description: 'Invoice voided',
        final: true,
      },

      cancelled: {
        label: 'Cancelled',
        description: 'Invoice cancelled',
        final: true,
      },
    },
  }

/**
 * Create an invoice machine with initial context
 */
export function createInvoiceMachine(context: Partial<InvoiceContext>) {
  return {
    ...invoiceMachineConfig,
    context: { ...invoiceMachineConfig.context, ...context },
  }
}

/**
 * Helper to determine next state after payment
 */
export function getPaymentTargetState(
  paidAmount: number,
  totalAmount: number
): 'paid' | 'partial' {
  return paidAmount >= totalAmount ? 'paid' : 'partial'
}
