/**
 * Indonesian PPN (Pajak Pertambahan Nilai) Tax Strategy
 *
 * Standard Indonesian Value Added Tax at 11%.
 * Tax is calculated on top of the subtotal (exclusive).
 */
import type { TaxStrategy } from '../types'

export class PPNStrategy implements TaxStrategy {
  readonly name = 'PPN 11%'
  readonly rate = 0.11
  readonly isInclusive = false

  calculate(subtotal: number): number {
    return subtotal * this.rate
  }
}
