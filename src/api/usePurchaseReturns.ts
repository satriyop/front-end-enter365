/**
 * Purchase Returns API hooks
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

export type PurchaseReturn = components['schemas']['PurchaseReturnResource']
export type PurchaseReturnItem = components['schemas']['PurchaseReturnItemResource']

export interface PurchaseReturnFilters {
  page?: number
  per_page?: number
  status?: 'draft' | 'submitted' | 'approved' | 'completed' | 'rejected' | 'cancelled'
  search?: string
  contact_id?: number
  bill_id?: number
  start_date?: string
  end_date?: string
}

export type CreatePurchaseReturnData = components['schemas']['StorePurchaseReturnRequest']

export type CreatePurchaseReturnItem = CreatePurchaseReturnData['items'][number]

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<PurchaseReturn, PurchaseReturnFilters, CreatePurchaseReturnData>({
  resourceName: 'purchase-returns',
  singularName: 'purchase-return',
})

export const usePurchaseReturns = hooks.useList
export const usePurchaseReturn = hooks.useSingle
export const useCreatePurchaseReturn = hooks.useCreate
export const useUpdatePurchaseReturn = hooks.useUpdate
export const useDeletePurchaseReturn = hooks.useDelete

// ============================================
// Returns for Bill
// ============================================

export function usePurchaseReturnsForBill(billId: MaybeRef<number>) {
  return useQuery({
    queryKey: ['purchase-returns', 'for-bill', billId],
    queryFn: async () => {
      const id = toValue(billId)
      const response = await api.get<{ data: PurchaseReturn[] }>(`/bills/${id}/returns`)
      return response.data.data
    },
    enabled: () => toValue(billId) > 0,
  })
}

// ============================================
// Create from Bill
// ============================================

export interface CreateFromBillData {
  return_date?: string
  warehouse_id?: number
  reason?: string
  notes?: string
}

export function useCreatePurchaseReturnFromBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ billId, data }: { billId: number; data: CreateFromBillData }) => {
      const response = await api.post<{ data: PurchaseReturn }>(`/bills/${billId}/return`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.setQueryData(['purchase-return', data.id], data)
    },
  })
}

// ============================================
// Statistics
// ============================================

export interface PurchaseReturnStatistics {
  total_count: number
  total_amount: number
  draft_count: number
  pending_count: number
  approved_count: number
  completed_count: number
  rejected_count: number
  cancelled_count: number
}

export function usePurchaseReturnStatistics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['purchase-returns', 'statistics', { startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      const queryString = params.toString()
      const url = queryString ? `/purchase-returns-statistics?${queryString}` : '/purchase-returns-statistics'
      const response = await api.get<PurchaseReturnStatistics>(url)
      return response.data
    },
  })
}

// ============================================
// Workflow Action Hooks
// ============================================

export function useSubmitPurchaseReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: PurchaseReturn }>(`/purchase-returns/${id}/submit`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
      queryClient.setQueryData(['purchase-return', data.id], data)
    },
  })
}

export function useApprovePurchaseReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: PurchaseReturn }>(`/purchase-returns/${id}/approve`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
      queryClient.setQueryData(['purchase-return', data.id], data)
    },
  })
}

export function useRejectPurchaseReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{ data: PurchaseReturn }>(`/purchase-returns/${id}/reject`, { reason })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
      queryClient.setQueryData(['purchase-return', data.id], data)
    },
  })
}

export function useCompletePurchaseReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: PurchaseReturn }>(`/purchase-returns/${id}/complete`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.setQueryData(['purchase-return', data.id], data)
    },
  })
}

export function useCancelPurchaseReturn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{ data: PurchaseReturn }>(`/purchase-returns/${id}/cancel`, { reason })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-returns'] })
      queryClient.setQueryData(['purchase-return', data.id], data)
    },
  })
}

// ============================================
// Helper Functions
// ============================================

export function getPurchaseReturnStatus(pr: PurchaseReturn): { label: string; color: string } {
  return {
    label: pr.status.label,
    color: pr.status.color,
  }
}

export function formatReturnNumber(pr: PurchaseReturn): string {
  return pr.return_number || `RET-${pr.id}`
}
