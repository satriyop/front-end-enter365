/**
 * useResourceList Module
 */

import { ref, computed, watch, type Ref } from 'vue'
import { eventBus } from '@/infrastructure/events'
import { logger } from '@/infrastructure/logger'
import type {
  UseResourceListOptions,
  UseResourceListReturn,
  BaseFilters,
} from './types'

/**
 * Enhanced composable for managing resource list pages with:
 * - Filtering with optional persistence
 * - Pagination controls
 * - Bulk selection
 * - Delete with confirmation
 * - UI state helpers
 *
 * @example
 * ```ts
 * const {
 *   items,
 *   pagination,
 *   isLoading,
 *   showLoading,
 *   showEmpty,
 *   showData,
 *   filters,
 *   updateFilter,
 *   deleteConfirmation,
 * } = useResourceList({
 *   resourceName: 'quotation',
 *   useListHook: useQuotations,
 *   initialFilters: { page: 1, per_page: 10, search: '', status: '' },
 *   useDeleteHook: useDeleteQuotation,
 * })
 * ```
 */
export function useResourceList<
  TResource extends { id: string | number },
  TFilters extends BaseFilters,
>(options: UseResourceListOptions<TResource, TFilters>): UseResourceListReturn<TResource, TFilters> {
  const {
    resourceName = 'resource',
    useListHook,
    initialFilters,
    useDeleteHook,
    persistFilters,
    filterStorageKey,
  } = options

  const listLogger = logger.child({ context: `list:${resourceName}` })

  // ─────────────────────────────────────────────────────────────
  // Filters
  // ─────────────────────────────────────────────────────────────

  const filters = ref<TFilters>({ ...initialFilters }) as Ref<TFilters>

  // Persist filters to localStorage
  if (persistFilters && filterStorageKey) {
    const stored = localStorage.getItem(filterStorageKey)
    if (stored) {
      try {
        filters.value = { ...initialFilters, ...JSON.parse(stored) }
      } catch {
        // Ignore invalid JSON
      }
    }

    watch(
      filters,
      (newFilters) => {
        localStorage.setItem(filterStorageKey, JSON.stringify(newFilters))
      },
      { deep: true }
    )
  }

  function updateFilter<K extends keyof TFilters>(key: K, value: TFilters[K]): void {
    filters.value = { ...filters.value, [key]: value }
    // Reset to page 1 when filters change (except page itself)
    if (key !== 'page') {
      filters.value = { ...filters.value, page: 1 }
    }
  }

  function resetFilters(): void {
    filters.value = { ...initialFilters }
    if (persistFilters && filterStorageKey) {
      localStorage.removeItem(filterStorageKey)
    }
  }

  const hasActiveFilters = computed(() => {
    return Object.entries(filters.value).some(([key, value]) => {
      if (key === 'page' || key === 'per_page') return false
      const initialValue = initialFilters[key as keyof TFilters]
      return value !== initialValue && value !== '' && value !== null && value !== undefined
    })
  })

  // ─────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────

  const hookResult = useListHook(filters)
  const { data, isLoading, error } = hookResult
  const isFetching = hookResult.isFetching ?? ref(false)
  const refetch = hookResult.refetch ?? (() => {})

  const items = computed(() => data.value?.data ?? [])
  const pagination = computed(() => data.value?.meta)
  const isEmpty = computed(() => !isLoading.value && items.value.length === 0)
  const totalCount = computed(() => pagination.value?.total ?? 0)

  // UI states for conditional rendering
  const showLoading = computed(() => isLoading.value && items.value.length === 0)
  const showEmpty = computed(() => !isLoading.value && isEmpty.value && !error.value)
  const showError = computed(() => !isLoading.value && !!error.value)
  const showData = computed(() => !showLoading.value && !showEmpty.value && !showError.value)

  // ─────────────────────────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────────────────────────

  function goToPage(page: number): void {
    if (!pagination.value) return
    if (page < 1 || page > pagination.value.last_page) return
    filters.value = { ...filters.value, page }
  }

  function nextPage(): void {
    const currentPage = filters.value.page ?? 1
    if (pagination.value && currentPage < pagination.value.last_page) {
      goToPage(currentPage + 1)
    }
  }

  function prevPage(): void {
    const currentPage = filters.value.page ?? 1
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  function setPerPage(perPage: number): void {
    filters.value = { ...filters.value, per_page: perPage, page: 1 }
  }

  // ─────────────────────────────────────────────────────────────
  // Bulk Selection
  // ─────────────────────────────────────────────────────────────

  const selectedIds = ref<(string | number)[]>([])

  function selectAll(): void {
    selectedIds.value = items.value.map((item) => item.id)
  }

  function deselectAll(): void {
    selectedIds.value = []
  }

  function toggleSelection(id: string | number): void {
    const index = selectedIds.value.indexOf(id)
    if (index === -1) {
      selectedIds.value = [...selectedIds.value, id]
    } else {
      selectedIds.value = selectedIds.value.filter((i) => i !== id)
    }
  }

  function isSelected(id: string | number): boolean {
    return selectedIds.value.includes(id)
  }

  const selectionCount = computed(() => selectedIds.value.length)

  // Clear selection when filters change
  watch(
    filters,
    () => {
      deselectAll()
    },
    { deep: true }
  )

  // ─────────────────────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────────────────────

  const showDeleteModal = ref(false)
  // Use explicit any to avoid Vue ref generic unwrapping issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const itemToDelete = ref<any>(null)
  const isDeleting = ref(false)

  const deleteMutation = useDeleteHook?.()

  /**
   * Show delete confirmation for an item.
   * Accepts either the full resource object or just an ID for backward compatibility.
   */
  function confirmDelete(itemOrId: TResource | string | number): void {
    itemToDelete.value = itemOrId
    showDeleteModal.value = true
  }

  function cancelDelete(): void {
    itemToDelete.value = null
    showDeleteModal.value = false
  }

  /**
   * Get the ID of the item to delete and close the modal.
   * Returns the ID for the caller to handle deletion.
   * This is synchronous for backward compatibility - pages handle their own delete mutations.
   */
  function executeDelete(): string | number | null {
    if (!itemToDelete.value) return null

    // Extract ID whether itemToDelete is a resource or just an ID
    const deleteId =
      typeof itemToDelete.value === 'object' && itemToDelete.value !== null
        ? itemToDelete.value.id
        : itemToDelete.value

    // Close modal and return ID for caller to handle deletion
    cancelDelete()
    return deleteId
  }

  /**
   * Execute delete using the provided delete hook.
   * Use this when useDeleteHook was provided in options.
   */
  async function performDelete(): Promise<string | number | null> {
    if (!deleteMutation || !itemToDelete.value) return null

    // Extract ID whether itemToDelete is a resource or just an ID
    const deleteId =
      typeof itemToDelete.value === 'object' && itemToDelete.value !== null
        ? itemToDelete.value.id
        : itemToDelete.value

    isDeleting.value = true
    try {
      await deleteMutation.mutateAsync(deleteId)

      eventBus.emit('document:deleted', {
        documentType: resourceName,
        id: deleteId,
      })

      listLogger.info('Resource deleted', { id: deleteId })
      refetch()
      return deleteId
    } catch (err) {
      listLogger.error('Delete failed', err as Error)
      throw err
    } finally {
      isDeleting.value = false
      cancelDelete()
    }
  }

  return {
    // Data
    items,
    pagination,
    isEmpty,
    totalCount,

    // States
    isLoading,
    isRefreshing: computed(() => isFetching.value),
    error,
    hasError: computed(() => !!error.value),

    // UI States
    showLoading,
    showEmpty,
    showError,
    showData,

    // Filters
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,

    // Pagination
    goToPage,
    nextPage,
    prevPage,
    setPerPage,

    // Bulk selection
    selectedIds,
    selectAll,
    deselectAll,
    toggleSelection,
    isSelected,
    selectionCount,

    // Delete
    deleteConfirmation: {
      showModal: showDeleteModal,
      itemToDelete,
      confirmDelete,
      cancelDelete,
      executeDelete,
      performDelete: useDeleteHook ? performDelete : undefined,
      isDeleting: computed(() => isDeleting.value),
    },

    // Refresh
    refresh: refetch,
  }
}

// Re-export types
export type {
  UseResourceListOptions,
  UseResourceListReturn,
  BaseFilters,
  PaginationMeta,
  PaginatedResponse,
  DeleteConfirmation,
  ResourceId,
} from './types'
