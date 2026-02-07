/**
 * Work Orders API hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed } from 'vue'
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

// ============================================
// Manufacturing Execution Hooks
// ============================================

export interface RecordOutputData {
  quantity: number
  scrapped?: number
}

export function useRecordOutput() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: RecordOutputData }) => {
      const response = await api.post<{ data: WorkOrder }>(`/work-orders/${id}/record-output`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['work-order', variables.id] })
    },
  })
}

export interface ConsumptionItem {
  product_id: number
  work_order_item_id?: number | null
  quantity_consumed: number
  quantity_scrapped?: number
  scrap_reason?: string
  unit?: string
  unit_cost?: number
  consumed_date?: string
  batch_number?: string
  notes?: string
}

export function useRecordConsumption() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, consumptions }: { id: number | string; consumptions: ConsumptionItem[] }) => {
      const response = await api.post<{ data: WorkOrder }>(`/work-orders/${id}/record-consumption`, { consumptions })
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['work-order', variables.id] })
    },
  })
}

export interface CreateMaterialRequisitionData {
  warehouse_id?: number
  requested_date?: string
  required_date?: string
  notes?: string
}

type MaterialRequisition = components['schemas']['MaterialRequisitionResource']

export function useCreateMaterialRequisition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ workOrderId, data }: { workOrderId: number | string; data?: CreateMaterialRequisitionData }) => {
      const response = await api.post<{ data: MaterialRequisition }>(`/work-orders/${workOrderId}/material-requisitions`, data || {})
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['work-order', variables.workOrderId] })
      queryClient.invalidateQueries({ queryKey: ['material-requisitions'] })
    },
  })
}

// ============================================
// Cost Summary
// ============================================

export interface WorkOrderCostSummary {
  work_order: {
    id: number
    wo_number: string
    status: { value: string; label: string }
  }
  materials: {
    planned_cost: number
    actual_cost: number
    variance: number
    items: Array<{
      product_id: number
      product_name: string
      planned_qty: number
      actual_qty: number
      unit_cost: number
      planned_cost: number
      actual_cost: number
    }>
  }
  labor: {
    planned_cost: number
    actual_cost: number
    variance: number
  }
  overhead: {
    planned_cost: number
    actual_cost: number
    variance: number
  }
  totals: {
    planned_cost: number
    actual_cost: number
    variance: number
    variance_percent: number
  }
}

export function useWorkOrderCostSummary(id: import('vue').Ref<number | string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['work-orders', id.value, 'cost-summary']),
    queryFn: async () => {
      const response = await api.get<WorkOrderCostSummary>(`/work-orders/${id.value}/cost-summary`)
      return response.data
    },
    enabled: computed(() => !!id.value),
  })
}

// ============================================
// Sub-Work Orders
// ============================================

export interface SubWorkOrder {
  id: number
  sub_wo_number: string
  parent_work_order_id: number
  description: string
  status: { value: string; label: string }
  planned_start: string
  planned_end: string
  actual_start?: string
  actual_end?: string
  assigned_to?: string
  progress_percent: number
  notes?: string
}

export function useSubWorkOrders(parentId: import('vue').Ref<number | string | undefined>) {
  return useQuery({
    queryKey: computed(() => ['work-orders', parentId.value, 'sub-work-orders']),
    queryFn: async () => {
      const response = await api.get<{ data: SubWorkOrder[] }>(`/work-orders/${parentId.value}/sub-work-orders`)
      return response.data.data
    },
    enabled: computed(() => !!parentId.value),
  })
}

export function useCreateSubWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ parentId, data }: { parentId: number | string; data: Partial<SubWorkOrder> }) => {
      const response = await api.post<{ data: SubWorkOrder }>(`/work-orders/${parentId}/sub-work-orders`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', variables.parentId, 'sub-work-orders'] })
    },
  })
}

export function useUpdateSubWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: Partial<SubWorkOrder> }) => {
      const response = await api.put<{ data: SubWorkOrder }>(`/sub-work-orders/${id}`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders', data.parent_work_order_id, 'sub-work-orders'] })
    },
  })
}

export function useDeleteSubWorkOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.delete(`/sub-work-orders/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })
}
