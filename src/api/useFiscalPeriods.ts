import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref, type ComputedRef } from 'vue'
import { createCrudHooks } from './factory'
import { api } from './client'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type FiscalPeriod = components['schemas']['FiscalPeriodResource']

export interface FiscalPeriodFilters {
  page?: number
  per_page?: number
  is_closed?: boolean
  is_locked?: boolean
  year?: number
}

export type CreateFiscalPeriodData = components['schemas']['StoreFiscalPeriodRequest']

export interface ClosingChecklistItem {
  id: string
  label: string
  description: string
  is_completed: boolean
  is_required: boolean
  action_url?: string
}

export interface ClosingChecklist {
  period: FiscalPeriod
  items: ClosingChecklistItem[]
  can_close: boolean
  required_items_completed: number
  required_items_total: number
}

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<FiscalPeriod, FiscalPeriodFilters, CreateFiscalPeriodData>({
  resourceName: 'fiscal-periods',
  singularName: 'fiscal-period',
})

export const useFiscalPeriods = hooks.useList
export const useFiscalPeriod = hooks.useSingle
export const useCreateFiscalPeriod = hooks.useCreate
// Note: Fiscal periods typically cannot be updated or deleted once created

/**
 * Fetch fiscal periods for dropdown (all, no pagination)
 */
export function useFiscalPeriodsLookup() {
  return hooks.useLookup({})
}

// ============================================
// Action Hooks
// ============================================

/**
 * Lock a fiscal period (prevents new transactions)
 */
export function useLockFiscalPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: FiscalPeriod }>(
        `/fiscal-periods/${id}/lock`
      )
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-periods'] })
      queryClient.setQueryData(['fiscal-period', data.id], data)
    },
  })
}

/**
 * Unlock a fiscal period (allows transactions again)
 */
export function useUnlockFiscalPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: FiscalPeriod }>(
        `/fiscal-periods/${id}/unlock`
      )
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-periods'] })
      queryClient.setQueryData(['fiscal-period', data.id], data)
    },
  })
}

/**
 * Close a fiscal period (permanent, creates closing entry)
 */
export function useCloseFiscalPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: { id: number | string; closing_notes?: string }) => {
      const { id, ...data } = params
      const response = await api.post<{ data: FiscalPeriod }>(
        `/fiscal-periods/${id}/close`,
        data
      )
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-periods'] })
      queryClient.setQueryData(['fiscal-period', data.id], data)
      // Also invalidate accounts and journal entries
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    },
  })
}

/**
 * Reopen a closed fiscal period (if allowed by system settings)
 */
export function useReopenFiscalPeriod() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: FiscalPeriod }>(
        `/fiscal-periods/${id}/reopen`
      )
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-periods'] })
      queryClient.setQueryData(['fiscal-period', data.id], data)
    },
  })
}

/**
 * Fetch closing checklist for a fiscal period
 */
export function useFiscalPeriodClosingChecklist(
  periodId: Ref<number | string> | ComputedRef<number | string>
) {
  return useQuery({
    queryKey: computed(() => ['fiscal-period', periodId.value, 'closing-checklist']),
    queryFn: async () => {
      const response = await api.get<{ data: ClosingChecklist }>(
        `/fiscal-periods/${periodId.value}/closing-checklist`
      )
      return response.data.data
    },
    enabled: computed(() => !!periodId.value),
  })
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get fiscal period status info
 */
export function getFiscalPeriodStatus(period: FiscalPeriod): {
  label: string
  color: string
  description: string
} {
  if (period.is_closed) {
    return {
      label: 'Closed',
      color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
      description: 'Period is permanently closed',
    }
  }

  if (period.is_locked) {
    return {
      label: 'Locked',
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      description: 'Period is locked but can be unlocked',
    }
  }

  return {
    label: 'Open',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    description: 'Period is open for transactions',
  }
}

/**
 * Check if a date falls within a fiscal period
 */
export function isDateInPeriod(date: string, period: FiscalPeriod): boolean {
  const d = new Date(date)
  const start = new Date(period.start_date)
  const end = new Date(period.end_date)
  return d >= start && d <= end
}

/**
 * Get current fiscal period from a list
 */
export function getCurrentPeriod(periods: FiscalPeriod[]): FiscalPeriod | undefined {
  const today = new Date().toISOString().split('T')[0] ?? ''
  return periods.find(p => isDateInPeriod(today, p) && !p.is_closed)
}

/**
 * Format fiscal period date range
 */
export function formatPeriodRange(period: FiscalPeriod): string {
  const start = new Date(period.start_date)
  const end = new Date(period.end_date)

  const startMonth = start.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
  const endMonth = end.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })

  if (startMonth === endMonth) {
    return startMonth
  }

  return `${startMonth} - ${endMonth}`
}
