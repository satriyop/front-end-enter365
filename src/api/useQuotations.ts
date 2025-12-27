import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'
import type { components } from './types'

// ============================================
// Types from OpenAPI spec
// ============================================

export type Quotation = components['schemas']['QuotationResource']
export type QuotationItem = components['schemas']['QuotationItemResource']

export interface QuotationFilters {
  page?: number
  per_page?: number
  status?: string
  search?: string
  contact_id?: number
  date_from?: string
  date_to?: string
}

export interface CreateQuotationData {
  contact_id: number
  quotation_date: string
  valid_until: string
  subject?: string
  reference?: string
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
  tax_rate?: number
  notes?: string
  terms_conditions?: string
  items: CreateQuotationItem[]
}

export interface CreateQuotationItem {
  product_id?: number | null
  description: string
  quantity: number
  unit: string
  unit_price: number
  discount_percent?: number
  tax_rate?: number
  notes?: string
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch paginated list of quotations
 */
export function useQuotations(filters: Ref<QuotationFilters>) {
  return useQuery({
    queryKey: computed(() => ['quotations', filters.value]),
    queryFn: async () => {
      // Filter out empty/undefined values to avoid sending empty params
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<Quotation>>('/quotations', {
        params: cleanParams
      })
      return response.data
    },
  })
}

/**
 * Fetch single quotation by ID
 */
export function useQuotation(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['quotation', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: Quotation }>(`/quotations/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

/**
 * Fetch quotation statistics
 */
export function useQuotationStatistics() {
  return useQuery({
    queryKey: ['quotations', 'statistics'],
    queryFn: async () => {
      const response = await api.get<{ data: Record<string, number> }>('/quotations-statistics')
      return response.data.data
    },
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create new quotation
 */
export function useCreateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateQuotationData) => {
      const response = await api.post<{ data: Quotation }>('/quotations', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}

/**
 * Update quotation (draft only)
 */
export function useUpdateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateQuotationData> }) => {
      const response = await api.put<{ data: Quotation }>(`/quotations/${id}`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

/**
 * Delete quotation (draft only)
 */
export function useDeleteQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/quotations/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.removeQueries({ queryKey: ['quotation', id] })
    },
  })
}

/**
 * Submit quotation for approval
 */
export function useSubmitQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/submit`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

/**
 * Approve quotation
 */
export function useApproveQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/approve`)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

/**
 * Reject quotation
 */
export function useRejectQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/reject`, {
        rejection_reason: reason,
      })
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

/**
 * Convert quotation to invoice
 */
export function useConvertToInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Quotation; invoice_id: number }>(
        `/quotations/${id}/convert-to-invoice`
      )
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.setQueryData(['quotation', data.data.id], data.data)
    },
  })
}

/**
 * Duplicate quotation
 */
export function useDuplicateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/duplicate`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}

/**
 * Create revision of quotation
 */
export function useReviseQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Quotation }>(`/quotations/${id}/revise`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}

// ============================================
// Create from BOM
// ============================================

export interface CreateQuotationFromBomData {
  bom_id: number
  contact_id: number
  margin_percent?: number
  selling_price?: number
  expand_items?: boolean
  quotation_date?: string
  valid_until?: string
  subject?: string
  tax_rate?: number
  notes?: string
  terms_conditions?: string
}

/**
 * Create quotation from BOM (single variant)
 */
export function useCreateQuotationFromBom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateQuotationFromBomData) => {
      const response = await api.post<{ data: Quotation }>('/quotations/from-bom', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}
