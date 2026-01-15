import { describe, it, expect } from 'vitest'
import {
  generateProjections,
  calculatePaybackPeriod,
  calculateROI,
  sumProjectionSavings,
} from '../projections'

describe('generateProjections', () => {
  it('generates correct number of years', () => {
    const projections = generateProjections(10000, 1500, 3, 0.5, 25)
    expect(projections).toHaveLength(25)
  })

  it('sets year numbers correctly', () => {
    const projections = generateProjections(10000, 1500, 3, 0.5, 5)
    expect(projections.map((p) => p.year)).toEqual([1, 2, 3, 4, 5])
  })

  it('calculates first year savings correctly', () => {
    // 10,000 kWh * 1,500 IDR = 15,000,000 IDR
    const projections = generateProjections(10000, 1500, 0, 0, 3)
    expect(projections[0]?.savings).toBe(15000000)
  })

  it('applies tariff escalation correctly', () => {
    // 5% escalation, no degradation
    const projections = generateProjections(10000, 1000, 5, 0, 3)
    expect(projections[0]?.savings).toBe(10000000) // Year 1
    expect(projections[1]?.savings).toBe(10500000) // Year 2: 10M * 1.05
    expect(projections[2]?.savings).toBe(11025000) // Year 3: 10.5M * 1.05
  })

  it('applies degradation correctly', () => {
    // 10% degradation, no escalation (for easy calculation)
    const projections = generateProjections(10000, 1000, 0, 10, 3)
    expect(projections[0]?.savings).toBe(10000000) // Year 1
    expect(projections[1]?.savings).toBe(9000000) // Year 2: 10M * 0.9
    expect(projections[2]?.savings).toBe(8100000) // Year 3: 9M * 0.9
  })

  it('applies both escalation and degradation', () => {
    // 3% escalation, 0.5% degradation
    const projections = generateProjections(10000, 1000, 3, 0.5, 2)
    // Year 1: 10000 * 1000 = 10,000,000
    expect(projections[0]?.savings).toBe(10000000)
    // Year 2: (10000 * 0.995) * (1000 * 1.03) = 9950 * 1030 = 10,248,500
    expect(projections[1]?.savings).toBe(10248500)
  })

  it('handles zero production', () => {
    const projections = generateProjections(0, 1500, 3, 0.5, 5)
    expect(projections.every((p) => p.savings === 0)).toBe(true)
  })

  it('handles zero rate', () => {
    const projections = generateProjections(10000, 0, 3, 0.5, 5)
    expect(projections.every((p) => p.savings === 0)).toBe(true)
  })
})

describe('calculatePaybackPeriod', () => {
  it('returns 0 for zero cost', () => {
    const projections = [{ savings: 1000 }]
    expect(calculatePaybackPeriod(projections, 0)).toBe(0)
  })

  it('returns 0 for negative cost', () => {
    const projections = [{ savings: 1000 }]
    expect(calculatePaybackPeriod(projections, -1000)).toBe(0)
  })

  it('returns null for empty projections', () => {
    expect(calculatePaybackPeriod([], 10000)).toBeNull()
  })

  it('returns null when savings never cover cost', () => {
    const projections = Array.from({ length: 25 }, () => ({ savings: 100 }))
    expect(calculatePaybackPeriod(projections, 100000)).toBeNull()
  })

  it('calculates exact year payback', () => {
    const projections = [
      { savings: 5000 },
      { savings: 5000 },
      { savings: 5000 },
    ]
    // Cost 10000, cumulative after year 2 = 10000, payback = 2 years
    expect(calculatePaybackPeriod(projections, 10000)).toBe(2)
  })

  it('calculates fractional year payback correctly', () => {
    const projections = [
      { savings: 3000 },
      { savings: 3000 },
      { savings: 3000 },
    ]
    // Cost 7500: 3000 + 3000 = 6000 after year 2
    // Need 1500 more, 1500/3000 = 0.5
    // Payback = 2 + 0.5 = 2.5 years
    expect(calculatePaybackPeriod(projections, 7500)).toBe(2.5)
  })

  it('handles payback in first year', () => {
    const projections = [{ savings: 10000 }, { savings: 10000 }]
    // Cost 5000, first year savings 10000
    // Fraction: 5000/10000 = 0.5
    expect(calculatePaybackPeriod(projections, 5000)).toBe(0.5)
  })

  it('handles zero savings in some years', () => {
    const projections = [
      { savings: 0 },
      { savings: 5000 },
      { savings: 5000 },
    ]
    expect(calculatePaybackPeriod(projections, 5000)).toBe(2)
  })
})

describe('calculateROI', () => {
  it('returns 0 for zero cost', () => {
    expect(calculateROI(50000, 0)).toBe(0)
  })

  it('returns 0 for negative cost', () => {
    expect(calculateROI(50000, -10000)).toBe(0)
  })

  it('calculates positive ROI correctly', () => {
    // 150000 savings, 100000 cost = 50% ROI
    expect(calculateROI(150000, 100000)).toBe(50)
  })

  it('calculates break-even correctly', () => {
    // Savings = Cost = 0% ROI
    expect(calculateROI(100000, 100000)).toBe(0)
  })

  it('calculates negative ROI correctly', () => {
    // 50000 savings, 100000 cost = -50% ROI
    expect(calculateROI(50000, 100000)).toBe(-50)
  })

  it('handles large numbers', () => {
    // 300M savings, 100M cost = 200% ROI
    expect(calculateROI(300000000, 100000000)).toBe(200)
  })
})

describe('sumProjectionSavings', () => {
  it('returns 0 for empty array', () => {
    expect(sumProjectionSavings([])).toBe(0)
  })

  it('sums all savings correctly', () => {
    const projections = [
      { savings: 1000 },
      { savings: 2000 },
      { savings: 3000 },
    ]
    expect(sumProjectionSavings(projections)).toBe(6000)
  })

  it('handles zero savings', () => {
    const projections = [
      { savings: 0 },
      { savings: 1000 },
      { savings: 0 },
    ]
    expect(sumProjectionSavings(projections)).toBe(1000)
  })
})
