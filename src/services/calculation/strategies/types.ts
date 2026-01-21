/**
 * Strategy Pattern Types for Calculation Service
 *
 * These interfaces define the contracts for different calculation strategies,
 * enabling flexible business logic without modifying core code.
 */

/**
 * Tax calculation strategy interface
 */
export interface TaxStrategy {
  /** Display name for the strategy */
  name: string
  /** Tax rate (e.g., 0.11 for 11%) */
  rate: number
  /** Whether tax is included in the price */
  isInclusive: boolean
  /** Calculate tax amount from subtotal */
  calculate(subtotal: number): number
}

/**
 * Discount calculation strategy interface
 */
export interface DiscountStrategy {
  /** Display name for the strategy */
  name: string
  /** Calculate discount amount */
  calculate(grossAmount: number, discountValue: number): number
}

/**
 * Rounding strategy interface
 */
export interface RoundingStrategy {
  /** Display name for the strategy */
  name: string
  /** Round value to specified precision */
  round(value: number, precision?: number): number
}

/**
 * Input for line item calculations
 */
export interface CalculableLineItem {
  quantity: number
  unit_price: number
  discount_type?: 'percent' | 'amount' | null
  discount_value?: number | null
  tax_rate?: number | null
}

/**
 * Result of a single line item calculation
 */
export interface LineItemCalculation {
  /** Quantity * Unit Price (before discount) */
  gross: number
  /** Discount amount */
  discount: number
  /** Gross - Discount */
  net: number
  /** Tax amount */
  tax: number
  /** Final total (net + tax for exclusive, net for inclusive) */
  total: number
}

/**
 * Result of document totals calculation
 */
export interface DocumentTotals {
  /** Sum of all line item net amounts */
  subtotal: number
  /** Sum of all line item discounts */
  totalDiscount: number
  /** Amount subject to tax */
  taxableAmount: number
  /** Total tax amount */
  tax: number
  /** Final document total */
  grandTotal: number
}
