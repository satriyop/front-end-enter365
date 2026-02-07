/**
 * Discount Strategy Tests
 *
 * Tests the three discount calculation strategies:
 * - AmountDiscountStrategy: Fixed amount discount, capped at gross
 * - PercentDiscountStrategy: Percentage discount, capped at 100%
 * - TieredDiscountStrategy: Quantity-based tiered discount
 */

import { describe, it, expect } from 'vitest'
import { AmountDiscountStrategy } from '../discount/AmountDiscountStrategy'
import { PercentDiscountStrategy } from '../discount/PercentDiscountStrategy'
import { TieredDiscountStrategy, type DiscountTier } from '../discount/TieredDiscountStrategy'

describe('AmountDiscountStrategy', () => {
  const strategy = new AmountDiscountStrategy()

  it('has correct name', () => {
    expect(strategy.name).toBe('Fixed Amount')
  })

  it('returns exact discount amount', () => {
    expect(strategy.calculate(1000000, 50000)).toBe(50000)
  })

  it('caps discount at gross amount', () => {
    expect(strategy.calculate(100000, 200000)).toBe(100000)
  })

  it('returns 0 for negative discount value', () => {
    expect(strategy.calculate(100000, -10000)).toBe(0)
  })

  it('returns 0 for zero discount', () => {
    expect(strategy.calculate(100000, 0)).toBe(0)
  })

  it('handles zero gross amount', () => {
    expect(strategy.calculate(0, 50000)).toBe(0)
  })

  it('handles exact match (discount equals gross)', () => {
    expect(strategy.calculate(100000, 100000)).toBe(100000)
  })
})

describe('PercentDiscountStrategy', () => {
  const strategy = new PercentDiscountStrategy()

  it('has correct name', () => {
    expect(strategy.name).toBe('Percentage')
  })

  it('calculates percentage discount', () => {
    expect(strategy.calculate(200000, 10)).toBe(20000)
  })

  it('handles 50% discount', () => {
    expect(strategy.calculate(100000, 50)).toBe(50000)
  })

  it('handles 100% discount', () => {
    expect(strategy.calculate(100000, 100)).toBe(100000)
  })

  it('caps at 100% (prevents negative)', () => {
    expect(strategy.calculate(100000, 150)).toBe(100000)
  })

  it('returns 0 for negative percentage', () => {
    expect(strategy.calculate(100000, -10)).toBe(0)
  })

  it('returns 0 for zero percentage', () => {
    expect(strategy.calculate(100000, 0)).toBe(0)
  })

  it('handles zero gross amount', () => {
    expect(strategy.calculate(0, 25)).toBe(0)
  })

  it('handles fractional percentages', () => {
    expect(strategy.calculate(1000000, 2.5)).toBe(25000)
  })
})

describe('TieredDiscountStrategy', () => {
  const tiers: DiscountTier[] = [
    { minQuantity: 100, discountPercent: 15 },
    { minQuantity: 50, discountPercent: 10 },
    { minQuantity: 10, discountPercent: 5 },
  ]
  const strategy = new TieredDiscountStrategy(tiers)

  it('has correct name', () => {
    expect(strategy.name).toBe('Tiered')
  })

  describe('calculate', () => {
    it('applies highest tier for large quantity', () => {
      // 200 units >= 100 → 15% off
      expect(strategy.calculate(1000000, 200)).toBe(150000)
    })

    it('applies middle tier', () => {
      // 75 units >= 50 → 10% off
      expect(strategy.calculate(1000000, 75)).toBe(100000)
    })

    it('applies lowest tier', () => {
      // 15 units >= 10 → 5% off
      expect(strategy.calculate(1000000, 15)).toBe(50000)
    })

    it('applies exact tier boundary', () => {
      // 50 units >= 50 → 10% off
      expect(strategy.calculate(1000000, 50)).toBe(100000)
    })

    it('returns 0 when below all tiers', () => {
      // 5 units < 10 → no discount
      expect(strategy.calculate(1000000, 5)).toBe(0)
    })

    it('returns 0 for zero quantity', () => {
      expect(strategy.calculate(1000000, 0)).toBe(0)
    })
  })

  describe('getTierForQuantity', () => {
    it('returns matching tier', () => {
      const tier = strategy.getTierForQuantity(75)
      expect(tier).toEqual({ minQuantity: 50, discountPercent: 10 })
    })

    it('returns null below all tiers', () => {
      expect(strategy.getTierForQuantity(3)).toBeNull()
    })

    it('returns highest matching tier', () => {
      const tier = strategy.getTierForQuantity(150)
      expect(tier).toEqual({ minQuantity: 100, discountPercent: 15 })
    })
  })

  describe('getTiers', () => {
    it('returns a copy of tiers sorted by minQuantity descending', () => {
      const result = strategy.getTiers()
      expect(result).toHaveLength(3)
      expect(result[0]!.minQuantity).toBe(100)
      expect(result[2]!.minQuantity).toBe(10)
    })

    it('returns a new array (not the internal reference)', () => {
      const result1 = strategy.getTiers()
      const result2 = strategy.getTiers()
      expect(result1).not.toBe(result2)
    })
  })

  describe('constructor sorting', () => {
    it('sorts unsorted tiers by minQuantity descending', () => {
      const unsorted = new TieredDiscountStrategy([
        { minQuantity: 10, discountPercent: 5 },
        { minQuantity: 100, discountPercent: 15 },
        { minQuantity: 50, discountPercent: 10 },
      ])
      const tiers = unsorted.getTiers()
      expect(tiers[0]!.minQuantity).toBe(100)
      expect(tiers[1]!.minQuantity).toBe(50)
      expect(tiers[2]!.minQuantity).toBe(10)
    })
  })
})
