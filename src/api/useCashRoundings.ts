import { createCrudHooks } from './factory'

export type CashRoundingStrategy = 'half_up' | 'up' | 'down'

export interface CashRounding {
  id: number
  name: string
  rounding: number
  strategy: CashRoundingStrategy
  profit_account_id?: number | null
  loss_account_id?: number | null
  is_active: boolean
  notes?: string | null
  profit_account?: { id: number; code: string; name: string } | null
  loss_account?: { id: number; code: string; name: string } | null
}

export interface CashRoundingFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export interface CreateCashRoundingData {
  name: string
  rounding: number
  strategy: CashRoundingStrategy
  profit_account_id?: number | null
  loss_account_id?: number | null
  is_active?: boolean
  notes?: string | null
}

export type UpdateCashRoundingData = Partial<CreateCashRoundingData>

const hooks = createCrudHooks<CashRounding, CashRoundingFilters, CreateCashRoundingData, UpdateCashRoundingData>({
  resourceName: 'cash-roundings',
  singularName: 'cashRounding',
})

export const useCashRoundings = hooks.useList
export const useCashRounding = hooks.useSingle
export const useCreateCashRounding = hooks.useCreate
export const useUpdateCashRounding = hooks.useUpdate
export const useDeleteCashRounding = hooks.useDelete
