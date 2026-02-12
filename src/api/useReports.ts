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
  period_start: string
  period_end: string
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

export interface ChangesInEquityItem {
  account_id: number
  code: string
  name: string
  opening_balance: number
  changes: number
  closing_balance: number
}

export interface ChangesInEquityReport {
  report_name: string
  period: {
    start_date: string
    end_date: string
  }
  opening_equity: ChangesInEquityItem[]
  changes: {
    capital_additions: number
    capital_withdrawals: number
    net_income: number
    dividends: number
    adjustments: number
    total_changes: number
  }
  closing_equity: ChangesInEquityItem[]
  total_opening_equity: number
  total_closing_equity: number
}

export interface InputTaxItem {
  id: number
  date: string
  vendor_invoice_number: string
  internal_number: string
  vendor_name: string
  npwp: string
  dpp: number
  ppn: number
  total: number
}

export interface InputTaxListReport {
  report_name: string
  period: {
    start: string
    end: string
  }
  items: InputTaxItem[]
  total_dpp: number
  total_ppn: number
  total: number
}

export interface TaxInvoiceItem {
  id: number
  date: string
  invoice_number: string
  buyer_name: string
  npwp: string
  address: string
  dpp: number
  ppn: number
  total: number
}

export interface TaxInvoiceListReport {
  report_name: string
  period: {
    start: string
    end: string
  }
  items: TaxInvoiceItem[]
  total_dpp: number
  total_ppn: number
  total: number
}

export interface CogsSummaryReport {
  report_name: string
  period: {
    start: string
    end: string
  }
  beginning_inventory: number
  purchases: number
  goods_available: number
  ending_inventory: number
  cogs: number
  cogs_from_movements: number
}

export interface CogsByCategoryItem {
  category: string
  product_count: number
  qty_sold: number
  total_cogs: number
  percentage: number
}

export interface CogsByCategoryReport {
  report_name: string
  period: {
    start: string
    end: string
  }
  categories: CogsByCategoryItem[]
  total_cogs: number
}

export interface CogsByProductItem {
  product_id: number
  sku: string
  name: string
  category: string
  qty_sold: number
  avg_unit_cost: number
  total_cogs: number
  percentage: number
}

export interface CogsByProductReport {
  report_name: string
  period: {
    start: string
    end: string
  }
  products: CogsByProductItem[]
  total_cogs: number
}

export interface CogsMonthlyTrendItem {
  month: number
  month_name: string
  beginning_inventory: number
  purchases: number
  ending_inventory: number
  cogs: number
}

export interface CogsMonthlyTrendReport {
  report_name: string
  year: number
  months: CogsMonthlyTrendItem[]
  total_cogs: number
}

export interface CostVarianceWorkOrder {
  id: number
  wo_number: string
  name: string
  project: string
  estimated_cost: number
  actual_cost: number
  variance: number
  variance_percent: number
}

export interface CostVarianceReport {
  report_name: string
  period: {
    start: string
    end: string
  }
  summary: {
    total_work_orders: number
    over_budget: number
    under_budget: number
    on_budget: number
    total_variance: number
  }
  over_budget_items: CostVarianceWorkOrder[]
  under_budget_items: CostVarianceWorkOrder[]
  on_budget_items: CostVarianceWorkOrder[]
}

export interface ProjectProfitabilityProject {
  id: number
  project_number: string
  name: string
  customer: string | null
  status: string
  start_date: string | null
  end_date: string | null
  contract_amount: number
  total_revenue: number
  costs: {
    material: number
    labor: number
    subcontractor: number
    equipment: number
    overhead: number
    other: number
    total: number
  }
  gross_profit: number
  profit_margin: number
  budget_amount: number
  budget_variance: number
  budget_utilization: number
  is_over_budget: boolean
  progress_percentage: number
}

export interface ProjectProfitabilityReport {
  report_name: string
  period: {
    start: string | null
    end: string | null
  }
  projects: ProjectProfitabilityProject[]
  totals: {
    total_contract: number
    total_revenue: number
    total_costs: number
    total_profit: number
    average_margin: number
    projects_count: number
    profitable_count: number
    loss_count: number
  }
}

export interface ProjectCostByType {
  total: number
  count: number
  label: string
}

