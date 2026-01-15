import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'

// ============================================
// Types
// ============================================

export interface BomProduct {
  id: number
  name: string
  sku: string
}

export interface BomItem {
  id: number
  bom_id: number
  type: 'material' | 'labor' | 'overhead'
  product_id: number | null
  product?: BomProduct
  description: string
  quantity: number
  unit: string
  unit_cost: number
  total_cost: number
  waste_percentage: number
  effective_quantity: number
  sort_order: number
  notes: string | null
  component_standard_id: number | null
  created_at: string
  updated_at: string
}

export interface Bom {
  id: number
  bom_number: string
  name: string
  description: string | null
  product_id: number
  product?: BomProduct
  output_quantity: number
  output_unit: string
  total_material_cost: number
  total_labor_cost: number
  total_overhead_cost: number
  total_cost: number
  unit_cost: number
  status: 'draft' | 'active' | 'inactive'
  version: number
  parent_bom_id: number | null
  variant_group_id: number | null
  variant_name: string | null
  variant_label: string | null
  is_primary_variant: boolean
  variant_sort_order: number | null
  notes: string | null
  items?: BomItem[]
  items_count?: number
  cost_breakdown?: {
    material_percentage: number
    labor_percentage: number
    overhead_percentage: number
  }
  created_by: number
  creator?: { id: number; name: string }
  approved_by: number | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface BomFilters {
  page?: number
  per_page?: number
  status?: 'draft' | 'active' | 'inactive'
  search?: string
  product_id?: number
}

export interface BomItemInput {
  type: 'material' | 'labor' | 'overhead'
  product_id?: number | null
  description: string
  quantity: number
  unit: string
  unit_cost: number
  waste_percentage?: number
  sort_order?: number
  notes?: string
}

export interface BomInput {
  name: string
  description?: string
  product_id: number
  output_quantity: number
  output_unit: string
  notes?: string
  items: BomItemInput[]
}

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<Bom, BomFilters, BomInput>({
  resourceName: 'boms',
  singularName: 'bom',
  lookupParams: { status: 'active' },
})

export const useBoms = hooks.useList
export const useBom = hooks.useSingle
export const useActiveBoms = hooks.useLookup
export const useCreateBom = hooks.useCreate
export const useUpdateBom = hooks.useUpdate
export const useDeleteBom = hooks.useDelete

// ============================================
// Custom Action Hooks
// ============================================

export function useActivateBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Bom }>(`/boms/${id}/activate`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      queryClient.invalidateQueries({ queryKey: ['bom', id] })
    },
  })
}

export function useDeactivateBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Bom }>(`/boms/${id}/deactivate`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      queryClient.invalidateQueries({ queryKey: ['bom', id] })
    },
  })
}

export function useDuplicateBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Bom }>(`/boms/${id}/duplicate`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
    },
  })
}

export function useCalculateBomCost() {
  return useMutation({
    mutationFn: async ({ bomId, quantity }: { bomId: number; quantity: number }) => {
      const response = await api.post<{
        data: {
          bom_id: number
          quantity: number
          material_cost: number
          labor_cost: number
          overhead_cost: number
          total_cost: number
          unit_cost: number
          items: Array<{
            description: string
            quantity: number
            unit_cost: number
            total_cost: number
          }>
        }
      }>('/boms/calculate-cost', { bom_id: bomId, quantity })
      return response.data.data
    },
  })
}
