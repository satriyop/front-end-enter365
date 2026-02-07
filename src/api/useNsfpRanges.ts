import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { createCrudHooks } from './factory'
import { api } from './client'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type NsfpRange = components['schemas']['NsfpRangeResource']
export type CreateNsfpRangeData = components['schemas']['StoreNsfpRangeRequest']
export type UpdateNsfpRangeData = components['schemas']['UpdateNsfpRangeRequest']

export interface NsfpRangeFilters {
  page?: number
  per_page?: number
  year_code?: string
  is_active?: boolean
}

export interface NsfpUtilizationSummary {
  total_ranges: number
  active_ranges: number
  total_capacity: string
  total_used: string
  total_remaining: string
  utilization_percent: number
}

export interface NsfpUtilizationResponse {
  summary: NsfpUtilizationSummary
  ranges: NsfpRange[]
}

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<NsfpRange, NsfpRangeFilters, CreateNsfpRangeData, UpdateNsfpRangeData>({
  resourceName: 'nsfp-ranges',
})

export const useNsfpRanges = hooks.useList
export const useNsfpRange = hooks.useSingle
export const useCreateNsfpRange = hooks.useCreate
export const useUpdateNsfpRange = hooks.useUpdate
export const useDeleteNsfpRange = hooks.useDelete

// ============================================
// Custom Hooks
// ============================================

/**
 * Deactivate an NSFP range
 */
export function useDeactivateNsfpRange() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: NsfpRange }>(
        `/nsfp-ranges/${id}/deactivate`
      )
      return response.data.data
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['nsfp-ranges'] })
      queryClient.invalidateQueries({ queryKey: ['nsfp-range', id] })
      queryClient.invalidateQueries({ queryKey: ['nsfp-ranges-utilization'] })
    },
  })
}

/**
 * Fetch NSFP utilization summary
 */
export function useNsfpUtilization(yearCode?: Ref<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['nsfp-ranges-utilization', yearCode?.value]),
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (yearCode?.value) {
        params.year_code = yearCode.value
      }
      const response = await api.get<NsfpUtilizationResponse>(
        '/nsfp-ranges-utilization',
        { params }
      )
      return response.data
    },
  })
}
