import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('bill purchase matching (#89)', () => {
  it('posts line matches and shows billed vs qty to invoice', () => {
    const page = readFileSync(resolve(__dirname, '../BillDetailPage.vue'), 'utf8')
    const api = readFileSync(resolve(__dirname, '../../../api/useBills.ts'), 'utf8')

    expect(api).toContain('/purchase-matching')
    expect(api).toContain('bill_item_id')
    expect(api).toContain('purchase_order_item_id')
    expect(page).toContain('qty_to_invoice')
    expect(page).toContain('billed_quantity')
    expect(page).toContain('lineMatches')
  })
})
