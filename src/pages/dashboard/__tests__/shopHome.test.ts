import { describe, expect, it } from 'vitest'
import type { PosShopHome } from '@/api/usePos'
import {
  isShopCaughtUp,
  journalUraian,
  sessionAgeLabel,
  shopAttentionItems,
  shopContinueLink,
  shopOmzetCard,
} from '../shopHome'

function emptyHome(over: Partial<PosShopHome> = {}): PosShopHome {
  return {
    open_sessions: [],
    open_hold_count: 0,
    today: { sale_count: 0, omzet_amount: 0, last_sale_number: null, last_sold_at: null },
    recent: {
      yesterday_sale_count: 0,
      yesterday_omzet_amount: 0,
      week_sale_count: 0,
      week_omzet_amount: 0,
      last_sale_number: null,
      last_sold_at: null,
    },
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

  it('sends open till and holds to that kasir screen', () => {
    const home = emptyHome({
      open_sessions: [{
        id: 7,
        session_number: 'PSS-202608-0007',
        cashier_name: 'Siti Kasir',
        warehouse_name: 'Toko Depan',
        hold_count: 1,
        opened_at: '2026-08-30T10:00:00Z',
      }],
      open_hold_count: 1,
      low_stock: [{ product_id: 9, sku: 'KT57-SB-GARLIC', name: 'Garlic', quantity: 3 }],
    })

    const items = shopAttentionItems(home)
    expect(items.map((row) => [row.label, row.link])).toEqual([
      ['Sesi kasir terbuka', '/kasir?session=7'],
      ['Pesanan tertahan', '/kasir?session=7&holds=1'],
      ['Stok menipis', '/inventory'],
    ])
    expect(shopContinueLink(home)).toEqual({ to: '/kasir?session=7', label: 'Lanjut sesi' })
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

describe('sessionAgeLabel', () => {
  it('says terbuka sejak kemarin for yesterday tills', () => {
    const now = new Date('2026-08-31T09:00:00')
    expect(sessionAgeLabel('2026-08-30T08:00:00', now)).toBe('terbuka sejak kemarin')
  })
})

describe('shopOmzetCard', () => {
  it('falls back to yesterday when today is zero', () => {
    const card = shopOmzetCard(emptyHome({
      recent: {
        yesterday_sale_count: 4,
        yesterday_omzet_amount: 120_000,
        week_sale_count: 4,
        week_omzet_amount: 120_000,
        last_sale_number: 'POS-9',
        last_sold_at: '2026-08-30T18:00:00Z',
      },
    }))
    expect(card.label).toBe('Omzet kemarin')
    expect(card.value).toContain('120')
  })
})

describe('journalUraian', () => {
  it('does not repeat the POS id already in the description', () => {
    expect(journalUraian('Penjualan kasir POS-202608-0010', 'POS-202608-0010'))
      .toBe('Penjualan kasir POS-202608-0010')
  })
})
