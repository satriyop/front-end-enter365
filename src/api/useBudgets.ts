import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import type { Ref } from 'vue'
import { computed } from 'vue'
import type { components } from './types'

// ─────────────────────────────────────────────────────────────
// Types (from Scramble-generated schemas)
// ─────────────────────────────────────────────────────────────

export type Budget = components['schemas']['BudgetResource']
export type BudgetLine = components['schemas']['BudgetLineResource']
export type BudgetStatus = components['schemas']['BudgetStatus']
export type CreateBudgetData = components['schemas']['StoreBudgetRequest']
export type UpdateBudgetData = components['schemas']['UpdateBudgetRequest']
export type CreateBudgetLineData = components['schemas']['StoreBudgetLineRequest']
export type UpdateBudgetLineData = components['schemas']['UpdateBudgetLineRequest']

export interface BudgetFilters {
  page?: number
  per_page?: number
  search?: string
  status?: BudgetStatus | ''
  fiscal_period_id?: number | ''
}

export interface BudgetComparison {
  account_id: number
  account_code: string
  account_name: string
  budgeted: number
  actual: number
  variance: number
  variance_percentage: number
  is_over_budget: boolean
}

export interface BudgetComparisonReport {
  budget: Budget
  comparison: BudgetComparison[]
  totals: {
    total_budgeted: number
    total_actual: number
    total_variance: number
  }
}

export interface MonthlyBreakdown {
  account_id: number
  account_code: string
  account_name: string
  annual_amount: number
  jan: number
  feb: number
  mar: number
  apr: number
  may: number
  jun: number
  jul: number
  aug: number
  sep: number
  oct: number
  nov: number
  dec: number
}

export interface MonthlyBreakdownReport {
  budget: Budget
  breakdown: MonthlyBreakdown[]
}

export interface OverBudgetAccount {
  account_id: number
  account_code: string
  account_name: string
  budgeted: number
  actual: number
  over_by: number
  over_percentage: number
}

// ─────────────────────────────────────────────────────────────
// List and Single Fetch Hooks
// ─────────────────────────────────────────────────────────────

export function useBudgets(filters: Ref<BudgetFilters>) {
  return useQuery({
    queryKey: ['budgets', filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {}
      if (filters.value.page) params.page = filters.value.page
      if (filters.value.per_page) params.per_page = filters.value.per_page
      if (filters.value.search) params.search = filters.value.search
      if (filters.value.status) params.status = filters.value.status
      if (filters.value.fiscal_period_id) params.fiscal_period_id = filters.value.fiscal_period_id

      const response = await api.get<{
        data: Budget[]
        meta: { current_page: number; last_page: number; per_page: number; total: number }
      }>('/budgets', { params })
      return response.data
    },
    staleTime: 30 * 1000,
  })
}

export function useBudget(id: Ref<number | string | undefined>) {
  return useQuery({
    queryKey: ['budgets', id],
    queryFn: async () => {
      const response = await api.get<{ data: Budget }>(`/budgets/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value),
  })
}

export function useBudgetComparison(id: Ref<number | string | undefined>) {
  return useQuery({
    queryKey: ['budgets', id, 'comparison'],
    queryFn: async () => {
      const response = await api.get<{ data: BudgetComparisonReport }>(`/budgets/${id.value}/comparison`)
      return response.data.data
    },
    enabled: computed(() => !!id.value),
    staleTime: 60 * 1000,
  })
}

export function useBudgetMonthlyBreakdown(id: Ref<number | string | undefined>) {
  return useQuery({
    queryKey: ['budgets', id, 'monthly-breakdown'],
    queryFn: async () => {
      const response = await api.get<{ data: MonthlyBreakdownReport }>(`/budgets/${id.value}/monthly-breakdown`)
      return response.data.data
    },
    enabled: computed(() => !!id.value),
    staleTime: 60 * 1000,
  })
}

export function useBudgetOverBudget(id: Ref<number | string | undefined>) {
  return useQuery({
    queryKey: ['budgets', id, 'over-budget'],
    queryFn: async () => {
      const response = await api.get<{ data: OverBudgetAccount[] }>(`/budgets/${id.value}/over-budget`)
      return response.data.data
    },
    enabled: computed(() => !!id.value),
    staleTime: 60 * 1000,
  })
}

// ─────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────

export function useCreateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBudgetData) => {
      const response = await api.post<{ data: Budget }>('/budgets', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: UpdateBudgetData }) => {
      const response = await api.put<{ data: Budget }>(`/budgets/${id}`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.id] })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.delete(`/budgets/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Budget Line Mutations
// ─────────────────────────────────────────────────────────────

export function useCreateBudgetLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ budgetId, data }: { budgetId: number | string; data: CreateBudgetLineData }) => {
      const response = await api.post<{ data: BudgetLine }>(`/budgets/${budgetId}/lines`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.budgetId] })
    },
  })
}

export function useUpdateBudgetLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      budgetId,
      lineId,
      data,
    }: {
      budgetId: number | string
      lineId: number | string
      data: UpdateBudgetLineData
    }) => {
      const response = await api.put<{ data: BudgetLine }>(`/budgets/${budgetId}/lines/${lineId}`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.budgetId] })
    },
  })
}

export function useDeleteBudgetLine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ budgetId, lineId }: { budgetId: number | string; lineId: number | string }) => {
      await api.delete(`/budgets/${budgetId}/lines/${lineId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets', variables.budgetId] })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Status Transition Mutations
// ─────────────────────────────────────────────────────────────

export function useApproveBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Budget }>(`/budgets/${id}/approve`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budgets', id] })
    },
  })
}

export function useReopenBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Budget }>(`/budgets/${id}/reopen`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budgets', id] })
    },
  })
}

export function useCloseBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Budget }>(`/budgets/${id}/close`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budgets', id] })
    },
  })
}

export function useCopyBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, fiscalPeriodId }: { id: number | string; fiscalPeriodId: number }) => {
      const response = await api.post<{ data: Budget }>(`/budgets/${id}/copy`, {
        fiscal_period_id: fiscalPeriodId,
      })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}