export interface ProjectCostByProject {
  project_id: number
  project_number: string | null
  project_name: string | null
  total_cost: number
}

export interface ProjectCostAnalysisReport {
  report_name: string
  period: {
    start: string | null
    end: string | null
  }
  by_type: Record<string, ProjectCostByType>
  by_project: ProjectCostByProject[]
  totals: {
    grand_total: number
    cost_types_count: number
    projects_count: number
  }
}

// Hand-written: API schema returns `data: string` (Scramble didn't generate proper schema)
export interface WorkOrderCostItem {
  id: number
  wo_number: string
  name: string
  project: string | null
  status: string
  estimated_cost: number
  actual_cost: number
  variance: number
  variance_percent: number
}

export interface WorkOrderCostsReport {
  report_name: string
  period: {
    start: string | null
    end: string | null
  }
  work_orders: WorkOrderCostItem[]
  summary: {
    total_work_orders: number
    total_estimated: number
    total_actual: number
    total_variance: number
  }
}

export interface SubcontractorSummaryItem {
  id: number
  code: string
  name: string
  work_orders: {
    total: number
    completed: number
    in_progress: number
    draft: number
  }
  financials: {
    total_agreed: number
    total_actual: number
    total_invoiced: number
    total_paid: number
    outstanding: number
    retention_held: number
  }
  performance: {
    on_time_completion: number
    average_completion_days: number
  }
}

export interface SubcontractorSummaryReport {
  report_name: string
  period: {
    start: string | null
    end: string | null
  }
  subcontractors: SubcontractorSummaryItem[]
  totals: {
    total_subcontractors: number
    total_agreed: number
    total_paid: number
    total_outstanding: number
    total_retention: number
  }
}

export interface SubcontractorRetentionItem {
  id: number
  sc_wo_number: string
  name: string
  subcontractor_name: string | null
  project_number: string | null
  status: string
  agreed_amount: number
  retention_percent: number
  retention_amount: number
  scheduled_end: string | null
  actual_end: string | null
  is_releasable: boolean
}

export interface SubcontractorRetentionBySubcontractor {
  subcontractor: string
  total_retention: number
  work_orders_count: number
  releasable_amount: number
}

export interface SubcontractorRetentionReport {
  report_name: string
  retentions: SubcontractorRetentionItem[]
  by_subcontractor: SubcontractorRetentionBySubcontractor[]
  totals: {
    total_retention_held: number
    releasable_amount: number
    pending_amount: number
    work_orders_count: number
  }
}

export interface SubcontractorDetailReport {
  report_name: string
  subcontractor: {
    id: number
    code: string
    name: string
    phone: string | null
    email: string | null
    hourly_rate: number | null
    daily_rate: number | null
  }
  period: {
    start: string | null
    end: string | null
  }
  work_orders: {
    id: number
    sc_wo_number: string
    name: string
    project_number: string | null
    project_name: string | null
    status: string
    agreed_amount: number
    actual_amount: number
    retention_amount: number
    amount_invoiced: number
    amount_paid: number
    scheduled_start: string | null
    scheduled_end: string | null
    actual_start: string | null
    actual_end: string | null
    completion_percentage: number
  }[]
  invoices: {
    id: number
    invoice_number: string
    invoice_date: string | null
    amount: number
    status: string
    sc_wo_number: string | null
  }[]
  summary: {
    total_work_orders: number
    completed_work_orders: number
    total_agreed: number
    total_actual: number
    total_invoiced: number
    total_paid: number
    outstanding: number
    retention_held: number
  }
}

