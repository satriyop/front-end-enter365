import { describe, expect, it } from 'vitest'
import { resolveStockInUnitCost } from '../stockInCost'

describe('resolveStockInUnitCost', () => {
  it('keeps an explicit positive cost', () => {
    expect(resolveStockInUnitCost(15000, { purchasePrice: 11000 })).toEqual({ unitCost: 15000 })
  })

  it('uses current average when entered cost is 0', () => {
    expect(resolveStockInUnitCost(0, { averageCost: 11000, purchasePrice: 5000 })).toEqual({
      unitCost: 11000,
    })
  })

  it('uses purchase price when there is no average', () => {
    expect(resolveStockInUnitCost(0, { purchasePrice: 11000 })).toEqual({ unitCost: 11000 })
  })

  it('errors when 0 has no fallback', () => {
    expect(resolveStockInUnitCost(0, {})).toEqual({
      error: 'Unit cost is required for stock in',
    })
  })
})
