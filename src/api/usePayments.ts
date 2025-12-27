/**
 * Payments API hooks
 * Level 2 Pattern: Types + Queries + Mutations in one file
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import type { Ref } from 'vue'
import type { components } from './types'

// Types from OpenAPI
export type Payment = components['schemas']['PaymentResource']

export interface PaymentFilters {
  page?: number
  per_page?: number
  type?: 'receive' | 'pay'
  contact_id?: number
  search?: string
  date_from?: string
  date_to?: string
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
export function usePayments(filters: Ref<PaymentFilters>) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      const f = filters.value
      if (f.page) params.set('page', String(f.page))
      if (f.per_page) params.set('per_page', String(f.per_page))
      if (f.type) params.set('type', f.type)
      if (f.contact_id) params.set('contact_id', String(f.contact_id))
      if (f.search) params.set('search', f.search)
      if (f.date_from) params.set('date_from', f.date_from)
      if (f.date_to) params.set('date_to', f.date_to)

      const response = await api.get<PaginatedResponse<Payment>>(`/payments?${params}`)
      return response.data
    },
  })
}

export function usePayment(id: Ref<number>) {
  return useQuery({
    queryKey: ['payments', id],
    queryFn: async () => {
      const response = await api.get<{ data: Payment }>(`/payments/${id.value}`)
      return response.data.data
    },
    enabled: () => id.value > 0,
  })
}

// Mutations
export interface CreatePaymentData {
  type: 'receive' | 'pay'
  contact_id: number
  payment_date: string
  amount: number
  payment_method: string
  cash_account_id: number
  reference?: string
  notes?: string
  payable_type?: string
  payable_id?: number
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreatePaymentData) => {
      const response = await api.post<{ data: Payment }>('/payments', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
    },
  })
}

export function useVoidPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ payment: Payment }>(`/payments/${id}/void`)
      return response.data.payment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['bills'] })
    },
  })
}
