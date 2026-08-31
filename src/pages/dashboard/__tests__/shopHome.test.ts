import { describe, expect, it } from 'vitest'
import type { PosShopHome } from '@/api/usePos'
import { isShopCaughtUp, shopAttentionItems } from '../shopHome'

function emptyHome(over: Partial<PosShopHome> = {}): PosShopHome {
  return {
    open_sessions: [],
    open_hold_count: 0,
    today: { sale_count: 0, omzet_amount: 0, last_sale_number: null, last_sold_at: null },
    low_stock: [],
    draft_journal_count: 0,
    ...over,
  }
}

describe('shopAttentionItems', () => {
  it('is all caught up when queues are empty', () => {
    const home = emptyHome()
    expect(shopAttentionItems(home)).toEqual([])
    expect(isShopCaughtUp(home)).toBe(true)
  })

  it('lists open till, holds, and low pastry', () => {
    const home = emptyHome({
      open_sessions: [{
        id: 1,
        session_number: 'PSS-202608-0007',
        cashier_name: 'Siti Kasir',
        warehouse_name: 'Toko Depan',
        hold_count: 1,
      }],
      open_hold_count: 1,
      low_stock: [{ product_id: 9, sku: 'KT57-SB-GARLIC', name: 'Garlic', quantity: 3 }],
    })

    const items = shopAttentionItems(home)
    expect(items.map((row) => row.label)).toEqual([
      'Sesi kasir terbuka',
      'Pesanan tertahan',
      'Stok menipis',
    ])
    expect(isShopCaughtUp(home)).toBe(false)
    expect(items.every((row) => row.link === '/kasir' || row.link === '/inventory')).toBe(true)
  })

  it('does not invent alerts', () => {
    expect(shopAttentionItems(emptyHome({ today: {
      sale_count: 12,
      omzet_amount: 500_000,
      last_sale_number: 'POS-1',
      last_sold_at: '2026-08-31T01:00:00Z',
    } }))).toEqual([])
  })
})
