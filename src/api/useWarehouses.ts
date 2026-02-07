import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref, type ComputedRef } from 'vue'
import { createCrudHooks } from './factory'
import { api } from './client'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type Warehouse = components['schemas']['WarehouseResource']
export type CreateWarehouseData = components['schemas']['StoreWarehouseRequest']
export type UpdateWarehouseData = components['schemas']['UpdateWarehouseRequest']

export interface WarehouseFilters {
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
}

export interface WarehouseStockSummary {
  warehouse: {
    id: number
    code: string
    name: string
  }
  summary: {
    total_products: number
    total_quantity: number
    total_value: number
  }
}

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<Warehouse, WarehouseFilters, CreateWarehouseData, UpdateWarehouseData>({
  resourceName: 'warehouses',
  lookupParams: { is_active: true },
})

export const useWarehouses = hooks.useList
export const useWarehouse = hooks.useSingle
export const useCreateWarehouse = hooks.useCreate
export const useUpdateWarehouse = hooks.useUpdate
export const useDeleteWarehouse = hooks.useDelete

/**
 * Fetch warehouses for dropdown/select (lightweight)
 * Returns only active warehouses
 */
export function useWarehousesLookup() {
  return hooks.useLookup()
}

/**
 * Fetch stock summary for a specific warehouse
 */
export function useWarehouseStockSummary(
  id: Ref<number | string | null | undefined> | ComputedRef<number | string | null | undefined>
) {
  return useQuery({
    queryKey: computed(() => ['warehouse', id.value, 'stock-summary']),
    queryFn: async () => {
      if (!id.value) return null
      const response = await api.get<WarehouseStockSummary>(
        `/warehouses/${id.value}/stock-summary`
      )
      return response.data
    },
    enabled: computed(() => !!id.value),
  })
}

/**
 * Set a warehouse as default
 */
export function useSetDefaultWarehouse() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Warehouse }>(
        `/warehouses/${id}/set-default`
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] })
    },
  })
}
