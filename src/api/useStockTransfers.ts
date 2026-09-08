import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'

export interface StockTransferItem {
  id?: number
  product_id: number
  product?: { id: number; sku: string; name: string; unit: string }
  quantity: number
  unit: string
  notes?: string | null
}

export interface StockTransfer {
  id: number
  transfer_number: string
  operation_type: 'internal' | 'receipt' | 'delivery'
  from_warehouse_id: number | null
  from_warehouse?: { id: number; code: string; name: string } | null
  to_warehouse_id: number | null
  to_warehouse?: { id: number; code: string; name: string } | null
  contact_id: number | null
  contact?: { id: number; name: string; code: string | null } | null
  scheduled_date: string
  source_document: string | null
  status: { value: string; label: string; color: string }
  notes: string | null
  items?: StockTransferItem[]
}

export interface StockTransferFilters {
  page?: number
  per_page?: number
  status?: string
  operation_type?: string
  search?: string
}

export interface CreateStockTransferData {
  operation_type: 'internal' | 'receipt' | 'delivery'
  from_warehouse_id?: number | null
  to_warehouse_id?: number | null
  contact_id?: number | null
  scheduled_date?: string
  source_document?: string | null
  notes?: string | null
  items: Array<{
    product_id: number
    quantity: number
    unit?: string
    notes?: string | null
  }>
}

const hooks = createCrudHooks<StockTransfer, StockTransferFilters, CreateStockTransferData>({
  resourceName: 'stock-transfers',
  singularName: 'stockTransfer',
})

export const useStockTransfers = hooks.useList
export const useStockTransfer = hooks.useSingle
export const useCreateStockTransfer = hooks.useCreate

export function useConfirmStockTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: StockTransfer }>(`/stock-transfers/${id}/confirm`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
      queryClient.invalidateQueries({ queryKey: ['stockTransfer'] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })
}

export function useCancelStockTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: StockTransfer }>(`/stock-transfers/${id}/cancel`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] })
      queryClient.invalidateQueries({ queryKey: ['stockTransfer'] })
    },
  })
}

export function transferStatusLabel(value: string, fallback?: string): string {
  if (value === 'draft') return 'Draft'
  if (value === 'completed') return 'Done'
  if (value === 'cancelled') return 'Cancelled'
  return fallback ?? value
}
