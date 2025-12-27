/**
 * Work Orders API hooks
 * Level 2 Pattern: Types + Queries + Mutations in one file
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import type { Ref } from 'vue'
import type { components } from './types'

// Types from OpenAPI
export type WorkOrder = components['schemas']['WorkOrderResource']

export interface WorkOrderFilters {
  page?: number
  per_page?: number
  status?: string
  type?: string
  search?: string
  project_id?: number | string
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// Queries
export function useWorkOrders(filters: Ref<WorkOrderFilters>) {
  return useQuery({
    queryKey: ['work-orders', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      const f = filters.value
      if (f.page) params.set('page', String(f.page))
      if (f.per_page) params.set('per_page', String(f.per_page))
      if (f.status) params.set('status', f.status)
      if (f.type) params.set('type', f.type)
      if (f.search) params.set('search', f.search)
      if (f.project_id) params.set('project_id', String(f.project_id))

      const response = await api.get<PaginatedResponse<WorkOrder>>(`/work-orders?${params}`)
      return response.data
    },
  })
}

export function useWorkOrder(id: Ref<number | string>) {
  return useQuery({
    queryKey: ['work-orders', id],
    queryFn: async () => {
      const response = await api.get<{ data: WorkOrder }>(`/work-orders/${id.value}`)
      return response.data.data
    },
    enabled: () => !!id.value,
  })
}

// Mutations
export function useCreateWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<WorkOrder>) => {
      const response = await api.post<{ data: WorkOrder }>('/work-orders', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: Partial<WorkOrder> }) => {
      const response = await api.put<{ data: WorkOrder }>(`/work-orders/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}

export function useDeleteWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.delete(`/work-orders/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}

// Work Order Actions
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
