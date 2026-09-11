import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { purchaseOrderAmount, purchaseOrderLineAmount } from '../purchaseOrderAmount'

describe('PO list/detail amount (#137)', () => {
  it('reads total_amount from the API resource, not a missing total field', () => {
    expect(purchaseOrderAmount({ total_amount: 2700, total: 0 })).toBe(2700)
    expect(purchaseOrderAmount({ total_amount: 2700 })).toBe(2700)
    expect(purchaseOrderAmount({ total: 2700 })).toBe(2700)
  })

  it('falls back to subtotal + tax when total_amount is 0', () => {
    expect(purchaseOrderAmount({
      total_amount: 0,
      total: 0,
      subtotal: 2432,
      tax_amount: 268,
      discount_amount: 0,
    })).toBe(2700)
  })

  it('unwraps a vue-query style ref so template function calls still total', () => {
    expect(purchaseOrderAmount({
      value: { total_amount: 0, subtotal: 2432, tax_amount: 268, po_number: 'PO-202609-0009' },
    })).toBe(2700)
  })

  it('reads line Total from total_amount or subtotal, not missing line_total', () => {
    expect(purchaseOrderLineAmount({ line_total: null, subtotal: 2432, tax_amount: 268, total_amount: 2700 })).toBe(2700)
    expect(purchaseOrderLineAmount({ subtotal: 2432, tax_amount: 268 })).toBe(2700)
    expect(purchaseOrderLineAmount({ quantity: 1, unit_price: 2432 })).toBe(2432)
  })

  it('wires list AMOUNT and detail/line Total through the helpers', () => {
    const list = readFileSync(resolve(__dirname, '../PurchaseOrderListPage.vue'), 'utf8')
    const detail = readFileSync(resolve(__dirname, '../PurchaseOrderDetailPage.vue'), 'utf8')

    expect(list).toContain("key: 'total_amount'")
    expect(list).toContain('purchaseOrderAmount')
    expect(list).toContain('poListRows')
    expect(detail).toContain('headerTotal')
    expect(detail).toContain('purchaseOrderLineAmount')
    expect(detail).not.toContain('formatCurrency(po.total)')
    expect(detail).not.toContain('item.line_total')
  })
})
