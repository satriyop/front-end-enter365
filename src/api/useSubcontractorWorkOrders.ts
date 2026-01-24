/**
 * Subcontractor Work Orders API Hooks
 *
 * Manages work orders assigned to subcontractors, including assignment,
 * progress tracking, completion, and invoice creation.
 */

import { computed, type Ref } from 'vue'
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'

// Types from OpenAPI schema
export type SubcontractorWorkOrder = components['schemas']['SubcontractorWorkOrderResource']
export type SubcontractorInvoice = components['schemas']['SubcontractorInvoiceResource']

// Filter types
export interface SubcontractorWorkOrderFilters {
  page?: number
  per_page?: number
  status?: SubcontractorWorkOrderStatus
  search?: string
  subcontractor_id?: number
  project_id?: number
  work_order_id?: number
}

// Status types
export type SubcontractorWorkOrderStatus = 'draft' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'

// Create types
export interface CreateSubcontractorWorkOrderData {
  work_order_id?: number
  project_id?: number
  name: string
  description?: string
  scope_of_work: string
  agreed_amount: number
  retention_percent?: number
  scheduled_start_date: string
  scheduled_end_date: string
  work_location?: string
  location_address?: string
  notes?: string
}

// Update types
export interface UpdateSubcontractorWorkOrderData {
  name?: string
  description?: string
  scope_of_work?: string
  agreed_amount?: number
  retention_percent?: number
  scheduled_start_date?: string
  scheduled_end_date?: string
  work_location?: string
  location_address?: string
  notes?: string
}

// Assign data
export interface AssignSubcontractorData {
  subcontractor_id: number
  notes?: string
}

// Update progress data
export interface UpdateProgressData {
  completion_percentage: number
  notes?: string
}

// Create invoice data
export interface CreateSubcontractorInvoiceData {
  invoice_date: string
  due_date: string
  gross_amount: number
  retention_held?: number
  other_deductions?: number
  description?: string
  notes?: string
}

// Query keys
const QUERY_KEYS = {
  all: ['subcontractor-work-orders'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  detail: (id: number) => [...QUERY_KEYS.all, 'detail', id] as const,
  statistics: () => [...QUERY_KEYS.all, 'statistics'] as const,
  invoices: (id: number) => [...QUERY_KEYS.all, id, 'invoices'] as const,
}

// CRUD hooks via factory
const hooks = createCrudHooks<SubcontractorWorkOrder, SubcontractorWorkOrderFilters, CreateSubcontractorWorkOrderData>({
  resourceName: 'subcontractor-work-orders',
  singularName: 'subcontractor-work-order',
})

export const useSubcontractorWorkOrders = hooks.useList
export const useSubcontractorWorkOrder = hooks.useSingle

/**
 * Fetch subcontractor work order statistics
 */
export function useSubcontractorWorkOrderStatistics() {
  return useQuery({
    queryKey: QUERY_KEYS.statistics(),
    queryFn: async () => {
      const response = await api.get<{
        data: {
          total_count: number
          by_status: Record<string, number>
          total_agreed_amount: number
          total_invoiced_amount: number
          total_paid_amount: number
          active_count: number
          completed_this_month: number
        }
      }>('/subcontractor-work-orders-statistics')
      return response.data.data
    },
  })
}

/**
 * Fetch invoices for a work order
 */
export function useSubcontractorWorkOrderInvoices(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => QUERY_KEYS.invoices(id.value)),
    queryFn: async () => {
      const response = await api.get<{ data: SubcontractorInvoice[] }>(
        `/subcontractor-work-orders/${id.value}/invoices`
      )
      return response.data.data
    },
    enabled: computed(() => id.value > 0),
  })
}

/**
 * Create subcontractor work order
 */
export function useCreateSubcontractorWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSubcontractorWorkOrderData) => {
      const response = await api.post<{ data: SubcontractorWorkOrder }>('/subcontractor-work-orders', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Update subcontractor work order
 */
export function useUpdateSubcontractorWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSubcontractorWorkOrderData }) => {
      const response = await api.put<{ data: SubcontractorWorkOrder }>(
        `/subcontractor-work-orders/${id}`,
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
 * Delete subcontractor work order
 */
export function useDeleteSubcontractorWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/subcontractor-work-orders/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() })
    },
  })
}

// ============================================================================
// Workflow Actions
// ============================================================================

/**
 * Assign subcontractor to work order
 */
export function useAssignSubcontractor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AssignSubcontractorData }) => {
      const response = await api.post<{ data: SubcontractorWorkOrder }>(
        `/subcontractor-work-orders/${id}/assign`,
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
 * Start work order
 */
export function useStartSubcontractorWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await api.post<{ data: SubcontractorWorkOrder }>(
        `/subcontractor-work-orders/${id}/start`,
        { notes }
      )
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Update work order progress
 */
export function useUpdateSubcontractorWorkOrderProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateProgressData }) => {
      const response = await api.post<{ data: SubcontractorWorkOrder }>(
        `/subcontractor-work-orders/${id}/update-progress`,
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
 * Complete work order
 */
export function useCompleteSubcontractorWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await api.post<{ data: SubcontractorWorkOrder }>(
        `/subcontractor-work-orders/${id}/complete`,
        { notes }
      )
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Cancel work order
 */
export function useCancelSubcontractorWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{ data: SubcontractorWorkOrder }>(
        `/subcontractor-work-orders/${id}/cancel`,
        { reason }
      )
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Create invoice for work order
 */
export function useCreateSubcontractorInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: CreateSubcontractorInvoiceData }) => {
      const response = await api.post<{ data: SubcontractorInvoice }>(
        `/subcontractor-work-orders/${id}/invoices`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices(id) })
      queryClient.invalidateQueries({ queryKey: ['subcontractor-invoices'] })
    },
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get status display info
 */
export function getSubcontractorWorkOrderStatus(scwo: SubcontractorWorkOrder): { label: string; color: string } {
  return {
    label: scwo.status.label,
    color: scwo.status.color,
  }
}

/**
 * Format SC WO number for display
 */
export function formatSCWONumber(scwo: SubcontractorWorkOrder): string {
  return scwo.sc_wo_number || `SCWO-${scwo.id}`
}
