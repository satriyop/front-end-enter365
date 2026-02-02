/**
 * Delivery Orders API hooks
 *
 * Delivery Orders track the physical shipment of goods to customers.
 * Workflow: Draft → Confirmed → Shipped → Delivered
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

export type DeliveryOrder = components['schemas']['DeliveryOrderResource']
export type DeliveryOrderItem = components['schemas']['DeliveryOrderItemResource']

export interface DeliveryOrderFilters {
  page?: number
  per_page?: number
  status?: 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  search?: string
  contact_id?: number
  invoice_id?: number
  warehouse_id?: number
  start_date?: string
  end_date?: string
}

export interface CreateDeliveryOrderData {
  contact_id: number
  invoice_id?: number
  warehouse_id?: number
  do_date: string
  shipping_address?: string
  shipping_method?: string
  notes?: string
  items: CreateDeliveryOrderItem[]
}

export interface CreateDeliveryOrderItem {
  product_id?: number | null
  description: string
  quantity: number
  unit?: string
}

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<DeliveryOrder, DeliveryOrderFilters, CreateDeliveryOrderData>({
  resourceName: 'delivery-orders',
  singularName: 'delivery-order',
})

export const useDeliveryOrders = hooks.useList
export const useDeliveryOrder = hooks.useSingle
export const useCreateDeliveryOrder = hooks.useCreate
export const useUpdateDeliveryOrder = hooks.useUpdate
export const useDeleteDeliveryOrder = hooks.useDelete

// ============================================
// Delivery Orders for Invoice
// ============================================

export function useDeliveryOrdersForInvoice(invoiceId: MaybeRef<number>) {
  return useQuery({
    queryKey: ['delivery-orders', 'for-invoice', invoiceId],
    queryFn: async () => {
      const id = toValue(invoiceId)
      const response = await api.get<{ data: DeliveryOrder[] }>(`/invoices/${id}/delivery-orders`)
      return response.data.data
    },
    enabled: () => toValue(invoiceId) > 0,
  })
}

// ============================================
// Create from Invoice
// ============================================

export interface CreateFromInvoiceData {
  do_date?: string
  warehouse_id?: number
  shipping_address?: string
  shipping_method?: string
  notes?: string
}

export function useCreateDeliveryOrderFromInvoice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ invoiceId, data }: { invoiceId: number; data: CreateFromInvoiceData }) => {
      const response = await api.post<{ data: DeliveryOrder }>(`/invoices/${invoiceId}/create-delivery-order`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['delivery-order', data.id], data)
    },
  })
}

// ============================================
// Statistics
// ============================================

export interface DeliveryOrderStatistics {
  total_count: number
  by_status: {
    draft: number
    confirmed: number
    shipped: number
    delivered: number
    cancelled: number
  }
  pending_delivery: number
  delivered_this_month: number
}

export function useDeliveryOrderStatistics(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['delivery-orders', 'statistics', { startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)
      const queryString = params.toString()
      const url = queryString ? `/delivery-orders-statistics?${queryString}` : '/delivery-orders-statistics'
      const response = await api.get<DeliveryOrderStatistics>(url)
      return response.data
    },
  })
}

// ============================================
// Workflow Action Hooks
// ============================================

export function useConfirmDeliveryOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: DeliveryOrder }>(`/delivery-orders/${id}/confirm`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] })
      queryClient.setQueryData(['delivery-order', data.id], data)
    },
  })
}

export interface ShipDeliveryOrderData {
  shipping_date?: string
  tracking_number?: string
  driver_name?: string
  vehicle_number?: string
}

export function useShipDeliveryOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: ShipDeliveryOrderData }) => {
      const response = await api.post<{ data: DeliveryOrder }>(`/delivery-orders/${id}/ship`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] })
      queryClient.setQueryData(['delivery-order', data.id], data)
    },
  })
}

export interface DeliverDeliveryOrderData {
  received_date?: string
  received_by?: string
  delivery_notes?: string
}

export function useDeliverDeliveryOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: DeliverDeliveryOrderData }) => {
      const response = await api.post<{ data: DeliveryOrder }>(`/delivery-orders/${id}/deliver`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['delivery-order', data.id], data)
    },
  })
}

export function useCancelDeliveryOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{ data: DeliveryOrder }>(`/delivery-orders/${id}/cancel`, { reason })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] })
      queryClient.setQueryData(['delivery-order', data.id], data)
    },
  })
}

// ============================================
// Update Delivery Progress (Partial Delivery)
// ============================================

export interface UpdateProgressItem {
  item_id: number
  quantity_delivered: number
}

export function useUpdateDeliveryProgress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, items }: { id: number; items: UpdateProgressItem[] }) => {
      const response = await api.post<{ data: DeliveryOrder }>(`/delivery-orders/${id}/update-progress`, { items })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] })
      queryClient.setQueryData(['delivery-order', data.id], data)
    },
  })
}

// ============================================
// Duplicate
// ============================================

export function useDuplicateDeliveryOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: DeliveryOrder }>(`/delivery-orders/${id}/duplicate`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] })
    },
  })
}

// ============================================
// Helper Functions
// ============================================

export type DeliveryOrderStatus = 'draft' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export function getDeliveryOrderStatus(dorder: DeliveryOrder): { label: string; color: string } {
  const colorMap: Record<DeliveryOrderStatus, string> = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    shipped: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }

  const statusObj = dorder.status && typeof dorder.status === 'object' ? dorder.status : null
  const statusValue = (statusObj?.value || dorder.status || 'draft') as DeliveryOrderStatus
  const label = statusObj?.label || statusValue
  const color = colorMap[statusValue] || colorMap.draft

  return { label, color }
}

export function formatDONumber(dorder: DeliveryOrder): string {
  return dorder.do_number || `DO-${dorder.id}`
}
