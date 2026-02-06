import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import type { Ref } from 'vue'
import { computed } from 'vue'
import type { components } from './types'

// ─────────────────────────────────────────────────────────────
// Types (from Scramble-generated schemas)
// ─────────────────────────────────────────────────────────────

export type BankTransaction = components['schemas']['BankTransactionResource']
export type CreateBankTransactionData = components['schemas']['StoreBankTransactionRequest']
export type ReconcileBankTransactionData = components['schemas']['ReconcileBankTransactionRequest']

export type BankTransactionStatus = 'unmatched' | 'matched' | 'reconciled'

export interface BankTransactionFilters {
  page?: number
  per_page?: number
  account_id?: number | ''
  status?: BankTransactionStatus | ''
  start_date?: string
  end_date?: string
  import_batch?: string
}

export interface BankTransactionSummary {
  total_transactions: number
  unmatched_count: number
  matched_count: number
  reconciled_count: number
  total_debit: number
  total_credit: number
  unmatched_debit: number
  unmatched_credit: number
}

export interface MatchSuggestion {
  payment_id: number
  payment_number: string
  payment_date: string
  amount: number
  contact_name: string
  confidence: number
}

// ─────────────────────────────────────────────────────────────
// List and Single Fetch Hooks
// ─────────────────────────────────────────────────────────────

export function useBankTransactions(filters: Ref<BankTransactionFilters>) {
  return useQuery({
    queryKey: ['bank-transactions', filters],
    queryFn: async () => {
      const params: Record<string, string | number> = {}
      if (filters.value.page) params.page = filters.value.page
      if (filters.value.per_page) params.per_page = filters.value.per_page
      if (filters.value.account_id) params.account_id = filters.value.account_id
      if (filters.value.status) params.status = filters.value.status
      if (filters.value.start_date) params.start_date = filters.value.start_date
      if (filters.value.end_date) params.end_date = filters.value.end_date
      if (filters.value.import_batch) params.import_batch = filters.value.import_batch

      const response = await api.get<{
        data: BankTransaction[]
        meta: { current_page: number; last_page: number; per_page: number; total: number }
      }>('/bank-transactions', { params })
      return response.data
    },
    staleTime: 30 * 1000,
  })
}

export function useBankTransaction(id: Ref<number | string | undefined>) {
  return useQuery({
    queryKey: ['bank-transactions', id],
    queryFn: async () => {
      const response = await api.get<{ data: BankTransaction }>(`/bank-transactions/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value),
  })
}

export function useBankTransactionSummary(accountId?: Ref<number | undefined>) {
  return useQuery({
    queryKey: ['bank-transactions', 'summary', accountId],
    queryFn: async () => {
      const params = accountId?.value ? { account_id: accountId.value } : {}
      const response = await api.get<{ data: BankTransactionSummary }>('/bank-transactions/summary', { params })
      return response.data.data
    },
    staleTime: 60 * 1000,
  })
}

export function useMatchSuggestions(transactionId: Ref<number | string | undefined>) {
  return useQuery({
    queryKey: ['bank-transactions', transactionId, 'suggest-matches'],
    queryFn: async () => {
      const response = await api.get<{ data: MatchSuggestion[] }>(
        `/bank-transactions/${transactionId.value}/suggest-matches`
      )
      return response.data.data
    },
    enabled: computed(() => !!transactionId.value),
    staleTime: 30 * 1000,
  })
}

// ─────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────

export function useCreateBankTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateBankTransactionData) => {
      const response = await api.post<{ data: BankTransaction }>('/bank-transactions', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })
    },
  })
}

export function useDeleteBankTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.delete(`/bank-transactions/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Matching & Reconciliation Mutations
// ─────────────────────────────────────────────────────────────

export function useMatchPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ transactionId, paymentId }: { transactionId: number | string; paymentId: number }) => {
      const response = await api.post<{ data: BankTransaction }>(
        `/bank-transactions/${transactionId}/match-payment/${paymentId}`
      )
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['bank-transactions', variables.transactionId] })
    },
  })
}

export function useUnmatchTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: BankTransaction }>(`/bank-transactions/${id}/unmatch`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['bank-transactions', id] })
    },
  })
}

export function useReconcileTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: BankTransaction }>(`/bank-transactions/${id}/reconcile`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['bank-transactions', id] })
    },
  })
}

export function useBulkReconcile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: (number | string)[]) => {
      const response = await api.post<{ data: { reconciled_count: number } }>(
        '/bank-transactions/bulk-reconcile',
        { ids }
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

export function getStatusColor(status: BankTransactionStatus): string {
  switch (status) {
    case 'unmatched':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'matched':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'reconciled':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
  }
}

export function getStatusLabel(status: BankTransactionStatus): string {
  switch (status) {
    case 'unmatched': return 'Unmatched'
    case 'matched': return 'Matched'
    case 'reconciled': return 'Reconciled'
    default: return status
  }
}
