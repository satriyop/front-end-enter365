import { describe, expect, it } from 'vitest'
import { priceForVendor } from '../vendorPrice'

const product = {
  purchase_price: 80_000,
  selling_price: 120_000,
  vendor_pricelists: [
    { contact_id: 7, min_qty: 1, price: 78_000 },
    { contact_id: 7, min_qty: 10, price: 75_000 },
  ],
}

describe('priceForVendor', () => {
  it('uses the highest min_qty line that the qty meets', () => {
    expect(priceForVendor(product, 7, 1)).toBe(78_000)
    expect(priceForVendor(product, 7, 10)).toBe(75_000)
    expect(priceForVendor(product, 7, 25)).toBe(75_000)
  })

  it('falls back to purchase_price when vendor or qty does not match', () => {
    expect(priceForVendor(product, 9, 10)).toBe(80_000)
    expect(priceForVendor(product, null, 10)).toBe(80_000)
  })
})
