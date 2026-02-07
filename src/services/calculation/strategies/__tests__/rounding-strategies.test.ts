/**
 * Rounding Strategy Tests
 *
 * Tests the three rounding strategies:
 * - StandardRoundingStrategy: Math.round (half-up)
 * - RoundUpStrategy: Math.ceil (always up)
 * - IndonesianRoundingStrategy: Round to nearest 100/1000
 */

import { describe, it, expect } from 'vitest'
import { StandardRoundingStrategy } from '../rounding/StandardRoundingStrategy'
import { RoundUpStrategy } from '../rounding/RoundUpStrategy'
import { IndonesianRoundingStrategy } from '../rounding/IndonesianRoundingStrategy'

describe('StandardRoundingStrategy', () => {
  const strategy = new StandardRoundingStrategy()

  it('has correct name', () => {
    expect(strategy.name).toBe('Standard')
  })

  describe('precision 0 (default)', () => {
    it('rounds down at .4', () => {
      expect(strategy.round(100.4)).toBe(100)
    })

    it('rounds up at .5', () => {
      expect(strategy.round(100.5)).toBe(101)
    })

    it('rounds up at .9', () => {
      expect(strategy.round(100.9)).toBe(101)
    })

    it('keeps integer unchanged', () => {
      expect(strategy.round(100)).toBe(100)
    })
  })

  describe('with precision', () => {
    it('rounds to 2 decimal places', () => {
      expect(strategy.round(100.456, 2)).toBe(100.46)
    })

    it('rounds to 1 decimal place', () => {
      expect(strategy.round(100.45, 1)).toBe(100.5)
    })

    it('rounds to 0 decimal places explicitly', () => {
      expect(strategy.round(100.5, 0)).toBe(101)
    })
  })

  it('handles zero', () => {
    expect(strategy.round(0)).toBe(0)
  })

  it('handles negative numbers', () => {
    expect(strategy.round(-100.5)).toBe(-100)
  })
})

describe('RoundUpStrategy', () => {
  const strategy = new RoundUpStrategy()

  it('has correct name', () => {
    expect(strategy.name).toBe('Round Up')
  })

  describe('precision 0 (default)', () => {
    it('rounds up at .1', () => {
      expect(strategy.round(100.1)).toBe(101)
    })

    it('rounds up at .01', () => {
      expect(strategy.round(100.01)).toBe(101)
    })

    it('keeps integer unchanged', () => {
      expect(strategy.round(100)).toBe(100)
    })

    it('rounds up at .5', () => {
      expect(strategy.round(100.5)).toBe(101)
    })
  })

  describe('with precision', () => {
    it('rounds up to 2 decimal places', () => {
      expect(strategy.round(100.451, 2)).toBe(100.46)
    })

    it('keeps value if already at precision', () => {
      expect(strategy.round(100.45, 2)).toBe(100.45)
    })
  })

  it('handles zero', () => {
    expect(strategy.round(0)).toBe(0)
  })

  it('handles negative numbers (ceil goes toward 0)', () => {
    expect(strategy.round(-100.5)).toBe(-100)
  })
})

describe('IndonesianRoundingStrategy', () => {
  describe('round to nearest 100 (default)', () => {
    const strategy = new IndonesianRoundingStrategy()

    it('has descriptive name', () => {
      expect(strategy.name).toContain('100')
    })

    it('rounds to nearest 100', () => {
      expect(strategy.round(123450)).toBe(123500)
    })

    it('rounds down when below midpoint', () => {
      expect(strategy.round(123449)).toBe(123400)
    })

    it('rounds up at midpoint', () => {
      expect(strategy.round(123450)).toBe(123500)
    })

    it('keeps exact hundreds unchanged', () => {
      expect(strategy.round(123400)).toBe(123400)
    })

    it('handles zero', () => {
      expect(strategy.round(0)).toBe(0)
    })

    it('ignores precision parameter', () => {
      expect(strategy.round(123450, 2)).toBe(123500)
    })
  })

  describe('round to nearest 1000', () => {
    const strategy = new IndonesianRoundingStrategy(1000)

    it('has descriptive name with 1000', () => {
      expect(strategy.name).toContain('1.000')
    })

    it('rounds to nearest 1000', () => {
      expect(strategy.round(123500)).toBe(124000)
    })

    it('rounds down below midpoint', () => {
      expect(strategy.round(123400)).toBe(123000)
    })

    it('rounds up at midpoint', () => {
      expect(strategy.round(123500)).toBe(124000)
    })

    it('keeps exact thousands unchanged', () => {
      expect(strategy.round(123000)).toBe(123000)
    })
  })

  describe('realistic IDR amounts', () => {
    const strategy = new IndonesianRoundingStrategy(100)

    it('rounds typical invoice total', () => {
      // 1,234,567 → 1,234,600
      expect(strategy.round(1234567)).toBe(1234600)
    })

    it('rounds small transaction', () => {
      // 15,750 → 15,800
      expect(strategy.round(15750)).toBe(15800)
    })

    it('rounds exact amount unchanged', () => {
      expect(strategy.round(500000)).toBe(500000)
    })
  })
})
