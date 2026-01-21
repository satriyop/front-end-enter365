/**
 * Status Registry
 *
 * Centralized configuration for all document status values.
 * Provides consistent labels, colors, and descriptions.
 */

import type { DocumentStatusRegistry } from './types'

export const STATUS_REGISTRY: DocumentStatusRegistry = {
  quotation: {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      description: 'Not yet submitted for approval',
    },
    submitted: {
      label: 'Submitted',
      variant: 'info',
      description: 'Awaiting approval',
    },
    approved: {
      label: 'Approved',
      variant: 'success',
      description: 'Ready for invoicing',
    },
    rejected: {
      label: 'Rejected',
      variant: 'destructive',
      description: 'Rejected by approver',
    },
    expired: {
      label: 'Expired',
      variant: 'warning',
      description: 'Past validity date',
    },
    converted: {
      label: 'Converted',
      variant: 'primary',
      description: 'Converted to invoice',
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'secondary',
      description: 'Cancelled by user',
    },
  },

  invoice: {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      description: 'Not yet sent',
    },
    sent: {
      label: 'Sent',
      variant: 'info',
      description: 'Sent to customer',
    },
    partial: {
      label: 'Partial',
      variant: 'warning',
      description: 'Partially paid',
    },
    paid: {
      label: 'Paid',
      variant: 'success',
      description: 'Fully paid',
    },
    overdue: {
      label: 'Overdue',
      variant: 'destructive',
      description: 'Past due date',
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'secondary',
      description: 'Cancelled',
    },
    void: {
      label: 'Void',
      variant: 'secondary',
      description: 'Voided',
    },
  },

  bill: {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      description: 'Not yet approved',
    },
    pending: {
      label: 'Pending',
      variant: 'info',
      description: 'Awaiting payment',
    },
    approved: {
      label: 'Approved',
      variant: 'success',
      description: 'Approved for payment',
    },
    partial: {
      label: 'Partial',
      variant: 'warning',
      description: 'Partially paid',
    },
    paid: {
      label: 'Paid',
      variant: 'success',
      description: 'Fully paid',
    },
    overdue: {
      label: 'Overdue',
      variant: 'destructive',
      description: 'Past due date',
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'secondary',
      description: 'Cancelled',
    },
  },

  purchase_order: {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      description: 'Not yet submitted',
    },
    submitted: {
      label: 'Submitted',
      variant: 'info',
      description: 'Awaiting approval',
    },
    approved: {
      label: 'Approved',
      variant: 'success',
      description: 'Approved and sent to vendor',
    },
    rejected: {
      label: 'Rejected',
      variant: 'destructive',
      description: 'Rejected by approver',
    },
    partial: {
      label: 'Partial',
      variant: 'warning',
      description: 'Partially received',
    },
    received: {
      label: 'Received',
      variant: 'success',
      description: 'Fully received',
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'secondary',
      description: 'Cancelled',
    },
  },

  delivery_order: {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      description: 'Not yet confirmed',
    },
    confirmed: {
      label: 'Confirmed',
      variant: 'info',
      description: 'Ready for delivery',
    },
    in_transit: {
      label: 'In Transit',
      variant: 'warning',
      description: 'Out for delivery',
    },
    delivered: {
      label: 'Delivered',
      variant: 'success',
      description: 'Successfully delivered',
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'secondary',
      description: 'Cancelled',
    },
  },

  goods_receipt: {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      description: 'Not yet confirmed',
    },
    confirmed: {
      label: 'Confirmed',
      variant: 'info',
      description: 'Goods received and confirmed',
    },
    inspecting: {
      label: 'Inspecting',
      variant: 'warning',
      description: 'Under quality inspection',
    },
    completed: {
      label: 'Completed',
      variant: 'success',
      description: 'Inspection complete, goods accepted',
    },
    rejected: {
      label: 'Rejected',
      variant: 'destructive',
      description: 'Goods rejected',
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'secondary',
      description: 'Cancelled',
    },
  },

  work_order: {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      description: 'Not yet started',
    },
    in_progress: {
      label: 'In Progress',
      variant: 'info',
      description: 'Work in progress',
    },
    on_hold: {
      label: 'On Hold',
      variant: 'warning',
      description: 'Temporarily paused',
    },
    completed: {
      label: 'Completed',
      variant: 'success',
      description: 'Work completed',
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'secondary',
      description: 'Cancelled',
    },
  },

  payment: {
    pending: {
      label: 'Pending',
      variant: 'warning',
      description: 'Payment pending',
    },
    completed: {
      label: 'Completed',
      variant: 'success',
      description: 'Payment completed',
    },
    failed: {
      label: 'Failed',
      variant: 'destructive',
      description: 'Payment failed',
    },
    refunded: {
      label: 'Refunded',
      variant: 'info',
      description: 'Payment refunded',
    },
  },

  journal_entry: {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      description: 'Not yet posted',
    },
    posted: {
      label: 'Posted',
      variant: 'success',
      description: 'Posted to ledger',
    },
    reversed: {
      label: 'Reversed',
      variant: 'warning',
      description: 'Entry reversed',
    },
  },

  sales_return: {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      description: 'Not yet processed',
    },
    pending: {
      label: 'Pending',
      variant: 'info',
      description: 'Awaiting approval',
    },
    approved: {
      label: 'Approved',
      variant: 'success',
      description: 'Return approved',
    },
    completed: {
      label: 'Completed',
      variant: 'success',
      description: 'Return completed',
    },
    rejected: {
      label: 'Rejected',
      variant: 'destructive',
      description: 'Return rejected',
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'secondary',
      description: 'Cancelled',
    },
  },

  purchase_return: {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      description: 'Not yet processed',
    },
    pending: {
      label: 'Pending',
      variant: 'info',
      description: 'Awaiting vendor confirmation',
    },
    approved: {
      label: 'Approved',
      variant: 'success',
      description: 'Return approved by vendor',
    },
    completed: {
      label: 'Completed',
      variant: 'success',
      description: 'Return completed',
    },
    rejected: {
      label: 'Rejected',
      variant: 'destructive',
      description: 'Return rejected',
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'secondary',
      description: 'Cancelled',
    },
  },

  down_payment: {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      description: 'Not yet applied',
    },
    active: {
      label: 'Active',
      variant: 'info',
      description: 'Available for use',
    },
    partial: {
      label: 'Partial',
      variant: 'warning',
      description: 'Partially used',
    },
    used: {
      label: 'Used',
      variant: 'success',
      description: 'Fully applied',
    },
    cancelled: {
      label: 'Cancelled',
      variant: 'secondary',
      description: 'Cancelled',
    },
  },

  solar_proposal: {
    draft: {
      label: 'Draft',
      variant: 'secondary',
      description: 'In preparation',
    },
    sent: {
      label: 'Sent',
      variant: 'info',
      description: 'Sent to customer',
    },
    viewed: {
      label: 'Viewed',
      variant: 'info',
      description: 'Viewed by customer',
    },
    accepted: {
      label: 'Accepted',
      variant: 'success',
      description: 'Accepted by customer',
    },
    rejected: {
      label: 'Rejected',
      variant: 'destructive',
      description: 'Rejected by customer',
    },
    expired: {
      label: 'Expired',
      variant: 'warning',
      description: 'Past validity date',
    },
  },
}

/**
 * Default fallback status config
 */
export const DEFAULT_STATUS_CONFIG = {
  label: 'Unknown',
  variant: 'secondary' as const,
  description: 'Unknown status',
}
