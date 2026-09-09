import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { applyPurchaseOrderProductDefaults, applyQuotedUnitPrice, isCurrentVendorQuoteRequest, purchaseOrderPriceHint, purchaseOrderPriceHintFromQuote } from '../poLineDefaults'

describe('PO vendor pricelist (#128)', () => {
  it('fills unit price from the vendor pricelist, else purchase price', () => {
    const item = {
      product_id: null as number | null,
      description: '',
      unit: 'pcs',
      tax_rate: 11,
      unit_price: 0,
      quantity: 10,
    }
    applyPurchaseOrderProductDefaults(item, {
      id: 9,
      name: 'MCB 16A',
      unit: 'pcs',
      tax_rate: 11,
      purchase_price: 80_000,
      vendor_pricelists: [
        { contact_id: 7, min_qty: 1, price: 78_000 },
        { contact_id: 7, min_qty: 10, price: 75_000 },
      ],
    }, 7)

    expect(item.unit_price).toBe(75_000)
    expect(item.description).toBe('MCB 16A')
    expect(purchaseOrderPriceHint({
      id: 9,
      name: 'MCB 16A',
      purchase_price: 80_000,
      vendor_pricelists: [{ contact_id: 7, min_qty: 10, price: 75_000 }],
    }, 7, 10)).toContain('Vendor pricelist')
  })

  it('offers catalog products after vendor is selected, not Custom as the only path', () => {
    const form = readFileSync(resolve(__dirname, '../PurchaseOrderFormPage.vue'), 'utf8')

    expect(form).toContain('applyPurchaseOrderProductDefaults')
    expect(form).toContain('Select product…')
    expect(form).toContain(':disabled="!contactId"')
    expect(form).toContain('po-item-${index}-price-source')
    expect(form).toContain("setFieldValue(`items[${index}]`")
    expect(form).toContain('po-price-${index}-${field.value.product_id}')
    expect(form).toContain('/price-for-vendor')
    expect(form).not.toMatch(/<option value="">Custom<\/option>/)
  })

  it('labels a server quote as vendor pricelist', () => {
    expect(purchaseOrderPriceHintFromQuote({ price: 2432, source: 'pricelist' })).toBe('Vendor pricelist · 2432')
    expect(purchaseOrderPriceHintFromQuote({ price: 2560, source: 'purchase_price' })).toBe('Product purchase price · 2560')
    expect(purchaseOrderPriceHintFromQuote({ price: 0, source: 'none' })).toBe('')
  })

  it('overwrites the listed price with a server quote and ignores stale requests', () => {
    const item = {
      product_id: 9 as number | null,
      description: 'MCB 16A',
      unit: 'pcs',
      tax_rate: 11,
      unit_price: 80_000,
      quantity: 1,
    }
    applyQuotedUnitPrice(item, { price: 75_000, source: 'pricelist' })
    expect(item.unit_price).toBe(75_000)

    applyQuotedUnitPrice(item, undefined)
    expect(item.unit_price).toBe(75_000)

    expect(isCurrentVendorQuoteRequest(item, 7, { productId: 9, qty: 1, vendorId: 7 })).toBe(true)
    expect(isCurrentVendorQuoteRequest({ ...item, product_id: 10 }, 7, { productId: 9, qty: 1, vendorId: 7 })).toBe(false)
    expect(isCurrentVendorQuoteRequest({ ...item, quantity: 10 }, 7, { productId: 9, qty: 1, vendorId: 7 })).toBe(false)
  })
})
