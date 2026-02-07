/**
 * Tax Strategy Tests
 *
 * Tests the three tax calculation strategies:
 * - PPNStrategy: Indonesian PPN at 11% (exclusive)
 * - InclusiveTaxStrategy: Tax already included in price
 * - NoTaxStrategy: Zero tax for exempt items
 */

import { describe, it, expect } from 'vitest'
import { PPNStrategy } from '../tax/PPNStrategy'
import { InclusiveTaxStrategy } from '../tax/InclusiveTaxStrategy'
import { NoTaxStrategy } from '../tax/NoTaxStrategy'

describe('PPNStrategy', () => {
  const strategy = new PPNStrategy()

  it('has correct name', () => {
    expect(strategy.name).toBe('PPN 11%')
  })

  it('has 11% rate', () => {
    expect(strategy.rate).toBe(0.11)
  })

  it('is not inclusive', () => {
    expect(strategy.isInclusive).toBe(false)
  })

  it('calculates 11% tax on subtotal', () => {
    expect(strategy.calculate(1000000)).toBe(110000)
  })

  it('handles zero subtotal', () => {
    expect(strategy.calculate(0)).toBe(0)
  })

  it('handles small amounts', () => {
    expect(strategy.calculate(100)).toBeCloseTo(11)
  })

  it('handles large amounts', () => {
    // 500 million * 11% = 55 million
    expect(strategy.calculate(500000000)).toBe(55000000)
  })
})

describe('InclusiveTaxStrategy', () => {
  describe('with default 11% rate', () => {
    const strategy = new InclusiveTaxStrategy()

    it('has auto-generated name', () => {
      expect(strategy.name).toBe('Inclusive Tax 11%')
    })

    it('has 11% rate', () => {
      expect(strategy.rate).toBe(0.11)
    })

    it('is inclusive', () => {
      expect(strategy.isInclusive).toBe(true)
    })

    it('extracts tax from inclusive amount', () => {
      // 111,000 includes 11% tax
      // tax = 111,000 - (111,000 / 1.11) = 111,000 - 100,000 = 11,000
      expect(strategy.calculate(111000)).toBeCloseTo(11000, 0)
    })

    it('extracts tax from 1M inclusive', () => {
      // 1,000,000 / 1.11 = 900,900.90...
      // tax = 1,000,000 - 900,900.90 = 99,099.10
      const tax = strategy.calculate(1000000)
      expect(tax).toBeCloseTo(99099.1, 0)
    })

    it('handles zero', () => {
      expect(strategy.calculate(0)).toBe(0)
    })
  })

  describe('with custom rate', () => {
    it('accepts custom rate', () => {
      const strategy = new InclusiveTaxStrategy(0.10)
      expect(strategy.rate).toBe(0.10)
    })

    it('calculates with custom rate', () => {
      const strategy = new InclusiveTaxStrategy(0.10)
      // 110,000 includes 10% tax
      // tax = 110,000 - (110,000 / 1.10) = 110,000 - 100,000 = 10,000
      expect(strategy.calculate(110000)).toBeCloseTo(10000, 0)
    })

    it('accepts custom name', () => {
      const strategy = new InclusiveTaxStrategy(0.05, 'Service Tax 5%')
      expect(strategy.name).toBe('Service Tax 5%')
    })

    it('auto-generates name from rate', () => {
      const strategy = new InclusiveTaxStrategy(0.10)
      expect(strategy.name).toBe('Inclusive Tax 10%')
    })
  })
})

describe('NoTaxStrategy', () => {
  const strategy = new NoTaxStrategy()

  it('has correct name', () => {
    expect(strategy.name).toBe('No Tax')
  })

  it('has 0 rate', () => {
    expect(strategy.rate).toBe(0)
  })

  it('is not inclusive', () => {
    expect(strategy.isInclusive).toBe(false)
  })

  it('always returns 0', () => {
    expect(strategy.calculate(1000000)).toBe(0)
  })

  it('returns 0 for zero subtotal', () => {
    expect(strategy.calculate(0)).toBe(0)
  })

  it('returns 0 for any amount', () => {
    expect(strategy.calculate(999999999)).toBe(0)
  })
})
