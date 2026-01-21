/**
 * Standard Pricing Strategy
 *
 * Default pricing with no discounts.
 * Acts as a fallback when no other strategy applies.
 */

import type { PricingStrategy, PricingContext, PricingResult } from '../types'

export class StandardPricingStrategy implements PricingStrategy {
  readonly name = 'Standard'
  readonly priority = 100 // Lowest priority (fallback)

  isApplicable(_context: PricingContext): boolean {
    // Always applicable as fallback
    return true
  }

  calculatePrice(context: PricingContext): PricingResult {
    return {
      finalPrice: context.basePrice,
      discount: 0,
      discountPercent: 0,
      pricingRule: 'Standard Price',
    }
  }
}
