import * as XLSX from 'xlsx'
import { formatDate } from './format'

export interface ExportColumn<T> {
  key: keyof T | string
  header: string
  width?: number
  /** Format: 'currency', 'date', 'number', 'percent', or custom function */
  format?: 'currency' | 'date' | 'number' | 'percent' | ((value: unknown, row: T) => string)
}

export interface ExportOptions {
  filename: string
  sheetName?: string
  /** Include timestamp in filename */
  timestamp?: boolean
}

/**
 * Get nested value from object using dot notation
 */
function getValue<T>(obj: T, key: string): unknown {
  const keys = key.split('.')
  let result: unknown = obj
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k]
    } else {
      return undefined
    }
  }
  return result
}

/**
 * Format a cell value based on column format
 */
function formatValue<T>(value: unknown, format: ExportColumn<T>['format'], row: T): string | number {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof format === 'function') {
    return format(value, row)
  }

  switch (format) {
    case 'currency':
      return typeof value === 'number' ? value : 0
    case 'date':
      return formatDate(value as string | Date)
    case 'number':
      return typeof value === 'number' ? value : Number(value) || 0
    case 'percent':
      return typeof value === 'number' ? `${value}%` : String(value)
    default:
      return String(value)
  }
}

/**
 * Export data to Excel file
 *
 * @example
 * exportToExcel(quotations, [
 *   { key: 'number', header: 'Quotation #' },
 *   { key: 'contact.name', header: 'Customer' },
 *   { key: 'total_amount', header: 'Total', format: 'currency' },
 *   { key: 'quotation_date', header: 'Date', format: 'date' },
 * ], { filename: 'quotations' })
 */
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions
): void {
  // Build header row
  const headers = columns.map(col => col.header)

  // Build data rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = getValue(item, col.key as string)
      return formatValue(value, col.format, item)
    })
  })

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])

  // Set column widths
  const colWidths = columns.map(col => ({ wch: col.width || 15 }))
  worksheet['!cols'] = colWidths

  // Apply currency formatting to currency columns
  columns.forEach((col, idx) => {
    if (col.format === 'currency') {
      const colLetter = XLSX.utils.encode_col(idx)
      for (let rowIdx = 1; rowIdx <= rows.length; rowIdx++) {
        const cellRef = `${colLetter}${rowIdx + 1}`
        if (worksheet[cellRef]) {
          worksheet[cellRef].z = '#,##0'
        }
      }
    }
  })

  // Create workbook
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Data')

  // Generate filename
  let filename = options.filename
  if (options.timestamp !== false) {
    const date = new Date().toISOString().slice(0, 10)
    filename = `${filename}_${date}`
  }
  filename = `${filename}.xlsx`

  // Download file
  XLSX.writeFile(workbook, filename)
}

/**
 * Export data to CSV file
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions
): void {
  // Build header row
  const headers = columns.map(col => col.header)

  // Build data rows
  const rows = data.map(item => {
    return columns.map(col => {
      const value = getValue(item, col.key as string)
      const formatted = formatValue(value, col.format, item)
      // Escape quotes and wrap in quotes if contains comma
      const stringValue = String(formatted)
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    })
  })

  // Combine into CSV string
  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')

  // Create blob and download
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  let filename = options.filename
  if (options.timestamp !== false) {
    const date = new Date().toISOString().slice(0, 10)
    filename = `${filename}_${date}`
  }
  filename = `${filename}.csv`

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Common export columns for quotations
 */
export const quotationExportColumns: ExportColumn<Record<string, unknown>>[] = [
  { key: 'number', header: 'Quotation #', width: 15 },
  { key: 'contact.name', header: 'Customer', width: 25 },
  { key: 'quotation_date', header: 'Date', format: 'date', width: 12 },
  { key: 'valid_until', header: 'Valid Until', format: 'date', width: 12 },
  { key: 'status', header: 'Status', width: 12 },
  { key: 'subtotal', header: 'Subtotal', format: 'currency', width: 15 },
  { key: 'tax_amount', header: 'Tax', format: 'currency', width: 12 },
  { key: 'total_amount', header: 'Total', format: 'currency', width: 15 },
]

/**
 * Common export columns for invoices
 */
export const invoiceExportColumns: ExportColumn<Record<string, unknown>>[] = [
  { key: 'number', header: 'Invoice #', width: 15 },
  { key: 'contact.name', header: 'Customer', width: 25 },
  { key: 'invoice_date', header: 'Date', format: 'date', width: 12 },
  { key: 'due_date', header: 'Due Date', format: 'date', width: 12 },
  { key: 'status', header: 'Status', width: 12 },
  { key: 'subtotal', header: 'Subtotal', format: 'currency', width: 15 },
  { key: 'tax_amount', header: 'Tax', format: 'currency', width: 12 },
  { key: 'total_amount', header: 'Total', format: 'currency', width: 15 },
  { key: 'amount_paid', header: 'Paid', format: 'currency', width: 15 },
  { key: 'amount_due', header: 'Due', format: 'currency', width: 15 },
]

/**
 * Common export columns for contacts
 */
export const contactExportColumns: ExportColumn<Record<string, unknown>>[] = [
  { key: 'code', header: 'Code', width: 12 },
  { key: 'name', header: 'Name', width: 25 },
  { key: 'type', header: 'Type', width: 12 },
  { key: 'email', header: 'Email', width: 25 },
  { key: 'phone', header: 'Phone', width: 15 },
  { key: 'city', header: 'City', width: 15 },
  { key: 'npwp', header: 'NPWP', width: 20 },
  { key: 'credit_limit', header: 'Credit Limit', format: 'currency', width: 15 },
]
