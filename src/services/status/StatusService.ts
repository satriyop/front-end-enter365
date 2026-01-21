/**
 * Status Service
 *
 * Centralized service for document status lookups and utilities.
 *
 * @example
 * ```typescript
 * const status = statusService.getStatus('invoice', 'paid')
 * // { label: 'Paid', variant: 'success', description: 'Fully paid' }
 *
 * const options = statusService.getSelectOptions('invoice', true)
 * // [{ value: '', label: 'All Status' }, { value: 'draft', label: 'Draft' }, ...]
 * ```
 */

import { STATUS_REGISTRY, DEFAULT_STATUS_CONFIG } from './statusRegistry'
import type {
  DocumentStatusRegistry,
  DocumentType,
  StatusConfig,
  StatusVariant,
} from './types'

export class StatusService {
  private registry: DocumentStatusRegistry

  constructor(customRegistry?: Partial<DocumentStatusRegistry>) {
    this.registry = customRegistry
      ? { ...STATUS_REGISTRY, ...customRegistry }
      : STATUS_REGISTRY
  }

  /**
   * Get full status configuration
   */
  getStatus(documentType: DocumentType, status: string): StatusConfig {
    const docStatuses = this.registry[documentType]
    return docStatuses?.[status] ?? { ...DEFAULT_STATUS_CONFIG, label: status }
  }

  /**
   * Get status label
   */
  getLabel(documentType: DocumentType, status: string): string {
    return this.getStatus(documentType, status).label
  }

  /**
   * Get status variant for Badge component
   */
  getVariant(documentType: DocumentType, status: string): StatusVariant {
    return this.getStatus(documentType, status).variant
  }

  /**
   * Get status description
   */
  getDescription(documentType: DocumentType, status: string): string | undefined {
    return this.getStatus(documentType, status).description
  }

  /**
   * Get all statuses for a document type
   */
  getStatuses(
    documentType: DocumentType
  ): Array<{ value: string } & StatusConfig> {
    const docStatuses = this.registry[documentType]
    return Object.entries(docStatuses).map(([value, config]) => ({
      value,
      ...config,
    }))
  }

  /**
   * Get statuses as Select options
   */
  getSelectOptions(
    documentType: DocumentType,
    includeAll: boolean = false
  ): Array<{ value: string; label: string }> {
    const options = this.getStatuses(documentType).map((s) => ({
      value: s.value,
      label: s.label,
    }))

    if (includeAll) {
      return [{ value: '', label: 'All Status' }, ...options]
    }

    return options
  }

  /**
   * Check if status is "active" (not cancelled/void/rejected)
   */
  isActive(_documentType: DocumentType, status: string): boolean {
    const inactiveStatuses = ['cancelled', 'void', 'rejected']
    return !inactiveStatuses.includes(status)
  }

  /**
   * Check if status is "final" (cannot be changed)
   */
  isFinal(_documentType: DocumentType, status: string): boolean {
    const finalStatuses = [
      'paid',
      'completed',
      'delivered',
      'converted',
      'posted',
      'received',
      'used',
    ]
    return finalStatuses.includes(status)
  }

  /**
   * Check if status is "pending" (awaiting action)
   */
  isPending(_documentType: DocumentType, status: string): boolean {
    const pendingStatuses = [
      'pending',
      'submitted',
      'in_transit',
      'in_progress',
      'inspecting',
    ]
    return pendingStatuses.includes(status)
  }

  /**
   * Get status badge props for direct component usage
   */
  getBadgeProps(
    documentType: DocumentType,
    status: string
  ): { variant: StatusVariant; children: string } {
    const config = this.getStatus(documentType, status)
    return {
      variant: config.variant,
      children: config.label,
    }
  }
}

/**
 * Singleton instance
 */
export const statusService = new StatusService()
