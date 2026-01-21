/**
 * Work Order Workflow Configuration
 *
 * Work Order lifecycle:
 * draft → in_progress → completed
 *                    ↔ on_hold
 */

import type { WorkflowConfig } from '../types'

export const workOrderWorkflow: WorkflowConfig = {
  documentType: 'work_order',
  actions: [
    {
      name: 'start',
      label: 'Start Work',
      icon: 'Play',
      variant: 'primary',
      allowedFromStatuses: ['draft'],
      targetStatus: 'in_progress',
    },
    {
      name: 'pause',
      label: 'Put on Hold',
      icon: 'Pause',
      variant: 'warning',
      allowedFromStatuses: ['in_progress'],
      targetStatus: 'on_hold',
    },
    {
      name: 'resume',
      label: 'Resume Work',
      icon: 'Play',
      variant: 'primary',
      allowedFromStatuses: ['on_hold'],
      targetStatus: 'in_progress',
    },
    {
      name: 'complete',
      label: 'Mark Complete',
      icon: 'CheckCircle',
      variant: 'success',
      requiresConfirmation: true,
      confirmationMessage: 'Mark this work order as completed?',
      allowedFromStatuses: ['in_progress'],
      targetStatus: 'completed',
    },
    {
      name: 'cancel',
      label: 'Cancel Work Order',
      icon: 'Ban',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to cancel this work order?',
      allowedFromStatuses: ['draft', 'in_progress', 'on_hold'],
      targetStatus: 'cancelled',
    },
    {
      name: 'add_materials',
      label: 'Add Materials',
      icon: 'Package',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'in_progress'],
    },
    {
      name: 'log_time',
      label: 'Log Time',
      icon: 'Clock',
      variant: 'secondary',
      allowedFromStatuses: ['in_progress', 'on_hold'],
    },
    {
      name: 'duplicate',
      label: 'Duplicate',
      icon: 'Copy',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    },
    {
      name: 'print',
      label: 'Print / PDF',
      icon: 'Printer',
      variant: 'secondary',
      allowedFromStatuses: ['draft', 'in_progress', 'on_hold', 'completed', 'cancelled'],
    },
  ],
}
