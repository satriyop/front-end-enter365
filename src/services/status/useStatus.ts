/**
 * useStatus Composable
 *
 * Provides status utilities for a specific document type in Vue components.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { getStatus, statusOptions, getVariant } = useStatus('invoice')
 *
 * // In template
 * // <Badge :variant="getVariant(invoice.status)">{{ getStatus(invoice.status).label }}</Badge>
 * // <Select v-model="filter.status" :options="statusOptions" />
 * </script>
 * ```
 */

import { computed, type ComputedRef } from 'vue'
import { statusService } from './StatusService'
import type { DocumentType, StatusConfig, StatusVariant } from './types'

export interface UseStatusReturn {
  /** Get full status config */
  getStatus: (status: string) => StatusConfig
  /** Get status label */
  getLabel: (status: string) => string
  /** Get status variant for Badge */
  getVariant: (status: string) => StatusVariant
  /** Get status description */
  getDescription: (status: string) => string | undefined
  /** Status options for Select (with "All" option) */
  statusOptions: ComputedRef<Array<{ value: string; label: string }>>
  /** Status options without "All" */
  statusOptionsWithoutAll: ComputedRef<Array<{ value: string; label: string }>>
  /** Check if status is active */
  isActive: (status: string) => boolean
  /** Check if status is final */
  isFinal: (status: string) => boolean
  /** Check if status is pending */
  isPending: (status: string) => boolean
}

/**
 * Use status utilities for a document type
 */
export function useStatus(documentType: DocumentType): UseStatusReturn {
  /**
   * Get full status configuration
   */
  function getStatus(status: string): StatusConfig {
    return statusService.getStatus(documentType, status)
  }

  /**
   * Get status label
   */
  function getLabel(status: string): string {
    return statusService.getLabel(documentType, status)
  }

  /**
   * Get status variant for Badge component
   */
  function getVariant(status: string): StatusVariant {
    return statusService.getVariant(documentType, status)
  }

  /**
   * Get status description
   */
  function getDescription(status: string): string | undefined {
    return statusService.getDescription(documentType, status)
  }

  /**
   * Status options for Select (includes "All Status")
   */
  const statusOptions = computed(() =>
    statusService.getSelectOptions(documentType, true)
  )

  /**
   * Status options without "All"
   */
  const statusOptionsWithoutAll = computed(() =>
    statusService.getSelectOptions(documentType, false)
  )

  /**
   * Check if status is active
   */
  function isActive(status: string): boolean {
    return statusService.isActive(documentType, status)
  }

  /**
   * Check if status is final
   */
  function isFinal(status: string): boolean {
    return statusService.isFinal(documentType, status)
  }

  /**
   * Check if status is pending
   */
  function isPending(status: string): boolean {
    return statusService.isPending(documentType, status)
  }

  return {
    getStatus,
    getLabel,
    getVariant,
    getDescription,
    statusOptions,
    statusOptionsWithoutAll,
    isActive,
    isFinal,
    isPending,
  }
}
