import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'
import { api } from './client'

export interface ReconcileAccount {
  id: number
  code: string
  name: string
  type: string
  unreconciled_count: number
  unreconciled_amount: number
}

export interface ReconcileLine {
  id: number
  journal_entry_id: number
  account_id: number
  partner_id?: number | null
  entry_number?: string | null
  entry_date?: string | null
  description?: string | null
  debit: number
  credit: number
  reconciled_amount: number
  residual: number
  side: 'debit' | 'credit'
  partner?: { id: number; code: string; name: string } | null
}

export interface AccountReconciliation {
  id: number
  account_id: number
  partner_id?: number | null
  amount: number
  notes?: string | null
  reconciled_at?: string | null
  account?: { id: number; code: string; name: string } | null
  partner?: { id: number; code: string; name: string } | null
}

export interface CreateReconcileData {
  account_id: number
  partner_id?: number | null
  notes?: string | null
  items: Array<{ journal_entry_line_id: number; amount?: number }>
}

export function useReconcileAccounts() {
  return useQuery({
    queryKey: ['reconcile-accounts'],
    queryFn: async () => {
      const response = await api.get<{ data: ReconcileAccount[] }>('/reconcile/accounts')
      return response.data.data
    },
  })
}

export function useReconcileLines(accountId: MaybeRef<number | string | null>) {
  const id = computed(() => {
    const value = unref(accountId)
    return value ? String(value) : ''
  })

  return useQuery({
    queryKey: ['reconcile-lines', id],
    enabled: computed(() => id.value !== ''),
    queryFn: async () => {
      const response = await api.get<{ data: ReconcileLine[] }>('/reconcile/lines', {
        params: { account_id: id.value },
      })
      return response.data.data
    },
  })
}

export function useReconcileHistory(accountId: MaybeRef<number | string | null>) {
  const id = computed(() => {
    const value = unref(accountId)
    return value ? String(value) : ''
  })

  return useQuery({
    queryKey: ['reconcile-history', id],
    queryFn: async () => {
      const response = await api.get<{ data: AccountReconciliation[] }>('/reconcile', {
        params: id.value ? { account_id: id.value, per_page: 50 } : { per_page: 50 },
      })
      return response.data.data
    },
  })
}

export function useCreateReconciliation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateReconcileData) => {
      const response = await api.post<{ data: AccountReconciliation }>('/reconcile', payload)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconcile-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['reconcile-lines'] })
      queryClient.invalidateQueries({ queryKey: ['reconcile-history'] })
    },
  })
}

export function useUnreconcile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.post('/reconcile/' + id + '/unreconcile')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconcile-accounts'] })
      queryClient.invalidateQueries({ queryKey: ['reconcile-lines'] })
      queryClient.invalidateQueries({ queryKey: ['reconcile-history'] })
    },
  })
}
