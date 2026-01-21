/**
 * Purchase Order Workflow Configuration
 *
 * PO lifecycle:
 * draft → submitted → approved → partial/received
 *                  ↘ rejected
 */

import type { WorkflowConfig } from '../types'

export const purchaseOrderWorkflow: WorkflowConfig = {
  documentType: 'purchase_order',
  actions: [
    {
      name: 'submit',
      label: 'Submit for Approval',
      icon: 'Send',
      variant: 'primary',
      allowedFromStatuses: ['draft'],
      targetStatus: 'submitted',
    },
    {
      name: 'approve',
      label: 'Approve',
      icon: 'CheckCircle',
      variant: 'success',
      allowedFromStatuses: ['submitted'],
      targetStatus: 'approved',
    },
    {
      name: 'reject',
      label: 'Reject',
      icon: 'XCircle',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to reject this purchase order?',
      allowedFromStatuses: ['submitted'],
      targetStatus: 'rejected',
    },
    {
      name: 'revise',
      label: 'Revise',
      icon: 'Edit',
      variant: 'secondary',
      allowedFromStatuses: ['rejected'],
      targetStatus: 'draft',
    },
    {
      name: 'receive_goods',
      label: 'Receive Goods',
      icon: 'Package',
      variant: 'success',
      allowedFromStatuses: ['approved', 'partial'],
    },
    {
      name: 'mark_received',
      label: 'Mark as Received',
      icon: 'CheckCircle',
      variant: 'success',
      requiresConfirmation: true,
      confirmationMessage: 'Mark this PO as fully received?',
      allowedFromStatuses: ['approved', 'partial'],
      targetStatus: 'received',
    },
    {
      name: 'cancel',
      label: 'Cancel PO',
      icon: 'Ban',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to cancel this purchase order?',
      allowedFromStatuses: ['draft', 'submitted', 'approved'],
      targetStatus: 'cancelled',
    },
    {
      name: 'create_bill',
      label: 'Create Bill',
      icon: 'FileText',
      variant: 'secondary',
      allowedFromStatuses: ['approved', 'partial', 'received'],
    },
    {
      name: 'duplicate',
      label: 'Duplicate',
      icon: 'Copy',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'submitted', 'approved', 'rejected', 'partial', 'received', 'cancelled'],
    },
    {
      name: 'print',
      label: 'Print / PDF',
      icon: 'Printer',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'submitted', 'approved', 'rejected', 'partial', 'received', 'cancelled'],
    },
    {
      name: 'send_to_vendor',
      label: 'Send to Vendor',
      icon: 'Mail',
      variant: 'secondary',
      allowedFromStatuses: ['approved'],
    },
  ],
}
