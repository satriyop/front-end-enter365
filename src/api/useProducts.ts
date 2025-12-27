import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'
import type { components } from './types'

// ============================================
// Types from OpenAPI spec
// ============================================

export type Product = components['schemas']['ProductResource']

export interface ProductFilters {
  page?: number
  per_page?: number
  search?: string
  type?: 'product' | 'service'
  category_id?: number
  is_active?: boolean
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch paginated list of products
 */
export function useProducts(filters: Ref<ProductFilters>) {
  return useQuery({
    queryKey: computed(() => ['products', filters.value]),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Product>>('/products', {
        params: filters.value
      })
      return response.data
    },
  })
}

/**
 * Fetch single product by ID
 */
export function useProduct(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['product', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: Product }>(`/products/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

/**
 * Fetch products for dropdown/select (lightweight lookup)
 */
export function useProductsLookup(type?: 'product' | 'service') {
  return useQuery({
    queryKey: ['products', 'lookup', type],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Product>>('/products', {
        params: {
          per_page: 100,
          is_active: true,
          type: type,
        }
      })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

// ============================================
// Mutation Hooks
// ============================================

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const response = await api.post<{ data: Product }>('/products', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      const response = await api.put<{ data: Product }>(`/products/${id}`, data)
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', id] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/products/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
