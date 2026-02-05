/**
 * Sales Returns API hooks
 *
 * Sales Returns track goods returned from customers.
 * Workflow: Draft → Pending → Approved → Completed
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'
import type { MaybeRef } from 'vue'
import { toValue } from 'vue'

// ============================================
// Types
// ============================================

export type SalesReturn = components['schemas']['SalesReturnResource']
export type SalesReturnItem = components['schemas']['SalesReturnItemResource']
export type SalesReturnStatus = 'draft' | 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled'

export interface SalesReturnFilters {
  page?: number
  per_page?: number
  status?: 'draft' | 'pending' | 'approved' | 'completed' | 'rejected' | 'cancelled'
  search?: string
  contact_id?: number
  invoice_id?: number
  start_date?: string
  end_date?: string
}

export type CreateSalesReturnData = components['schemas']['StoreSalesReturnRequest']

export type CreateSalesReturnItem = CreateSalesReturnData['items'][number]

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<SalesReturn, SalesReturnFilters, CreateSalesReturnData>({
  resourceName: 'sales-returns',
  singularName: 'sales-return',
})

export const useSalesReturns = hooks.useList
export const useSalesReturn = hooks.useSingle
export const useCreateSalesReturn = hooks.useCreate
export const useUpdateSalesReturn = hooks.useUpdate
export const useDeleteSalesReturn = hooks.useDelete

// ============================================
// Sales Returns for Invoice
// ============================================

export function useSalesReturnsForInvoice(invoiceId: MaybeRef<number>) {
  return useQuery({
    queryKey: ['sales-returns', 'for-invoice', invoiceId],
    queryFn: async () => {
      const id = toValue(invoiceId)
      const response = await api.get<{ data: SalesReturn[] }>(`/invoices/${id}/sales-returns`)
      return response.data.data
    },
    enabled: () => toValue(invoiceId) > 0,
  })
}

// ============================================
// Create from Invoice
// ============================================

export interface CreateFromInvoiceData {
  return_date?: string
  warehouse_id?: number
  reason?: string
  notes?: string
}

export function useCreateSalesReturnFromInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ invoiceId, data }: { invoiceId: number; data: CreateFromInvoiceData }) => {
      const response = await api.post<{ data: SalesReturn }>(`/invoices/${invoiceId}/create-sales-return`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['sales-return', data.id], data)
    },
  })
}

// ============================================
// Statistics
// ============================================

export interface SalesReturnStatistics {
  total_count: number
  total_amount: number
  draft_count: number
  pending_count: number
  approved_count: number
  completed_count: number
  rejected_count: number
  cancelled_count: number
}

export function useSalesReturnStatistics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['sales-returns', 'statistics', { startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      const queryString = params.toString()
      const url = queryString ? `/sales-returns-statistics?${queryString}` : '/sales-returns-statistics'
      const response = await api.get<SalesReturnStatistics>(url)
      return response.data
    },
  })
}

// ============================================
// Workflow Action Hooks
// ============================================

export function useSubmitSalesReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: SalesReturn }>(`/sales-returns/${id}/submit`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
      queryClient.invalidateQueries({ queryKey: ['sales-return', data.id] })
    },
  })
}

export function useApproveSalesReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: SalesReturn }>(`/sales-returns/${id}/approve`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
      queryClient.invalidateQueries({ queryKey: ['sales-return', data.id] })
    },
  })
}

export function useRejectSalesReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{ data: SalesReturn }>(`/sales-returns/${id}/reject`, { reason })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
      queryClient.invalidateQueries({ queryKey: ['sales-return', data.id] })
    },
  })
}

export function useCompleteSalesReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: SalesReturn }>(`/sales-returns/${id}/complete`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
      queryClient.invalidateQueries({ queryKey: ['sales-return', data.id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useCancelSalesReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{ data: SalesReturn }>(`/sales-returns/${id}/cancel`, { reason })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales-returns'] })
      queryClient.invalidateQueries({ queryKey: ['sales-return', data.id] })
    },
  })
}

// ============================================
// Helper Functions
// ============================================

export function getSalesReturnStatus(sr: SalesReturn): { label: string; color: string } {
  return {
    label: sr.status.label,
    color: sr.status.color,
  }
}

export function formatReturnNumber(sr: SalesReturn): string {
  return sr.return_number || `RET-${sr.id}`
}
