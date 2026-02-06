/**
 * MRP (Material Requirements Planning) API hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref, type ComputedRef, toValue, type MaybeRef } from 'vue'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type MrpRun = components['schemas']['MrpRunResource']
export type MrpDemand = components['schemas']['MrpDemandResource']
export type MrpSuggestion = components['schemas']['MrpSuggestionResource']

export type CreateMrpRunData = components['schemas']['StoreMrpRunRequest']
export type UpdateMrpSuggestionData = components['schemas']['UpdateMrpSuggestionRequest']

export interface MrpRunFilters {
  page?: number
  per_page?: number
  status?: string
  search?: string
  include?: string[]
}

export interface MrpSuggestionFilters {
  suggestion_type?: 'purchase' | 'work_order' | 'subcontract'
  status?: 'pending' | 'accepted' | 'rejected' | 'converted'
}

export interface MrpStatistics {
  total_runs: number
  draft_runs: number
  completed_runs: number
  total_suggestions: number
  pending_suggestions: number
  converted_suggestions: number
}

export interface MrpShortageItem {
  product_id: number
  product_sku: string
  product_name: string
  required_qty: number
  available_qty: number
  shortage_qty: number
  suggested_action: string
}

export interface MrpShortageReport {
  items: MrpShortageItem[]
  summary: {
    total_shortages: number
    total_shortage_value: number
  }
}

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<MrpRun, MrpRunFilters, CreateMrpRunData>({
  resourceName: 'mrp-runs',
  singularName: 'mrp-run',
})

export const useMrpRuns = hooks.useList
export const useMrpRun = hooks.useSingle
export const useCreateMrpRun = hooks.useCreate
export const useUpdateMrpRun = hooks.useUpdate
export const useDeleteMrpRun = hooks.useDelete

// ============================================
// Execute MRP Run
// ============================================

export function useExecuteMrpRun() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: MrpRun }>(`/mrp-runs/${id}/execute`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mrp-runs'] })
      queryClient.invalidateQueries({ queryKey: ['mrp-run', data.id] })
    },
  })
}

// ============================================
// MRP Run Demands
// ============================================

export function useMrpRunDemands(
  id: Ref<number | string | null | undefined> | ComputedRef<number | string | null | undefined>
) {
  return useQuery({
    queryKey: computed(() => ['mrp-run', id.value, 'demands']),
    queryFn: async () => {
      const value = toValue(id)
      if (!value) return []
      const response = await api.get<{ data: MrpDemand[] }>(`/mrp-runs/${value}/demands`)
      return response.data.data
    },
    enabled: computed(() => !!toValue(id)),
  })
}

// ============================================
// MRP Run Suggestions
// ============================================

export function useMrpRunSuggestions(
  id: Ref<number | string | null | undefined> | ComputedRef<number | string | null | undefined>,
  filters?: Ref<MrpSuggestionFilters>
) {
  return useQuery({
    queryKey: computed(() => ['mrp-run', id.value, 'suggestions', filters?.value]),
    queryFn: async () => {
      const value = toValue(id)
      if (!value) return []
      const params: Record<string, unknown> = {}
      if (filters?.value?.suggestion_type) params.suggestion_type = filters.value.suggestion_type
      if (filters?.value?.status) params.status = filters.value.status

      const response = await api.get<{ data: MrpSuggestion[] }>(`/mrp-runs/${value}/suggestions`, { params })
      return response.data.data
    },
    enabled: computed(() => !!toValue(id)),
  })
}

// ============================================
// Suggestion Actions
// ============================================

export function useAcceptSuggestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number | string; reason?: string }) => {
      const response = await api.post<{ data: MrpSuggestion }>(
        `/mrp-suggestions/${id}/accept`,
        { reason }
      )
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mrp-runs'] })
      queryClient.invalidateQueries({ queryKey: ['mrp-run', data.mrp_run_id] })
    },
  })
}

export function useRejectSuggestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number | string; reason?: string }) => {
      const response = await api.post<{ data: MrpSuggestion }>(
        `/mrp-suggestions/${id}/reject`,
        { reason }
      )
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mrp-runs'] })
      queryClient.invalidateQueries({ queryKey: ['mrp-run', data.mrp_run_id] })
    },
  })
}

export function useUpdateSuggestion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: UpdateMrpSuggestionData }) => {
      const response = await api.put<{ data: MrpSuggestion }>(`/mrp-suggestions/${id}`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mrp-run', data.mrp_run_id] })
    },
  })
}

// ============================================
// Convert Suggestions
// ============================================

export function useConvertToPO() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: MrpSuggestion; purchase_order_id: number }>(
        `/mrp-suggestions/${id}/convert-to-po`
      )
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mrp-runs'] })
      queryClient.invalidateQueries({ queryKey: ['mrp-run', data.data.mrp_run_id] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}

export function useConvertToWO() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: MrpSuggestion; work_order_id: number }>(
        `/mrp-suggestions/${id}/convert-to-wo`
      )
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mrp-runs'] })
      queryClient.invalidateQueries({ queryKey: ['mrp-run', data.data.mrp_run_id] })
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}

export function useConvertToScWO() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: MrpSuggestion; subcontractor_work_order_id: number }>(
        `/mrp-suggestions/${id}/convert-to-sc-wo`
      )
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mrp-runs'] })
      queryClient.invalidateQueries({ queryKey: ['mrp-run', data.data.mrp_run_id] })
      queryClient.invalidateQueries({ queryKey: ['subcontractor-work-orders'] })
    },
  })
}

// ============================================
// Bulk Actions
// ============================================

export function useBulkAcceptSuggestions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (ids: (number | string)[]) => {
      const response = await api.post<{ data: MrpSuggestion[] }>(
        '/mrp-suggestions/bulk-accept',
        { suggestion_ids: ids }
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mrp-runs'] })
      queryClient.invalidateQueries({ queryKey: ['mrp-run'] })
    },
  })
}

export function useBulkRejectSuggestions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ids, reason }: { ids: (number | string)[]; reason?: string }) => {
      const response = await api.post<{ data: MrpSuggestion[] }>(
        '/mrp-suggestions/bulk-reject',
        { suggestion_ids: ids, reason }
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mrp-runs'] })
      queryClient.invalidateQueries({ queryKey: ['mrp-run'] })
    },
  })
}

// ============================================
// Reports
// ============================================

export function useMrpShortageReport(
  startDate?: MaybeRef<string | undefined>,
  endDate?: MaybeRef<string | undefined>,
  warehouseId?: MaybeRef<number | undefined>
) {
  return useQuery({
    queryKey: computed(() => [
      'mrp',
      'shortage-report',
      toValue(startDate),
      toValue(endDate),
      toValue(warehouseId),
    ]),
    queryFn: async () => {
      const params: Record<string, unknown> = {}
      const start = toValue(startDate)
      const end = toValue(endDate)
      const warehouse = toValue(warehouseId)

      if (start) params.start_date = start
      if (end) params.end_date = end
      if (warehouse) params.warehouse_id = warehouse

      const response = await api.get<MrpShortageReport>('/mrp/shortage-report', { params })
      return response.data
    },
  })
}

export function useMrpStatistics() {
  return useQuery({
    queryKey: ['mrp', 'statistics'],
    queryFn: async () => {
      const response = await api.get<MrpStatistics>('/mrp/statistics')
      return response.data
    },
  })
}

// ============================================
// Helper Functions
// ============================================

export type MrpRunStatus = 'draft' | 'running' | 'completed' | 'applied' | 'cancelled'
export type SuggestionType = 'purchase' | 'work_order' | 'subcontract'
export type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'converted'

export function getMrpRunStatusLabel(run: MrpRun): { label: string; color: string } {
  const statusValue = run.status && typeof run.status === 'object' ? run.status.value : run.status

  const statusMap: Record<string, { label: string; color: string }> = {
    draft: {
      label: 'Draft',
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    running: {
      label: 'Running',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    completed: {
      label: 'Completed',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    applied: {
      label: 'Applied',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  }

  const status = (statusValue as MrpRunStatus) || 'draft'
  return statusMap[status] ?? statusMap.draft!
}

export function getSuggestionTypeLabel(type: SuggestionType): { label: string; icon: string; color: string } {
  const typeMap: Record<SuggestionType, { label: string; icon: string; color: string }> = {
    purchase: {
      label: 'Purchase',
      icon: 'ShoppingCart',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    work_order: {
      label: 'Work Order',
      icon: 'Wrench',
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
    subcontract: {
      label: 'Subcontract',
      icon: 'Users',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    },
  }

  return typeMap[type] || typeMap.purchase
}

export function getSuggestionStatusLabel(status: SuggestionStatus): { label: string; color: string } {
  const statusMap: Record<SuggestionStatus, { label: string; color: string }> = {
    pending: {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    accepted: {
      label: 'Accepted',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    rejected: {
      label: 'Rejected',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    converted: {
      label: 'Converted',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
  }

  return statusMap[status] || statusMap.pending
}

export function formatMrpRunNumber(run: MrpRun): string {
  return run.run_number || `MRP-${run.id}`
}
