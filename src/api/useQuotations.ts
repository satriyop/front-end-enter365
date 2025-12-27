import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'

// ============================================
// Types (match your API response)
// ============================================

export interface Quotation {
  id: number
  quotation_number: string
  contact: {
    id: number
    company_name: string
    name: string
    email: string
  }
  subject: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'expired' | 'converted'
  subtotal: number
  discount_percent: number
  discount_amount: number
  tax_amount: number
  grand_total: number
  valid_until: string
  notes: string | null
  created_at: string
  updated_at: string
  items?: QuotationItem[]
}

export interface QuotationItem {
  id: number
  product_id: number
  product: {
    id: number
    name: string
    sku: string
  }
  description: string
  quantity: number
  unit: string
  unit_price: number
  amount: number
}

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
  subject: string
  valid_until: string
  discount_percent?: number
  notes?: string
  items: {
    product_id: number
    description?: string
    quantity: number
    unit: string
    unit_price: number
  }[]
}

// ============================================
// Hooks
// ============================================

/**
 * Fetch paginated list of quotations
 */
export function useQuotations(filters: Ref<QuotationFilters>) {
  return useQuery({
    queryKey: computed(() => ['quotations', filters.value]),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Quotation>>('/quotations', {
        params: filters.value
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
      const response = await api.get<Quotation>(`/quotations/${id.value}`)
      return response.data
    },
    enabled: computed(() => !!id.value),
  })
}

/**
 * Create new quotation
 */
export function useCreateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateQuotationData) => {
      const response = await api.post<Quotation>('/quotations', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}

/**
 * Update quotation
 */
export function useUpdateQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateQuotationData> }) => {
      const response = await api.put<Quotation>(`/quotations/${id}`, data)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
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
      const response = await api.post<Quotation>(`/quotations/${id}/submit`)
      return response.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
      queryClient.setQueryData(['quotation', data.id], data)
    },
  })
}

/**
 * Delete quotation
 */
export function useDeleteQuotation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/quotations/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] })
    },
  })
}
