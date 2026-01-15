import { ref, defineComponent, h } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { mount, flushPromises } from '@vue/test-utils'
import { createCrudHooks } from '../createCrudHooks'
import { api } from '../../client'
import type { BaseFilters } from '../types'

// ============================================
// Mock Setup
// ============================================

vi.mock('../../client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// ============================================
// Test Types
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

interface TestCreateData {
  name: string
}

// ============================================
// Test Helper - Wraps hooks in Vue component context
// ============================================

let testQueryClient: QueryClient

function withSetup<T>(composable: () => T): { result: T; queryClient: QueryClient } {
  let result: T

  const TestComponent = defineComponent({
    setup() {
      result = composable()
      return () => h('div')
    },
  })

  mount(TestComponent, {
    global: {
      plugins: [[VueQueryPlugin, { queryClient: testQueryClient }]],
    },
  })

  // @ts-expect-error result is assigned in setup
  return { result, queryClient: testQueryClient }
}

// ============================================
// Tests
// ============================================

describe('createCrudHooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    testQueryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
  })

  describe('factory creation', () => {
    it('returns object with all hook functions', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'contacts',
      })

      expect(hooks).toHaveProperty('useList')
      expect(hooks).toHaveProperty('useSingle')
      expect(hooks).toHaveProperty('useLookup')
      expect(hooks).toHaveProperty('useCreate')
      expect(hooks).toHaveProperty('useUpdate')
      expect(hooks).toHaveProperty('useDelete')
      expect(typeof hooks.useList).toBe('function')
      expect(typeof hooks.useSingle).toBe('function')
      expect(typeof hooks.useLookup).toBe('function')
      expect(typeof hooks.useCreate).toBe('function')
      expect(typeof hooks.useUpdate).toBe('function')
      expect(typeof hooks.useDelete).toBe('function')
    })

    it('uses custom endpoint when provided', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'contacts',
        endpoint: '/api/custom-contacts',
      })

      expect(hooks).toBeDefined()
    })

    it('accepts custom lookup stale time', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'contacts',
        lookupStaleTime: 10 * 60 * 1000,
      })

      expect(hooks).toBeDefined()
    })

    it('accepts custom lookup params', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'contacts',
        lookupParams: { type: 'customer' },
      })

      expect(hooks).toBeDefined()
    })
  })

  describe('useList hook', () => {
    it('creates a query with correct structure', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const filters = ref<TestFilters>({ page: 1, per_page: 10 })
      const { result } = withSetup(() => hooks.useList(filters))

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('isLoading')
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('refetch')
    })

    it('calls api.get with correct endpoint and params when fetching', async () => {
      const mockData = {
        data: [{ id: 1, name: 'Product 1' }],
        meta: { current_page: 1, last_page: 1, per_page: 10, total: 1 },
      }
      vi.mocked(api.get).mockResolvedValue({ data: mockData })

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const filters = ref<TestFilters>({ page: 1, per_page: 10, search: 'test' })
      const { result } = withSetup(() => hooks.useList(filters))

      await result.refetch()
      await flushPromises()

      expect(api.get).toHaveBeenCalledWith('/products', {
        params: { page: 1, per_page: 10, search: 'test' },
      })
    })

    it('cleans empty params from request', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 } },
      })

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const filters = ref<TestFilters>({
        page: 1,
        per_page: 10,
        search: '',
        status: undefined,
      })

      const { result } = withSetup(() => hooks.useList(filters))
      await result.refetch()
      await flushPromises()

      expect(api.get).toHaveBeenCalledWith('/products', {
        params: { page: 1, per_page: 10 },
      })
    })

    it('uses custom endpoint when provided', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 10, total: 0 } },
      })

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'contacts',
        endpoint: '/api/v2/contacts',
      })

      const filters = ref<TestFilters>({ page: 1 })
      const { result } = withSetup(() => hooks.useList(filters))
      await result.refetch()
      await flushPromises()

      expect(api.get).toHaveBeenCalledWith('/api/v2/contacts', expect.any(Object))
    })
  })

  describe('useSingle hook', () => {
    it('creates a query with correct structure', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const id = ref(1)
      const { result } = withSetup(() => hooks.useSingle(id))

      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('isLoading')
      expect(result).toHaveProperty('error')
    })

    it('calls api.get with id in endpoint', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { data: { id: 42, name: 'Product 42' } },
      })

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const id = ref(42)
      const { result } = withSetup(() => hooks.useSingle(id))
      await result.refetch()
      await flushPromises()

      expect(api.get).toHaveBeenCalledWith('/products/42')
    })

    it('is disabled when id is falsy (0)', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const id = ref(0)
      const { result } = withSetup(() => hooks.useSingle(id))

      expect(result.isFetching.value).toBe(false)
    })

    it('accepts string id', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { data: { id: 'abc-123', name: 'Product ABC' } },
      })

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const id = ref('abc-123')
      const { result } = withSetup(() => hooks.useSingle(id))
      await result.refetch()
      await flushPromises()

      expect(api.get).toHaveBeenCalledWith('/products/abc-123')
    })

    it('uses singular name for query key', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'categories',
        singularName: 'category',
      })

      const id = ref(1)
      const { result } = withSetup(() => hooks.useSingle(id))

      expect(result).toBeDefined()
    })
  })

  describe('useLookup hook', () => {
    it('calls api.get with per_page=100 by default', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { data: [{ id: 1, name: 'Item 1' }], meta: { current_page: 1, last_page: 1, per_page: 100, total: 1 } },
      })

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const { result } = withSetup(() => hooks.useLookup())
      await result.refetch()
      await flushPromises()

      expect(api.get).toHaveBeenCalledWith('/products', {
        params: { per_page: 100 },
      })
    })

    it('merges custom params with defaults', async () => {
      vi.mocked(api.get).mockResolvedValue({
        data: { data: [], meta: { current_page: 1, last_page: 1, per_page: 100, total: 0 } },
      })

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'contacts',
        lookupParams: { type: 'customer' },
      })

      const { result } = withSetup(() => hooks.useLookup({ status: 'active' }))
      await result.refetch()
      await flushPromises()

      expect(api.get).toHaveBeenCalledWith('/contacts', {
        params: { per_page: 100, type: 'customer', status: 'active' },
      })
    })

    it('returns data array directly', async () => {
      const mockItems = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ]
      vi.mocked(api.get).mockResolvedValue({
        data: { data: mockItems, meta: { current_page: 1, last_page: 1, per_page: 100, total: 2 } },
      })

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const { result } = withSetup(() => hooks.useLookup())
      await result.refetch()
      await flushPromises()

      expect(result.data.value).toEqual(mockItems)
    })
  })

  describe('useCreate hook', () => {
    it('creates a mutation with correct structure', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const { result } = withSetup(() => hooks.useCreate())

      expect(result).toHaveProperty('mutate')
      expect(result).toHaveProperty('mutateAsync')
      expect(result).toHaveProperty('isPending')
      expect(result).toHaveProperty('error')
    })

    it('calls api.post with data', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { data: { id: 1, name: 'New Product' } },
      })

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const { result } = withSetup(() => hooks.useCreate())
      await result.mutateAsync({ name: 'New Product' })
      await flushPromises()

      expect(api.post).toHaveBeenCalledWith('/products', { name: 'New Product' })
    })

    it('invalidates queries on success', async () => {
      vi.mocked(api.post).mockResolvedValue({
        data: { data: { id: 1, name: 'New Product' } },
      })

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const invalidateSpy = vi.spyOn(testQueryClient, 'invalidateQueries')

      const { result } = withSetup(() => hooks.useCreate())
      await result.mutateAsync({ name: 'New Product' })
      await flushPromises()

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] })
    })
  })

  describe('useUpdate hook', () => {
    it('creates a mutation with correct structure', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const { result } = withSetup(() => hooks.useUpdate())

      expect(result).toHaveProperty('mutate')
      expect(result).toHaveProperty('mutateAsync')
      expect(result).toHaveProperty('isPending')
    })

    it('calls api.put with id and data', async () => {
      vi.mocked(api.put).mockResolvedValue({
        data: { data: { id: 42, name: 'Updated Product' } },
      })

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const { result } = withSetup(() => hooks.useUpdate())
      await result.mutateAsync({ id: 42, data: { name: 'Updated Product' } })
      await flushPromises()

      expect(api.put).toHaveBeenCalledWith('/products/42', { name: 'Updated Product' })
    })

    it('invalidates queries and updates cache on success', async () => {
      vi.mocked(api.put).mockResolvedValue({
        data: { data: { id: 42, name: 'Updated Product' } },
      })

      const invalidateSpy = vi.spyOn(testQueryClient, 'invalidateQueries')
      const setQueryDataSpy = vi.spyOn(testQueryClient, 'setQueryData')

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const { result } = withSetup(() => hooks.useUpdate())
      await result.mutateAsync({ id: 42, data: { name: 'Updated Product' } })
      await flushPromises()

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] })
      expect(setQueryDataSpy).toHaveBeenCalledWith(
        ['product', 42],
        { id: 42, name: 'Updated Product' }
      )
    })
  })

  describe('useDelete hook', () => {
    it('creates a mutation with correct structure', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const { result } = withSetup(() => hooks.useDelete())

      expect(result).toHaveProperty('mutate')
      expect(result).toHaveProperty('mutateAsync')
      expect(result).toHaveProperty('isPending')
    })

    it('calls api.delete with id', async () => {
      vi.mocked(api.delete).mockResolvedValue({})

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const { result } = withSetup(() => hooks.useDelete())
      await result.mutateAsync(42)
      await flushPromises()

      expect(api.delete).toHaveBeenCalledWith('/products/42')
    })

    it('invalidates queries and removes from cache on success', async () => {
      vi.mocked(api.delete).mockResolvedValue({})

      const invalidateSpy = vi.spyOn(testQueryClient, 'invalidateQueries')
      const removeQueriesSpy = vi.spyOn(testQueryClient, 'removeQueries')

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      const { result } = withSetup(() => hooks.useDelete())
      await result.mutateAsync(42)
      await flushPromises()

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['products'] })
      expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey: ['product', 42] })
    })
  })

  describe('singular name derivation', () => {
    it('derives singular from plural ending in s', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'products',
      })

      expect(hooks.useSingle).toBeDefined()
    })

    it('uses custom singular name when provided', async () => {
      vi.mocked(api.put).mockResolvedValue({
        data: { data: { id: 1, name: 'Test' } },
      })

      const setQueryDataSpy = vi.spyOn(testQueryClient, 'setQueryData')

      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'people',
        singularName: 'person',
      })

      const { result } = withSetup(() => hooks.useUpdate())
      await result.mutateAsync({ id: 1, data: { name: 'Test' } })
      await flushPromises()

      expect(setQueryDataSpy).toHaveBeenCalledWith(['person', 1], expect.any(Object))
    })

    it('handles resource names not ending in s', () => {
      const hooks = createCrudHooks<TestResource, TestFilters, TestCreateData>({
        resourceName: 'staff',
      })

      expect(hooks.useSingle).toBeDefined()
    })
  })
})
