import { createCrudHooks } from './factory'

export type AssetDepreciationMethod = 'linear' | 'degressive'
export type AssetDepreciationPeriod = 'month' | 'year'

export interface AssetModel {
  id: number
  code: string
  name: string
  method: AssetDepreciationMethod
  method_number: number
  method_period: AssetDepreciationPeriod
  method_progress_factor?: number | null
  salvage_value_percent: number
  asset_account_id: number
  depreciation_account_id: number
  expense_account_id: number
  journal_id?: number | null
  notes?: string | null
  is_active: boolean
}

export interface AssetModelFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export interface CreateAssetModelData {
  code: string
  name: string
  method: AssetDepreciationMethod
  method_number: number
  method_period: AssetDepreciationPeriod
  method_progress_factor?: number | null
  salvage_value_percent?: number
  asset_account_id: number
  depreciation_account_id: number
  expense_account_id: number
  journal_id?: number | null
  notes?: string | null
  is_active?: boolean
}

export type UpdateAssetModelData = Partial<CreateAssetModelData>

const hooks = createCrudHooks<AssetModel, AssetModelFilters, CreateAssetModelData, UpdateAssetModelData>({
  resourceName: 'asset-models',
  lookupParams: { is_active: true, per_page: 200 },
})

export const useAssetModels = hooks.useList
export const useAssetModel = hooks.useSingle
export const useCreateAssetModel = hooks.useCreate
export const useUpdateAssetModel = hooks.useUpdate
export const useDeleteAssetModel = hooks.useDelete
export const useAssetModelsLookup = hooks.useLookup
