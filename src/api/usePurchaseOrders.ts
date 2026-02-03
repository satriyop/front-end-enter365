/**
 * Purchase Orders API hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type PurchaseOrder = components['schemas']['PurchaseOrderResource']
export type PurchaseOrderItem = components['schemas']['PurchaseOrderItemResource']

export interface PurchaseOrderFilters {
  page?: number
  per_page?: number
  status?: 'draft' | 'pending' | 'approved' | 'partial' | 'received' | 'cancelled' | 'rejected'
  search?: string
  contact_id?: number
  date_from?: string
  date_to?: string
}

export interface CreatePurchaseOrderData {
  contact_id: number
  po_date: string
  expected_date?: string
  reference?: string
  subject?: string
  currency?: string
  exchange_rate?: number
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
  tax_rate?: number
  notes?: string
  terms_conditions?: string
  shipping_address?: string
  items: CreatePurchaseOrderItem[]
}

export interface CreatePurchaseOrderItem {
  product_id?: number | null
  description: string
  quantity: number
  unit?: string
  unit_price: number
  discount_percent?: number
  tax_rate?: number
  sort_order?: number
  notes?: string
}

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<PurchaseOrder, PurchaseOrderFilters, CreatePurchaseOrderData>({
  resourceName: 'purchase-orders',
  singularName: 'purchase-order',
})

export const usePurchaseOrders = hooks.useList
export const usePurchaseOrder = hooks.useSingle
export const useCreatePurchaseOrder = hooks.useCreate
export const useUpdatePurchaseOrder = hooks.useUpdate
export const useDeletePurchaseOrder = hooks.useDelete

// ============================================
// Statistics Hook
// ============================================

export interface PurchaseOrderStatistics {
  total_count: number
  total_value: number
  draft_count: number
  draft_value: number
  pending_count: number
  pending_value: number
  approved_count: number
  approved_value: number
  partial_count: number
  partial_value: number
  received_count: number
  received_value: number
  cancelled_count: number
  rejected_count: number
}

export function usePurchaseOrderStatistics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['purchase-orders', 'statistics', { startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      const queryString = params.toString()
      const url = queryString ? `/purchase-orders-statistics?${queryString}` : '/purchase-orders-statistics'
      const response = await api.get<{ data: PurchaseOrderStatistics }>(url)
      return response.data.data
    },
  })
}

// ============================================
// Workflow Action Hooks
// ============================================

export function useSubmitPurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: PurchaseOrder }>(`/purchase-orders/${id}/submit`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.setQueryData(['purchase-order', data.id], data)
    },
  })
}

export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: PurchaseOrder }>(`/purchase-orders/${id}/approve`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.setQueryData(['purchase-order', data.id], data)
    },
  })
}

export function useRejectPurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await api.post<{ data: PurchaseOrder }>(`/purchase-orders/${id}/reject`, {
        reason,
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.setQueryData(['purchase-order', data.id], data)
    },
  })
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await api.post<{ data: PurchaseOrder }>(`/purchase-orders/${id}/cancel`, {
        reason,
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.setQueryData(['purchase-order', data.id], data)
    },
  })
}

export function useConvertPurchaseOrderToBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{
        message: string
        bill: { id: number }
        purchase_order: PurchaseOrder
      }>(`/purchase-orders/${id}/convert-to-bill`)
      return {
        bill_id: response.data.bill.id,
        purchase_order: response.data.purchase_order,
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.setQueryData(['purchase-order', data.purchase_order.id], data.purchase_order)
    },
  })
}

export function useDuplicatePurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: PurchaseOrder }>(`/purchase-orders/${id}/duplicate`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
    },
  })
}

// ============================================
// Outstanding POs Hook
// ============================================

export function useOutstandingPurchaseOrders(contactId?: number) {
  return useQuery({
    queryKey: ['purchase-orders', 'outstanding', { contactId }],
    queryFn: async () => {
      const params = contactId ? `?contact_id=${contactId}` : ''
      const response = await api.get<{ data: PurchaseOrder[] }>(`/purchase-orders-outstanding${params}`)
      return response.data.data
    },
  })
}

// ============================================
// Helper Functions
// ============================================

export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'partial' | 'received' | 'cancelled' | 'rejected'

export function getPurchaseOrderStatus(po: PurchaseOrder): { label: string; color: string } {
  const statusMap: Record<PurchaseOrderStatus, { label: string; color: string }> = {
    draft: {
      label: 'Draft',
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    pending: {
      label: 'Pending Approval',
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    approved: {
      label: 'Approved',
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    partial: {
      label: 'Partially Received',
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    },
    received: {
      label: 'Fully Received',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
    rejected: {
      label: 'Rejected',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  }

  const statusValue = po.status && typeof po.status === 'object' ? po.status.value : po.status
  const status = (statusValue as PurchaseOrderStatus) || 'draft'
  return statusMap[status] || statusMap.draft
}

export function formatPONumber(po: PurchaseOrder): string {
  return po.full_number || po.po_number || `PO-${po.id}`
}
