/**
 * Fixed Amount Discount Strategy
 *
 * Applies a fixed amount discount.
 * Caps discount at gross amount to prevent negative values.
 */
import type { DiscountStrategy } from '../types'

export class AmountDiscountStrategy implements DiscountStrategy {
  readonly name = 'Fixed Amount'

  calculate(grossAmount: number, discountValue: number): number {
    // Ensure non-negative and cap at gross amount
    const discount = Math.max(discountValue, 0)
    return Math.min(discount, grossAmount)
  }
}
