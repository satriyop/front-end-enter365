import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createGrnFromPurchaseOrderPath, remainingGrnLinesFromPurchaseOrder } from '../grnFromPurchaseOrder'

describe('GRN from purchase order (#138)', () => {
  it('prefills lines from undelivered PO quantity', () => {
    const lines = remainingGrnLinesFromPurchaseOrder({
      items: [
        { product_id: 12, quantity: 10, quantity_received: 3, quantity_remaining: 7, unit_price: 2432 },
        { product_id: 13, quantity: 1, quantity_received: 1, quantity_remaining: 0, unit_price: 100 },
      ],
    })

    expect(lines).toEqual([
      { product_id: 12, quantity_ordered: 7, unit_price: 2432 },
    ])
  })

  it('posts create-grn on the purchase-order path', () => {
    expect(createGrnFromPurchaseOrderPath(8)).toBe('/purchase-orders/8/create-grn')
  })

  it('wires New GRN to a PO picker and the from-PO create hook', () => {
    const form = readFileSync(resolve(__dirname, '../GoodsReceiptNoteFormPage.vue'), 'utf8')
    const hooks = readFileSync(resolve(__dirname, '../../../../api/useGoodsReceiptNotes.ts'), 'utf8')

    expect(form).toContain('grn-purchase-order')
    expect(form).toContain('useCreateGRNFromPO')
    expect(form).toContain('remainingGrnLinesFromPurchaseOrder')
    expect(hooks).toContain('/purchase-orders/${purchaseOrderId}/create-grn')
    expect(hooks).not.toMatch(/purchase-orders\/\$\{purchaseOrderId\}\/grn`/)
  })
})
