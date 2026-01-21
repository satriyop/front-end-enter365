/**
 * Indonesian Rounding Strategy
 *
 * Indonesian business convention: round to nearest 100 or 1000.
 * This is common for cash transactions where small denominations
 * are avoided.
 *
 * @example
 * // Round to nearest 100
 * new IndonesianRoundingStrategy(100).round(123450) // 123500
 *
 * // Round to nearest 1000
 * new IndonesianRoundingStrategy(1000).round(123450) // 123000
 */
import type { RoundingStrategy } from '../types'

export class IndonesianRoundingStrategy implements RoundingStrategy {
  readonly name: string
  private roundTo: number

  constructor(roundTo: number = 100) {
    this.roundTo = roundTo
    this.name = `Indonesian (nearest ${roundTo.toLocaleString('id-ID')})`
  }

  round(value: number, _precision?: number): number {
    return Math.round(value / this.roundTo) * this.roundTo
  }
}
