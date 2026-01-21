/**
 * Round Up Strategy
 *
 * Always rounds up to the next integer or decimal place.
 * Useful for scenarios where you never want to under-charge.
 */
import type { RoundingStrategy } from '../types'

export class RoundUpStrategy implements RoundingStrategy {
  readonly name = 'Round Up'

  round(value: number, precision: number = 0): number {
    const multiplier = Math.pow(10, precision)
    return Math.ceil(value * multiplier) / multiplier
  }
}
