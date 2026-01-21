import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api, type PaginatedResponse } from './client'
import type { Ref, ComputedRef } from 'vue'
import { computed } from 'vue'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface InventoryMovement {
  id: number
  product_id: number
  product?: {
    id: number
    sku: string
    name: string
    unit: string
  }
  warehouse_id: number
  warehouse?: {
    id: number
    code: string
    name: string
  }
  type: 'in' | 'out' | 'adjustment' | 'transfer_in' | 'transfer_out'
  quantity: number
  unit_cost: number
  total_cost: number
  balance_after: number
  movement_date: string
  reference_type?: string
  reference_id?: number
  notes?: string
  created_by?: number
  created_by_user?: {
    id: number
    name: string
  }
  created_at: string
}

export interface ProductStock {
  id: number
  product_id: number
  product?: {
    id: number
    sku: string
    name: string
    unit: string
  }
  warehouse_id: number
  warehouse?: {
    id: number
    name: string
  }
  quantity: number
  average_cost: number
  total_value: number
}

export interface StockCardResponse {
  product: {
    id: number
    sku: string
    name: string
    unit: string
    current_stock: number
  }
  warehouse: {
    id: number
    code: string
    name: string
  } | null
  movements: InventoryMovement[]
}

export interface StockValuationResponse {
  warehouse: {
    id: number
    code: string
    name: string
  } | null
  summary: {
    total_items: number
    total_value: number
  }
  items: Array<{
    product_id: number
    sku: string
    name: string
    quantity: number
    average_cost: number
    total_value: number
  }>
}

export interface MovementFilters {
  page?: number
  per_page?: number
  product_id?: number
  warehouse_id?: number
  type?: string
  start_date?: string
  end_date?: string
}

export interface InventoryFilters {
  page?: number
  per_page?: number
  search?: string
  warehouse_id?: number
}

export interface StockAdjustmentData {
  product_id: number
  warehouse_id?: number
  new_quantity: number
  new_unit_cost?: number
  notes?: string
}

export interface StockInData {
  product_id: number
  warehouse_id?: number
  quantity: number
  unit_cost: number
  notes?: string
}

export interface StockOutData {
  product_id: number
  warehouse_id?: number
  quantity: number
  notes?: string
}

export interface Warehouse {
  id: number
  code: string
  name: string
  address?: string
  is_default: boolean
  is_active: boolean
}

// ─────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────

/**
 * Fetch paginated stock levels for the inventory list page
 */
export function useStockLevels(filters: Ref<InventoryFilters>) {
  return useQuery({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryKey: computed(() => ['inventory', 'stock-levels', filters.value]) as any,
    queryFn: async () => {
      const params = new URLSearchParams()
      const f = filters.value
      if (f.page) params.set('page', String(f.page))
      if (f.per_page) params.set('per_page', String(f.per_page))
      if (f.search) params.set('search', f.search)
      if (f.warehouse_id) params.set('warehouse_id', String(f.warehouse_id))

      const response = await api.get<PaginatedResponse<ProductStock>>(
        `/inventory/stock-levels?${params}`
      )
      return response.data
    },
  })
}

export function useInventoryMovements(filters: Ref<MovementFilters> | ComputedRef<MovementFilters>) {
  return useQuery({
    queryKey: ['inventory', 'movements', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      const f = filters.value
      if (f.page) params.set('page', String(f.page))
      if (f.per_page) params.set('per_page', String(f.per_page))
      if (f.product_id) params.set('product_id', String(f.product_id))
      if (f.warehouse_id) params.set('warehouse_id', String(f.warehouse_id))
      if (f.type) params.set('type', f.type)
      if (f.start_date) params.set('start_date', f.start_date)
      if (f.end_date) params.set('end_date', f.end_date)

      const response = await api.get<{
        data: InventoryMovement[]
        meta: { current_page: number; last_page: number; per_page: number; total: number }
      }>(`/inventory/movements?${params}`)
      return response.data
    },
  })
}

export function useStockCard(
  productId: Ref<number | string>,
  warehouseId?: Ref<number | undefined>,
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['inventory', 'stock-card', productId, warehouseId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (warehouseId?.value) params.set('warehouse_id', String(warehouseId.value))
      if (startDate?.value) params.set('start_date', startDate.value)
      if (endDate?.value) params.set('end_date', endDate.value)

      const response = await api.get<StockCardResponse>(
        `/inventory/stock-card/${productId.value}?${params}`
      )
      return response.data
    },
    enabled: computed(() => !!productId.value),
  })
}

export function useStockValuation(warehouseId?: Ref<number | undefined>) {
  return useQuery({
    queryKey: ['inventory', 'valuation', warehouseId],
    queryFn: async () => {
      const params = warehouseId?.value ? `?warehouse_id=${warehouseId.value}` : ''
      const response = await api.get<StockValuationResponse>(`/inventory/valuation${params}`)
      return response.data
    },
  })
}

export function useStockAdjust() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: StockAdjustmentData) => {
      const response = await api.post<{ message: string; data: InventoryMovement }>(
        '/inventory/adjust',
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useStockIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: StockInData) => {
      const response = await api.post<{ message: string; data: InventoryMovement }>(
        '/inventory/stock-in',
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useStockOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: StockOutData) => {
      const response = await api.post<{ message: string; data: InventoryMovement }>(
        '/inventory/stock-out',
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Fetch warehouses for dropdown/select (lightweight)
 */
export function useWarehousesLookup() {
  return useQuery({
    queryKey: ['warehouses', 'lookup'],
    queryFn: async () => {
      const response = await api.get<{ data: Warehouse[] }>('/warehouses', {
        params: { is_active: true, per_page: 100 }
      })
      return response.data.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - warehouses don't change often
  })
}
