/**
 * Payments API hooks
 */

import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type Payment = components['schemas']['PaymentResource']

export interface PaymentFilters {
  page?: number
  per_page?: number
  type?: 'receive' | 'send'
  contact_id?: number
  search?: string
  date_from?: string
  date_to?: string
}

export interface CreatePaymentData {
  type: 'receive' | 'send'
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

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<Payment, PaymentFilters, CreatePaymentData>({
  resourceName: 'payments',
  singularName: 'payment',
})

export const usePayments = hooks.useList
export const usePayment = hooks.useSingle
export const useCreatePayment = hooks.useCreate

// ============================================
// Custom Action Hooks
// ============================================

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
