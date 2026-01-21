/**
 * useExport Composable
 *
 * Vue composable for using the export service in components.
 */

import { ref, computed } from 'vue'
import { exportService } from './ExportService'
import { useToast } from '@/components/ui/Toast'
import type { ExportColumn, ExportOptions } from './types'

export function useExport<T extends Record<string, unknown>>() {
  const toast = useToast()
  const isExporting = ref(false)
  const exportError = ref<Error | null>(null)

  const availableFormats = computed(() => exportService.getAvailableFormats())

  /**
   * Export data to a specific format
   */
  async function exportData(
    strategyKey: string,
    data: T[],
    columns: ExportColumn<T>[],
    options?: ExportOptions
  ): Promise<boolean> {
    if (data.length === 0) {
      toast.warning('No data to export')
      return false
    }

    isExporting.value = true
    exportError.value = null

    try {
      await exportService.export(strategyKey, data, columns, options)
      toast.success(`Exported ${data.length} rows to ${strategyKey.toUpperCase()}`)
      return true
    } catch (error) {
      exportError.value = error as Error
      toast.error('Export failed. Please try again.')
      return false
    } finally {
      isExporting.value = false
    }
  }

  /**
   * Export to CSV (convenience method)
   */
  async function exportToCSV(
    data: T[],
    columns: ExportColumn<T>[],
    filename?: string
  ): Promise<boolean> {
    return exportData('csv', data, columns, { filename })
  }

  /**
   * Export to Excel (convenience method)
   */
  async function exportToExcel(
    data: T[],
    columns: ExportColumn<T>[],
    filename?: string
  ): Promise<boolean> {
    return exportData('excel', data, columns, { filename })
  }

  return {
    isExporting,
    exportError,
    availableFormats,
    exportData,
    exportToCSV,
    exportToExcel,
  }
}
