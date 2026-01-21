/**
 * Export Service
 *
 * Strategy pattern implementation for data exports.
 * Supports CSV, Excel, and can be extended with additional formats.
 */

// Types
export * from './types'

// Service
export { ExportService, exportService } from './ExportService'

// Composable
export { useExport } from './useExport'

// Strategies
export { CSVExportStrategy } from './strategies/CSVExportStrategy'
export { ExcelExportStrategy } from './strategies/ExcelExportStrategy'

// Bootstrap: Register default strategies
import { exportService } from './ExportService'
import { CSVExportStrategy } from './strategies/CSVExportStrategy'
import { ExcelExportStrategy } from './strategies/ExcelExportStrategy'

// Register CSV strategy
exportService.registerStrategy('csv', new CSVExportStrategy())

// Register Excel strategy
exportService.registerStrategy('excel', new ExcelExportStrategy())
