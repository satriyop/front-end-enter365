/**
 * Bills API hooks
 * Level 2 Pattern: Types + Queries + Mutations in one file
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import type { Ref } from 'vue'
import type { components } from './types'

// Types from OpenAPI
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
export function useBills(filters: Ref<BillFilters>) {
  return useQuery({
    queryKey: ['bills', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      const f = filters.value
      if (f.page) params.set('page', String(f.page))
      if (f.per_page) params.set('per_page', String(f.per_page))
      if (f.status) params.set('status', f.status)
      if (f.contact_id) params.set('contact_id', String(f.contact_id))
      if (f.search) params.set('search', f.search)
      if (f.date_from) params.set('date_from', f.date_from)
      if (f.date_to) params.set('date_to', f.date_to)

      const response = await api.get<PaginatedResponse<Bill>>(`/bills?${params}`)
      return response.data
    },
  })
}

export function useBill(id: Ref<number>) {
  return useQuery({
    queryKey: ['bills', id],
    queryFn: async () => {
      const response = await api.get<{ data: Bill }>(`/bills/${id.value}`)
      return response.data.data
    },
    enabled: () => id.value > 0,
  })
}

// Mutations
export function useCreateBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Bill>) => {
      const response = await api.post<{ data: Bill }>('/bills', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
    },
  })
}

export function useUpdateBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Bill> }) => {
      const response = await api.put<{ data: Bill }>(`/bills/${id}`, data)
      return response.data.data
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['bills', id] })
    },
  })
}

export function useDeleteBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/bills/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
    },
  })
}

export function usePostBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: Bill }>(`/bills/${id}/post`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] })
      queryClient.invalidateQueries({ queryKey: ['bills', id] })
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
      queryClient.invalidateQueries({ queryKey: ['bills', id] })
    },
  })
}
