/**
 * Standard Rounding Strategy
 *
 * Uses standard mathematical rounding (half-up).
 * Configurable precision for decimal places.
 */
import type { RoundingStrategy } from '../types'

export class StandardRoundingStrategy implements RoundingStrategy {
  readonly name = 'Standard'

  round(value: number, precision: number = 0): number {
    const multiplier = Math.pow(10, precision)
    return Math.round(value * multiplier) / multiplier
  }
}
