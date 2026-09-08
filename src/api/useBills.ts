/**
 * Bills API hooks
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type Bill = components['schemas']['BillResource']
export type BillItem = components['schemas']['BillItemResource']

export interface BillFilters {
  page?: number
  per_page?: number
  status?: string
  contact_id?: number
  search?: string
  date_from?: string
  date_to?: string
}

export type CreateBillData = Partial<Bill>

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<Bill, BillFilters, CreateBillData>({
  resourceName: 'bills',
  singularName: 'bill',
})

export const useBills = hooks.useList
export const useBill = hooks.useSingle
export const useCreateBill = hooks.useCreate
export const useUpdateBill = hooks.useUpdate
export const useDeleteBill = hooks.useDelete

// ============================================
// Custom Action Hooks
// ============================================

export function usePostBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Bill }>(`/bills/${id}/post`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['bill', id] })
    },
  })
}

export function useBillCreditNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number
      data?: { reason: string; notes?: string }
    }) => {
      const response = await api.post<{ data: { id: number; source_type?: string } }>(`/bills/${id}/credit-note`, data ?? {})
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['bill', id] })
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] })
    },
  })
}

export interface PurchaseMatchingBillLine {
  id: number
  product_id: number | null
  description: string
  quantity: number
  unit: string
  unit_price: number
  line_total: number
  purchase_order_item_id: number | null
}

export interface PurchaseMatchingPoLine {
  id: number
  product_id: number | null
  description: string
  quantity: number
  quantity_received: number
  unit: string
  unit_price: number
  billed_quantity: number
  billed_amount: number
  qty_to_invoice: number
}

export interface PurchaseMatchingWorksheet {
  purchase_order_id: number | null
  bill_lines: PurchaseMatchingBillLine[]
  purchase_lines: PurchaseMatchingPoLine[]
}

export function useBillPurchaseMatching(
  billId: Ref<number>,
  purchaseOrderId: Ref<number | string>,
  enabled: Ref<boolean>,
) {
  return useQuery({
    queryKey: ['bills', billId, 'purchase-matching', purchaseOrderId],
    enabled: computed(() => enabled.value && !!billId.value && Number(purchaseOrderId.value) > 0),
    queryFn: async () => {
      const response = await api.get<{ data: PurchaseMatchingWorksheet }>(
        `/bills/${billId.value}/purchase-matching`,
        { params: { purchase_order_id: Number(purchaseOrderId.value) } },
      )
      return response.data.data
    },
  })
}

export function useMatchBillPurchaseOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      purchase_order_id,
      lines,
    }: {
      id: number
      purchase_order_id: number
      lines: { bill_item_id: number; purchase_order_item_id: number }[]
    }) => {
      const response = await api.post<{ data: Bill }>(`/bills/${id}/match-purchase-order`, {
        purchase_order_id,
        lines,
      })
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['bill', id] })
    },
  })
}

export function useVoidBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Bill }>(`/bills/${id}/void`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['bill', id] })
    },
  })
}
