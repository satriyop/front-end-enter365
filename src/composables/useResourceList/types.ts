/**
 * useResourceList Types
 */

import type { Ref, ComputedRef } from 'vue'

/**
 * ID type - supports both string and number IDs from API
 */
export type ResourceId = string | number

/**
 * Pagination metadata from API response
 */
export interface PaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from?: number | null
  to?: number | null
}

/**
 * Base filter interface that all filter types should extend.
 * Only requires standard pagination fields; additional filter properties are allowed.
 */
export interface BaseFilters {
  page?: number
  per_page?: number
  search?: string
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

/**
 * Options for the useResourceList composable
 */
export interface UseResourceListOptions<TResource, TFilters extends BaseFilters> {
  /** Resource name for events and logging */
  resourceName?: string
  /** The API hook that returns query result */
  useListHook: (filters: Ref<TFilters>) => {
    data: Ref<PaginatedResponse<TResource> | undefined>
    isLoading: Ref<boolean>
    isFetching?: Ref<boolean>
    error: Ref<Error | null>
    refetch?: () => void
  }
  /** Initial filter values */
  initialFilters: TFilters
  /** Hook to delete item (optional) */
  useDeleteHook?: () => {
    mutateAsync: (id: ResourceId) => Promise<void>
    isPending: Ref<boolean>
  }
  /** Whether to persist filters to localStorage */
  persistFilters?: boolean
  /** Storage key for persisted filters */
  filterStorageKey?: string
}

/**
 * Delete confirmation state
 */
export interface DeleteConfirmation<T> {
  showModal: Ref<boolean>
  /** The item or ID pending deletion */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemToDelete: Ref<T | ResourceId | null>
  /** Show confirmation - accepts full resource or just ID for backward compatibility */
  confirmDelete: (itemOrId: T | ResourceId) => void
  cancelDelete: () => void
  /** Get delete ID and close modal - synchronous for backward compatibility */
  executeDelete: () => ResourceId | null
  /** Execute delete using provided delete hook - async version */
  performDelete?: () => Promise<ResourceId | null>
  isDeleting: ComputedRef<boolean>
}

/**
 * Return type for the useResourceList composable
 */
export interface UseResourceListReturn<TResource, TFilters extends BaseFilters> {
  // Data
  /** List items */
  items: ComputedRef<TResource[]>
  /** Pagination metadata */
  pagination: ComputedRef<PaginationMeta | undefined>
  /** Whether list is empty */
  isEmpty: ComputedRef<boolean>
  /** Total count */
  totalCount: ComputedRef<number>

  // States
  /** Initial loading */
  isLoading: Ref<boolean>
  /** Refetching in background */
  isRefreshing: ComputedRef<boolean>
  /** Error state */
  error: Ref<Error | null>
  /** Has error */
  hasError: ComputedRef<boolean>

  // UI States (for template conditions)
  /** Show loading skeleton */
  showLoading: ComputedRef<boolean>
  /** Show empty state */
  showEmpty: ComputedRef<boolean>
  /** Show error state */
  showError: ComputedRef<boolean>
  /** Show data */
  showData: ComputedRef<boolean>

  // Filters
  /** Current filters */
  filters: Ref<TFilters>
  /** Update a single filter */
  updateFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void
  /** Reset filters to initial values */
  resetFilters: () => void
  /** Whether any filter is active (excluding page/per_page) */
  hasActiveFilters: ComputedRef<boolean>

  // Pagination
  /** Go to specific page */
  goToPage: (page: number) => void
  /** Go to next page */
  nextPage: () => void
  /** Go to previous page */
  prevPage: () => void
  /** Set items per page */
  setPerPage: (perPage: number) => void

  // Bulk Selection
  /** Selected item IDs */
  selectedIds: Ref<ResourceId[]>
  /** Select all visible items */
  selectAll: () => void
  /** Deselect all items */
  deselectAll: () => void
  /** Toggle selection for item */
  toggleSelection: (id: ResourceId) => void
  /** Check if item is selected */
  isSelected: (id: ResourceId) => boolean
  /** Number of selected items */
  selectionCount: ComputedRef<number>

  // Delete
  /** Delete confirmation state */
  deleteConfirmation: DeleteConfirmation<TResource>

  // Refresh
  /** Refresh list */
  refresh: () => void
}
