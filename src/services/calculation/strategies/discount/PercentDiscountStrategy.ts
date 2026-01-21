/**
 * Percentage Discount Strategy
 *
 * Calculates discount as a percentage of the gross amount.
 * Caps percentage at 100% to prevent negative values.
 */
import type { DiscountStrategy } from '../types'

export class PercentDiscountStrategy implements DiscountStrategy {
  readonly name = 'Percentage'

  calculate(grossAmount: number, discountValue: number): number {
    // Cap at 100% to prevent negative values
    const percentage = Math.min(Math.max(discountValue, 0), 100)
    return grossAmount * (percentage / 100)
  }
}
