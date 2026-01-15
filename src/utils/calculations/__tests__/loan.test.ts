import { describe, it, expect } from 'vitest'
import { calculateLoanPayment, calculateLeasePayment } from '../loan'

describe('calculateLoanPayment', () => {
  it('returns 0 for zero principal', () => {
    expect(calculateLoanPayment(0, 12, 5)).toBe(0)
  })

  it('returns 0 for negative principal', () => {
    expect(calculateLoanPayment(-10000, 12, 5)).toBe(0)
  })

  it('calculates simple division when interest rate is zero', () => {
    const result = calculateLoanPayment(12000, 0, 1)
    expect(result).toBe(1000) // 12000 / 12 months
  })

  it('calculates simple division when interest rate is negative', () => {
    const result = calculateLoanPayment(12000, -5, 1)
    expect(result).toBe(1000) // Falls back to simple division
  })

  it('calculates correct monthly payment with 12% annual rate', () => {
    // Known value: 100,000 at 12% for 5 years ≈ 2,224.44/month
    const result = calculateLoanPayment(100000, 12, 5)
    expect(result).toBeCloseTo(2224.44, 0)
  })

  it('calculates correct monthly payment with 8% annual rate', () => {
    // 50,000 at 8% for 3 years
    const result = calculateLoanPayment(50000, 8, 3)
    expect(result).toBeCloseTo(1566.82, 0)
  })

  it('handles short loan terms', () => {
    // 12,000 at 12% for 1 year
    const result = calculateLoanPayment(12000, 12, 1)
    expect(result).toBeCloseTo(1066.19, 0)
  })

  it('handles long loan terms', () => {
    // 100,000 at 10% for 25 years
    const result = calculateLoanPayment(100000, 10, 25)
    expect(result).toBeCloseTo(908.70, 0)
  })
})

describe('calculateLeasePayment', () => {
  it('returns zeros for zero system cost', () => {
    const result = calculateLeasePayment(0, 5, 10, 0.003)
    expect(result.monthlyLease).toBe(0)
    expect(result.totalLeasePayments).toBe(0)
    expect(result.buyoutPrice).toBe(0)
    expect(result.totalCost).toBe(0)
  })

  it('returns zeros for zero lease term', () => {
    const result = calculateLeasePayment(100000, 0, 10, 0.003)
    expect(result.monthlyLease).toBe(0)
  })

  it('calculates buyout price correctly', () => {
    const result = calculateLeasePayment(100000, 5, 10, 0.003)
    expect(result.buyoutPrice).toBe(10000) // 10% residual
  })

  it('calculates total cost as lease payments + buyout', () => {
    const result = calculateLeasePayment(100000, 5, 10, 0.003)
    expect(result.totalCost).toBe(result.totalLeasePayments + result.buyoutPrice)
  })

  it('calculates monthly payments correctly', () => {
    // 100,000 system, 5 year lease, 10% residual, 0.003 money factor
    // Depreciation = (100000 - 10000) / 60 = 1500/month
    // Finance charge = (100000 + 10000) * 0.003 = 330/month
    // Monthly = 1500 + 330 = 1830
    const result = calculateLeasePayment(100000, 5, 10, 0.003)
    expect(result.monthlyLease).toBe(1830)
  })

  it('handles different residual percentages', () => {
    // 20% residual
    const result = calculateLeasePayment(100000, 5, 20, 0.003)
    expect(result.buyoutPrice).toBe(20000)
  })

  it('handles different money factors', () => {
    // Higher money factor = higher monthly payment
    const lowFactor = calculateLeasePayment(100000, 5, 10, 0.002)
    const highFactor = calculateLeasePayment(100000, 5, 10, 0.004)
    expect(highFactor.monthlyLease).toBeGreaterThan(lowFactor.monthlyLease)
  })
})
