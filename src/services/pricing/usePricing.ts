/**
 * usePricing Composable
 *
 * Vue composable for using the pricing service in components.
 */

import { computed } from 'vue'
import { pricingService } from './PricingService'
import type { PricingContext, PricingResult } from './types'

export function usePricing() {
  /**
   * Calculate price for a given context
   */
  function calculatePrice(context: PricingContext): PricingResult {
    return pricingService.calculatePrice(context)
  }

  /**
   * Calculate price with analysis of all applicable strategies
   */
  function calculateWithAnalysis(context: PricingContext) {
    return pricingService.calculateWithAnalysis(context)
  }

  /**
   * Calculate line item total with pricing
   */
  function calculateLineTotal(
    productId: number,
    basePrice: number,
    quantity: number,
    customerId?: number
  ): {
    unitPrice: number
    total: number
    discount: number
    pricingRule: string
  } {
    const result = calculatePrice({
      productId,
      basePrice,
      quantity,
      customerId,
    })

    return {
      unitPrice: result.finalPrice,
      total: result.finalPrice * quantity,
      discount: result.discount * quantity,
      pricingRule: result.pricingRule,
    }
  }

  /**
   * Get available pricing strategies
   */
  const strategies = computed(() => pricingService.getStrategies())

  return {
    calculatePrice,
    calculateWithAnalysis,
    calculateLineTotal,
    strategies,
  }
}
