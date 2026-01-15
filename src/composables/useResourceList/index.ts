import { ref, computed, type Ref } from 'vue'
import type {
  UseResourceListOptions,
  UseResourceListReturn,
  BaseFilters,
} from './types'

/**
 * Composable for managing resource list pages with filtering, pagination, and delete confirmation.
 *
 * @example
 * ```ts
 * const {
 *   items: contacts,
 *   pagination,
 *   isLoading,
 *   error,
 *   isEmpty,
 *   filters,
 *   updateFilter,
 *   goToPage,
 *   deleteConfirmation,
 * } = useResourceList({
 *   useListHook: useContacts,
 *   initialFilters: { page: 1, per_page: 10, search: '', type: undefined },
 * })
 * ```
 */
export function useResourceList<
  TResource extends { id: number | string },
  TFilters extends BaseFilters
>(options: UseResourceListOptions<TResource, TFilters>): UseResourceListReturn<TResource, TFilters> {
  const {
    useListHook,
    initialFilters,
  } = options

  // Filters state
  const filters = ref<TFilters>({ ...initialFilters }) as Ref<TFilters>

  // Fetch data using the provided hook
  const { data, isLoading, error } = useListHook(filters)

  // Computed data
  const items = computed(() => data.value?.data ?? [])
  const pagination = computed(() => data.value?.meta)
  const isEmpty = computed(() => !isLoading.value && items.value.length === 0)

  // Filter management
  function updateFilter<K extends keyof TFilters>(key: K, value: TFilters[K]) {
    filters.value[key] = value
    // Reset to page 1 when filters change (except page itself)
    if (key !== 'page') {
      filters.value.page = 1
    }
  }

  function resetFilters() {
    Object.assign(filters.value, { ...initialFilters })
  }

  // Pagination
  function goToPage(page: number) {
    filters.value.page = page
  }

  function nextPage() {
    const currentPage = filters.value.page ?? 1
    if (pagination.value && currentPage < pagination.value.last_page) {
      filters.value.page = currentPage + 1
    }
  }

  function prevPage() {
    const currentPage = filters.value.page ?? 1
    if (currentPage > 1) {
      filters.value.page = currentPage - 1
    }
  }

  // Delete confirmation pattern
  const showDeleteModal = ref(false)
  const itemToDelete = ref<number | string | null>(null)

  function confirmDelete(id: number | string) {
    itemToDelete.value = id
    showDeleteModal.value = true
  }

  function cancelDelete() {
    showDeleteModal.value = false
    itemToDelete.value = null
  }

  function executeDelete(): number | string | null {
    const id = itemToDelete.value
    showDeleteModal.value = false
    itemToDelete.value = null
    return id
  }

  return {
    // Data
    items,
    pagination,
    isLoading,
    error,
    isEmpty,

    // Filters
    filters,
    updateFilter,
    resetFilters,

    // Pagination
    goToPage,
    nextPage,
    prevPage,

    // Delete confirmation
    deleteConfirmation: {
      showModal: showDeleteModal,
      itemToDelete,
      confirmDelete,
      cancelDelete,
      executeDelete,
    },
  }
}

// Re-export types
export type { UseResourceListOptions, UseResourceListReturn, BaseFilters, PaginationMeta } from './types'
