import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref, type ComputedRef } from 'vue'
import { createCrudHooks } from './factory'
import { api } from './client'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type Product = components['schemas']['ProductResource']
export type CreateProductData = components['schemas']['StoreProductRequest']

export interface ProductFilters {
  page?: number
  per_page?: number
  search?: string
  type?: 'product' | 'service'
  category_id?: number
  is_active?: boolean
}

export interface LowStockFilters {
  page?: number
  per_page?: number
  warehouse_id?: number
}

export interface StockAdjustmentData {
  warehouse_id: number
  quantity_change: number
  reason: string
}

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<Product, ProductFilters, CreateProductData>({
  resourceName: 'products',
  lookupParams: { is_active: true },
})

export const useProducts = hooks.useList
export const useProduct = hooks.useSingle
export const useProductsLookup = hooks.useLookup
export const useCreateProduct = hooks.useCreate
export const useUpdateProduct = hooks.useUpdate
export const useDeleteProduct = hooks.useDelete

// ============================================
// Additional Hooks
// ============================================

/**
 * Duplicate a product
 * Creates a copy of the product with a new SKU
 */
export function useDuplicateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Product }>(`/products/${id}/duplicate`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Adjust stock for a product
 * Allows manual stock adjustments with audit trail
 */
export function useAdjustProductStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, data }: { productId: number; data: StockAdjustmentData }) => {
      const response = await api.post<{ data: Product }>(`/products/${productId}/adjust-stock`, data)
      return response.data.data
    },
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', productId] })
    },
  })
}

/**
 * Fetch products with low stock
 */
export function useLowStockProducts(
  filters: Ref<LowStockFilters> | ComputedRef<LowStockFilters>
) {
  return useQuery({
    queryKey: computed(() => ['products', 'low-stock', filters.value]),
    queryFn: async () => {
      const params = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== undefined && v !== '')
      )
      const response = await api.get<{ data: Product[] }>('/products-low-stock', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Export product price list as CSV
 * Uses blob download pattern for authenticated downloads
 */
export function useExportProductPriceList() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/products-price-list', {
        responseType: 'blob',
      })

      // Create blob and trigger download
      const blob = new Blob([response.data], { type: 'text/csv' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `price-list-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      URL.revokeObjectURL(link.href)

      return true
    },
  })
}
