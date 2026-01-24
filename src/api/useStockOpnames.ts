/**
 * Stock Opnames API hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components, paths } from './types'
import type { Ref } from 'vue'

// ============================================
// Types
// ============================================

export type StockOpname = components['schemas']['StockOpnameResource']
export type StockOpnameItem = components['schemas']['StockOpnameItemResource']

export interface StockOpnameFilters {
  page?: number
  per_page?: number
  status?: string
  warehouse_id?: number
  search?: string
  include?: string[]
}

export type CreateStockOpnameData = paths['/stock-opnames']['post']['requestBody']['content']['application/json']
export type UpdateStockOpnameData = paths['/stock-opnames/{stockOpname}']['put']['requestBody']['content']['application/json']

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<StockOpname, StockOpnameFilters, CreateStockOpnameData>({
  resourceName: 'stock-opnames',
  singularName: 'stockOpname',
})

export const useStockOpnames = hooks.useList
export const useStockOpname = hooks.useSingle
export const useCreateStockOpname = hooks.useCreate
export const useUpdateStockOpname = hooks.useUpdate
export const useDeleteStockOpname = hooks.useDelete

// ============================================
// Workflow Action Hooks
// ============================================

/**
 * Start the counting process for a Stock Opname
 */
export function useStartCounting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: StockOpname }>(`/stock-opnames/${id}/start-counting`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-opnames'] })
      queryClient.invalidateQueries({ queryKey: ['stockOpname', data.id] })
    },
  })
}

/**
 * Submit counting results for review
 */
export function useSubmitForReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: StockOpname }>(`/stock-opnames/${id}/submit-review`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-opnames'] })
      queryClient.invalidateQueries({ queryKey: ['stockOpname', data.id] })
    },
  })
}

/**
 * Approve and complete the Stock Opname (adjusts inventory)
 */
export function useApproveOpname() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: StockOpname }>(`/stock-opnames/${id}/approve`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-opnames'] })
      queryClient.invalidateQueries({ queryKey: ['stockOpname', data.id] })
      queryClient.invalidateQueries({ queryKey: ['inventory'] }) // Refresh stock levels
    },
  })
}

/**
 * Reject and return to counting phase
 */
export function useRejectOpname() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number | string; reason?: string }) => {
      const response = await api.post<{ data: StockOpname }>(`/stock-opnames/${id}/reject`, { reason })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-opnames'] })
      queryClient.invalidateQueries({ queryKey: ['stockOpname', data.id] })
    },
  })
}

/**
 * Cancel a Stock Opname
 */
export function useCancelOpname() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: StockOpname }>(`/stock-opnames/${id}/cancel`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stock-opnames'] })
      queryClient.invalidateQueries({ queryKey: ['stockOpname', data.id] })
    },
  })
}

// ================= ===========================
// Item Management Hooks
// ============================================

/**
 * Update a specific item's counted quantity
 */
export function useUpdateOpnameItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ 
      opnameId, 
      itemId, 
      data 
    }: { 
      opnameId: number | string; 
      itemId: number | string; 
      data: { counted_quantity: number; notes?: string } 
    }) => {
      const response = await api.put<{ data: StockOpnameItem }>(
        `/stock-opnames/${opnameId}/items/${itemId}`, 
        data
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stockOpname', variables.opnameId] })
    },
  })
}
