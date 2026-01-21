import { useQuery } from '@tanstack/vue-query'
import { api } from './client'
import type { Ref } from 'vue'
import { computed } from 'vue'

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface TrialBalanceAccount {
  id: number
  code: string
  name: string
  type: string
  debit_balance: number
  credit_balance: number
}

export interface TrialBalanceReport {
  report_name: string
  as_of_date: string
  accounts: TrialBalanceAccount[]
  total_debit: number
  total_credit: number
  is_balanced: boolean
}

export interface BalanceSheetSection {
  name: string
  accounts: Array<{
    id: number
    code: string
    name: string
    balance: number
  }>
  total: number
}

export interface BalanceSheetReport {
  report_name: string
  as_of_date: string
  assets: BalanceSheetSection[]
  liabilities: BalanceSheetSection[]
  equity: BalanceSheetSection[]
  total_assets: number
  total_liabilities: number
  total_equity: number
  total_liabilities_equity: number
  is_balanced: boolean
}

export interface IncomeStatementSection {
  name: string
  accounts: Array<{
    id: number
    code: string
    name: string
    balance: number
  }>
  total: number
}

export interface IncomeStatementReport {
  report_name: string
  period: {
    start_date: string
    end_date: string
  }
  revenue: IncomeStatementSection[]
  expenses: IncomeStatementSection[]
  total_revenue: number
  total_expenses: number
  net_income: number
  gross_profit?: number
  operating_income?: number
}

export interface CashFlowCategory {
  name: string
  items: Array<{
    description: string
    amount: number
  }>
  total: number
}

export interface CashFlowReport {
  report_name: string
  period: {
    start: string
    end: string
  }
  operating_activities: CashFlowCategory
  investing_activities: CashFlowCategory
  financing_activities: CashFlowCategory
  net_cash_change: number
  opening_balance: number
  closing_balance: number
}

export interface AgingBucket {
  label: string
  min_days: number
  max_days: number | null
  amount: number
  count: number
}

export interface AgingContact {
  id: number
  code: string
  name: string
  current: number
  days_1_30: number
  days_31_60: number
  days_61_90: number
  over_90: number
  total: number
}

export interface AgingReport {
  report_name: string
  as_of_date: string
  buckets: AgingBucket[]
  contacts: AgingContact[]
  totals: {
    current: number
    days_1_30: number
    days_31_60: number
    days_61_90: number
    over_90: number
    total: number
  }
}

export interface GeneralLedgerAccount {
  id: number
  code: string
  name: string
  opening_balance: number
  entries: Array<{
    date: string
    description: string
    reference: string
    debit: number
    credit: number
    balance: number
  }>
  closing_balance: number
}

export interface GeneralLedgerReport {
  report_name: string
  start_date: string
  end_date: string
  accounts: GeneralLedgerAccount[]
}

export interface PpnSummaryReport {
  report_name: string
  period: {
    start: string
    end: string
  }
  output_tax: number
  input_tax: number
  net_vat: number
  output_count: number
  input_count: number
}

export interface PpnMonthlyReport {
  report_name: string
  year: number
  months: Array<{
    month: number
    month_name: string
    output: number
    input: number
    net: number
  }>
  total_output: number
  total_input: number
  total_net: number
}

export interface DailyCashMovement {
  date: string
  receipts: number
  payments: number
  net: number
  running_balance: number
}

export interface DailyCashMovementReport {
  report_name: string
  period: {
    start: string
    end: string
  }
  movements: DailyCashMovement[]
  total_receipts: number
  total_payments: number
  net_movement: number
}

export interface ContactAgingInvoice {
  id: number
  invoice_number?: string
  bill_number?: string
  date: string
  due_date: string
  total: number
  paid: number
  balance: number
  days_overdue: number
  aging_bucket: string
}

export interface ContactAgingReport {
  report_name: string
  contact: {
    id: number
    code: string
    name: string
  }
  as_of_date: string
  receivables?: {
    invoices: ContactAgingInvoice[]
    totals: {
      current: number
      days_1_30: number
      days_31_60: number
      days_61_90: number
      over_90: number
      total: number
    }
  }
  payables?: {
    bills: ContactAgingInvoice[]
    totals: {
      current: number
      days_1_30: number
      days_31_60: number
      days_61_90: number
      over_90: number
      total: number
    }
  }
}

