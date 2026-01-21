/**
 * Status Service Types
 */

/**
 * Badge variant types matching the UI Badge component
 */
export type StatusVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'destructive'
  | 'info'

/**
 * Configuration for a single status
 */
export interface StatusConfig {
  /** Display label */
  label: string
  /** Badge variant for styling */
  variant: StatusVariant
  /** Optional icon name */
  icon?: string
  /** Optional description for tooltips */
  description?: string
}

/**
 * Map of status values to configurations
 */
export type StatusRegistry = Record<string, StatusConfig>

/**
 * All document type status registries
 */
export interface DocumentStatusRegistry {
  quotation: StatusRegistry
  invoice: StatusRegistry
  bill: StatusRegistry
  purchase_order: StatusRegistry
  delivery_order: StatusRegistry
  goods_receipt: StatusRegistry
  work_order: StatusRegistry
  payment: StatusRegistry
  journal_entry: StatusRegistry
  sales_return: StatusRegistry
  purchase_return: StatusRegistry
  down_payment: StatusRegistry
  solar_proposal: StatusRegistry
}

/**
 * Document type keys
 */
export type DocumentType = keyof DocumentStatusRegistry
