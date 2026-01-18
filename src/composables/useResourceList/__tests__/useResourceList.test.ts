import { ref, type Ref } from 'vue'
import { describe, it, expect } from 'vitest'
import { useResourceList, type BaseFilters, type PaginationMeta } from '../index'

// ============================================
// Test Types & Helpers
// ============================================

interface TestResource {
  id: number
  name: string
}

interface TestFilters extends BaseFilters {
  page?: number
  per_page?: number
  search?: string
  status?: string
}

interface MockHookReturn {
  data: Ref<{ data: TestResource[]; meta: PaginationMeta } | undefined>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
}

/**
 * Creates a mock list hook that returns controlled query state
 */
function createMockListHook(options: {
  data?: TestResource[]
  meta?: PaginationMeta
  isLoading?: boolean
  error?: Error | null
} = {}): (filters: Ref<TestFilters>) => MockHookReturn {
  const defaultMeta: PaginationMeta = {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  }

  return () => ({
    data: ref(
      options.data !== undefined
        ? { data: options.data, meta: options.meta ?? defaultMeta }
        : undefined
    ),
    isLoading: ref(options.isLoading ?? false),
    error: ref(options.error ?? null),
  })
}

const mockResources: TestResource[] = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' },
]

const mockPagination: PaginationMeta = {
  current_page: 1,
  last_page: 3,
  per_page: 10,
  total: 25,
}

// ============================================
// Tests
// ============================================

