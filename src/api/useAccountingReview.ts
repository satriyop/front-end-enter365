import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'
import { api } from './client'

export type ReviewKind = 'journal-items' | 'journal-audit' | 'working-files' | 'audit-trail'

export interface JournalItemRow {
  id: number
  journal_entry_id: number
  entry_number: string
  entry_date: string | null
  journal_name: string | null
  account_code: string | null
  account_name: string | null
  partner_name: string | null
  description: string | null
  debit: number
  credit: number
  residual: number
  is_posted: boolean
}

export interface JournalItemsReport {
  report_name: string
  rows: JournalItemRow[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export interface JournalAuditRow {
  journal_id: number | null
  journal_name: string | null
  journal_type: string | null
  entry_count: number
  debit: number
  credit: number
}

export interface JournalAuditReport {
  report_name: string
  from: string | null
  to: string | null
  journals: JournalAuditRow[]
  totals: { entry_count: number; debit: number; credit: number }
}

export interface WorkingFileDoc {
  id: number
  number: string
  date: string | null
  description?: string | null
  journal_name?: string | null
  partner?: string | null
  amount?: number
}

export interface WorkingFilesReport {
  report_name: string
  unposted_journal_entries: WorkingFileDoc[]
  draft_invoices: WorkingFileDoc[]
  draft_bills: WorkingFileDoc[]
  totals: {
    unposted_journal_entries: number
    draft_invoices: number
    draft_bills: number
  }
}

export interface AuditTrailRow {
  id: number
  user_name: string | null
  action: string
  auditable_type: string
  auditable_label: string | null
  notes: string | null
  created_at: string | null
}

export const REVIEW_KIND_META: Record<ReviewKind, { title: string; description: string; path: string }> = {
  'journal-items': {
    title: 'Journal Items',
    description: 'Line-level ledger browser. Journal Entries stays header-level.',
    path: '/accounting/journal-items',
  },
  'journal-audit': {
    title: 'Journal Audit',
    description: 'Posted journal register grouped by journal for the period.',
    path: '/accounting/journal-audit',
  },
  'working-files': {
    title: 'Working Files',
    description: 'Unposted journals and draft invoices/bills still open.',
    path: '/accounting/working-files',
  },
  'audit-trail': {
    title: 'Audit Trail',
    description: 'Who changed accounting documents, and when.',
    path: '/accounting/audit-trail',
  },
}

export function useJournalItems(params: MaybeRef<Record<string, unknown>>, enabled: MaybeRef<boolean> = true) {
  const filters = computed(() => unref(params))
  return useQuery({
    queryKey: ['review-journal-items', filters],
    enabled: computed(() => unref(enabled)),
    queryFn: async () => {
      const response = await api.get<{ data: JournalItemsReport }>('/reports/review/journal-items', {
        params: filters.value,
      })
      return response.data.data
    },
  })
}

export function useJournalAudit(params: MaybeRef<Record<string, unknown>>, enabled: MaybeRef<boolean> = true) {
  const filters = computed(() => unref(params))
  return useQuery({
    queryKey: ['review-journal-audit', filters],
    enabled: computed(() => unref(enabled)),
    queryFn: async () => {
      const response = await api.get<{ data: JournalAuditReport }>('/reports/review/journal-audit', {
        params: filters.value,
      })
      return response.data.data
    },
  })
}

export function useWorkingFiles(enabled: MaybeRef<boolean> = true) {
  return useQuery({
    queryKey: ['review-working-files'],
    enabled: computed(() => unref(enabled)),
    queryFn: async () => {
      const response = await api.get<{ data: WorkingFilesReport }>('/reports/review/working-files')
      return response.data.data
    },
  })
}

export function useAuditTrail(params: MaybeRef<Record<string, unknown>>, enabled: MaybeRef<boolean> = true) {
  const filters = computed(() => unref(params))
  return useQuery({
    queryKey: ['review-audit-trail', filters],
    enabled: computed(() => unref(enabled)),
    queryFn: async () => {
      const response = await api.get<{ data: AuditTrailRow[]; meta?: { total: number } }>(
        '/reports/review/audit-trail',
        { params: filters.value },
      )
      return response.data
    },
  })
}
