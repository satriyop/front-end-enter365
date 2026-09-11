import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { createCrudHooks } from './factory'
import { api } from './client'

export type DeferredKind = 'expense' | 'revenue'
export type DeferredStatus = 'draft' | 'running' | 'closed'
export type DeferredLineStatus = 'draft' | 'posted'

export interface DeferredEntryLine {
  id: number
  deferred_entry_id: number
  sequence: number
  recognition_date: string
  amount: number
  remaining_amount: number
  status: DeferredLineStatus
  journal_entry_id?: number | null
  posted_at?: string | null
}

export interface DeferredEntry {
  id: number
  kind: DeferredKind
  code: string
  name: string
  contact_id?: number | null
  amount: number
  duration_months: number
  start_date: string
  deferred_account_id: number
  recognition_account_id: number
  counterpart_account_id: number
  journal_id?: number | null
  status: DeferredStatus
  remaining_amount: number
  origination_journal_entry_id?: number | null
  notes?: string | null
  contact?: { id: number; code: string; name: string } | null
  lines?: DeferredEntryLine[]
}

export interface DeferredEntryFilters {
  page?: number
  per_page?: number
  search?: string
  status?: string
}

export interface CreateDeferredEntryData {
  code: string
  name: string
  contact_id?: number | null
  amount: number
  duration_months: number
  start_date: string
  deferred_account_id: number
  recognition_account_id: number
  counterpart_account_id: number
  journal_id?: number | null
  notes?: string | null
}

export type UpdateDeferredEntryData = Partial<CreateDeferredEntryData>

export function deferredResource(kind: DeferredKind): string {
  return kind === 'expense' ? 'deferred-expenses' : 'deferred-revenues'
}

export function deferredBasePath(kind: DeferredKind): string {
  return kind === 'expense' ? '/accounting/deferred-expenses' : '/accounting/deferred-revenues'
}

export function deferredLabel(kind: DeferredKind): string {
  return kind === 'expense' ? 'Deferred Expenses' : 'Deferred Revenues'
}

const expenseHooks = createCrudHooks<DeferredEntry, DeferredEntryFilters, CreateDeferredEntryData, UpdateDeferredEntryData>({
  resourceName: 'deferred-expenses',
  singularName: 'deferred-expense',
})

const revenueHooks = createCrudHooks<DeferredEntry, DeferredEntryFilters, CreateDeferredEntryData, UpdateDeferredEntryData>({
  resourceName: 'deferred-revenues',
  singularName: 'deferred-revenue',
})

function hooksFor(kind: DeferredKind) {
  return kind === 'expense' ? expenseHooks : revenueHooks
}

export function useDeferredEntries(kind: DeferredKind) {
  return hooksFor(kind).useList
}

export function useDeferredEntry(kind: DeferredKind) {
  return hooksFor(kind).useSingle
}

export function useCreateDeferredEntry(kind: DeferredKind) {
  return hooksFor(kind).useCreate
}

export function useUpdateDeferredEntry(kind: DeferredKind) {
  return hooksFor(kind).useUpdate
}

export function useConfirmDeferredEntry(kind: DeferredKind) {
  const queryClient = useQueryClient()
  const resource = deferredResource(kind)
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: DeferredEntry }>(`/${resource}/${id}/confirm`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] })
    },
  })
}

export function usePostDeferredRecognition(kind: DeferredKind) {
  const queryClient = useQueryClient()
  const resource = deferredResource(kind)
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: DeferredEntry }>(`/${resource}/${id}/post-recognition`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] })
    },
  })
}
