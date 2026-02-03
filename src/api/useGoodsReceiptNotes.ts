/**
 * Goods Receipt Notes (GRN) API hooks
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

export type GoodsReceiptNote = components['schemas']['GoodsReceiptNoteResource']
export type GoodsReceiptNoteItem = components['schemas']['GoodsReceiptNoteItemResource']

export interface GoodsReceiptNoteFilters {
  page?: number
  per_page?: number
  status?: 'draft' | 'receiving' | 'completed' | 'cancelled'
  search?: string
  warehouse_id?: number
  purchase_order_id?: number
  start_date?: string
  end_date?: string
}

export type CreateGoodsReceiptNoteData = components['schemas']['StoreGoodsReceiptNoteRequest']

export interface UpdateGoodsReceiptNoteItemData {
  quantity_received?: number
  quantity_rejected?: number
  rejection_reason?: string
  quality_notes?: string
  lot_number?: string
  expiry_date?: string
}

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<GoodsReceiptNote, GoodsReceiptNoteFilters, CreateGoodsReceiptNoteData>({
  resourceName: 'goods-receipt-notes',
  singularName: 'goods-receipt-note',
})

export const useGoodsReceiptNotes = hooks.useList
export const useGoodsReceiptNote = hooks.useSingle
export const useCreateGoodsReceiptNote = hooks.useCreate
export const useUpdateGoodsReceiptNote = hooks.useUpdate
export const useDeleteGoodsReceiptNote = hooks.useDelete

// ============================================
// GRNs for Purchase Order
// ============================================

export function useGoodsReceiptNotesForPO(purchaseOrderId: MaybeRef<number>) {
  return useQuery({
    queryKey: ['goods-receipt-notes', 'for-po', purchaseOrderId],
    queryFn: async () => {
      const id = toValue(purchaseOrderId)
      const response = await api.get<{ data: GoodsReceiptNote[] }>(`/purchase-orders/${id}/grns`)
      return response.data.data
    },
    enabled: () => toValue(purchaseOrderId) > 0,
  })
}

// ============================================
// Create from Purchase Order
// ============================================

export interface CreateFromPOData {
  warehouse_id: number
  receipt_date?: string
  supplier_do_number?: string
  supplier_invoice_number?: string
  vehicle_number?: string
  driver_name?: string
  notes?: string
}

export function useCreateGRNFromPO() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ purchaseOrderId, data }: { purchaseOrderId: number; data: CreateFromPOData }) => {
      const response = await api.post<{ data: GoodsReceiptNote }>(`/purchase-orders/${purchaseOrderId}/grn`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-notes'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-note', data.id] })
    },
  })
}

// ============================================
// Workflow Action Hooks
// ============================================

export function useStartReceiving() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: GoodsReceiptNote }>(`/goods-receipt-notes/${id}/start-receiving`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-notes'] })
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-note', data.id] })
    },
  })
}

export function useCompleteGRN() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: GoodsReceiptNote }>(`/goods-receipt-notes/${id}/complete`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-notes'] })
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-note', data.id] })
    },
  })
}

export function useCancelGRN() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: GoodsReceiptNote }>(`/goods-receipt-notes/${id}/cancel`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-notes'] })
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-note', data.id] })
    },
  })
}

// ============================================
// Update Item
// ============================================

export function useUpdateGRNItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ grnId, itemId, data }: { grnId: number; itemId: number; data: UpdateGoodsReceiptNoteItemData }) => {
      const response = await api.patch<{ data: GoodsReceiptNoteItem }>(`/goods-receipt-notes/${grnId}/items/${itemId}`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-note', variables.grnId] })
    },
  })
}

// ============================================
// Helper Functions
// ============================================

export type GRNStatus = 'draft' | 'receiving' | 'completed' | 'cancelled'

export function getGRNStatus(grn: GoodsReceiptNote): { label: string; color: string } {
  const statusMap: Record<GRNStatus, { label: string; color: string }> = {
    draft: {
      label: 'Draft',
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    receiving: {
      label: 'In Progress',
      color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    },
    completed: {
      label: 'Completed',
      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  }

  const statusValue = grn.status && typeof grn.status === 'object' ? grn.status.value : grn.status
  const status = (statusValue as GRNStatus) || 'draft'
  return statusMap[status] || statusMap.draft
}

export function formatGRNNumber(grn: GoodsReceiptNote): string {
  return grn.grn_number || `GRN-${grn.id}`
}
