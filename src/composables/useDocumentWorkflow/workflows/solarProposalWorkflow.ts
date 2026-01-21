/**
 * Solar Proposal Workflow Configuration
 *
 * Solar Proposal lifecycle:
 * draft → sent → viewed → accepted
 *                      ↘ rejected
 *                      ↘ expired
 */

import type { WorkflowConfig } from '../types'

export const solarProposalWorkflow: WorkflowConfig = {
  documentType: 'solar_proposal',
  actions: [
    {
      name: 'send',
      label: 'Send to Customer',
      icon: 'Send',
      variant: 'primary',
      allowedFromStatuses: ['draft'],
      targetStatus: 'sent',
    },
    {
      name: 'resend',
      label: 'Resend',
      icon: 'RefreshCw',
      variant: 'secondary',
      allowedFromStatuses: ['sent', 'viewed'],
    },
    {
      name: 'mark_accepted',
      label: 'Mark as Accepted',
      icon: 'CheckCircle',
      variant: 'success',
      requiresConfirmation: true,
      confirmationMessage: 'Mark this proposal as accepted by the customer?',
      allowedFromStatuses: ['sent', 'viewed'],
      targetStatus: 'accepted',
    },
    {
      name: 'mark_rejected',
      label: 'Mark as Rejected',
      icon: 'XCircle',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Mark this proposal as rejected?',
      allowedFromStatuses: ['sent', 'viewed'],
      targetStatus: 'rejected',
    },
    {
      name: 'convert_to_quotation',
      label: 'Convert to Quotation',
      icon: 'FileText',
      variant: 'primary',
      requiresConfirmation: true,
      confirmationMessage: 'Create a quotation from this proposal?',
      allowedFromStatuses: ['accepted'],
    },
    {
      name: 'revise',
      label: 'Create Revision',
      icon: 'Edit',
      variant: 'secondary',
      allowedFromStatuses: ['sent', 'viewed', 'rejected', 'expired'],
    },
    {
      name: 'duplicate',
      label: 'Duplicate',
      icon: 'Copy',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
    },
    {
      name: 'print',
      label: 'Print / PDF',
      icon: 'Printer',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
    },
    {
      name: 'view_analytics',
      label: 'View Analytics',
      icon: 'BarChart',
      variant: 'secondary',
      allowedFromStatuses: ['sent', 'viewed', 'accepted', 'rejected'],
    },
  ],
}
