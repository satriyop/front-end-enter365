/**
 * No Tax Strategy
 *
 * For tax-exempt transactions or non-taxable items.
 */
import type { TaxStrategy } from '../types'

export class NoTaxStrategy implements TaxStrategy {
  readonly name = 'No Tax'
  readonly rate = 0
  readonly isInclusive = false

  calculate(_subtotal: number): number {
    return 0
  }
}
