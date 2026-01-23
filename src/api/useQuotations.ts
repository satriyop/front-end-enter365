/**
 * Quotations API hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components, paths } from './types'

// ============================================
// Types
// ============================================

export type Quotation = components['schemas']['QuotationResource']
export type QuotationItem = components['schemas']['QuotationItemResource']

// Manual definition because OpenAPI spec is missing query parameters
export interface QuotationFilters {
  page?: number
  per_page?: number
  status?: string
  search?: string
  contact_id?: number
  date_from?: string
  date_to?: string
}

export type CreateQuotationData = paths['/quotations']['post']['requestBody']['content']['application/json']
export type CreateQuotationItem = CreateQuotationData['items'][number]

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<Quotation, QuotationFilters, CreateQuotationData>({
  resourceName: 'quotations',
  singularName: 'quotation',
})

export const useQuotations = hooks.useList
export const useQuotation = hooks.useSingle
export const useCreateQuotation = hooks.useCreate
export const useUpdateQuotation = hooks.useUpdate
export const useDeleteQuotation = hooks.useDelete

// ============================================
// Statistics Hook
// ============================================

export function useQuotationStatistics() {
  return useQuery({
    queryKey: ['quotations', 'statistics'],
    queryFn: async () => {
      const response = await api.get<{ data: Record<string, number> }>('/quotations-statistics')
      return response.data.data
    },
  })
}

// ============================================
// Custom Action Hooks
// ============================================

export function useSubmitQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/submit`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

export function useApproveQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/approve`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

export function useRejectQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/reject`, {
        rejection_reason: reason,
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

export function useConvertToInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        message: string
        invoice: { id: number }
        quotation: Quotation
      }>(`/quotations/${id}/convert-to-invoice`)
      return {
        invoice_id: response.data.invoice.id,
        quotation: response.data.quotation,
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['quotation', data.quotation.id], data.quotation)
    },
  })
}

export function useDuplicateQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/duplicate`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}

export function useReviseQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/revise`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}

// ============================================
// Create from BOM
// ============================================

export type CreateQuotationFromBomData = paths['/quotations/from-bom']['post']['requestBody']['content']['application/json']

export function useCreateQuotationFromBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateQuotationFromBomData) => {
      const response = await api.post<{ data: Quotation }>('/quotations/from-bom', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}
