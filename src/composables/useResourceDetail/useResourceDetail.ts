/**
 * useResourceDetail Composable
 *
 * Handles common detail page patterns:
 * - Fetch single resource by ID
 * - Loading state
 * - Error handling
 * - Delete with confirmation
 * - Navigation utilities
 *
 * @example
 * ```typescript
 * const {
 *   data,
 *   isLoading,
 *   confirmDelete,
 *   showDeleteModal,
 *   executeDelete,
 *   navigateToEdit,
 * } = useResourceDetail(
 *   { resourceName: 'quotation', listRoute: 'quotations', editRoute: 'quotation-edit' },
 *   { useFetch: useQuotation, useDelete: useDeleteQuotation }
 * )
 * ```
 */

import { computed, ref, type ComputedRef, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { eventBus } from '@/infrastructure/events'
import { logger } from '@/infrastructure/logger'

export interface ResourceDetailConfig {
  /** Resource name for events and logging */
  resourceName: string
  /** Route param name for ID (default: 'id') */
  idParam?: string
  /** Route name for list page */
  listRoute?: string
  /** Route name for edit page */
  editRoute?: string
}

export interface ResourceDetailHooks<T> {
  /** Hook to fetch the resource */
  useFetch: (id: number) => {
    data: Ref<T | undefined>
    isLoading: Ref<boolean>
    error: Ref<Error | null>
    refetch: () => void
  }
  /** Hook to delete the resource (optional) */
  useDelete?: () => {
    mutateAsync: (id: number) => Promise<void>
    isPending: Ref<boolean>
  }
}

export interface ResourceDetailReturn<T> {
  /** Resource data */
  data: Ref<T | undefined>
  /** Resource ID from route */
  resourceId: ComputedRef<number>

  /** Whether loading data */
  isLoading: Ref<boolean>
  /** Fetch error */
  error: Ref<Error | null>
  /** Whether deleting */
  isDeleting: ComputedRef<boolean>

  /** Delete confirmation modal state */
  showDeleteModal: Ref<boolean>
  /** Show delete confirmation */
  confirmDelete: () => void
  /** Cancel delete */
  cancelDelete: () => void
  /** Execute delete */
  executeDelete: () => Promise<void>

  /** Refresh data */
  refresh: () => void
  /** Navigate to edit page */
  navigateToEdit: () => void
  /** Navigate to list page */
  navigateToList: () => void
}

export function useResourceDetail<T extends { id: number }>(
  config: ResourceDetailConfig,
  hooks: ResourceDetailHooks<T>
): ResourceDetailReturn<T> {
  const route = useRoute()
  const router = useRouter()

  const { resourceName, idParam = 'id', listRoute, editRoute } = config

  const detailLogger = logger.child({ context: `detail:${resourceName}` })

  // ─────────────────────────────────────────────────────────────
  // Resource ID
  // ─────────────────────────────────────────────────────────────

  const resourceId = computed(() => {
    const id = route.params[idParam]
    if (Array.isArray(id)) return Number(id[0])
    return Number(id)
  })

  // ─────────────────────────────────────────────────────────────
  // Fetch Data
  // ─────────────────────────────────────────────────────────────

  const { data, isLoading, error, refetch } = hooks.useFetch(resourceId.value)

  // ─────────────────────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────────────────────

  const showDeleteModal = ref(false)
  const isDeleting = ref(false)

  const deleteMutation = hooks.useDelete?.()

  function confirmDelete(): void {
    showDeleteModal.value = true
  }

  function cancelDelete(): void {
    showDeleteModal.value = false
  }

  async function executeDelete(): Promise<void> {
    if (!deleteMutation || !data.value) return

    isDeleting.value = true
    try {
      await deleteMutation.mutateAsync(data.value.id)

      eventBus.emit('document:deleted', {
        documentType: resourceName,
        id: data.value.id,
      })

      detailLogger.info('Resource deleted', { id: data.value.id })

      // Navigate to list
      if (listRoute) {
        router.push({ name: listRoute })
      } else {
        router.back()
      }
    } catch (err) {
      detailLogger.error('Delete failed', err as Error)
      throw err
    } finally {
      isDeleting.value = false
      showDeleteModal.value = false
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────────────────────

  function navigateToEdit(): void {
    if (editRoute && data.value) {
      router.push({ name: editRoute, params: { id: data.value.id } })
    }
  }

  function navigateToList(): void {
    if (listRoute) {
      router.push({ name: listRoute })
    } else {
      router.back()
    }
  }

  return {
    // Data
    data,
    resourceId,

    // States
    isLoading,
    error,
    isDeleting: computed(() => isDeleting.value),

    // Delete modal
    showDeleteModal,
    confirmDelete,
    cancelDelete,
    executeDelete,

    // Actions
    refresh: refetch,
    navigateToEdit,
    navigateToList,
  }
}
