import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'
import { api } from './client'

export type AnalysisKind =
  | 'tax-returns'
  | 'unrealized-currencies'
  | 'invoice-analysis'
  | 'analytic-report'
  | 'executive-summary'
  | 'budget-report'

export interface AnalysisTotals {
  [key: string]: number
}

export interface AnalysisReport {
  report_name: string
  rows: Array<Record<string, unknown>>
  totals?: AnalysisTotals
  kpis?: Record<string, number>
  year?: number
  from?: string
  to?: string
  as_of_date?: string
  group_by?: string
  closing_rates?: Record<string, number>
}

export const ANALYSIS_KIND_META: Record<AnalysisKind, { title: string; description: string; path: string; endpoint: string }> = {
  'tax-returns': {
    title: 'Tax Returns',
    description: 'Monthly VAT filing workspace: output tax, input tax, and net to file.',
    path: '/accounting/tax-returns',
    endpoint: '/reports/tax-returns',
  },
  'unrealized-currencies': {
    title: 'Unrealized Currencies',
    description: 'Open foreign-currency AR/AP revalued at the closing rate.',
    path: '/accounting/unrealized-currencies',
    endpoint: '/reports/review/unrealized-currencies',
  },
  'invoice-analysis': {
    title: 'Invoice Analysis',
    description: 'Posted customer invoices grouped by month, partner, or status.',
    path: '/accounting/invoice-analysis',
    endpoint: '/reports/invoice-analysis',
  },
  'analytic-report': {
    title: 'Analytic Report',
    description: 'Income and expense by analytic account from posted distributions.',
    path: '/accounting/analytic-report',
    endpoint: '/reports/analytic-report',
  },
  'executive-summary': {
    title: 'Executive Summary',
    description: 'Period sales, purchases, receivables, payables, and cash.',
    path: '/accounting/executive-summary',
    endpoint: '/reports/executive-summary',
  },
  'budget-report': {
    title: 'Budget Report',
    description: 'Company budgets versus posted actuals.',
    path: '/accounting/budget-report',
    endpoint: '/reports/budget-report',
  },
}

export interface AnalysisFilters {
  year?: number
  from?: string
  to?: string
  as_of_date?: string
  group_by?: string
  usd_rate?: number
}

export function useAccountingAnalysis(kind: AnalysisKind, filters: MaybeRef<AnalysisFilters>) {
  const params = computed(() => unref(filters))
  const meta = ANALYSIS_KIND_META[kind]

  return useQuery({
    queryKey: ['accounting-analysis', kind, params],
    queryFn: async () => {
      const current = params.value
      const query: Record<string, string | number> = {}

      if (kind === 'tax-returns' && current.year) {
        query.year = current.year
      }
      if (kind === 'unrealized-currencies') {
        if (current.as_of_date) {
          query.as_of_date = current.as_of_date
        }
      }
      if (kind === 'invoice-analysis' || kind === 'analytic-report' || kind === 'executive-summary') {
        if (current.from) {
          query.from = current.from
        }
        if (current.to) {
          query.to = current.to
        }
      }
      if (kind === 'invoice-analysis' && current.group_by) {
        query.group_by = current.group_by
      }
      if (kind === 'budget-report' && current.as_of_date) {
        query.as_of_date = current.as_of_date
      }

      const requestParams: Record<string, unknown> = { ...query }
      if (kind === 'unrealized-currencies' && current.usd_rate) {
        requestParams.rates = { USD: current.usd_rate }
      }

      const response = await api.get<{ data: AnalysisReport }>(meta.endpoint, { params: requestParams })
      return response.data.data
    },
  })
}
