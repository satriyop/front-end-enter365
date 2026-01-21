/**
 * Bill (Vendor Invoice) Workflow Configuration
 *
 * Bill lifecycle:
 * draft → pending → approved → partial/paid
 *                           ↘ overdue
 */

import type { WorkflowConfig } from '../types'

export const billWorkflow: WorkflowConfig = {
  documentType: 'bill',
  actions: [
    {
      name: 'submit',
      label: 'Submit for Approval',
      icon: 'Send',
      variant: 'primary',
      allowedFromStatuses: ['draft'],
      targetStatus: 'pending',
    },
    {
      name: 'approve',
      label: 'Approve',
      icon: 'CheckCircle',
      variant: 'success',
      allowedFromStatuses: ['pending'],
      targetStatus: 'approved',
    },
    {
      name: 'reject',
      label: 'Reject',
      icon: 'XCircle',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to reject this bill?',
      allowedFromStatuses: ['pending'],
      targetStatus: 'draft',
    },
    {
      name: 'record_payment',
      label: 'Record Payment',
      icon: 'CreditCard',
      variant: 'success',
      allowedFromStatuses: ['approved', 'partial', 'overdue'],
    },
    {
      name: 'mark_paid',
      label: 'Mark as Paid',
      icon: 'CheckCircle',
      variant: 'success',
      requiresConfirmation: true,
      confirmationMessage: 'Mark this bill as fully paid?',
      allowedFromStatuses: ['approved', 'partial', 'overdue'],
      targetStatus: 'paid',
    },
    {
      name: 'cancel',
      label: 'Cancel Bill',
      icon: 'Ban',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to cancel this bill?',
      allowedFromStatuses: ['draft', 'pending', 'approved'],
      targetStatus: 'cancelled',
    },
    {
      name: 'duplicate',
      label: 'Duplicate',
      icon: 'Copy',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'pending', 'approved', 'partial', 'paid', 'overdue', 'cancelled'],
    },
    {
      name: 'print',
      label: 'Print / PDF',
      icon: 'Printer',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'pending', 'approved', 'partial', 'paid', 'overdue', 'cancelled'],
    },
  ],
}
