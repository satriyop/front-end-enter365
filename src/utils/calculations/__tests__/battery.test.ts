import { describe, it, expect } from 'vitest'
import {
  calculateSelfConsumption,
  calculateBackupCapability,
  calculateBatterySavings,
  getRecommendedBatteryCapacity,
} from '../battery'

describe('calculateSelfConsumption', () => {
  it('returns base consumption when daily production is zero', () => {
    const result = calculateSelfConsumption(0, 10, 0.9, 0.3, 0.85)
    expect(result.without).toBe(0.3)
    expect(result.with).toBe(0.3)
    expect(result.increase).toBe(0)
  })

  it('returns base consumption when daily production is negative', () => {
    const result = calculateSelfConsumption(-10, 10, 0.9, 0.3, 0.85)
    expect(result.without).toBe(0.3)
    expect(result.increase).toBe(0)
  })

  it('increases self-consumption with battery', () => {
    // 20 kWh daily production, 10 kWh battery, 90% efficiency
    // Base: 30%, Max: 85%
    const result = calculateSelfConsumption(20, 10, 0.9, 0.3, 0.85)
    expect(result.without).toBe(0.3)
    expect(result.with).toBeGreaterThan(0.3)
    expect(result.increase).toBeGreaterThan(0)
  })

  it('caps self-consumption at max', () => {
    // Large battery should cap at max
    const result = calculateSelfConsumption(10, 100, 0.9, 0.3, 0.85)
    expect(result.with).toBe(0.85)
  })

  it('calculates increase correctly', () => {
    const result = calculateSelfConsumption(20, 10, 0.9, 0.3, 0.85)
    expect(result.increase).toBeCloseTo(result.with - result.without)
  })

  it('accounts for battery efficiency', () => {
    // Higher efficiency = more self-consumption
    const lowEfficiency = calculateSelfConsumption(20, 10, 0.7, 0.3, 0.85)
    const highEfficiency = calculateSelfConsumption(20, 10, 0.95, 0.3, 0.85)
    expect(highEfficiency.with).toBeGreaterThan(lowEfficiency.with)
  })
})

describe('calculateBackupCapability', () => {
  it('returns zeros when daily consumption is zero', () => {
    const result = calculateBackupCapability(10, 0.9, 0, 10)
    expect(result.hours).toBe(0)
    expect(result.days).toBe(0)
  })

  it('returns zeros when active hours is zero', () => {
    const result = calculateBackupCapability(10, 0.9, 30, 0)
    expect(result.hours).toBe(0)
    expect(result.days).toBe(0)
  })

  it('calculates backup hours correctly', () => {
    // 10 kWh battery, 90% efficiency = 9 kWh usable
    // 30 kWh daily consumption over 10 hours = 3 kWh/hour
    // 9 / 3 = 3 hours backup
    const result = calculateBackupCapability(10, 0.9, 30, 10)
    expect(result.hours).toBe(3)
  })

  it('calculates backup days correctly', () => {
    const result = calculateBackupCapability(10, 0.9, 30, 10)
    // 3 hours / 24 = 0.125 days, rounded to 0.1
    expect(result.days).toBe(0.1)
  })

  it('larger battery provides more backup', () => {
    const small = calculateBackupCapability(5, 0.9, 30, 10)
    const large = calculateBackupCapability(20, 0.9, 30, 10)
    expect(large.hours).toBeGreaterThan(small.hours)
  })

  it('higher efficiency provides more backup', () => {
    const low = calculateBackupCapability(10, 0.7, 30, 10)
    const high = calculateBackupCapability(10, 0.95, 30, 10)
    expect(high.hours).toBeGreaterThan(low.hours)
  })
})

describe('calculateBatterySavings', () => {
  it('calculates annual savings correctly', () => {
    // 10000 kWh production, 20% increase, 1500 IDR/kWh
    // 10000 * 0.2 * 1500 = 3,000,000 IDR
    const result = calculateBatterySavings(10000, 0.2, 1500, 3, 25)
    expect(result.annual).toBe(3000000)
  })

  it('applies degradation to lifetime savings', () => {
    const result = calculateBatterySavings(10000, 0.2, 1500, 3, 25)
    // Annual: 3,000,000
    // Without degradation: 3M * 25 = 75M
    // With 3% degradation over 25 years: factor = 1 - (0.03 * 25 / 2) = 0.625
    // Lifetime: 75M * 0.625 = 46,875,000
    expect(result.lifetime).toBeLessThan(result.annual * 25)
  })

  it('returns 0 for zero production', () => {
    const result = calculateBatterySavings(0, 0.2, 1500, 3, 25)
    expect(result.annual).toBe(0)
    expect(result.lifetime).toBe(0)
  })

  it('returns 0 for zero self-consumption increase', () => {
    const result = calculateBatterySavings(10000, 0, 1500, 3, 25)
    expect(result.annual).toBe(0)
    expect(result.lifetime).toBe(0)
  })
})

describe('getRecommendedBatteryCapacity', () => {
  it('recommends smallest capacity for small production', () => {
    // 5 kWh daily * 0.5 ratio = 2.5 kWh recommended -> 5 kWh
    const result = getRecommendedBatteryCapacity(5, 0.5)
    expect(result).toBe(5)
  })

  it('recommends 10 kWh for medium production', () => {
    // 15 kWh daily * 0.5 = 7.5 kWh recommended -> 10 kWh
    const result = getRecommendedBatteryCapacity(15, 0.5)
    expect(result).toBe(10)
  })

  it('recommends 15 kWh for larger production', () => {
    // 25 kWh daily * 0.5 = 12.5 kWh recommended -> 15 kWh
    const result = getRecommendedBatteryCapacity(25, 0.5)
    expect(result).toBe(15)
  })

  it('recommends largest for very large production', () => {
    // 60 kWh daily * 0.5 = 30 kWh recommended -> 20 kWh (max)
    const result = getRecommendedBatteryCapacity(60, 0.5)
    expect(result).toBe(20)
  })

  it('uses custom capacity options', () => {
    const result = getRecommendedBatteryCapacity(20, 0.5, [8, 12, 16])
    expect(result).toBe(12) // 20 * 0.5 = 10 kWh, rounds to 12
  })

  it('returns last option if all are too small', () => {
    const result = getRecommendedBatteryCapacity(100, 0.5, [5, 10])
    expect(result).toBe(10)
  })
})
