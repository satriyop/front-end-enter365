import { describe, expect, it } from 'vitest'
import { formatStrukWaktu, tillReceiptHtml } from '../tillPrint'
import type { PosCatalogProduct, PosSale } from '@/api/usePos'

describe('tillReceiptHtml', () => {
  it('prints cafe line, service, PBJT, WIB time, and kasir', () => {
    const sale: PosSale = {
      id: 1,
      sale_number: 'POS-202608-0011',
      pos_session_id: 7,
      status: 'completed',
      subtotal_amount: 8_000,
      service_amount: 400,
      tax_amount: 840,
      payable_amount: 9_240,
      cash_received_amount: 9_240,
      change_amount: 0,
      sold_at: '2026-08-31T13:00:00+07:00',
      void_reason: null,
      items: [{ id: 1, product_id: 4, quantity: 1, payable_amount: 8_000 }],
    }
    const catalog = [{ id: 4, name: 'Air Mineral', sku: 'KT57-AIR' }] as PosCatalogProduct[]
    const html = tillReceiptHtml(sale, catalog, { cashier: 'Siti Kasir', taxName: 'PBJT', serviceRate: 5, taxRate: 10 })
    expect(html).toContain('POS-202608-0011')
    expect(html).toContain('Air Mineral')
    expect(html).toContain('8.000')
    expect(html).toContain('Service 5%')
    expect(html).toContain('400')
    expect(html).toContain('PBJT 10%')
    expect(html).toContain('840')
    expect(html).toContain('9.240')
    expect(html).toContain('Kasir Siti Kasir')
    expect(html).toContain('WIB')
    expect(html).not.toContain('Printer belum terhubung')
  })
})

describe('formatStrukWaktu', () => {
  it('labels Asia/Jakarta as WIB', () => {
    expect(formatStrukWaktu('2026-08-31T13:00:00+07:00')).toContain('WIB')
  })
})
