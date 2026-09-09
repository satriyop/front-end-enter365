import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('PO vendor pricelist (#128)', () => {
  it('offers catalog products after vendor is selected, not Custom as the only path', () => {
    const form = readFileSync(resolve(__dirname, '../PurchaseOrderFormPage.vue'), 'utf8')

    expect(form).toContain('priceForVendor')
    expect(form).toContain('vendorPriceSource')
    expect(form).toContain('Select product…')
    expect(form).toContain(':disabled="!contactId"')
    expect(form).toContain('Vendor pricelist')
    expect(form).toContain('po-item-${index}-price-source')
    expect(form).not.toMatch(/<option value="">Custom<\/option>/)
  })
})
