/**
 * CalculationService Tests
 */

import { describe, it, expect } from 'vitest'
import { CalculationService } from '../CalculationService'
import { PPNStrategy } from '../strategies/tax/PPNStrategy'
import { NoTaxStrategy } from '../strategies/tax/NoTaxStrategy'
import { InclusiveTaxStrategy } from '../strategies/tax/InclusiveTaxStrategy'
import { IndonesianRoundingStrategy } from '../strategies/rounding/IndonesianRoundingStrategy'

describe('CalculationService', () => {
  describe('calculateLineItem', () => {
    it('calculates basic line item correctly', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 2,
        unit_price: 100000,
      })

      expect(result.gross).toBe(200000)
      expect(result.discount).toBe(0)
      expect(result.net).toBe(200000)
      expect(result.tax).toBe(22000) // 11% PPN
      expect(result.total).toBe(222000)
    })

    it('handles zero quantity', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 0,
        unit_price: 100000,
      })

      expect(result.gross).toBe(0)
      expect(result.net).toBe(0)
      expect(result.total).toBe(0)
    })

    it('handles zero unit price', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 5,
        unit_price: 0,
      })

      expect(result.gross).toBe(0)
      expect(result.net).toBe(0)
      expect(result.total).toBe(0)
    })

    it('applies percent discount correctly', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        discount_type: 'percent',
        discount_value: 10,
      })

      expect(result.gross).toBe(100000)
      expect(result.discount).toBe(10000) // 10%
      expect(result.net).toBe(90000)
      expect(result.tax).toBe(9900) // 11% of 90000
      expect(result.total).toBe(99900)
    })

    it('applies amount discount correctly', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        discount_type: 'amount',
        discount_value: 5000,
      })

      expect(result.discount).toBe(5000)
      expect(result.net).toBe(95000)
    })

    it('caps percent discount at 100%', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        discount_type: 'percent',
        discount_value: 150, // Over 100%
      })

      expect(result.discount).toBe(100000) // Capped at gross
      expect(result.net).toBe(0)
    })

    it('caps amount discount at gross amount', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        discount_type: 'amount',
        discount_value: 150000, // More than gross
      })

      expect(result.discount).toBe(100000) // Capped at gross
      expect(result.net).toBe(0)
    })

    it('ignores null discount values', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        discount_type: 'percent',
        discount_value: null,
      })

      expect(result.discount).toBe(0)
      expect(result.net).toBe(100000)
    })

    it('uses item-specific tax rate when provided', () => {
      const service = new CalculationService()
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
        tax_rate: 0.05, // 5% instead of default 11%
      })

      expect(result.tax).toBe(5000) // 5%
      expect(result.total).toBe(105000)
    })
  })

  describe('with different tax strategies', () => {
    it('uses no tax strategy', () => {
      const service = new CalculationService({ taxStrategy: new NoTaxStrategy() })
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
      })

      expect(result.tax).toBe(0)
      expect(result.total).toBe(100000)
    })

    it('handles inclusive tax correctly', () => {
      const service = new CalculationService({
        taxStrategy: new InclusiveTaxStrategy(0.11),
      })
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 111000, // Price includes tax
      })

      expect(result.net).toBe(111000)
      // Tax extracted from inclusive price: 111000 - (111000 / 1.11) ≈ 11000
      expect(result.tax).toBeCloseTo(11000, -2)
      expect(result.total).toBe(111000) // Same as net for inclusive
    })

    it('reports correct tax info', () => {
      const service = new CalculationService({ taxStrategy: new PPNStrategy() })
      const info = service.getTaxInfo()

      expect(info.name).toBe('PPN 11%')
      expect(info.rate).toBe(0.11)
      expect(info.isInclusive).toBe(false)
    })
  })

  describe('with different rounding strategies', () => {
    it('uses Indonesian rounding strategy', () => {
      const service = new CalculationService({
        roundingStrategy: new IndonesianRoundingStrategy(100),
      })
      const result = service.calculateLineItem({
        quantity: 1,
        unit_price: 123456,
      })

      // Should round to nearest 100
      expect(result.gross).toBe(123500)
    })
  })

  describe('calculateTotals', () => {
    it('calculates document totals correctly', () => {
      const service = new CalculationService()
      const result = service.calculateTotals([
        { quantity: 2, unit_price: 100000 },
        { quantity: 1, unit_price: 50000, discount_type: 'percent', discount_value: 10 },
      ])

      // First item: 200000 net
      // Second item: 50000 - 5000 = 45000 net
      // Subtotal: 245000
      expect(result.subtotal).toBe(245000)
      expect(result.totalDiscount).toBe(5000)
      expect(result.taxableAmount).toBe(245000)
      expect(result.tax).toBe(26950) // 11% of 245000
      expect(result.grandTotal).toBe(271950)
    })

    it('handles empty items array', () => {
      const service = new CalculationService()
      const result = service.calculateTotals([])

      expect(result.subtotal).toBe(0)
      expect(result.totalDiscount).toBe(0)
      expect(result.tax).toBe(0)
      expect(result.grandTotal).toBe(0)
    })

    it('calculates multiple items with various discounts', () => {
      const service = new CalculationService({ taxStrategy: new NoTaxStrategy() })
      const result = service.calculateTotals([
        { quantity: 1, unit_price: 100000 },
        { quantity: 2, unit_price: 50000, discount_type: 'percent', discount_value: 20 },
        { quantity: 1, unit_price: 30000, discount_type: 'amount', discount_value: 5000 },
      ])

      // Item 1: 100000 (no discount)
      // Item 2: 100000 - 20000 = 80000
      // Item 3: 30000 - 5000 = 25000
      // Total: 205000
      expect(result.subtotal).toBe(205000)
      expect(result.totalDiscount).toBe(25000) // 20000 + 5000
      expect(result.grandTotal).toBe(205000) // No tax
    })
  })

  describe('withTaxStrategy', () => {
    it('creates new service with different tax strategy', () => {
      const original = new CalculationService()
      const noTax = original.withTaxStrategy(new NoTaxStrategy())

      const originalResult = original.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
      })
      const noTaxResult = noTax.calculateLineItem({
        quantity: 1,
        unit_price: 100000,
      })

      expect(originalResult.tax).toBe(11000)
      expect(noTaxResult.tax).toBe(0)
    })
  })
})
