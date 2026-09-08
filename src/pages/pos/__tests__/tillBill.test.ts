import { describe, expect, it } from 'vitest'
import { addOnBill, roundCashPayable, tillBill } from '../tillBill'

describe('addOnBill', () => {
  it('charges Hakau cafe 22000 as 25410', () => {
    expect(addOnBill(22_000, 5, 10)).toEqual({
      subtotal: 22_000,
      service: 1_100,
      tax: 2_310,
      payable: 25_410,
    })
  })

  it('charges Garlic Cheese cafe 28000 as 32340', () => {
    expect(addOnBill(28_000, 5, 10).payable).toBe(32_340)
  })
})

describe('tillBill', () => {
  it('leaves inclusive mode as the tile total', () => {
    expect(tillBill(28_000, 'inclusive', 5, 10).payable).toBe(28_000)
  })

  it('adds service and PBJT in add mode', () => {
    expect(tillBill(22_000, 'add', 5, 10).payable).toBe(25_410)
  })
})

describe('roundCashPayable', () => {
  it('rounds Air Mineral 9240 down to 9200', () => {
    expect(roundCashPayable(9_240)).toBe(9_200)
  })

  it('rounds Hakau 25410 down to 25400', () => {
    expect(roundCashPayable(25_410)).toBe(25_400)
  })

  it('rounds half of the unit up', () => {
    expect(roundCashPayable(9_250)).toBe(9_300)
  })

  it('leaves an already-round bill unchanged', () => {
    expect(roundCashPayable(9_200)).toBe(9_200)
  })
})