export interface InventorySummaryReport {
  warehouse: {
    id: number
    code: string
    name: string
  } | null
  summary: {
    total_value: number
    total_items: number
    total_quantity: number
    low_stock_count: number
    out_of_stock_count: number
  }
}

export interface MovementSummaryItem {
  product_id: number
  sku: string
  name: string
  unit: string
  opening_qty: number
  in_qty: number
  out_qty: number
  adjustment_qty: number
  closing_qty: number
  opening_value: number
  closing_value: number
}

export interface MovementSummaryReport {
  warehouse: {
    id: number
    code: string
    name: string
  } | null
  period: {
    start: string
    end: string
  }
  summary: {
    total_opening_value: number
    total_closing_value: number
    total_in: number
    total_out: number
    total_adjustment: number
    items: MovementSummaryItem[]
  }
}

// ─────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────

export function useTrialBalance(asOfDate?: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['reports', 'trial-balance', asOfDate],
    queryFn: async () => {
      const params = asOfDate?.value ? { as_of_date: asOfDate.value } : {}
      const response = await api.get<TrialBalanceReport>('/reports/trial-balance', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useBalanceSheet(asOfDate?: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['reports', 'balance-sheet', asOfDate],
    queryFn: async () => {
      const params = asOfDate?.value ? { as_of_date: asOfDate.value } : {}
      const response = await api.get<BalanceSheetReport>('/reports/balance-sheet', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useIncomeStatement(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'income-statement', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<IncomeStatementReport>('/reports/income-statement', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCashFlow(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'cash-flow', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<CashFlowReport>('/reports/cash-flow', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useReceivablesAging(asOfDate?: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['reports', 'receivables-aging', asOfDate],
    queryFn: async () => {
      const params = asOfDate?.value ? { as_of_date: asOfDate.value } : {}
      const response = await api.get<AgingReport>('/reports/receivable-aging', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function usePayablesAging(asOfDate?: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['reports', 'payables-aging', asOfDate],
    queryFn: async () => {
      const params = asOfDate?.value ? { as_of_date: asOfDate.value } : {}
      const response = await api.get<AgingReport>('/reports/payable-aging', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useGeneralLedger(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'general-ledger', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<GeneralLedgerReport>('/reports/general-ledger', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function usePpnSummary(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'ppn-summary', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<PpnSummaryReport>('/reports/ppn-summary', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function usePpnMonthly(year?: Ref<number | undefined>) {
  const yearParam = computed(() => year?.value ?? new Date().getFullYear())

  return useQuery({
    queryKey: ['reports', 'ppn-monthly', yearParam],
    queryFn: async () => {
      const response = await api.get<PpnMonthlyReport>('/reports/ppn-monthly', {
        params: { year: yearParam.value }
      })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useDailyCashMovement(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'daily-cash-movement', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<DailyCashMovementReport>('/reports/daily-cash-movement', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useContactAging(
  contactId: Ref<number | string | undefined>,
  asOfDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'contact-aging', contactId, asOfDate],
    queryFn: async () => {
      const params = asOfDate?.value ? { as_of_date: asOfDate.value } : {}
      const response = await api.get<ContactAgingReport>(`/reports/contacts/${contactId.value}/aging`, { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: computed(() => !!contactId.value),
  })
}

export function useInventorySummary(warehouseId?: Ref<number | undefined>) {
  return useQuery({
    queryKey: ['reports', 'inventory-summary', warehouseId],
    queryFn: async () => {
      const params = warehouseId?.value ? { warehouse_id: warehouseId.value } : {}
      const response = await api.get<InventorySummaryReport>('/inventory/summary', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useMovementSummary(
  startDate: Ref<string | undefined>,
  endDate: Ref<string | undefined>,
  warehouseId?: Ref<number | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'movement-summary', startDate, endDate, warehouseId],
    queryFn: async () => {
      const params: Record<string, string | number> = {}
      if (startDate.value) params.start_date = startDate.value
      if (endDate.value) params.end_date = endDate.value
      if (warehouseId?.value) params.warehouse_id = warehouseId.value
      const response = await api.get<MovementSummaryReport>('/inventory/movement-summary', { params })
      return response.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: computed(() => !!startDate.value && !!endDate.value),
  })
}
