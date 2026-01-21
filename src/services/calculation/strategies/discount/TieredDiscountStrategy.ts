/**
 * Tiered Discount Strategy
 *
 * Applies discount based on quantity tiers.
 * Higher quantities get better discount rates.
 *
 * @example
 * const tiers = [
 *   { minQuantity: 100, discountPercent: 15 },
 *   { minQuantity: 50, discountPercent: 10 },
 *   { minQuantity: 10, discountPercent: 5 },
 * ]
 * // Buying 75 units gets 10% discount
 */
import type { DiscountStrategy } from '../types'

export interface DiscountTier {
  minQuantity: number
  discountPercent: number
}

export class TieredDiscountStrategy implements DiscountStrategy {
  readonly name = 'Tiered'
  private tiers: DiscountTier[]

  constructor(tiers: DiscountTier[]) {
    // Sort tiers by minQuantity descending for easy lookup
    this.tiers = [...tiers].sort((a, b) => b.minQuantity - a.minQuantity)
  }

  /**
   * For tiered discounts, discountValue represents the quantity
   */
  calculate(grossAmount: number, quantity: number): number {
    const tier = this.tiers.find((t) => quantity >= t.minQuantity)
    if (!tier) return 0
    return grossAmount * (tier.discountPercent / 100)
  }

  /**
   * Get applicable tier for a quantity
   */
  getTierForQuantity(quantity: number): DiscountTier | null {
    return this.tiers.find((t) => quantity >= t.minQuantity) ?? null
  }

  /**
   * Get all tiers
   */
  getTiers(): DiscountTier[] {
    return [...this.tiers]
  }
}
