import type { Ref, ComputedRef } from 'vue'

/**
 * Pagination metadata from API response
 */
export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

/**
 * Base filter interface that all filter types should extend
 */
export interface BaseFilters {
  page?: number
  per_page?: number
  search?: string
}

/**
 * Options for the useResourceList composable
 */
export interface UseResourceListOptions<TResource, TFilters extends BaseFilters> {
  /** The API hook that returns query result */
  useListHook: (filters: Ref<TFilters>) => {
    data: Ref<{ data: TResource[]; meta: PaginationMeta } | undefined>
    isLoading: Ref<boolean>
    error: Ref<Error | null>
  }
  /** Initial filter values */
  initialFilters: TFilters
}

/**
 * Return type for the useResourceList composable
 */
export interface UseResourceListReturn<TResource, TFilters extends BaseFilters> {
  // Data
  items: ComputedRef<TResource[]>
  pagination: ComputedRef<PaginationMeta | undefined>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  isEmpty: ComputedRef<boolean>

  // Filters
  filters: Ref<TFilters>
  updateFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void
  resetFilters: () => void

  // Pagination
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void

  // Delete confirmation pattern
  deleteConfirmation: {
    showModal: Ref<boolean>
    itemToDelete: Ref<number | string | null>
    confirmDelete: (id: number | string) => void
    cancelDelete: () => void
    executeDelete: () => number | string | null
  }
}
