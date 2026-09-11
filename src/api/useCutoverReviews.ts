import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'
import { api } from './client'

export type CutoverKind =
  | 'bill-to-receive'
  | 'billed-not-received'
  | 'invoices-to-be-issued'
  | 'invoiced-not-delivered'

export interface CutoverRow {
  id: number
  document_type: string
  number: string
  date: string | null
  partner: string | null
  reference: string | null
  amount: number
  status: string
}

export interface CutoverReport {
  report_name: string
  kind: CutoverKind
  as_of_date: string
  rows: CutoverRow[]
  totals: { count: number; amount: number }
}

export const CUTOVER_KIND_META: Record<CutoverKind, { title: string; description: string; path: string }> = {
  'bill-to-receive': {
    title: 'Bill to Receive',
    description: 'Goods received, vendor bill not yet posted.',
    path: '/accounting/bill-to-receive',
  },
  'billed-not-received': {
    title: 'Billed Not Received',
    description: 'Vendor bill posted, goods not yet received.',
    path: '/accounting/billed-not-received',
  },
  'invoices-to-be-issued': {
    title: 'Invoices to Be Issued',
    description: 'Goods delivered, customer invoice not yet posted.',
    path: '/accounting/invoices-to-be-issued',
  },
  'invoiced-not-delivered': {
    title: 'Invoiced Not Delivered',
    description: 'Customer invoice posted, goods not yet delivered.',
    path: '/accounting/invoiced-not-delivered',
  },
}

export function useCutoverReview(kind: CutoverKind, asOfDate: MaybeRef<string>) {
  const date = computed(() => unref(asOfDate))

  return useQuery({
    queryKey: ['cutover-review', kind, date],
    queryFn: async () => {
      const response = await api.get<{ data: CutoverReport }>('/reports/cutover/' + kind, {
        params: { as_of_date: date.value },
      })
      return response.data.data
    },
  })
}
