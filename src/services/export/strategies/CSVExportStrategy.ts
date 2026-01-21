/**
 * CSV Export Strategy
 *
 * Exports data to CSV format. No external dependencies required.
 */

import type { ExportStrategy, ExportColumn, ExportOptions } from '../types'

export class CSVExportStrategy<T extends Record<string, unknown>>
  implements ExportStrategy<T>
{
  readonly name = 'CSV'
  readonly extension = 'csv'
  readonly mimeType = 'text/csv;charset=utf-8;'

  constructor(private config: { delimiter?: string } = {}) {}

  async export(
    data: T[],
    columns: ExportColumn<T>[],
    _options?: ExportOptions
  ): Promise<Blob> {
    const delimiter = this.config.delimiter ?? ','

    // Header row
    const headers = columns.map((col) => this.escapeCSV(col.header)).join(delimiter)

    // Data rows
    const rows = data.map((row) =>
      columns.map((col) => this.escapeCSV(this.formatValue(row, col))).join(delimiter)
    )

    // Add BOM for Excel compatibility with UTF-8
    const BOM = '\uFEFF'
    const csv = BOM + [headers, ...rows].join('\n')

    return new Blob([csv], { type: this.mimeType })
  }

  /**
   * Format a value based on column configuration
   */
  private formatValue(row: T, column: ExportColumn<T>): string {
    const value = row[column.key as keyof T]

    // Use custom formatter if provided
    if (column.formatter) {
      return column.formatter(value, row)
    }

    if (value === null || value === undefined) {
      return ''
    }

    // Format based on type
    switch (column.format) {
      case 'currency':
        return typeof value === 'number' ? value.toFixed(2) : String(value)
      case 'percent':
        return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : String(value)
      case 'date':
        if (value instanceof Date) {
          return value.toISOString().split('T')[0] ?? ''
        }
        return String(value)
      case 'number':
        return typeof value === 'number' ? String(value) : String(value)
      default:
        return String(value)
    }
  }

  /**
   * Escape CSV special characters
   */
  private escapeCSV(value: string): string {
    // If value contains comma, quote, or newline, wrap in quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Escape existing quotes by doubling them
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }
}