describe('useResourceList', () => {
  describe('initialization', () => {
    it('initializes filters with provided initial values', () => {
      const initialFilters: TestFilters = {
        page: 1,
        per_page: 10,
        search: '',
        status: 'active',
      }

      const { filters } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters,
      })

      expect(filters.value).toEqual(initialFilters)
    })

    it('starts with empty items array when no data', () => {
      const { items } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook({ data: undefined }),
        initialFilters: { page: 1 },
      })

      expect(items.value).toEqual([])
    })

    it('exposes isLoading from the hook', () => {
      const { isLoading } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook({ isLoading: true }),
        initialFilters: { page: 1 },
      })

      expect(isLoading.value).toBe(true)
    })
  })

  describe('data fetching', () => {
    it('populates items when query succeeds', () => {
      const { items } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook({ data: mockResources }),
        initialFilters: { page: 1 },
      })

      expect(items.value).toEqual(mockResources)
      expect(items.value).toHaveLength(3)
    })

    it('sets pagination from response meta', () => {
      const { pagination } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook({
          data: mockResources,
          meta: mockPagination,
        }),
        initialFilters: { page: 1 },
      })

      expect(pagination.value).toEqual(mockPagination)
      expect(pagination.value?.current_page).toBe(1)
      expect(pagination.value?.last_page).toBe(3)
      expect(pagination.value?.total).toBe(25)
    })

    it('sets error when query fails', () => {
      const testError = new Error('API Error')
      const { error } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook({ error: testError }),
        initialFilters: { page: 1 },
      })

      expect(error.value).toBe(testError)
    })

    it('isEmpty is true when items array is empty and not loading', () => {
      const { isEmpty } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook({ data: [], isLoading: false }),
        initialFilters: { page: 1 },
      })

      expect(isEmpty.value).toBe(true)
    })

    it('isEmpty is false when loading', () => {
      const { isEmpty } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook({ data: [], isLoading: true }),
        initialFilters: { page: 1 },
      })

      expect(isEmpty.value).toBe(false)
    })

    it('isEmpty is false when items exist', () => {
      const { isEmpty } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook({ data: mockResources, isLoading: false }),
        initialFilters: { page: 1 },
      })

      expect(isEmpty.value).toBe(false)
    })
  })

  describe('filter management', () => {
    it('updateFilter updates the filter value', () => {
      const { filters, updateFilter } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters: { page: 1, search: '' },
      })

      updateFilter('search', 'test query')

      expect(filters.value.search).toBe('test query')
    })

    it('updateFilter resets page to 1 when non-page filter changes', () => {
      const { filters, updateFilter } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters: { page: 5, search: '', status: undefined },
      })

      // Simulate being on page 5
      expect(filters.value.page).toBe(5)

      // Update search filter
      updateFilter('search', 'new search')

      // Page should reset to 1
      expect(filters.value.page).toBe(1)
      expect(filters.value.search).toBe('new search')
    })

    it('updateFilter does not reset page when updating page itself', () => {
      const { filters, updateFilter } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters: { page: 1, search: '' },
      })

      updateFilter('page', 3)

      expect(filters.value.page).toBe(3)
    })

    it('resetFilters restores initial filter values', () => {
      const initialFilters: TestFilters = {
        page: 1,
        per_page: 10,
        search: '',
        status: 'active',
      }

      const { filters, updateFilter, resetFilters } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters,
      })

      // Modify filters
      updateFilter('search', 'modified')
      updateFilter('status', 'inactive')
      updateFilter('page', 5)

      expect(filters.value.search).toBe('modified')
      expect(filters.value.status).toBe('inactive')

      // Reset
      resetFilters()

      expect(filters.value).toEqual(initialFilters)
    })
  })

  describe('pagination', () => {
    it('goToPage updates page filter', () => {
      const { filters, goToPage } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters: { page: 1 },
      })

      goToPage(5)

      expect(filters.value.page).toBe(5)
    })

    it('nextPage increments page when not on last page', () => {
      const { filters, nextPage } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook({
          data: mockResources,
          meta: { current_page: 1, last_page: 3, per_page: 10, total: 25 },
        }),
        initialFilters: { page: 1 },
      })

      nextPage()

      expect(filters.value.page).toBe(2)
    })

    it('nextPage does nothing on last page', () => {
      const { filters, nextPage } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook({
          data: mockResources,
          meta: { current_page: 3, last_page: 3, per_page: 10, total: 25 },
        }),
        initialFilters: { page: 3 },
      })

      nextPage()

      expect(filters.value.page).toBe(3)
    })

    it('prevPage decrements page when not on first page', () => {
      const { filters, prevPage } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters: { page: 3 },
      })

      prevPage()

      expect(filters.value.page).toBe(2)
    })

    it('prevPage does nothing on first page', () => {
      const { filters, prevPage } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters: { page: 1 },
      })

      prevPage()

      expect(filters.value.page).toBe(1)
    })
  })

  describe('delete confirmation', () => {
    it('confirmDelete sets itemToDelete and opens modal', () => {
      const { deleteConfirmation } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters: { page: 1 },
      })

      expect(deleteConfirmation.showModal.value).toBe(false)
      expect(deleteConfirmation.itemToDelete.value).toBeNull()

      deleteConfirmation.confirmDelete(42)

      expect(deleteConfirmation.showModal.value).toBe(true)
      expect(deleteConfirmation.itemToDelete.value).toBe(42)
    })

    it('confirmDelete works with string ids', () => {
      const { deleteConfirmation } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters: { page: 1 },
      })

      deleteConfirmation.confirmDelete('abc-123')

      expect(deleteConfirmation.itemToDelete.value).toBe('abc-123')
    })

    it('cancelDelete clears itemToDelete and closes modal', () => {
      const { deleteConfirmation } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters: { page: 1 },
      })

      // First confirm delete
      deleteConfirmation.confirmDelete(42)
      expect(deleteConfirmation.showModal.value).toBe(true)

      // Then cancel
      deleteConfirmation.cancelDelete()

      expect(deleteConfirmation.showModal.value).toBe(false)
      expect(deleteConfirmation.itemToDelete.value).toBeNull()
    })

    it('executeDelete returns item id and closes modal', () => {
      const { deleteConfirmation } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters: { page: 1 },
      })

      deleteConfirmation.confirmDelete(42)

      const deletedId = deleteConfirmation.executeDelete()

      expect(deletedId).toBe(42)
      expect(deleteConfirmation.showModal.value).toBe(false)
      expect(deleteConfirmation.itemToDelete.value).toBeNull()
    })

    it('executeDelete returns null when no item selected', () => {
      const { deleteConfirmation } = useResourceList<TestResource, TestFilters>({
        useListHook: createMockListHook(),
        initialFilters: { page: 1 },
      })

      const deletedId = deleteConfirmation.executeDelete()

      expect(deletedId).toBeNull()
    })
  })
})
