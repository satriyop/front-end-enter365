/**
 * Pricing Service Types
 *
 * Defines interfaces for the pricing strategy pattern.
 */

/**
 * Customer types for pricing tiers
 */
export type CustomerType = 'retail' | 'wholesale' | 'contract' | 'vip'

/**
 * Context for pricing calculations
 */
export interface PricingContext {
  /** Customer ID (if applicable) */
  customerId?: number
  /** Customer type */
  customerType?: CustomerType
  /** Quantity being purchased */
  quantity: number
  /** Product ID */
  productId: number
  /** Base price (before any discounts) */
  basePrice: number
  /** Date of transaction (for time-based pricing) */
  date?: Date
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Result of pricing calculation
 */
export interface PricingResult {
  /** Final price per unit */
  finalPrice: number
  /** Total discount amount */
  discount: number
  /** Discount as percentage */
  discountPercent: number
  /** Name of the pricing rule applied */
  pricingRule: string
  /** Whether this is a promotional price */
  isPromotion?: boolean
}

/**
 * Volume discount tier configuration
 */
export interface VolumeTier {
  /** Minimum quantity for this tier */
  minQuantity: number
  /** Discount percentage */
  discountPercent: number
}

/**
 * Contract pricing configuration
 */
export interface ContractPrice {
  /** Customer ID */
  customerId: number
  /** Product ID */
  productId: number
  /** Fixed contract price */
  contractPrice: number
  /** Contract start date */
  validFrom: Date
  /** Contract end date */
  validUntil: Date
}

/**
 * Pricing strategy interface
 */
export interface PricingStrategy {
  /** Strategy name */
  readonly name: string
  /** Priority (lower = higher priority, evaluated first) */
  readonly priority: number
  /** Check if strategy applies to context */
  isApplicable(context: PricingContext): boolean
  /** Calculate price */
  calculatePrice(context: PricingContext): PricingResult
}
