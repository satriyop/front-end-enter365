/**
 * Export Service
 *
 * Manages export strategies and provides a unified interface
 * for exporting data to various formats.
 */

import { eventBus } from '@/infrastructure/events'
import { logger } from '@/infrastructure/logger'
import type { ExportStrategy, ExportColumn, ExportOptions, ExportFormat } from './types'

export class ExportService {
  private strategies = new Map<string, ExportStrategy<unknown>>()

  /**
   * Register an export strategy
   */
  registerStrategy<T>(key: string, strategy: ExportStrategy<T>): void {
    this.strategies.set(key, strategy as ExportStrategy<unknown>)
    logger.debug('Export strategy registered', { key, name: strategy.name })
  }

  /**
   * Get a registered strategy
   */
  getStrategy<T>(key: string): ExportStrategy<T> | undefined {
    return this.strategies.get(key) as ExportStrategy<T> | undefined
  }

  /**
   * Get all available export formats
   */
  getAvailableFormats(): ExportFormat[] {
    return Array.from(this.strategies.entries()).map(([key, strategy]) => ({
      key,
      name: strategy.name,
      extension: strategy.extension,
    }))
  }

  /**
   * Export data using a specific strategy
   */
  async export<T extends Record<string, unknown>>(
    strategyKey: string,
    data: T[],
    columns: ExportColumn<T>[],
    options?: ExportOptions
  ): Promise<void> {
    const strategy = this.getStrategy<T>(strategyKey)

    if (!strategy) {
      throw new Error(`Export strategy not found: ${strategyKey}`)
    }

    logger.info('Starting export', {
      strategy: strategyKey,
      count: data.length,
      columns: columns.length,
    })

    try {
      const blob = await strategy.export(data, columns, options)
      const filename = `${options?.filename ?? 'export'}.${strategy.extension}`

      // Trigger download
      this.downloadBlob(blob, filename)

      eventBus.emit('user:action', {
        action: 'export',
        target: `${strategyKey}:${filename}`,
      })

      logger.info('Export completed', { strategy: strategyKey, filename })
    } catch (error) {
      logger.error('Export failed', error as Error, { strategy: strategyKey })
      throw error
    }
  }

  /**
   * Download a blob as a file
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// Singleton instance
export const exportService = new ExportService()
