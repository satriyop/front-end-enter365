import { describe, expect, it } from 'vitest'
import { tillReceiptHtml } from '../tillPrint'
import type { PosCatalogProduct, PosSale } from '@/api/usePos'

describe('tillReceiptHtml', () => {
  it('prints the sale number and line names without a printer toast', () => {
    const sale: PosSale = {
      id: 1,
      sale_number: 'POS-202608-0010',
      pos_session_id: 7,
      status: 'completed',
      payable_amount: 25_410,
      cash_received_amount: 25_410,
      change_amount: 0,
      sold_at: '2026-08-31T01:00:00Z',
      void_reason: null,
      items: [{ id: 1, product_id: 9, quantity: 1, payable_amount: 25_410 }],
    }
    const catalog = [{ id: 9, name: 'Hakau', sku: 'KT57-HAKAU' }] as PosCatalogProduct[]
    const html = tillReceiptHtml(sale, catalog)
    expect(html).toContain('POS-202608-0010')
    expect(html).toContain('Hakau')
    expect(html).not.toContain('Printer belum terhubung')
  })
})
