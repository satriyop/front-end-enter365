import { createCrudHooks } from './factory'

export type JournalType = 'sales' | 'purchase' | 'bank' | 'cash' | 'miscellaneous'

export interface Journal {
  id: number
  name: string
  type: JournalType
  sequence_prefix: string
  default_account_id: number | null
  suspense_account_id: number | null
  outstanding_receipts_account_id: number | null
  outstanding_payments_account_id: number | null
  profit_account_id: number | null
  loss_account_id: number | null
  bank_account_number: string | null
  dedicated_payment_sequence: boolean
  currency: string | null
  is_active: boolean
  default_account?: {
    id: number
    code: string
    name: string
  } | null
  suspense_account?: {
    id: number
    code: string
    name: string
  } | null
  outstanding_receipts_account?: {
    id: number
    code: string
    name: string
  } | null
  outstanding_payments_account?: {
    id: number
    code: string
    name: string
  } | null
  profit_account?: {
    id: number
    code: string
    name: string
  } | null
  loss_account?: {
    id: number
    code: string
    name: string
  } | null
  created_at?: string | null
  updated_at?: string | null
}

export interface JournalFilters {
  page?: number
  per_page?: number
  search?: string
  type?: JournalType | ''
  is_active?: boolean
}

export interface CreateJournalData {
  name: string
  type: JournalType
  sequence_prefix: string
  default_account_id?: number | null
  suspense_account_id?: number | null
  outstanding_receipts_account_id?: number | null
  outstanding_payments_account_id?: number | null
  profit_account_id?: number | null
  loss_account_id?: number | null
  bank_account_number?: string | null
  dedicated_payment_sequence?: boolean
  currency?: string | null
  is_active?: boolean
}

export type UpdateJournalData = Partial<CreateJournalData>

const hooks = createCrudHooks<Journal, JournalFilters, CreateJournalData, UpdateJournalData>({
  resourceName: 'journals',
  singularName: 'journal',
  lookupParams: { is_active: true, per_page: 200 },
})

export const useJournals = hooks.useList
export const useJournal = hooks.useSingle
export const useCreateJournal = hooks.useCreate
export const useUpdateJournal = hooks.useUpdate
export const useDeleteJournal = hooks.useDelete
export const useJournalsLookup = hooks.useLookup

export const JOURNAL_TYPE_OPTIONS = [
  { value: 'sales', label: 'Sales' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'bank', label: 'Bank' },
  { value: 'cash', label: 'Cash' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
] as const

export function journalTypeLabel(type: string): string {
  return JOURNAL_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type
}
