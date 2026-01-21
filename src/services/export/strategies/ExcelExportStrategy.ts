/**
 * Excel Export Strategy
 *
 * Exports data to Excel format using the xlsx library.
 */

import * as XLSX from 'xlsx'
import type { ExportStrategy, ExportColumn, ExportOptions } from '../types'

export class ExcelExportStrategy<T extends Record<string, unknown>>
  implements ExportStrategy<T>
{
  readonly name = 'Excel'
  readonly extension = 'xlsx'
  readonly mimeType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  constructor(private config: { sheetName?: string } = {}) {}

  async export(
    data: T[],
    columns: ExportColumn<T>[],
    _options?: ExportOptions
  ): Promise<Blob> {
    // Transform data to match column headers
    const transformedData = data.map((row) => {
      const obj: Record<string, unknown> = {}
      columns.forEach((col) => {
        obj[col.header] = this.formatValue(row, col)
      })
      return obj
    })

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(transformedData)

    // Set column widths
    ws['!cols'] = columns.map((col) => ({
      wch: col.width ?? this.calculateWidth(col),
    }))

    // Create workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, this.config.sheetName ?? 'Data')

    // Generate buffer
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

    return new Blob([buffer], { type: this.mimeType })
  }

  /**
   * Format a value based on column configuration
   */
  private formatValue(row: T, column: ExportColumn<T>): unknown {
    const value = row[column.key as keyof T]

    // Use custom formatter if provided
    if (column.formatter) {
      return column.formatter(value, row)
    }

    if (value === null || value === undefined) {
      return ''
    }

    // Keep numeric values as numbers for Excel
    switch (column.format) {
      case 'currency':
      case 'number':
      case 'percent':
        return typeof value === 'number' ? value : parseFloat(String(value)) || 0
      case 'date':
        if (value instanceof Date) {
          return value.toISOString().split('T')[0]
        }
        return value
      default:
        return value
    }
  }

  /**
   * Calculate column width based on header length and format
   */
  private calculateWidth(column: ExportColumn<T>): number {
    const headerLength = column.header.length

    switch (column.format) {
      case 'currency':
        return Math.max(15, headerLength)
      case 'date':
        return Math.max(12, headerLength)
      case 'number':
      case 'percent':
        return Math.max(10, headerLength)
      default:
        return Math.max(15, headerLength)
    }
  }
}
