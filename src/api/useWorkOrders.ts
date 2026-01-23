/**
 * Work Orders API hooks
 */

import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components, paths } from './types'

// ============================================
// Types
// ============================================

export type WorkOrder = components['schemas']['WorkOrderResource']

export interface WorkOrderFilters {
  page?: number
  per_page?: number
  status?: string
  type?: string
  search?: string
  project_id?: number | string
}

export type CreateWorkOrderData = paths['/work-orders']['post']['requestBody']['content']['application/json']

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<WorkOrder, WorkOrderFilters, CreateWorkOrderData>({
  resourceName: 'work-orders',
  singularName: 'work-order',
})

export const useWorkOrders = hooks.useList
export const useWorkOrder = hooks.useSingle
export const useCreateWorkOrder = hooks.useCreate
export const useUpdateWorkOrder = hooks.useUpdate
export const useDeleteWorkOrder = hooks.useDelete
export const useWorkOrdersLookup = hooks.useLookup

// ============================================
// Custom Action Hooks
// ============================================

export function useConfirmWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: WorkOrder }>(`/work-orders/${id}/confirm`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}

export function useStartWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: WorkOrder }>(`/work-orders/${id}/start`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}

export function useCompleteWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: WorkOrder }>(`/work-orders/${id}/complete`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}

export function useCancelWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number | string; reason?: string }) => {
      const response = await api.post<{ data: WorkOrder }>(`/work-orders/${id}/cancel`, { reason })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}
