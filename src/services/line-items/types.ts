/**
 * Line Items Service Types
 */

/**
 * Base line item interface
 * Extend this for document-specific line items
 */
export interface BaseLineItem {
  id?: number
  product_id?: number | null
  description?: string
  quantity: number
  unit_price: number
  discount_type?: 'percent' | 'amount' | null
  discount_value?: number | null
  unit?: string
  notes?: string
}

/**
 * Configuration for line items service
 */
export interface LineItemsConfig {
  /** Minimum number of items required */
  minItems?: number
  /** Maximum number of items allowed */
  maxItems?: number
  /** Whether product selection is required */
  requireProduct?: boolean
  /** Default values for new items */
  defaultItem?: Partial<BaseLineItem>
}

/**
 * Validation result for line items
 */
export interface ValidationResult {
  valid: boolean
  errors: Map<number, string[]>
}
