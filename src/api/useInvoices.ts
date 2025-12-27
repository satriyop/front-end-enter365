import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'
import type { components } from './types'

// ============================================
// Types from OpenAPI spec
// ============================================

export type Invoice = components['schemas']['InvoiceResource']
export type InvoiceItem = components['schemas']['InvoiceItemResource']

export interface InvoiceFilters {
  page?: number
  per_page?: number
  status?: 'draft' | 'posted' | 'paid' | 'partial' | 'overdue' | 'void'
  search?: string
  contact_id?: number
  date_from?: string
  date_to?: string
}

export interface CreateInvoiceData {
  contact_id: number
  invoice_date: string
  due_date: string
  description?: string
  reference?: string
  tax_rate?: number
  discount_amount?: number
  receivable_account_id?: number | null
  items: CreateInvoiceItem[]
}

export interface CreateInvoiceItem {
  description: string
  quantity: number
  unit?: string
  unit_price: number
  revenue_account_id?: number | null
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch paginated list of invoices
 */
export function useInvoices(filters: Ref<InvoiceFilters>) {
  return useQuery({
    queryKey: computed(() => ['invoices', filters.value]),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Invoice>>('/invoices', {
        params: filters.value
      })
      return response.data
    },
  })
}

/**
 * Fetch single invoice by ID
 */
export function useInvoice(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['invoice', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: Invoice }>(`/invoices/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

/**
 * Fetch invoice statistics
 */
export function useInvoiceStatistics() {
  return useQuery({
    queryKey: ['invoices', 'statistics'],
    queryFn: async () => {
      const response = await api.get<{ data: Record<string, number> }>('/invoices-statistics')
      return response.data.data
    },
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create new invoice
 */
export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateInvoiceData) => {
      const response = await api.post<{ data: Invoice }>('/invoices', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

/**
 * Update invoice (draft only)
 */
export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateInvoiceData> }) => {
      const response = await api.put<{ data: Invoice }>(`/invoices/${id}`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['invoice', data.id], data)
    },
  })
}

/**
 * Delete invoice (draft only)
 */
export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/invoices/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.removeQueries({ queryKey: ['invoice', id] })
    },
  })
}

/**
 * Post invoice (creates journal entry)
 */
export function usePostInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Invoice }>(`/invoices/${id}/post`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['invoice', data.id], data)
    },
  })
}

/**
 * Void invoice
 */
export function useVoidInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{ data: Invoice }>(`/invoices/${id}/void`, {
        reason,
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['invoice', data.id], data)
    },
  })
}

/**
 * Duplicate invoice
 */
export function useDuplicateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Invoice }>(`/invoices/${id}/duplicate`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
  })
}

/**
 * Send invoice email
 */
export function useSendInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, email }: { id: number; email?: string }) => {
      const response = await api.post<{ data: Invoice }>(`/invoices/${id}/send`, {
        email,
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['invoice', data.id], data)
    },
  })
}
