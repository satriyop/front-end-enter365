/**
 * Purchase Order Workflow State Machine
 *
 * Defines the lifecycle states and transitions for purchase orders.
 * States: draft → submitted → approved → ordered → received
 *         ↓         ↓           ↓
 *      cancelled  rejected    cancelled
 */

import type { MachineConfig } from '../types'
import { logger } from '@/infrastructure/logger'

export interface PurchaseOrderContext {
  id: number
  vendorId: number
  totalAmount: number
  receivedAmount: number
  expectedDate: Date | null
  rejectionReason?: string
}

export type PurchaseOrderEvent =
  | { type: 'SUBMIT' }
  | { type: 'APPROVE' }
  | { type: 'REJECT'; reason: string }
  | { type: 'SEND_TO_VENDOR' }
  | { type: 'RECEIVE_PARTIAL'; amount: number }
  | { type: 'RECEIVE_FULL' }
  | { type: 'CANCEL' }

export const purchaseOrderMachineConfig: MachineConfig<
  PurchaseOrderContext,
  PurchaseOrderEvent
> = {
  id: 'purchase_order',
  initial: 'draft',
  context: {
    id: 0,
    vendorId: 0,
    totalAmount: 0,
    receivedAmount: 0,
    expectedDate: null,
  },

  states: {
    draft: {
      label: 'Draft',
      description: 'Purchase order is being prepared',
      on: {
        SUBMIT: {
          target: 'submitted',
          guard: (ctx) => ctx.totalAmount > 0 && ctx.vendorId > 0,
          guardMessage: 'PO must have a vendor and amount',
          actions: [
            (ctx) => {
              logger.info('PO submitted', { id: ctx.id })
            },
          ],
        },
        CANCEL: 'cancelled',
      },
    },

    submitted: {
      label: 'Submitted',
      description: 'Awaiting approval',
      on: {
        APPROVE: {
          target: 'approved',
          actions: [
            (ctx) => {
              logger.info('PO approved', { id: ctx.id })
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
            },
          ],
        },
        CANCEL: 'cancelled',
      },
    },

    approved: {
      label: 'Approved',
      description: 'Ready to send to vendor',
      on: {
        SEND_TO_VENDOR: {
          target: 'ordered',
          actions: [
            (ctx) => {
              logger.info('PO sent to vendor', { id: ctx.id })
            },
          ],
        },
        CANCEL: 'cancelled',
      },
    },

    rejected: {
      label: 'Rejected',
      description: 'PO was rejected',
      on: {
        SUBMIT: {
          target: 'submitted',
          actions: [
            (ctx) => {
              ctx.rejectionReason = undefined
            },
          ],
        },
        CANCEL: 'cancelled',
      },
    },

    ordered: {
      label: 'Ordered',
      description: 'Order placed with vendor',
      on: {
        RECEIVE_PARTIAL: {
          target: 'partial_received',
          actions: [
            (ctx, event) => {
              if (event.type === 'RECEIVE_PARTIAL') {
                ctx.receivedAmount += event.amount
                logger.info('Partial goods received', {
                  id: ctx.id,
                  amount: event.amount,
                })
              }
            },
          ],
        },
        RECEIVE_FULL: {
          target: 'received',
          actions: [
            (ctx) => {
              ctx.receivedAmount = ctx.totalAmount
              logger.info('Full order received', { id: ctx.id })
            },
          ],
        },
        CANCEL: {
          target: 'cancelled',
          guardMessage: 'Cannot cancel after goods received',
        },
      },
    },

    partial_received: {
      label: 'Partial',
      description: 'Partially received',
      on: {
        RECEIVE_PARTIAL: {
          target: 'partial_received',
          guard: (ctx, event) =>
            event.type === 'RECEIVE_PARTIAL' &&
            ctx.receivedAmount + event.amount < ctx.totalAmount,
          actions: [
            (ctx, event) => {
              if (event.type === 'RECEIVE_PARTIAL') {
                ctx.receivedAmount += event.amount
              }
            },
          ],
        },
        RECEIVE_FULL: {
          target: 'received',
          actions: [
            (ctx) => {
              ctx.receivedAmount = ctx.totalAmount
            },
          ],
        },
      },
    },

    received: {
      label: 'Received',
      description: 'All goods received',
      final: true,
    },

    cancelled: {
      label: 'Cancelled',
      description: 'PO was cancelled',
      final: true,
    },
  },
}

/**
 * Create a purchase order machine with initial context
 */
export function createPurchaseOrderMachine(
  context: Partial<PurchaseOrderContext>
) {
  return {
    ...purchaseOrderMachineConfig,
    context: { ...purchaseOrderMachineConfig.context, ...context },
  }
}
