import { createCrudHooks } from './factory'
import type { components } from './types'

// ============================================
// Types
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

export type CreateProductData = Partial<Product>

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
