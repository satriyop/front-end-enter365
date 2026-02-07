/**
 * Stock Opnames API hooks
 */

import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'

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

// Use Scramble-generated request types directly
export type CreateStockOpnameData = components['schemas']['StoreStockOpnameRequest']
export type UpdateStockOpnameData = components['schemas']['UpdateStockOpnameRequest']

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

// ============================================
// Item Management Hooks
// ============================================

/**
 * Generate items from current warehouse stock
 */
export function useGenerateOpnameItems() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: StockOpname }>(`/stock-opnames/${id}/generate-items`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stockOpname', data.id] })
    },
  })
}

/**
 * Add a single item to the stock opname
 */
export function useAddOpnameItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ opnameId, productId }: { opnameId: number | string; productId: number }) => {
      const response = await api.post<{ data: StockOpnameItem }>(
        `/stock-opnames/${opnameId}/items`,
        { product_id: productId }
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stockOpname', variables.opnameId] })
    },
  })
}

/**
 * Remove an item from the stock opname
 */
export function useDeleteOpnameItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ opnameId, itemId }: { opnameId: number | string; itemId: number | string }) => {
      await api.delete(`/stock-opnames/${opnameId}/items/${itemId}`)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stockOpname', variables.opnameId] })
    },
  })
}

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
