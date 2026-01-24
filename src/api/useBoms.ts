import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components, paths } from './types'

// ============================================
// Types
// ============================================

export type Bom = components['schemas']['BomResource']
export type BomItem = components['schemas']['BomItemResource']

export interface BomFilters {
  page?: number
  per_page?: number
  status?: 'draft' | 'active' | 'inactive'
  search?: string
  product_id?: number
}

export type CreateBomData = paths['/boms']['post']['requestBody']['content']['application/json']
export type UpdateBomData = paths['/boms/{bom}']['patch']['requestBody']['content']['application/json']

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<Bom, BomFilters, CreateBomData>({
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

/**
 * Activate a BOM
 */
export function useActivateBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Bom }>(`/boms/${id}/activate`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      queryClient.invalidateQueries({ queryKey: ['bom', data.id] })
    },
  })
}

/**
 * Deactivate a BOM
 */
export function useDeactivateBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Bom }>(`/boms/${id}/deactivate`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
      queryClient.invalidateQueries({ queryKey: ['bom', data.id] })
    },
  })
}

/**
 * Duplicate a BOM
 */
export function useDuplicateBom() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Bom }>(`/boms/${id}/duplicate`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] })
    },
  })
}

/**
 * Calculate production cost for a quantity
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