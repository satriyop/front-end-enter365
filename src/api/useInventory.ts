import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api, type PaginatedResponse } from './client'
import type { Ref, ComputedRef } from 'vue'
import { computed } from 'vue'
import type { components } from './types'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type InventoryMovement = components['schemas']['InventoryMovementResource']
export type ProductStock = components['schemas']['ProductStockResource']
export type Warehouse = components['schemas']['WarehouseResource']

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

export type StockTransferData = components['schemas']['StockTransferRequest']

// ─────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────

/**
 * Fetch paginated stock levels for the inventory list page
 */
export function useStockLevels(filters: Ref<InventoryFilters>) {
  return useQuery({
    queryKey: computed(() => ['inventory', 'stock-levels', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<ProductStock>>(
        '/inventory/stock-levels', {
          params: cleanParams
        }
      )
      return response.data
    },
  })
}

/**
 * Fetch inventory movements
 */
export function useInventoryMovements(filters: Ref<MovementFilters> | ComputedRef<MovementFilters>) {
  return useQuery({
    queryKey: computed(() => ['inventory', 'movements', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<InventoryMovement>>('/inventory/movements', {
        params: cleanParams
      })
      return response.data
    },
  })
}

/**
 * Fetch stock card for a product
 */
export function useStockCard(
  productId: Ref<number | string>,
  warehouseId?: Ref<number | undefined>,
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: computed(() => ['inventory', 'stock-card', productId.value, warehouseId?.value, startDate?.value, endDate?.value]),
    queryFn: async () => {
      const params: Record<string, any> = {}
      if (warehouseId?.value) params.warehouse_id = warehouseId.value
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value

      const response = await api.get<StockCardResponse>(
        `/inventory/stock-card/${productId.value}`, {
          params
        }
      )
      return response.data
    },
    enabled: computed(() => !!productId.value),
  })
}

/**
 * Fetch stock valuation report
 */
export function useStockValuation(warehouseId?: Ref<number | undefined>) {
  return useQuery({
    queryKey: computed(() => ['inventory', 'valuation', warehouseId?.value]),
    queryFn: async () => {
      const params: Record<string, any> = {}
      if (warehouseId?.value) params.warehouse_id = warehouseId.value
      
      const response = await api.get<StockValuationResponse>('/inventory/valuation', {
        params
      })
      return response.data
    },
  })
}

/**
 * Record stock adjustment
 */
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

/**
 * Record stock in
 */
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

/**
 * Record stock out
 */
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
 * Transfer stock between warehouses
 */
export function useStockTransfer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: StockTransferData) => {
      const response = await api.post<{ message: string; data: InventoryMovement }>(
        '/inventory/transfer',
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
 * @deprecated Use useWarehousesLookup from '@/api/useWarehouses' instead
 */
export { useWarehousesLookup } from './useWarehouses'

// ─────────────────────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────────────────────

export interface MovementSummaryFilters {
  warehouse_id?: number
  start_date?: string
  end_date?: string
}

export interface MovementSummaryResponse {
  warehouse: { id: number; code: string; name: string } | null
  period: { start_date: string; end_date: string }
  summary: {
    total_in: number
    total_out: number
    net_movement: number
    total_value_in: number
    total_value_out: number
  }
  by_type: Array<{
    type: string
    type_label: string
    count: number
    quantity_in: number
    quantity_out: number
    value_in: number
    value_out: number
  }>
  by_product: Array<{
    product_id: number
    sku: string
    name: string
    quantity_in: number
    quantity_out: number
    net_quantity: number
  }>
}

export interface VarianceReportFilters {
  opname_id?: number
  warehouse_id?: number
}

export interface VarianceReportResponse {
  opname: {
    id: number
    reference: string
    opname_date: string
    status: { value: string; label: string }
  }
  warehouse: { id: number; code: string; name: string }
  summary: {
    total_items: number
    items_with_variance: number
    total_variance_value: number
  }
  items: Array<{
    product_id: number
    sku: string
    name: string
    system_quantity: number
    counted_quantity: number
    variance: number
    unit_cost: number
    variance_value: number
  }>
}

/**
 * Fetch movement summary report
 */
export function useMovementSummary(filters: Ref<MovementSummaryFilters>) {
  return useQuery({
    queryKey: computed(() => ['inventory', 'movement-summary', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<MovementSummaryResponse>('/inventory/movement-summary', {
        params: cleanParams
      })
      return response.data
    },
  })
}

/**
 * Fetch variance report for stock opname
 */
export function useVarianceReport(opnameId: Ref<number | string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['inventory', 'variance-report', opnameId.value]),
    queryFn: async () => {
      const response = await api.get<VarianceReportResponse>(`/stock-opnames/${opnameId.value}/variance-report`)
      return response.data
    },
    enabled: computed(() => !!opnameId.value),
  })
}