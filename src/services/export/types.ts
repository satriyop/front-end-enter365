/**
 * Export Service Types
 *
 * Defines interfaces for the Strategy pattern implementation
 * allowing different export formats (CSV, Excel, PDF) to be
 * added without modifying existing code.
 */

/**
 * Options for configuring exports
 */
export interface ExportOptions {
  /** Custom filename (without extension) */
  filename?: string
  /** Page orientation for PDF exports */
  orientation?: 'portrait' | 'landscape'
  /** Paper size for PDF exports */
  paperSize?: 'A4' | 'Letter' | 'Legal'
  /** Include header row */
  includeHeaders?: boolean
  /** Specific columns to export */
  columns?: string[]
}

/**
 * Column configuration for exports
 */
export interface ExportColumn<T = unknown> {
  /** Key to access in data object */
  key: keyof T | (string & {})
  /** Display header */
  header: string
  /** Column width (for Excel/PDF) */
  width?: number
  /** Format type for values */
  format?: 'text' | 'number' | 'currency' | 'date' | 'percent'
  /** Custom formatter function */
  formatter?: (value: unknown, row: T) => string
}

/**
 * Base export strategy interface
 */
export interface ExportStrategy<T = unknown> {
  /** Strategy display name */
  readonly name: string
  /** File extension */
  readonly extension: string
  /** MIME type for download */
  readonly mimeType: string
  /** Export data to blob */
  export(data: T[], columns: ExportColumn<T>[], options?: ExportOptions): Promise<Blob>
}

/**
 * Extended strategy for single document exports (e.g., invoices)
 */
export interface DocumentExportStrategy<T = unknown> extends ExportStrategy<T> {
  /** Export a single document with custom layout */
  exportSingle(data: T, options?: ExportOptions): Promise<Blob>
}

/**
 * Export format registry entry
 */
export interface ExportFormat {
  key: string
  name: string
  extension: string
  icon?: string
}
