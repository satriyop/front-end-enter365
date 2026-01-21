/**
 * useDocumentWorkflow Types
 */

import type { ComputedRef, Ref } from 'vue'
import type { StatusVariant } from '@/services/status'

/**
 * A single workflow action that can be performed on a document
 */
export interface WorkflowAction {
  /** Unique action identifier */
  name: string
  /** Display label for the action */
  label: string
  /** Icon name (from Lucide) */
  icon?: string
  /** Button variant */
  variant?: StatusVariant
  /** Whether action requires confirmation dialog */
  requiresConfirmation?: boolean
  /** Custom confirmation message */
  confirmationMessage?: string
  /** Statuses from which this action can be performed */
  allowedFromStatuses: string[]
  /** Target status after action (for display) */
  targetStatus?: string
}

/**
 * Configuration for document workflow
 */
export interface WorkflowConfig {
  /** Document type for events and logging */
  documentType: string
  /** Available workflow actions */
  actions: WorkflowAction[]
}

/**
 * Mutation hook type for workflow actions
 */
export interface WorkflowMutationHook<T> {
  mutateAsync: (params: { id: number; payload?: unknown }) => Promise<T>
  isPending: Ref<boolean>
}

/**
 * Return type for useDocumentWorkflow
 */
export interface WorkflowReturn {
  /** Current document status */
  currentStatus: ComputedRef<string>
  /** Actions available for current status */
  availableActions: ComputedRef<WorkflowAction[]>
  /** Whether any action is processing */
  isProcessing: ComputedRef<boolean>
  /** Name of action currently processing */
  processingAction: ComputedRef<string | null>
  /** Execute a workflow action */
  executeAction: (actionName: string, payload?: unknown) => Promise<void>
  /** Check if action can be executed from current status */
  canExecute: (actionName: string) => boolean
  /** Get action by name */
  getAction: (actionName: string) => WorkflowAction | undefined

  // Confirmation dialog state
  /** Whether confirmation dialog is shown */
  showConfirmation: Ref<boolean>
  /** Action pending confirmation */
  pendingAction: Ref<WorkflowAction | null>
  /** Payload for pending action */
  pendingPayload: Ref<unknown>
  /** Confirm the pending action */
  confirmAction: () => Promise<void>
  /** Cancel the pending action */
  cancelAction: () => void
}
