/**
 * Volume Discount Strategy
 *
 * Applies tiered discounts based on quantity purchased.
 * Higher quantities get better discounts.
 */

import type { PricingStrategy, PricingContext, PricingResult, VolumeTier } from '../types'

export class VolumeDiscountStrategy implements PricingStrategy {
  readonly name = 'Volume Discount'
  readonly priority = 20

  private tiers: VolumeTier[]

  constructor(tiers: VolumeTier[]) {
    // Sort by minQuantity descending (highest tier first)
    this.tiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity)
  }

  isApplicable(context: PricingContext): boolean {
    return this.tiers.some((tier) => context.quantity >= tier.minQuantity)
  }

  calculatePrice(context: PricingContext): PricingResult {
    // Find the highest applicable tier
    const tier = this.tiers.find((t) => context.quantity >= t.minQuantity)

    if (!tier) {
      return {
        finalPrice: context.basePrice,
        discount: 0,
        discountPercent: 0,
        pricingRule: 'Standard',
      }
    }

    const discount = context.basePrice * (tier.discountPercent / 100)
    const finalPrice = context.basePrice - discount

    return {
      finalPrice,
      discount,
      discountPercent: tier.discountPercent,
      pricingRule: `Volume ${tier.minQuantity}+ (${tier.discountPercent}% off)`,
    }
  }

  /**
   * Get the discount tier for a given quantity
   */
  getTierForQuantity(quantity: number): VolumeTier | null {
    return this.tiers.find((t) => quantity >= t.minQuantity) ?? null
  }

  /**
   * Get all configured tiers
   */
  getTiers(): VolumeTier[] {
    return [...this.tiers]
  }
}
