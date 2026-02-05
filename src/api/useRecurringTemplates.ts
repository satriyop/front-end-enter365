/**
 * Recurring Templates API hooks
 */

import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type RecurringTemplate = components['schemas']['RecurringTemplateResource']
export type CreateRecurringTemplateData = components['schemas']['StoreRecurringTemplateRequest']
export type UpdateRecurringTemplateData = components['schemas']['UpdateRecurringTemplateRequest']
export type MakeRecurringData = components['schemas']['MakeRecurringRequest']

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export interface RecurringTemplateFilters {
  page?: number
  per_page?: number
  type?: 'invoice' | 'bill'
  is_active?: boolean
  contact_id?: number
  search?: string
}

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<RecurringTemplate, RecurringTemplateFilters, CreateRecurringTemplateData, UpdateRecurringTemplateData>({
  resourceName: 'recurring-templates',
  singularName: 'recurring-template',
})

export const useRecurringTemplates = hooks.useList
export const useRecurringTemplate = hooks.useSingle
export const useCreateRecurringTemplate = hooks.useCreate
export const useUpdateRecurringTemplate = hooks.useUpdate
export const useDeleteRecurringTemplate = hooks.useDelete

// ============================================
// Action Hooks
// ============================================

/**
 * Generate document from recurring template
 */
export function useGenerateFromTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: RecurringTemplate }>(`/recurring-templates/${id}/generate`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-templates'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
    },
  })
}

/**
 * Pause recurring template
 */
export function usePauseTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: RecurringTemplate }>(`/recurring-templates/${id}/pause`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-templates'] })
      queryClient.setQueryData(['recurring-template', data.id], data)
    },
  })
}

/**
 * Resume recurring template
 */
export function useResumeTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: RecurringTemplate }>(`/recurring-templates/${id}/resume`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-templates'] })
      queryClient.setQueryData(['recurring-template', data.id], data)
    },
  })
}

// ============================================
// Make Recurring Hooks (from Invoice/Bill)
// ============================================

interface MakeRecurringResponse {
  message: string
  recurring_template: RecurringTemplate
}

/**
 * Create recurring template from an invoice
 */
export function useMakeInvoiceRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ invoiceId, data }: { invoiceId: number; data: MakeRecurringData }) => {
      const response = await api.post<MakeRecurringResponse>(`/invoices/${invoiceId}/make-recurring`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-templates'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

/**
 * Create recurring template from a bill
 */
export function useMakeBillRecurring() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ billId, data }: { billId: number; data: MakeRecurringData }) => {
      const response = await api.post<MakeRecurringResponse>(`/bills/${billId}/make-recurring`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-templates'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
    },
  })
}

// ============================================
// Helper Functions
// ============================================

export const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
] as const

export function getFrequencyLabel(frequency: RecurringFrequency): string {
  const option = frequencyOptions.find(o => o.value === frequency)
  return option?.label || frequency
}

export function getIntervalLabel(frequency: RecurringFrequency, interval: number): string {
  if (interval === 1) {
    return getFrequencyLabel(frequency)
  }

  const periodMap: Record<RecurringFrequency, string> = {
    daily: 'days',
    weekly: 'weeks',
    monthly: 'months',
    quarterly: 'quarters',
    yearly: 'years',
  }

  return `Every ${interval} ${periodMap[frequency]}`
}
