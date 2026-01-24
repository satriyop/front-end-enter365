import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref, type ComputedRef } from 'vue'
import { api, type PaginatedResponse } from '../client'
import type { CrudHooksConfig, BaseFilters } from './types'

/**
 * Clean params by removing empty strings, undefined, and null values
 */
function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  )
}

/**
 * Factory function to create standardized CRUD hooks for a resource
 */
export function createCrudHooks<
  TResource extends { id: number | string },
  TFilters extends BaseFilters,
  TCreateData,
  TUpdateData = Partial<TCreateData>
>(config: CrudHooksConfig) {
  const {
    resourceName,
    endpoint = `/${resourceName}`,
    singularName = resourceName.endsWith('s') ? resourceName.slice(0, -1) : resourceName,
    lookupStaleTime = 5 * 60 * 1000,
    lookupParams = {},
  } = config

  return {
    /**
     * Fetch paginated list with filters
     */
    useList(filters: Ref<TFilters>) {
      return useQuery({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryKey: computed(() => [resourceName, filters.value]) as any,
        queryFn: async () => {
          const params = cleanParams(filters.value as Record<string, unknown>)
          
          if (Array.isArray(params.include)) {
            params.include = params.include.join(',')
          }

          const response = await api.get<PaginatedResponse<TResource>>(endpoint, {
            params,
          })
          return response.data
        },
      })
    },

    /**
     * Fetch single item by ID
     */
    useSingle(
      id: Ref<number | string | null | undefined> | ComputedRef<number | string | null | undefined>,
      filters?: Ref<TFilters>
    ) {
      return useQuery({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryKey: computed(() => [singularName, id.value, filters?.value]) as any,
        queryFn: async () => {
          if (!id.value) return null
          
          const params = filters?.value 
            ? cleanParams(filters.value as Record<string, unknown>)
            : {}

          if (Array.isArray(params.include)) {
            params.include = params.include.join(',')
          }

          const response = await api.get<{ data: TResource }>(`${endpoint}/${id.value}`, {
            params
          })
          return response.data.data
        },
        enabled: computed(() => !!id.value),
      })
    },

    /**
     * Fetch lightweight list for dropdowns/selects
     */
    useLookup(params: Record<string, unknown> = {}) {
      return useQuery({
        queryKey: [resourceName, 'lookup', { ...lookupParams, ...params }] as const,
        queryFn: async () => {
          const response = await api.get<PaginatedResponse<TResource>>(endpoint, {
            params: cleanParams({ per_page: 500, ...lookupParams, ...params }),
          })
          return response.data.data
        },
        staleTime: lookupStaleTime,
      })
    },

    /**
     * Create new item
     */
    useCreate() {
      const queryClient = useQueryClient()
      return useMutation({
        mutationFn: async (data: TCreateData) => {
          const response = await api.post<{ data: TResource }>(endpoint, data)
          return response.data.data
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: [resourceName] })
        },
      })
    },

    /**
     * Update existing item
     */
    useUpdate() {
      const queryClient = useQueryClient()
      return useMutation({
        mutationFn: async ({ id, data }: { id: number | string; data: TUpdateData }) => {
          const response = await api.put<{ data: TResource }>(`${endpoint}/${id}`, data)
          return response.data.data
        },
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: [resourceName] })
          queryClient.setQueryData([singularName, data.id], data)
        },
      })
    },

    /**
     * Delete item
     */
    useDelete() {
      const queryClient = useQueryClient()
      return useMutation({
        mutationFn: async (id: number | string) => {
          await api.delete(`${endpoint}/${id}`)
          return id
        },
        onSuccess: (id) => {
          queryClient.invalidateQueries({ queryKey: [resourceName] })
          queryClient.removeQueries({ queryKey: [singularName, id] })
        },
      })
    },
  }
}