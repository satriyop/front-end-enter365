import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { purchaseOrderAmount } from '../purchaseOrderAmount'

describe('PO list/detail amount (#137)', () => {
  it('reads total_amount from the API resource, not a missing total field', () => {
    expect(purchaseOrderAmount({ total_amount: 2432, total: 0 })).toBe(2432)
    expect(purchaseOrderAmount({ total_amount: 2700 })).toBe(2700)
    expect(purchaseOrderAmount({ total: 2700 })).toBe(2700)
    expect(purchaseOrderAmount({})).toBe(0)
  })

  it('wires list AMOUNT and detail Total to total_amount', () => {
    const list = readFileSync(resolve(__dirname, '../PurchaseOrderListPage.vue'), 'utf8')
    const detail = readFileSync(resolve(__dirname, '../PurchaseOrderDetailPage.vue'), 'utf8')

    expect(list).toContain("key: 'total_amount'")
    expect(list).toContain('purchaseOrderAmount')
    expect(list).not.toContain("key: 'total'")
    expect(detail).toContain('purchaseOrderAmount(po)')
    expect(detail).not.toContain('formatCurrency(po.total)')
  })
})