export interface BankReconciliationReport {
  report_name: string
  account: {
    id: number
    code: string
    name: string
  }
  as_of_date: string
  book_balance: number
  bank_balance: number
  adjustments_to_book: {
    items: Array<{
      id: number
      date: string
      description: string
      reference: string | null
      amount: number
      type: string
    }>
    total: number
  }
  adjustments_to_bank: {
    items: Array<{
      id: number
      type: string
      date: string
      number: string
      description: string | null
      amount: number
    }>
    total: number
  }
  adjusted_book_balance: number
  adjusted_bank_balance: number
  difference: number
  is_reconciled: boolean
  reconciliation_summary: {
    total: number
    reconciled: number
    matched: number
    unmatched: number
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
      const response = await api.get<{ data: TrialBalanceReport }>('/reports/trial-balance', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useBalanceSheet(asOfDate?: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['reports', 'balance-sheet', asOfDate],
    queryFn: async () => {
      const params = asOfDate?.value ? { as_of_date: asOfDate.value } : {}
      const response = await api.get<{ data: BalanceSheetReport }>('/reports/balance-sheet', { params })
      return response.data.data
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
      const response = await api.get<{ data: IncomeStatementReport }>('/reports/income-statement', { params })
      return response.data.data
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
      const response = await api.get<{ data: CashFlowReport }>('/reports/cash-flow', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useReceivablesAging(asOfDate?: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['reports', 'receivables-aging', asOfDate],
    queryFn: async () => {
      const params = asOfDate?.value ? { as_of_date: asOfDate.value } : {}
      const response = await api.get<{ data: AgingReport }>('/reports/receivable-aging', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function usePayablesAging(asOfDate?: Ref<string | undefined>) {
  return useQuery({
    queryKey: ['reports', 'payables-aging', asOfDate],
    queryFn: async () => {
      const params = asOfDate?.value ? { as_of_date: asOfDate.value } : {}
      const response = await api.get<{ data: AgingReport }>('/reports/payable-aging', { params })
      return response.data.data
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
      const response = await api.get<{ data: GeneralLedgerReport }>('/reports/general-ledger', { params })
      return response.data.data
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
      const response = await api.get<{ data: PpnSummaryReport }>('/reports/ppn-summary', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function usePpnMonthly(year?: Ref<number | undefined>) {
  const yearParam = computed(() => year?.value ?? new Date().getFullYear())

  return useQuery({
    queryKey: ['reports', 'ppn-monthly', yearParam],
    queryFn: async () => {
      const response = await api.get<{ data: PpnMonthlyReport }>('/reports/ppn-monthly', {
        params: { year: yearParam.value }
      })
      return response.data.data
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
      const response = await api.get<{ data: DailyCashMovementReport }>('/reports/daily-cash-movement', { params })
      return response.data.data
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
      const response = await api.get<{ data: ContactAgingReport }>(`/reports/contacts/${contactId.value}/aging`, { params })
      return response.data.data
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
      const response = await api.get<{ data: InventorySummaryReport }>('/inventory/summary', { params })
      return response.data.data
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
      const response = await api.get<{ data: MovementSummaryReport }>('/inventory/movement-summary', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: computed(() => !!startDate.value && !!endDate.value),
  })
}

export function useChangesInEquity(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'changes-in-equity', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<{ data: ChangesInEquityReport }>('/reports/changes-in-equity', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useInputTaxList(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'input-tax-list', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<{ data: InputTaxListReport }>('/reports/input-tax-list', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useTaxInvoiceList(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'tax-invoice-list', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<{ data: TaxInvoiceListReport }>('/reports/tax-invoice-list', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCogsSummary(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'cogs-summary', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<{ data: CogsSummaryReport }>('/reports/cogs-summary', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCogsByCategory(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'cogs-by-category', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<{ data: CogsByCategoryReport }>('/reports/cogs-by-category', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCogsByProduct(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'cogs-by-product', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<{ data: CogsByProductReport }>('/reports/cogs-by-product', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCogsMonthlyTrend(year?: Ref<number | undefined>) {
  const yearParam = computed(() => year?.value ?? new Date().getFullYear())

  return useQuery({
    queryKey: ['reports', 'cogs-monthly-trend', yearParam],
    queryFn: async () => {
      const response = await api.get<{ data: CogsMonthlyTrendReport }>('/reports/cogs-monthly-trend', {
        params: { year: yearParam.value }
      })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useCostVariance(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'cost-variance', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<{ data: CostVarianceReport }>('/reports/cost-variance', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useProjectProfitability(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>,
  status?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'project-profitability', startDate, endDate, status],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      if (status?.value) params.status = status.value
      const response = await api.get<{ data: ProjectProfitabilityReport }>('/reports/project-profitability', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useProjectCostAnalysis(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'project-cost-analysis', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<{ data: ProjectCostAnalysisReport }>('/reports/project-cost-analysis', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useWorkOrderCosts(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>,
  status?: Ref<string | undefined>,
  projectId?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'work-order-costs', startDate, endDate, status, projectId],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      if (status?.value) params.status = status.value
      if (projectId?.value) params.project_id = projectId.value
      const response = await api.get<{ data: WorkOrderCostsReport }>('/reports/work-order-costs', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useSubcontractorSummary(
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'subcontractor-summary', startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<{ data: SubcontractorSummaryReport }>('/reports/subcontractor-summary', { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useSubcontractorRetention() {
  return useQuery({
    queryKey: ['reports', 'subcontractor-retention'],
    queryFn: async () => {
      const response = await api.get<{ data: SubcontractorRetentionReport }>('/reports/subcontractor-retention')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useSubcontractorDetail(
  contactId: Ref<number | string>,
  startDate?: Ref<string | undefined>,
  endDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'subcontractor-detail', contactId, startDate, endDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (startDate?.value) params.start_date = startDate.value
      if (endDate?.value) params.end_date = endDate.value
      const response = await api.get<{ data: SubcontractorDetailReport }>(`/reports/subcontractors/${contactId.value}/summary`, { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: computed(() => !!contactId.value),
  })
}

export function useBankReconciliationReport(
  accountId: Ref<number | undefined>,
  asOfDate?: Ref<string | undefined>
) {
  return useQuery({
    queryKey: ['reports', 'bank-reconciliation', accountId, asOfDate],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (asOfDate?.value) params.as_of_date = asOfDate.value
      const response = await api.get<{ data: BankReconciliationReport }>(`/reports/accounts/${accountId.value}/bank-reconciliation`, { params })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: computed(() => !!accountId.value),
  })
}

// ─────────────────────────────────────────────────────────────
// Detail Report Types
// ─────────────────────────────────────────────────────────────

export interface ProjectProfitabilityDetail {
  project: {
    id: number
    project_number: string
    name: string
    customer: string | null
    status: string
    start_date: string | null
    end_date: string | null
    contract_amount: number
    budget_amount: number
  }
  financials: {
    total_revenue: number
    total_costs: number
    gross_profit: number
    profit_margin: number
  }
  cost_breakdown: Array<{
    category: string
    amount: number
    percentage: number
  }>
  revenue_timeline: Array<{
    month: string
    revenue: number
  }>
}

export interface WorkOrderCostDetail {
  work_order: {
    id: number
    wo_number: string
    name: string
    project_number: string | null
    project_name: string | null
    status: string
  }
  costs: {
    planned_cost: number
    actual_cost: number
    material_cost: number
    labor_cost: number
    overhead_cost: number
    variance: number
    variance_percent: number
  }
  completion_percentage: number
}

export interface ProductCOGSDetail {
  product: {
    id: number
    sku: string
    name: string
    category: string | null
  }
  summary: {
    total_cogs: number
    units_sold: number
    avg_cogs_per_unit: number
  }
  breakdown: Array<{
    component: string
    amount: number
    percentage: number
  }>
  monthly_trend: Array<{
    month: string
    cogs: number
    units_sold: number
  }>
}

// ─────────────────────────────────────────────────────────────
// Detail Report Hooks
// ─────────────────────────────────────────────────────────────

export function useProjectProfitabilityDetail(projectId: Ref<number>) {
  return useQuery({
    queryKey: ['reports', 'project-profitability-detail', projectId],
    queryFn: async () => {
      const response = await api.get<{ data: ProjectProfitabilityDetail }>(`/reports/projects/${projectId.value}/profitability`)
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: computed(() => !!projectId.value),
  })
}

export function useWorkOrderCostDetail(workOrderId: Ref<number>) {
  return useQuery({
    queryKey: ['reports', 'work-order-cost-detail', workOrderId],
    queryFn: async () => {
      const response = await api.get<{ data: WorkOrderCostDetail }>(`/reports/work-orders/${workOrderId.value}/costs`)
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: computed(() => !!workOrderId.value),
  })
}

export function useProductCOGSDetail(productId: Ref<number>) {
  return useQuery({
    queryKey: ['reports', 'product-cogs-detail', productId],
    queryFn: async () => {
      const response = await api.get<{ data: ProductCOGSDetail }>(`/reports/products/${productId.value}/cogs`)
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
    enabled: computed(() => !!productId.value),
  })
}
