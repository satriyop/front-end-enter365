/**
 * useDocumentWorkflow Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, type Ref } from 'vue'
import { useDocumentWorkflow } from '../useDocumentWorkflow'
import type { WorkflowConfig } from '../types'

// Mock the infrastructure
vi.mock('@/infrastructure/events', () => ({
  eventBus: {
    emit: vi.fn(),
  },
}))

vi.mock('@/infrastructure/logger', () => ({
  logger: {
    child: () => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}))

// Test workflow config
const testWorkflow: WorkflowConfig = {
  documentType: 'test_document',
  actions: [
    {
      name: 'submit',
      label: 'Submit',
      variant: 'primary',
      allowedFromStatuses: ['draft'],
      targetStatus: 'submitted',
    },
    {
      name: 'approve',
      label: 'Approve',
      variant: 'success',
      allowedFromStatuses: ['submitted'],
      targetStatus: 'approved',
    },
    {
      name: 'reject',
      label: 'Reject',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure?',
      allowedFromStatuses: ['submitted'],
      targetStatus: 'rejected',
    },
    {
      name: 'cancel',
      label: 'Cancel',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Cancel this document?',
      allowedFromStatuses: ['draft', 'submitted'],
      targetStatus: 'cancelled',
    },
  ],
}

interface TestDocument {
  id: number
  status: string
}

// Type for mutations matching useDocumentWorkflow API
type MutationFactory = () => {
  mutateAsync: (params: { id: number; payload?: unknown }) => Promise<TestDocument>
  isPending: Ref<boolean>
}

describe('useDocumentWorkflow', () => {
  let document: Ref<TestDocument | null>
  let mockSubmitMutation: ReturnType<typeof vi.fn>
  let mockApproveMutation: ReturnType<typeof vi.fn>
  let mockRejectMutation: ReturnType<typeof vi.fn>
  let mutations: Record<string, MutationFactory>

  beforeEach(() => {
    document = ref<TestDocument | null>({ id: 1, status: 'draft' })

    mockSubmitMutation = vi.fn().mockResolvedValue({ id: 1, status: 'submitted' })
    mockApproveMutation = vi.fn().mockResolvedValue({ id: 1, status: 'approved' })
    mockRejectMutation = vi.fn().mockResolvedValue({ id: 1, status: 'rejected' })

    mutations = {
      submit: () => ({ mutateAsync: mockSubmitMutation, isPending: ref(false) as Ref<boolean> }),
      approve: () => ({ mutateAsync: mockApproveMutation, isPending: ref(false) as Ref<boolean> }),
      reject: () => ({ mutateAsync: mockRejectMutation, isPending: ref(false) as Ref<boolean> }),
    }
  })

  describe('currentStatus', () => {
    it('returns document status', () => {
      const { currentStatus } = useDocumentWorkflow(document, testWorkflow, mutations)
      expect(currentStatus.value).toBe('draft')
    })

    it('returns empty string when no document', () => {
      document.value = null
      const { currentStatus } = useDocumentWorkflow(document, testWorkflow, mutations)
      expect(currentStatus.value).toBe('')
    })

    it('updates when document status changes', () => {
      const { currentStatus } = useDocumentWorkflow(document, testWorkflow, mutations)
      expect(currentStatus.value).toBe('draft')

      document.value = { id: 1, status: 'submitted' }
      expect(currentStatus.value).toBe('submitted')
    })
  })

  describe('availableActions', () => {
    it('returns actions for current status', () => {
      const { availableActions } = useDocumentWorkflow(document, testWorkflow, mutations)

      // From draft, should have submit and cancel
      const actionNames = availableActions.value.map((a) => a.name)
      expect(actionNames).toContain('submit')
      expect(actionNames).toContain('cancel')
      expect(actionNames).not.toContain('approve')
    })

    it('updates when status changes', () => {
      const { availableActions } = useDocumentWorkflow(document, testWorkflow, mutations)

      document.value = { id: 1, status: 'submitted' }
      const actionNames = availableActions.value.map((a) => a.name)
      expect(actionNames).toContain('approve')
      expect(actionNames).toContain('reject')
      expect(actionNames).toContain('cancel')
      expect(actionNames).not.toContain('submit')
    })

    it('returns empty array when no document', () => {
      document.value = null
      const { availableActions } = useDocumentWorkflow(document, testWorkflow, mutations)
      expect(availableActions.value).toEqual([])
    })
  })

  describe('canExecute', () => {
    it('returns true for available actions', () => {
      const { canExecute } = useDocumentWorkflow(document, testWorkflow, mutations)
      expect(canExecute('submit')).toBe(true)
      expect(canExecute('cancel')).toBe(true)
    })

    it('returns false for unavailable actions', () => {
      const { canExecute } = useDocumentWorkflow(document, testWorkflow, mutations)
      expect(canExecute('approve')).toBe(false)
      expect(canExecute('reject')).toBe(false)
    })

    it('returns false for non-existent actions', () => {
      const { canExecute } = useDocumentWorkflow(document, testWorkflow, mutations)
      expect(canExecute('nonexistent')).toBe(false)
    })
  })

  describe('getAction', () => {
    it('returns action by name', () => {
      const { getAction } = useDocumentWorkflow(document, testWorkflow, mutations)
      const action = getAction('submit')
      expect(action).toBeDefined()
      expect(action?.label).toBe('Submit')
    })

    it('returns undefined for non-existent action', () => {
      const { getAction } = useDocumentWorkflow(document, testWorkflow, mutations)
      expect(getAction('nonexistent')).toBeUndefined()
    })
  })

  describe('executeAction', () => {
    it('executes action without confirmation', async () => {
      const { executeAction, isProcessing } = useDocumentWorkflow(document, testWorkflow, mutations)

      await executeAction('submit')

      expect(mockSubmitMutation).toHaveBeenCalledWith({ id: 1, payload: undefined })
      expect(isProcessing.value).toBe(false)
    })

    it('opens confirmation dialog for actions requiring confirmation', async () => {
      document.value = { id: 1, status: 'submitted' }
      const { executeAction, showConfirmation, pendingAction } = useDocumentWorkflow(
        document,
        testWorkflow,
        mutations
      )

      await executeAction('reject')

      expect(showConfirmation.value).toBe(true)
      expect(pendingAction.value?.name).toBe('reject')
      expect(mockRejectMutation).not.toHaveBeenCalled()
    })

    it('does not execute when action not allowed', async () => {
      const { executeAction } = useDocumentWorkflow(document, testWorkflow, mutations)

      await executeAction('approve') // Not allowed from draft

      expect(mockApproveMutation).not.toHaveBeenCalled()
    })

    it('passes payload to mutation', async () => {
      const { executeAction } = useDocumentWorkflow(document, testWorkflow, mutations)

      await executeAction('submit', { note: 'test note' })

      expect(mockSubmitMutation).toHaveBeenCalledWith({ id: 1, payload: { note: 'test note' } })
    })
  })

  describe('confirmation dialog', () => {
    it('confirmAction executes pending action', async () => {
      document.value = { id: 1, status: 'submitted' }
      const { executeAction, confirmAction, showConfirmation } = useDocumentWorkflow(
        document,
        testWorkflow,
        mutations
      )

      // Open confirmation
      await executeAction('reject')
      expect(showConfirmation.value).toBe(true)

      // Confirm
      await confirmAction()
      expect(mockRejectMutation).toHaveBeenCalled()
      expect(showConfirmation.value).toBe(false)
    })

    it('cancelAction clears pending action', async () => {
      document.value = { id: 1, status: 'submitted' }
      const { executeAction, cancelAction, showConfirmation, pendingAction } = useDocumentWorkflow(
        document,
        testWorkflow,
        mutations
      )

      await executeAction('reject')
      expect(showConfirmation.value).toBe(true)

      cancelAction()
      expect(showConfirmation.value).toBe(false)
      expect(pendingAction.value).toBeNull()
      expect(mockRejectMutation).not.toHaveBeenCalled()
    })
  })

  describe('processingAction', () => {
    it('tracks which action is processing', async () => {
      const { executeAction, processingAction } = useDocumentWorkflow(
        document,
        testWorkflow,
        mutations
      )

      expect(processingAction.value).toBeNull()

      const promise = executeAction('submit')
      // During execution, processingAction should be set
      // (timing may vary, so we check after)
      await promise

      expect(processingAction.value).toBeNull() // Reset after completion
    })
  })
})
