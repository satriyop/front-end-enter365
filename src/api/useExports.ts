import { useMutation } from '@tanstack/vue-query'
import { api } from './client'

// ─────────────────────────────────────────────────────────────
// Shared download helper
// ─────────────────────────────────────────────────────────────

function reportFormat(format?: string): 'csv' | 'xlsx' | 'pdf' {
  if (format === 'pdf') return 'pdf'
  if (format === 'xlsx' || format === 'excel') return 'xlsx'
  return 'csv'
}

function downloadBlob(data: Blob, filename: string, mime = 'text/csv') {
  const blob = new Blob([data], { type: mime || data.type || 'application/octet-stream' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

function mimeFor(format: 'csv' | 'xlsx' | 'pdf'): string {
  if (format === 'pdf') return 'application/pdf'
  if (format === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  return 'text/csv'
}

function today() {
  return new Date().toISOString().split('T')[0]
}

// ─────────────────────────────────────────────────────────────
// Export Hooks
// ─────────────────────────────────────────────────────────────

/**
 * Export Trial Balance as CSV
 * Params: date (as-of date)
 */
export function useExportTrialBalance() {
  return useMutation({
    mutationFn: async (params?: { date?: string; format?: string }) => {
      const format = reportFormat(params?.format)
      const response = await api.get('/export/trial-balance', {
        params: { ...params, format },
        responseType: 'blob',
      })
      downloadBlob(response.data, `trial-balance-${params?.date || today()}.${format}`, mimeFor(format))
      return true
    },
  })
}

/**
 * Export Balance Sheet as CSV
 * Params: date (as-of date)
 */
export function useExportBalanceSheet() {
  return useMutation({
    mutationFn: async (params?: { date?: string; format?: string; journal_id?: string }) => {
      const format = reportFormat(params?.format)
      const response = await api.get('/export/balance-sheet', {
        params: { ...params, format },
        responseType: 'blob',
      })
      downloadBlob(response.data, `balance-sheet-${params?.date || today()}.${format}`, mimeFor(format))
      return true
    },
  })
}

/**
 * Export Income Statement as CSV
 * Params: start_date, end_date
 */
export function useExportIncomeStatement() {
  return useMutation({
    mutationFn: async (params?: { start_date?: string; end_date?: string; format?: string; journal_id?: string }) => {
      const format = reportFormat(params?.format)
      const response = await api.get('/export/income-statement', {
        params: { ...params, format },
        responseType: 'blob',
      })
      downloadBlob(response.data, `income-statement-${params?.start_date || today()}.${format}`, mimeFor(format))
      return true
    },
  })
}

/**
 * Export General Ledger as CSV
 * Params: account_id (required by backend), start_date, end_date
 */
export function useExportGeneralLedger() {
  return useMutation({
    mutationFn: async (params?: {
      account_id?: string
      start_date?: string
      end_date?: string
      journal_id?: string
      analytic_account_id?: string
      format?: string
      posted_only?: boolean
    }) => {
      const format = reportFormat(params?.format)
      const response = await api.get('/export/general-ledger', {
        params: { ...params, format },
        responseType: 'blob',
      })
      downloadBlob(response.data, `general-ledger-${params?.start_date || today()}.${format}`, mimeFor(format))
      return true
    },
  })
}

export function useExportCashFlow() {
  return useMutation({
    mutationFn: async (params?: { start_date?: string; end_date?: string; format?: string; journal_id?: string }) => {
      const format = reportFormat(params?.format)
      const response = await api.get('/export/cash-flow', {
        params: { ...params, format },
        responseType: 'blob',
      })
      downloadBlob(response.data, `cash-flow-${params?.start_date || today()}.${format}`, mimeFor(format))
      return true
    },
  })
}

export function useExportChangesInEquity() {
  return useMutation({
    mutationFn: async (params?: { start_date?: string; end_date?: string; format?: string }) => {
      const format = reportFormat(params?.format)
      const response = await api.get('/export/changes-in-equity', {
        params: { ...params, format },
        responseType: 'blob',
      })
      downloadBlob(response.data, `changes-in-equity-${params?.start_date || today()}.${format}`, mimeFor(format))
      return true
    },
  })
}

export function useExportDailyCashMovement() {
  return useMutation({
    mutationFn: async (params?: { start_date?: string; end_date?: string; format?: string }) => {
      const format = reportFormat(params?.format)
      const response = await api.get('/export/daily-cash-movement', {
        params: { ...params, format },
        responseType: 'blob',
      })
      downloadBlob(response.data, `daily-cash-movement-${params?.start_date || today()}.${format}`, mimeFor(format))
      return true
    },
  })
}

/**
 * Export Receivables Aging as CSV
 */
export function useExportPartnerLedger() {
  return useMutation({
    mutationFn: async (params?: { start_date?: string; end_date?: string; contact_id?: string }) => {
      const response = await api.get('/export/partner-ledger', {
        params: { format: 'csv', ...params },
        responseType: 'blob',
      })
      downloadBlob(response.data, `partner-ledger-${params?.start_date || today()}.csv`)
      return true
    },
  })
}

export function useExportReceivablesAging() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/export/receivable-aging', {
        params: { format: 'csv' },
        responseType: 'blob',
      })
      downloadBlob(response.data, `receivables-aging-${today()}.csv`)
      return true
    },
  })
}

/**
 * Export Payables Aging as CSV
 */
export function useExportPayablesAging() {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/export/payable-aging', {
        params: { format: 'csv' },
        responseType: 'blob',
      })
      downloadBlob(response.data, `payables-aging-${today()}.csv`)
      return true
    },
  })
}

/**
 * Export Invoices as CSV
 * Params: start_date, end_date, status
 */
export function useExportInvoices() {
  return useMutation({
    mutationFn: async (params?: { start_date?: string; end_date?: string; status?: string }) => {
      const response = await api.get('/export/invoices', {
        params: { format: 'csv', ...params },
        responseType: 'blob',
      })
      downloadBlob(response.data, `invoices-${today()}.csv`)
      return true
    },
  })
}

/**
 * Export Bills as CSV
 * Params: start_date, end_date, status
 */
export function useExportBills() {
  return useMutation({
    mutationFn: async (params?: { start_date?: string; end_date?: string; status?: string }) => {
      const response = await api.get('/export/bills', {
        params: { format: 'csv', ...params },
        responseType: 'blob',
      })
      downloadBlob(response.data, `bills-${today()}.csv`)
      return true
    },
  })
}

/**
 * Export Tax Report as CSV
 * Params: month, year
 */
export function useExportTaxReport() {
  return useMutation({
    mutationFn: async (params?: { month?: string; year?: string }) => {
      const response = await api.get('/export/tax-report', {
        params: { format: 'csv', ...params },
        responseType: 'blob',
      })
      downloadBlob(response.data, `tax-report-${params?.year || new Date().getFullYear()}-${params?.month || ''}.csv`)
      return true
    },
  })
}
