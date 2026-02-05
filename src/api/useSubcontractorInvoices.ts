/**
 * Subcontractor Invoices API Hooks
 *
 * Manages invoices from subcontractors for work performed,
 * including approval, rejection, and bill conversion.
 */

import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'

// Query keys
const QUERY_KEYS = {
  all: ['subcontractor-invoices'] as const,
  lists: () => [...QUERY_KEYS.all, 'list'] as const,
  detail: (id: number) => [...QUERY_KEYS.all, 'detail', id] as const,
}

// Types from OpenAPI schema
// Extended type includes fields not yet in generated schema
export type SubcontractorInvoice = components['schemas']['SubcontractorInvoiceResource'] & {
  description?: string | null
  bill_id?: number | null
  rejected_at?: string | null
  approved_at?: string | null
}

// Filter types
export interface SubcontractorInvoiceFilters {
  page?: number
  per_page?: number
  status?: SubcontractorInvoiceStatus
  search?: string
  subcontractor_id?: number
  subcontractor_work_order_id?: number
}

// Status types
export type SubcontractorInvoiceStatus = 'pending' | 'approved' | 'rejected' | 'converted'

// Update types
export type UpdateSubcontractorInvoiceData = components['schemas']['UpdateSubcontractorInvoiceRequest']

// CRUD hooks via factory
const hooks = createCrudHooks<SubcontractorInvoice, SubcontractorInvoiceFilters, UpdateSubcontractorInvoiceData>({
  resourceName: 'subcontractor-invoices',
  singularName: 'subcontractor-invoice',
})

export const useSubcontractorInvoices = hooks.useList
export const useSubcontractorInvoice = hooks.useSingle
export const useUpdateSubcontractorInvoice = hooks.useUpdate

// ============================================================================
// Workflow Actions
// ============================================================================

/**
 * Approve subcontractor invoice
 */
export function useApproveSubcontractorInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes?: string }) => {
      const response = await api.post<{ data: SubcontractorInvoice }>(
        `/subcontractor-invoices/${id}/approve`,
        { notes }
      )
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: ['subcontractor-work-orders'] })
    },
  })
}

/**
 * Reject subcontractor invoice
 */
export function useRejectSubcontractorInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await api.post<{ data: SubcontractorInvoice }>(
        `/subcontractor-invoices/${id}/reject`,
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

/**
 * Convert subcontractor invoice to bill
 */
export function useConvertSubcontractorInvoiceToBill() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data?: { bill_date?: string; due_date?: string } }) => {
      const response = await api.post<{ data: SubcontractorInvoice }>(
        `/subcontractor-invoices/${id}/convert-to-bill`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.detail(id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
    },
  })
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get status display info
 */
export function getSubcontractorInvoiceStatus(invoice: SubcontractorInvoice): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    converted: { label: 'Converted', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  }
  const statusValue = invoice.status && typeof invoice.status === 'object' ? invoice.status.value : invoice.status
  return statusMap[statusValue] || { label: statusValue, color: 'bg-slate-100 text-slate-700' }
}

/**
 * Format invoice number for display
 */
export function formatSCInvoiceNumber(invoice: SubcontractorInvoice): string {
  return invoice.invoice_number || `SCI-${invoice.id}`
}
