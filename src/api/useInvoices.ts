/**
 * Invoices API hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type Invoice = components['schemas']['InvoiceResource']
export type InvoiceItem = components['schemas']['InvoiceItemResource']

export interface InvoiceFilters {
  page?: number
  per_page?: number
  status?: 'draft' | 'posted' | 'paid' | 'partial' | 'overdue' | 'void'
  search?: string
  contact_id?: number
  date_from?: string
  date_to?: string
}

export interface CreateInvoiceData {
  contact_id: number
  invoice_date: string
  due_date: string
  description?: string
  reference?: string
  tax_rate?: number
  discount_amount?: number
  receivable_account_id?: number | null
  items: CreateInvoiceItem[]
}

export interface CreateInvoiceItem {
  description: string
  quantity: number
  unit?: string
  unit_price: number
  revenue_account_id?: number | null
}

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<Invoice, InvoiceFilters, CreateInvoiceData>({
  resourceName: 'invoices',
  singularName: 'invoice',
})

export const useInvoices = hooks.useList
export const useInvoice = hooks.useSingle
export const useCreateInvoice = hooks.useCreate
export const useUpdateInvoice = hooks.useUpdate
export const useDeleteInvoice = hooks.useDelete

// ============================================
// Statistics Hook
// ============================================

export function useInvoiceStatistics() {
  return useQuery({
    queryKey: ['invoices', 'statistics'],
    queryFn: async () => {
      const response = await api.get<{ data: Record<string, number> }>('/invoices-statistics')
      return response.data.data
    },
  })
}

// ============================================
// Custom Action Hooks
// ============================================

export function usePostInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Invoice }>(`/invoices/${id}/post`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['invoice', data.id], data)
    },
  })
}

export function useVoidInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{ data: Invoice }>(`/invoices/${id}/void`, { reason })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['invoice', data.id], data)
    },
  })
}

export function useDuplicateInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Invoice }>(`/invoices/${id}/duplicate`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useSendInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, email }: { id: number; email?: string }) => {
      const response = await api.post<{ data: Invoice }>(`/invoices/${id}/send`, { email })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['invoice', data.id], data)
    },
  })
}
