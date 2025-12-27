import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'

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
// Query Hooks
// ============================================

/**
 * Fetch paginated list of BOMs
 */
export function useBoms(filters: Ref<BomFilters>) {
  return useQuery({
    queryKey: computed(() => ['boms', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<Bom>>('/boms', {
        params: cleanParams
      })
      return response.data
    },
  })
}

/**
 * Fetch single BOM by ID
 */
export function useBom(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['bom', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: Bom }>(`/boms/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

/**
 * Fetch active BOMs for dropdown/select (lightweight)
 */
export function useActiveBoms() {
  return useQuery({
    queryKey: ['boms', 'active'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Bom>>('/boms', {
        params: {
          per_page: 100,
          status: 'active',
        }
      })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create a new BOM
 */
export function useCreateBom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BomInput) => {
      const response = await api.post<{ data: Bom }>('/boms', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
    },
  })
}

/**
 * Update an existing BOM
 */
export function useUpdateBom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BomInput> }) => {
      const response = await api.put<{ data: Bom }>(`/boms/${id}`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      queryClient.invalidateQueries({ queryKey: ['bom', variables.id] })
    },
  })
}

/**
 * Delete a BOM
 */
export function useDeleteBom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/boms/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
    },
  })
}

/**
 * Activate a BOM
 */
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

/**
 * Deactivate a BOM
 */
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

/**
 * Duplicate a BOM
 */
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

/**
 * Calculate production cost for a BOM
 */
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
