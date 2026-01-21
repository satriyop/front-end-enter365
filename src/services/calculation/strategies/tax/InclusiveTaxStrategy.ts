/**
 * Inclusive Tax Strategy
 *
 * For prices that already include tax.
 * Extracts the tax component from the inclusive amount.
 *
 * Formula: tax = amount - (amount / (1 + rate))
 * Example: 111,000 includes 11% tax = 111,000 - (111,000 / 1.11) = 11,000
 */
import type { TaxStrategy } from '../types'

export class InclusiveTaxStrategy implements TaxStrategy {
  readonly name: string
  readonly rate: number
  readonly isInclusive = true

  constructor(rate: number = 0.11, name?: string) {
    this.rate = rate
    this.name = name ?? `Inclusive Tax ${(rate * 100).toFixed(0)}%`
  }

  calculate(subtotal: number): number {
    // Extract tax from inclusive amount
    return subtotal - (subtotal / (1 + this.rate))
  }
}
