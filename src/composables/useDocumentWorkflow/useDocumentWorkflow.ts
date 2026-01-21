/**
 * useDocumentWorkflow Composable
 *
 * Manages document status transitions and workflow actions.
 * Handles action execution, confirmation dialogs, and events.
 *
 * @example
 * ```typescript
 * const { availableActions, executeAction, isProcessing } = useDocumentWorkflow(
 *   quotation,
 *   quotationWorkflow,
 *   {
 *     submit: useSubmitQuotation,
 *     approve: useApproveQuotation,
 *     reject: useRejectQuotation,
 *   }
 * )
 *
 * // In template
 * <Button
 *   v-for="action in availableActions"
 *   @click="executeAction(action.name)"
 * >
 *   {{ action.label }}
 * </Button>
 * ```
 */

import { computed, ref, type Ref } from 'vue'
import { eventBus } from '@/infrastructure/events'
import { logger } from '@/infrastructure/logger'
import type { WorkflowConfig, WorkflowAction, WorkflowReturn } from './types'

export function useDocumentWorkflow<T extends { id: number; status: string }>(
  document: Ref<T | null | undefined>,
  config: WorkflowConfig,
  mutations: Record<
    string,
    () => {
      mutateAsync: (params: { id: number; payload?: unknown }) => Promise<T>
      isPending: Ref<boolean>
    }
  >
): WorkflowReturn {
  const workflowLogger = logger.child({ context: `workflow:${config.documentType}` })

  const isProcessing = ref(false)
  const processingAction = ref<string | null>(null)

  // Confirmation dialog state
  const showConfirmation = ref(false)
  const pendingAction = ref<WorkflowAction | null>(null)
  const pendingPayload = ref<unknown>(null)

  /**
   * Current document status
   */
  const currentStatus = computed(() => document.value?.status ?? '')

  /**
   * Actions available for current status
   */
  const availableActions = computed(() => {
    if (!document.value) return []

    return config.actions.filter((action) =>
      action.allowedFromStatuses.includes(currentStatus.value)
    )
  })

  /**
   * Check if action can be executed from current status
   */
  function canExecute(actionName: string): boolean {
    return availableActions.value.some((a) => a.name === actionName)
  }

  /**
   * Get action by name
   */
  function getAction(actionName: string): WorkflowAction | undefined {
    return config.actions.find((a) => a.name === actionName)
  }

  /**
   * Execute a workflow action
   */
  async function executeAction(actionName: string, payload?: unknown): Promise<void> {
    if (!document.value) {
      workflowLogger.warn('Cannot execute action: no document', { actionName })
      return
    }

    if (!canExecute(actionName)) {
      workflowLogger.warn('Action not allowed from current status', {
        actionName,
        status: currentStatus.value,
      })
      return
    }

    const action = getAction(actionName)
    if (!action) {
      workflowLogger.error('Action not found', undefined, { actionName })
      return
    }

    // Check if requires confirmation
    if (action.requiresConfirmation) {
      pendingAction.value = action
      pendingPayload.value = payload
      showConfirmation.value = true
      return
    }

    // Execute directly
    await performAction(action, payload)
  }

  /**
   * Perform the actual action execution
   */
  async function performAction(action: WorkflowAction, payload?: unknown): Promise<void> {
    if (!document.value) return

    const mutationFactory = mutations[action.name]
    if (!mutationFactory) {
      workflowLogger.error('Mutation not found for action', undefined, {
        actionName: action.name,
      })
      return
    }

    const oldStatus = currentStatus.value
    isProcessing.value = true
    processingAction.value = action.name

    try {
      const mutation = mutationFactory()
      const result = await mutation.mutateAsync({
        id: document.value.id,
        payload,
      })

      eventBus.emit('document:status-changed', {
        documentType: config.documentType,
        id: document.value.id,
        from: oldStatus,
        to: result.status,
      })

      workflowLogger.info('Workflow action executed', {
        action: action.name,
        documentId: document.value.id,
        from: oldStatus,
        to: result.status,
      })
    } catch (error) {
      workflowLogger.error('Workflow action failed', error as Error, {
        actionName: action.name,
      })
      throw error
    } finally {
      isProcessing.value = false
      processingAction.value = null
    }
  }

  /**
   * Confirm pending action
   */
  async function confirmAction(): Promise<void> {
    if (!pendingAction.value) return

    const action = pendingAction.value
    const payload = pendingPayload.value

    // Clear confirmation state
    showConfirmation.value = false
    pendingAction.value = null
    pendingPayload.value = null

    await performAction(action, payload)
  }

  /**
   * Cancel pending action
   */
  function cancelAction(): void {
    showConfirmation.value = false
    pendingAction.value = null
    pendingPayload.value = null
  }

  return {
    currentStatus,
    availableActions,
    isProcessing: computed(() => isProcessing.value),
    processingAction: computed(() => processingAction.value),
    executeAction,
    canExecute,
    getAction,

    // Confirmation dialog
    showConfirmation,
    pendingAction,
    pendingPayload,
    confirmAction,
    cancelAction,
  }
}
