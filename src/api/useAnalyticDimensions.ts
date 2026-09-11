import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { createCrudHooks } from './factory'
import { api } from './client'

export interface AnalyticPlan {
  id: number
  code: string
  name: string
  parent_id?: number | null
  default_applicability: 'optional' | 'mandatory' | 'unavailable'
  is_active: boolean
  notes?: string | null
  analytic_accounts_count?: number
  parent?: { id: number; code: string; name: string } | null
}

export interface AnalyticPlanFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export interface CreateAnalyticPlanData {
  code: string
  name: string
  parent_id?: number | null
  default_applicability?: AnalyticPlan['default_applicability']
  is_active?: boolean
  notes?: string | null
}

export type UpdateAnalyticPlanData = Partial<CreateAnalyticPlanData>

const planHooks = createCrudHooks<AnalyticPlan, AnalyticPlanFilters, CreateAnalyticPlanData, UpdateAnalyticPlanData>({
  resourceName: 'analytic-plans',
  singularName: 'analytic-plan',
  lookupParams: { is_active: true, per_page: 200 },
})

export const useAnalyticPlans = planHooks.useList
export const useAnalyticPlan = planHooks.useSingle
export const useCreateAnalyticPlan = planHooks.useCreate
export const useUpdateAnalyticPlan = planHooks.useUpdate
export const useDeleteAnalyticPlan = planHooks.useDelete
export const useAnalyticPlansLookup = planHooks.useLookup

export interface AnalyticDistributionModel {
  id: number
  name: string
  partner_id?: number | null
  account_prefix?: string | null
  product_id?: number | null
  analytic_distribution: Record<string, number> | null
  sequence: number
  is_active: boolean
  partner?: { id: number; name: string } | null
}

export interface AnalyticDistributionModelFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export interface CreateAnalyticDistributionModelData {
  name: string
  partner_id?: number | null
  account_prefix?: string | null
  product_id?: number | null
  analytic_distribution: Record<string, number>
  sequence?: number
  is_active?: boolean
}

export type UpdateAnalyticDistributionModelData = Partial<CreateAnalyticDistributionModelData>

const modelHooks = createCrudHooks<
  AnalyticDistributionModel,
  AnalyticDistributionModelFilters,
  CreateAnalyticDistributionModelData,
  UpdateAnalyticDistributionModelData
>({
  resourceName: 'analytic-distribution-models',
  singularName: 'analytic-distribution-model',
})

export const useAnalyticDistributionModels = modelHooks.useList
export const useAnalyticDistributionModel = modelHooks.useSingle
export const useCreateAnalyticDistributionModel = modelHooks.useCreate
export const useUpdateAnalyticDistributionModel = modelHooks.useUpdate
export const useDeleteAnalyticDistributionModel = modelHooks.useDelete

export interface AnalyticItem {
  id: string
  journal_entry_id: number
  entry_number?: string | null
  entry_date?: string | null
  analytic_account_id: number
  amount: number
  percentage: number
  description?: string | null
  analytic_account?: { id: number; code: string; name: string } | null
  account?: { id: number; code: string; name: string } | null
}

export interface AnalyticItemFilters {
  page?: number
  per_page?: number
  analytic_account_id?: number | string
  from?: string
  to?: string
}

export function useAnalyticItems(filters: Ref<AnalyticItemFilters>) {
  return useQuery({
    queryKey: computed(() => ['analytic-items', filters.value]),
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters.value).filter(([, value]) => value !== '' && value != null),
      )
      const response = await api.get<{ data: AnalyticItem[]; meta?: { total: number } }>(
        '/analytic-items',
        { params },
      )
      return response.data
    },
  })
}

export interface AnalyticBudgetLine {
  id?: number
  analytic_account_id: number
  planned_amount: number
  actual_amount?: number
  variance?: number
  analytic_account?: { id: number; code: string; name: string } | null
}

export interface AnalyticBudget {
  id: number
  name: string
  date_from: string
  date_to: string
  status: 'draft' | 'open' | 'closed'
  notes?: string | null
  lines?: AnalyticBudgetLine[]
}

export interface AnalyticBudgetFilters {
  page?: number
  per_page?: number
  search?: string
  status?: string
}

export interface CreateAnalyticBudgetData {
  name: string
  date_from: string
  date_to: string
  notes?: string | null
  status?: AnalyticBudget['status']
  lines: { analytic_account_id: number; planned_amount: number }[]
}

export type UpdateAnalyticBudgetData = Partial<CreateAnalyticBudgetData>

const budgetHooks = createCrudHooks<AnalyticBudget, AnalyticBudgetFilters, CreateAnalyticBudgetData, UpdateAnalyticBudgetData>({
  resourceName: 'analytic-budgets',
  singularName: 'analytic-budget',
})

export const useAnalyticBudgets = budgetHooks.useList
export const useAnalyticBudget = budgetHooks.useSingle
export const useCreateAnalyticBudget = budgetHooks.useCreate
export const useUpdateAnalyticBudget = budgetHooks.useUpdate
export const useDeleteAnalyticBudget = budgetHooks.useDelete
