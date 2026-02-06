/**
 * Material Requisitions API Hooks
 *
 * Handles material requisitions for work orders - requesting, approving, and issuing materials.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'

// Query keys
const QUERY_KEYS = {
  all: ['material-requisitions'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  detail: (id: number) => [...QUERY_KEYS.all, 'detail', id] as const,
}

// Types from OpenAPI schema
export type MaterialRequisition = components['schemas']['MaterialRequisitionResource']
export type MaterialRequisitionItem = components['schemas']['MaterialRequisitionItemResource']

// Filter types
export interface MaterialRequisitionFilters {
  page?: number
  per_page?: number
  status?: MaterialRequisitionStatus
  search?: string
  work_order_id?: number
  warehouse_id?: number
}

// Status types
export type MaterialRequisitionStatus = 'draft' | 'pending' | 'approved' | 'partial' | 'issued' | 'cancelled'

// Create types
export type CreateMaterialRequisitionData = components['schemas']['StoreMaterialRequisitionRequest']

// Update types
export type UpdateMaterialRequisitionData = components['schemas']['UpdateMaterialRequisitionRequest']

// Issue items data
export interface IssueItemsData {
  items: {
    item_id: number
    quantity_issued: number
    warehouse_location?: string
  }[]
  issue_notes?: string
}

// CRUD hooks via factory
const hooks = createCrudHooks<MaterialRequisition, MaterialRequisitionFilters, CreateMaterialRequisitionData>({
  resourceName: 'material-requisitions',
  singularName: 'material-requisition',
})

export const useMaterialRequisitions = hooks.useList
export const useMaterialRequisition = hooks.useSingle
export const useCreateMaterialRequisition = hooks.useCreate
export const useUpdateMaterialRequisition = hooks.useUpdate
export const useDeleteMaterialRequisition = hooks.useDelete

// ============================================================================
// Workflow Actions
// ============================================================================

/**
 * Approve material requisition
 */
export function useApproveMaterialRequisition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: { notes?: string } }) => {
      const response = await api.post<{ data: MaterialRequisition }>(
        `/material-requisitions/${id}/approve`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
    },
  })
}

/**
 * Issue materials for requisition
 */
export function useIssueMaterialRequisition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: IssueItemsData }) => {
      const response = await api.post<{ data: MaterialRequisition }>(
        `/material-requisitions/${id}/issue`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
    },
  })
}

/**
 * Cancel material requisition
 */
export function useCancelMaterialRequisition() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{ data: MaterialRequisition }>(
        `/material-requisitions/${id}/cancel`,
        { reason }
      )
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
    },
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get status display info
 */
export function getMaterialRequisitionStatus(mr: MaterialRequisition): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    partial: { label: 'Partial Issue', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    issued: { label: 'Issued', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  }
  const statusValue = mr.status && typeof mr.status === 'object' ? mr.status.value : mr.status
  return statusMap[statusValue] || { label: statusValue, color: 'bg-slate-100 text-slate-700' }
}

/**
 * Format requisition number for display
 */
export function formatMRNumber(mr: MaterialRequisition): string {
  return mr.requisition_number || `MR-${mr.id}`
}

// ============================================================================
// Material Status Report
// ============================================================================

export interface MaterialStatusItem {
  product_id: number
  product_sku: string
  product_name: string
  work_order_id: number
  work_order_number: string
  requisition_id: number
  requisition_number: string
  required_qty: number
  issued_qty: number
  pending_qty: number
  status: 'pending' | 'partial' | 'complete'
  expected_date?: string
}

export interface MaterialStatusReport {
  items: MaterialStatusItem[]
  summary: {
    total_items: number
    pending_items: number
    partial_items: number
    complete_items: number
  }
}

/**
 * Get material status report for work orders
 */
export function useMaterialStatus(
  workOrderId?: Ref<number | undefined>,
  warehouseId?: Ref<number | undefined>
) {
  return useQuery({
    queryKey: computed(() => ['material-status', workOrderId?.value, warehouseId?.value]),
    queryFn: async () => {
      const params: Record<string, unknown> = {}
      if (workOrderId?.value) params.work_order_id = workOrderId.value
      if (warehouseId?.value) params.warehouse_id = warehouseId.value

      const response = await api.get<MaterialStatusReport>('/material-requisitions/status-report', { params })
      return response.data
    },
  })
}
