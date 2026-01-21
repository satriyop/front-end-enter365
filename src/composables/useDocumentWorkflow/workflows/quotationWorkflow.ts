/**
 * Quotation Workflow Configuration
 *
 * Quotation lifecycle:
 * draft → submitted → approved → converted
 *                  ↘ rejected
 * Any status → cancelled (except converted)
 */

import type { WorkflowConfig } from '../types'

export const quotationWorkflow: WorkflowConfig = {
  documentType: 'quotation',
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
      confirmationMessage: 'Are you sure you want to reject this quotation? This action will notify the creator.',
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
      name: 'convert',
      label: 'Convert to Invoice',
      icon: 'FileText',
      variant: 'primary',
      requiresConfirmation: true,
      confirmationMessage: 'This will create an invoice from this quotation. Continue?',
      allowedFromStatuses: ['approved'],
      targetStatus: 'converted',
    },
    {
      name: 'cancel',
      label: 'Cancel Quotation',
      icon: 'Ban',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to cancel this quotation? This action cannot be undone.',
      allowedFromStatuses: ['draft', 'submitted', 'approved', 'rejected', 'expired'],
      targetStatus: 'cancelled',
    },
    {
      name: 'duplicate',
      label: 'Duplicate',
      icon: 'Copy',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'submitted', 'approved', 'rejected', 'expired', 'converted', 'cancelled'],
    },
    {
      name: 'print',
      label: 'Print / PDF',
      icon: 'Printer',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'submitted', 'approved', 'rejected', 'expired', 'converted', 'cancelled'],
    },
    {
      name: 'send_email',
      label: 'Send Email',
      icon: 'Mail',
      variant: 'secondary',
      allowedFromStatuses: ['submitted', 'approved'],
    },
  ],
}
