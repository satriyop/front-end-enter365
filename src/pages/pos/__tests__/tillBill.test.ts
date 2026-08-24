import { describe, expect, it } from 'vitest'
import { addOnBill, tillBill } from '../tillBill'

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
