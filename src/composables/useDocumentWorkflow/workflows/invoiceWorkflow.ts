/**
 * Invoice Workflow Configuration
 *
 * Invoice lifecycle:
 * draft → sent → partial/paid
 *            ↘ overdue
 * draft → void
 * sent → cancelled
 */

import type { WorkflowConfig } from '../types'

export const invoiceWorkflow: WorkflowConfig = {
  documentType: 'invoice',
  actions: [
    {
      name: 'send',
      label: 'Mark as Sent',
      icon: 'Send',
      variant: 'primary',
      allowedFromStatuses: ['draft'],
      targetStatus: 'sent',
    },
    {
      name: 'record_payment',
      label: 'Record Payment',
      icon: 'CreditCard',
      variant: 'success',
      allowedFromStatuses: ['sent', 'partial', 'overdue'],
    },
    {
      name: 'mark_paid',
      label: 'Mark as Paid',
      icon: 'CheckCircle',
      variant: 'success',
      requiresConfirmation: true,
      confirmationMessage: 'Mark this invoice as fully paid?',
      allowedFromStatuses: ['sent', 'partial', 'overdue'],
      targetStatus: 'paid',
    },
    {
      name: 'void',
      label: 'Void Invoice',
      icon: 'FileX',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Voiding will create a reversal entry. This cannot be undone. Continue?',
      allowedFromStatuses: ['draft'],
      targetStatus: 'void',
    },
    {
      name: 'cancel',
      label: 'Cancel Invoice',
      icon: 'Ban',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to cancel this invoice?',
      allowedFromStatuses: ['sent', 'partial'],
      targetStatus: 'cancelled',
    },
    {
      name: 'send_reminder',
      label: 'Send Reminder',
      icon: 'Bell',
      variant: 'warning',
      allowedFromStatuses: ['sent', 'partial', 'overdue'],
    },
    {
      name: 'create_credit_note',
      label: 'Create Credit Note',
      icon: 'FileText',
      variant: 'secondary',
      allowedFromStatuses: ['sent', 'partial', 'paid', 'overdue'],
    },
    {
      name: 'duplicate',
      label: 'Duplicate',
      icon: 'Copy',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled', 'void'],
    },
    {
      name: 'print',
      label: 'Print / PDF',
      icon: 'Printer',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled', 'void'],
    },
    {
      name: 'send_email',
      label: 'Send Email',
      icon: 'Mail',
      variant: 'secondary',
      allowedFromStatuses: ['sent', 'partial', 'overdue'],
    },
  ],
}
