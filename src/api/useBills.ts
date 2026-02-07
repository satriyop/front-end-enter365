/**
 * Bills API hooks
 */

import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type Bill = components['schemas']['BillResource']
export type BillItem = components['schemas']['BillItemResource']

export interface BillFilters {
  page?: number
  per_page?: number
  status?: string
  contact_id?: number
  search?: string
  date_from?: string
  date_to?: string
}

export type CreateBillData = Partial<Bill>

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<Bill, BillFilters, CreateBillData>({
  resourceName: 'bills',
  singularName: 'bill',
})

export const useBills = hooks.useList
export const useBill = hooks.useSingle
export const useCreateBill = hooks.useCreate
export const useUpdateBill = hooks.useUpdate
export const useDeleteBill = hooks.useDelete

// ============================================
// Custom Action Hooks
// ============================================

export function usePostBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Bill }>(`/bills/${id}/post`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['bill', id] })
    },
  })
}

export function useVoidBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Bill }>(`/bills/${id}/void`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['bill', id] })
    },
  })
}
