/**
 * Quotations API hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api, type ApiRequest } from './client'
import { createCrudHooks } from './factory'
import type { components, paths } from './types'

// ============================================
// Types
// ============================================

export type Quotation = components['schemas']['QuotationResource']
export type QuotationItem = components['schemas']['QuotationItemResource']

export interface QuotationFilters {
  page?: number
  per_page?: number
  status?: string
  contact_id?: number
  search?: string
  date_from?: string
  date_to?: string
}

export type CreateQuotationData = ApiRequest<paths['/quotations']['post']>
export type CreateQuotationItem = CreateQuotationData['items'][number]

export type CreateQuotationFromBomData = ApiRequest<paths['/quotations/from-bom']['post']>

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
// Custom Action Hooks
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

export function useSubmitQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
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
    mutationFn: async (id: number | string) => {
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
    mutationFn: async ({ id, reason }: { id: number | string; reason?: string }) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/reject`, { reason })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

export function useCancelQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number | string; reason?: string }) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/cancel`, { reason })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

export function useMarkQuotationSent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/mark-sent`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

export function useReviseQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/revise`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}

export function useConvertToInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ 
        message: string, 
        invoice: components['schemas']['InvoiceResource'],
        quotation: Quotation 
      }>(`/quotations/${id}/convert-to-invoice`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

export function useDuplicateQuotation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/duplicate`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}

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

// ============================================
// Win/Loss Tracking
// ============================================

export function useMarkQuotationWon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, notes }: { id: number | string; notes?: string }) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/mark-won`, { notes })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

export function useMarkQuotationLost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number | string; reason?: string }) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/mark-lost`, { reason })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

// ============================================
// PDF Export
// ============================================

export function useExportQuotationPdf() {
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.get(`/quotations/${id}/pdf`, { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `quotation-${id}.pdf`
      link.click()
      URL.revokeObjectURL(link.href)
      return true
    },
  })
}