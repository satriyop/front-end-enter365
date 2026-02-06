/**
 * Quotation Follow-Up API hooks
 * Covers: follow-up list, summary, statistics, activities, scheduling, assignment, priority
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'
import type { components } from './types'
import type { Quotation } from './useQuotations'

// ============================================
// Types
// ============================================

export type QuotationActivity = components['schemas']['QuotationActivityResource']
export type StoreActivityData = components['schemas']['StoreQuotationActivityRequest']

export interface FollowUpFilters {
  page?: number
  per_page?: number
  assigned_to?: number | string
  sort_by?: string
  sort_dir?: string
}

export interface StatisticsFilters {
  start_date?: string
  end_date?: string
}

export interface FollowUpSummary {
  overdue: string
  today: string
  upcoming_week: string
  no_follow_up_scheduled: string
}

export interface FollowUpStatistics {
  period: { start: unknown; end: unknown }
  counts: { total: string; won: string; lost: string; pending: string }
  values: { won: string; lost: string; pending: string }
  conversion_rate: number
  lost_reasons: { reason: string; label: string; count: number; value: number }[]
  won_reasons: { reason: string; label: string; count: number; value: number }[]
}

// ============================================
// Query Hooks
// ============================================

/**
 * List quotations needing follow-up (paginated)
 */
export function useFollowUpList(filters: Ref<FollowUpFilters>) {
  return useQuery({
    queryKey: computed(() => ['quotation-follow-up', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<Quotation>>('/quotation-follow-up', {
        params: cleanParams,
      })
      return response.data
    },
  })
}

/**
 * Follow-up summary (overdue, today, upcoming, no follow-up)
 */
export function useFollowUpSummary(userId?: Ref<string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['follow-up-summary', userId?.value]),
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (userId?.value) params.user_id = userId.value
      const response = await api.get<FollowUpSummary>('/quotation-follow-up/summary', { params })
      return response.data
    },
    staleTime: 60_000,
  })
}

/**
 * Win/loss statistics with date range filter
 */
export function useFollowUpStatistics(filters: Ref<StatisticsFilters>) {
  return useQuery({
    queryKey: computed(() => ['follow-up-statistics', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<FollowUpStatistics>('/quotation-follow-up/statistics', {
        params: cleanParams,
      })
      return response.data
    },
    staleTime: 60_000,
  })
}

/**
 * Paginated activities for a specific quotation
 */
export function useQuotationActivities(
  quotationId: Ref<number>,
  filters?: Ref<{ type?: string; per_page?: number; page?: number }>
) {
  return useQuery({
    queryKey: computed(() => ['quotation-activities', quotationId.value, filters?.value]),
    queryFn: async () => {
      const params: Record<string, unknown> = {}
      if (filters?.value) {
        Object.entries(filters.value).forEach(([k, v]) => {
          if (v !== '' && v !== undefined && v !== null) params[k] = v
        })
      }
      const response = await api.get<PaginatedResponse<QuotationActivity>>(
        `/quotations/${quotationId.value}/activities`,
        { params }
      )
      return response.data
    },
    enabled: computed(() => !!quotationId.value && quotationId.value > 0),
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Log a new activity on a quotation
 */
export function useLogActivity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: StoreActivityData }) => {
      const response = await api.post<{ data: QuotationActivity }>(
        `/quotations/${id}/activities`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotation-activities', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['quotation-follow-up'] })
      queryClient.invalidateQueries({ queryKey: ['follow-up-summary'] })
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.id] })
    },
  })
}

/**
 * Schedule a follow-up date for a quotation
 */
export function useScheduleFollowUp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      next_follow_up_at,
      notes,
    }: {
      id: number
      next_follow_up_at: string
      notes?: string | null
    }) => {
      const response = await api.post<{ data: Quotation }>(
        `/quotations/${id}/schedule-follow-up`,
        { next_follow_up_at, notes }
      )
      return response.data.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.id] })
      queryClient.setQueryData(['quotation', variables.id], data)
      queryClient.invalidateQueries({ queryKey: ['quotation-follow-up'] })
      queryClient.invalidateQueries({ queryKey: ['follow-up-summary'] })
    },
  })
}

/**
 * Assign a quotation to a user
 */
export function useAssignQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, assigned_to }: { id: number; assigned_to: number }) => {
      const response = await api.post<{ data: Quotation }>(
        `/quotations/${id}/assign`,
        { assigned_to }
      )
      return response.data.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.id] })
      queryClient.setQueryData(['quotation', variables.id], data)
      queryClient.invalidateQueries({ queryKey: ['quotation-follow-up'] })
    },
  })
}

/**
 * Update quotation priority
 */
export function useUpdatePriority() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      priority,
    }: {
      id: number
      priority: 'low' | 'normal' | 'high' | 'urgent'
    }) => {
      const response = await api.post<{ data: Quotation }>(
        `/quotations/${id}/priority`,
        { priority }
      )
      return response.data.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotation', variables.id] })
      queryClient.setQueryData(['quotation', variables.id], data)
      queryClient.invalidateQueries({ queryKey: ['quotation-follow-up'] })
    },
  })
}
