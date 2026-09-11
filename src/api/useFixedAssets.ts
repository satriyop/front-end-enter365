import { computed, type Ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { createCrudHooks } from './factory'
import { api } from './client'
import type { AssetDepreciationMethod, AssetDepreciationPeriod } from './useAssetModels'

export interface AssetDepreciationLine {
  id: number
  fixed_asset_id: number
  sequence: number
  depreciation_date: string
  amount: number
  depreciated_value: number
  remaining_value: number
  status: 'draft' | 'posted'
  journal_entry_id?: number | null
  asset?: { id: number; code: string; name: string } | null
}

export interface FixedAsset {
  id: number
  code: string
  name: string
  asset_model_id?: number | null
  original_value: number
  salvage_value: number
  acquisition_date: string
  method: AssetDepreciationMethod
  method_number: number
  method_period: AssetDepreciationPeriod
  method_progress_factor?: number | null
  asset_account_id: number
  depreciation_account_id: number
  expense_account_id: number
  journal_id?: number | null
  status: 'draft' | 'running' | 'closed'
  accumulated_depreciation: number
  book_value: number
  notes?: string | null
  asset_model?: { id: number; code: string; name: string } | null
  depreciation_lines?: AssetDepreciationLine[]
}

export interface FixedAssetFilters {
  page?: number
  per_page?: number
  search?: string
  status?: string
}

export interface CreateFixedAssetData {
  code: string
  name: string
  asset_model_id?: number | null
  original_value: number
  salvage_value?: number
  acquisition_date: string
  method?: AssetDepreciationMethod
  method_number?: number
  method_period?: AssetDepreciationPeriod
  asset_account_id?: number
  depreciation_account_id?: number
  expense_account_id?: number
  notes?: string | null
}

export type UpdateFixedAssetData = Partial<CreateFixedAssetData>

const hooks = createCrudHooks<FixedAsset, FixedAssetFilters, CreateFixedAssetData, UpdateFixedAssetData>({
  resourceName: 'assets',
  singularName: 'asset',
})

export const useFixedAssets = hooks.useList
export const useFixedAsset = hooks.useSingle
export const useCreateFixedAsset = hooks.useCreate
export const useUpdateFixedAsset = hooks.useUpdate
export const useDeleteFixedAsset = hooks.useDelete

export function useConfirmFixedAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: FixedAsset }>(`/assets/${id}/confirm`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['depreciation-schedule'] })
    },
  })
}

export function usePostAssetDepreciation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: FixedAsset }>(`/assets/${id}/post-depreciation`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      queryClient.invalidateQueries({ queryKey: ['depreciation-schedule'] })
    },
  })
}

export interface DepreciationScheduleFilters {
  page?: number
  per_page?: number
  status?: string
  from?: string
  to?: string
}

export function useDepreciationSchedule(filters: Ref<DepreciationScheduleFilters>) {
  return useQuery({
    queryKey: computed(() => ['depreciation-schedule', filters.value]),
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters.value).filter(([, value]) => value !== '' && value != null),
      )
      const response = await api.get<{ data: AssetDepreciationLine[]; meta?: { total: number; current_page: number; last_page: number; per_page: number } }>(
        '/depreciation-schedule',
        { params },
      )
      return response.data
    },
  })
}
