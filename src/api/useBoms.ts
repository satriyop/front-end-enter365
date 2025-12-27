import { useQuery } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'
import type { components } from './types'

// ============================================
// Types from OpenAPI spec
// ============================================

export type Bom = components['schemas']['BomResource']

export interface BomFilters {
  page?: number
  per_page?: number
  status?: 'draft' | 'active' | 'inactive'
  search?: string
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch paginated list of BOMs
 */
export function useBoms(filters: Ref<BomFilters>) {
  return useQuery({
    queryKey: computed(() => ['boms', filters.value]),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Bom>>('/boms', {
        params: filters.value
      })
      return response.data
    },
  })
}

/**
 * Fetch single BOM by ID
 */
export function useBom(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['bom', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: Bom }>(`/boms/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

/**
 * Fetch active BOMs for dropdown/select (lightweight)
 * Only returns active BOMs that can be used for quotations
 */
export function useActiveBoms() {
  return useQuery({
    queryKey: ['boms', 'active'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Bom>>('/boms', {
        params: {
          per_page: 100,
          status: 'active',
        }
      })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}
