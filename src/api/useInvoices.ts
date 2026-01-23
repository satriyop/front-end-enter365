/**
 * Invoices API hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components, paths } from './types'

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

export type CreateInvoiceData = paths['/invoices']['post']['requestBody']['content']['application/json']
export type CreateInvoiceItem = CreateInvoiceData['items'][number]

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
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] })
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
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
