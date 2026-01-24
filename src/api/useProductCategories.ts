import { useQuery } from '@tanstack/vue-query'
import { createCrudHooks } from './factory'
import { api } from './client'
import type { components, paths } from './types'

// ============================================
// Types
// ============================================

export type ProductCategory = components['schemas']['ProductCategoryResource']

export interface ProductCategoryFilters {
  page?: number
  per_page?: number
  search?: string
  parent_id?: number | null
  is_active?: boolean
}

export type CreateProductCategoryData = paths['/product-categories']['post']['requestBody']['content']['application/json']

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<ProductCategory, ProductCategoryFilters, CreateProductCategoryData>({
  resourceName: 'product-categories',
  singularName: 'productCategory',
  lookupParams: { per_page: 500 },
})

export const useProductCategories = hooks.useList
export const useProductCategory = hooks.useSingle
export const useProductCategoriesLookup = hooks.useLookup
export const useCreateProductCategory = hooks.useCreate
export const useUpdateProductCategory = hooks.useUpdate
export const useDeleteProductCategory = hooks.useDelete

// ============================================
// Additional Hooks
// ============================================

/**
 * Fetch product categories as a tree
 */
export function useProductCategoriesTree() {
  return useQuery({
    queryKey: ['product-categories', 'tree'],
    queryFn: async () => {
      const response = await api.get<{ data: ProductCategory[] }>('/product-categories-tree')
      return response.data.data
    },
    staleTime: 10 * 60 * 1000,
  })
}
