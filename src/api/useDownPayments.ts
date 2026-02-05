/**
 * Down Payments API hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api, type ApiRequest, type ApiResponse, type PaginatedResponse } from './client'
import { createCrudHooks } from './factory'
import type { components, paths } from './types'
import type { MaybeRef } from 'vue'
import { toValue } from 'vue'

// ============================================
// Types
// ============================================

export type DownPayment = components['schemas']['DownPaymentResource']
export type DownPaymentApplication = components['schemas']['DownPaymentApplicationResource']

export type DownPaymentType = 'receivable' | 'payable'
export type DownPaymentStatus = 'draft' | 'confirmed' | 'applied' | 'refunded' | 'voided'

export interface DownPaymentFilters {
  page?: number
  per_page?: number
  type?: DownPaymentType
  status?: string
  contact_id?: number
  search?: string
  available_only?: boolean
  start_date?: string
  end_date?: string
}

// Use Scramble-generated request types directly
export type CreateDownPaymentData = components['schemas']['StoreDownPaymentRequest']
export type UpdateDownPaymentData = components['schemas']['UpdateDownPaymentRequest']

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<DownPayment, DownPaymentFilters, CreateDownPaymentData, UpdateDownPaymentData>({
  resourceName: 'down-payments',
  singularName: 'down-payment',
})

export const useDownPayments = hooks.useList
export const useDownPayment = hooks.useSingle
export const useCreateDownPayment = hooks.useCreate
export const useUpdateDownPayment = hooks.useUpdate
export const useDeleteDownPayment = hooks.useDelete

// ============================================
// Available Down Payments for Contact
// ============================================

export function useAvailableDownPayments(contactId: MaybeRef<number>, type: MaybeRef<DownPaymentType>) {
  return useQuery({
    queryKey: ['down-payments', 'available', contactId, type],
    queryFn: async () => {
      const id = toValue(contactId)
      const dpType = toValue(type)
      const response = await api.get<PaginatedResponse<DownPayment>>('/down-payments-available', {
        params: { contact_id: id, type: dpType },
      })
      return response.data.data
    },
    enabled: () => toValue(contactId) > 0,
  })
}

// ============================================
// Down Payment Applications
// ============================================

export function useDownPaymentApplications(downPaymentId: MaybeRef<number>) {
  return useQuery({
    queryKey: ['down-payments', downPaymentId, 'applications'],
    queryFn: async () => {
      const id = toValue(downPaymentId)
      const response = await api.get<PaginatedResponse<DownPaymentApplication>>(`/down-payments/${id}/applications`)
      return response.data.data
    },
    enabled: () => toValue(downPaymentId) > 0,
  })
}

// ============================================
// Statistics
// ============================================

export type DownPaymentStatistics = ApiResponse<paths['/down-payments-statistics']['get']>

export function useDownPaymentStatistics(type?: DownPaymentType, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['down-payments', 'statistics', { type, startDate, endDate }],
    queryFn: async () => {
      const params: Record<string, any> = {}
      if (type) params.type = type
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      
      const response = await api.get<DownPaymentStatistics>('/down-payments-statistics', {
        params
      })
      return response.data
    },
  })
}

// ============================================
// Apply to Invoice
// ============================================

export type ApplyToInvoiceData = ApiRequest<paths['/down-payments/{downPayment}/apply-to-invoice/{invoice}']['post']>
export type ApplyToInvoiceResponse = ApiResponse<paths['/down-payments/{downPayment}/apply-to-invoice/{invoice}']['post']>

export function useApplyDownPaymentToInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      downPaymentId,
      invoiceId,
      data,
    }: {
      downPaymentId: number
      invoiceId: number
      data: ApplyToInvoiceData
    }) => {
      const response = await api.post<ApplyToInvoiceResponse>(`/down-payments/${downPaymentId}/apply-to-invoice/${invoiceId}`, data)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['down-payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['down-payment', variables.downPaymentId], data.down_payment)
    },
  })
}

// ============================================
// Apply to Bill
// ============================================

export type ApplyToBillData = ApiRequest<paths['/down-payments/{downPayment}/apply-to-bill/{bill}']['post']>
export type ApplyToBillResponse = ApiResponse<paths['/down-payments/{downPayment}/apply-to-bill/{bill}']['post']>

export function useApplyDownPaymentToBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      downPaymentId,
      billId,
      data,
    }: {
      downPaymentId: number
      billId: number
      data: ApplyToBillData
    }) => {
      const response = await api.post<ApplyToBillResponse>(`/down-payments/${downPaymentId}/apply-to-bill/${billId}`, data)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['down-payments'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.setQueryData(['down-payment', variables.downPaymentId], data.down_payment)
    },
  })
}

// ============================================
// Unapply (Reverse Application)
// ============================================

export type UnapplyDownPaymentResponse = ApiResponse<paths['/down-payments/{downPayment}/applications/{application}']['delete']>

export function useUnapplyDownPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      downPaymentId,
      applicationId,
    }: {
      downPaymentId: number
      applicationId: number
    }) => {
      const response = await api.delete<UnapplyDownPaymentResponse>(
        `/down-payments/${downPaymentId}/applications/${applicationId}`
      )
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['down-payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.setQueryData(['down-payment', variables.downPaymentId], data.down_payment)
    },
  })
}

// ============================================
// Refund
// ============================================

// Use Scramble-generated request types directly
export type RefundDownPaymentData = components['schemas']['RefundDownPaymentRequest']

interface RefundDownPaymentResponse {
  message: string
  down_payment: DownPayment
}

export function useRefundDownPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RefundDownPaymentData }) => {
      const response = await api.post<RefundDownPaymentResponse>(`/down-payments/${id}/refund`, data)
      return response.data
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['down-payments'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.setQueryData(['down-payment', variables.id], data.down_payment)
    },
  })
}

// ============================================
// Cancel
// ============================================

export function useCancelDownPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number | string; reason?: string }) => {
      const response = await api.post<{ data: DownPayment }>(`/down-payments/${id}/cancel`, { reason })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['down-payments'] })
      queryClient.setQueryData(['down-payment', data.id], data)
    },
  })
}

// ============================================
// Helper Functions
// ============================================

export function getDownPaymentStatus(dp: DownPayment): { label: string; color: string } {
  // Direct use of structured status from backend
  return {
    label: dp.status.label,
    color: dp.status.color,
  }
}

export function getDownPaymentType(dp: DownPayment): { label: string; color: string } {
  if (dp.type === 'receivable') {
    return {
      label: 'Customer Advance',
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    }
  }
  return {
    label: 'Vendor Advance',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  }
}

export function formatDPNumber(dp: DownPayment): string {
  return dp.dp_number || `DP-${dp.id}`
}