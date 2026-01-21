/**
 * Calculation Service
 *
 * Centralized service for document calculations using Strategy Pattern.
 * Handles line item totals, taxes, discounts, and document totals.
 *
 * @example
 * ```typescript
 * const service = new CalculationService()
 *
 * // Single line item
 * const result = service.calculateLineItem({
 *   quantity: 2,
 *   unit_price: 100000,
 *   discount_type: 'percent',
 *   discount_value: 10,
 * })
 *
 * // Document totals
 * const totals = service.calculateTotals(items)
 * ```
 */

import type {
  TaxStrategy,
  DiscountStrategy,
  RoundingStrategy,
  CalculableLineItem,
  LineItemCalculation,
  DocumentTotals,
} from './strategies/types'
import { PPNStrategy } from './strategies/tax/PPNStrategy'
import { PercentDiscountStrategy } from './strategies/discount/PercentDiscountStrategy'
import { AmountDiscountStrategy } from './strategies/discount/AmountDiscountStrategy'
import { StandardRoundingStrategy } from './strategies/rounding/StandardRoundingStrategy'

export interface CalculationServiceOptions {
  /** Tax strategy to use (default: PPN 11%) */
  taxStrategy?: TaxStrategy
  /** Rounding strategy to use (default: Standard) */
  roundingStrategy?: RoundingStrategy
}

export class CalculationService {
  private taxStrategy: TaxStrategy
  private roundingStrategy: RoundingStrategy
  private percentDiscountStrategy: DiscountStrategy
  private amountDiscountStrategy: DiscountStrategy

  constructor(options: CalculationServiceOptions = {}) {
    this.taxStrategy = options.taxStrategy ?? new PPNStrategy()
    this.roundingStrategy = options.roundingStrategy ?? new StandardRoundingStrategy()
    this.percentDiscountStrategy = new PercentDiscountStrategy()
    this.amountDiscountStrategy = new AmountDiscountStrategy()
  }

  /**
   * Calculate a single line item
   */
  calculateLineItem(item: CalculableLineItem): LineItemCalculation {
    const quantity = item.quantity || 0
    const unitPrice = item.unit_price || 0
    const gross = quantity * unitPrice

    // Calculate discount based on type
    let discount = 0
    if (item.discount_value && item.discount_value > 0) {
      const strategy =
        item.discount_type === 'percent'
          ? this.percentDiscountStrategy
          : this.amountDiscountStrategy

      discount = strategy.calculate(gross, item.discount_value)
    }

    const net = gross - discount

    // Calculate tax on net amount
    // Use item-specific tax rate if provided, otherwise use strategy rate
    const taxRate = item.tax_rate ?? this.taxStrategy.rate
    let tax: number
    let total: number

    if (this.taxStrategy.isInclusive) {
      // For inclusive tax, extract tax from net
      tax = net - net / (1 + taxRate)
      total = net // Total equals net for inclusive
    } else {
      // For exclusive tax, add tax to net
      tax = net * taxRate
      total = net + tax
    }

    return {
      gross: this.round(gross),
      discount: this.round(discount),
      net: this.round(net),
      tax: this.round(tax),
      total: this.round(total),
    }
  }

  /**
   * Calculate all line items
   */
  calculateLineItems(items: CalculableLineItem[]): LineItemCalculation[] {
    return items.map((item) => this.calculateLineItem(item))
  }

  /**
   * Calculate document totals from line items
   */
  calculateTotals(items: CalculableLineItem[]): DocumentTotals {
    const calculations = this.calculateLineItems(items)

    const subtotal = calculations.reduce((sum, calc) => sum + calc.net, 0)
    const totalDiscount = calculations.reduce((sum, calc) => sum + calc.discount, 0)
    const tax = calculations.reduce((sum, calc) => sum + calc.tax, 0)
    const grandTotal = calculations.reduce((sum, calc) => sum + calc.total, 0)

    return {
      subtotal: this.round(subtotal),
      totalDiscount: this.round(totalDiscount),
      taxableAmount: this.round(subtotal),
      tax: this.round(tax),
      grandTotal: this.round(grandTotal),
    }
  }

  /**
   * Apply rounding strategy
   */
  private round(value: number): number {
    return this.roundingStrategy.round(value)
  }

  /**
   * Get current tax strategy info
   */
  getTaxInfo(): { name: string; rate: number; isInclusive: boolean } {
    return {
      name: this.taxStrategy.name,
      rate: this.taxStrategy.rate,
      isInclusive: this.taxStrategy.isInclusive,
    }
  }

  /**
   * Get current rounding strategy info
   */
  getRoundingInfo(): { name: string } {
    return {
      name: this.roundingStrategy.name,
    }
  }

  /**
   * Create a new service with different tax strategy
   */
  withTaxStrategy(strategy: TaxStrategy): CalculationService {
    return new CalculationService({
      taxStrategy: strategy,
      roundingStrategy: this.roundingStrategy,
    })
  }

  /**
   * Create a new service with different rounding strategy
   */
  withRoundingStrategy(strategy: RoundingStrategy): CalculationService {
    return new CalculationService({
      taxStrategy: this.taxStrategy,
      roundingStrategy: strategy,
    })
  }
}

/**
 * Default singleton instance with PPN 11% and standard rounding
 */
export const calculationService = new CalculationService()
