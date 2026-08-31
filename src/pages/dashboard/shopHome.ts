import type { PosShopHome } from '@/api/usePos'

export interface ShopAttentionItem {
  type: 'warning' | 'destructive'
  label: string
  count: number
  link: string
}

export function shopAttentionItems(home: PosShopHome): ShopAttentionItem[] {
  const items: ShopAttentionItem[] = []

  if (home.open_sessions.length > 0) {
    items.push({
      type: 'warning',
      label: 'Sesi kasir terbuka',
      count: home.open_sessions.length,
      link: '/kasir',
    })
  }

  if (home.open_hold_count > 0) {
    items.push({
      type: 'warning',
      label: 'Pesanan tertahan',
      count: home.open_hold_count,
      link: '/kasir',
    })
  }

  if (home.low_stock.length > 0) {
    items.push({
      type: 'destructive',
      label: 'Stok menipis',
      count: home.low_stock.length,
      link: '/inventory',
    })
  }

  if (home.draft_journal_count > 0) {
    items.push({
      type: 'warning',
      label: 'Jurnal draft',
      count: home.draft_journal_count,
      link: '/accounting/journal-entries',
    })
  }

  return items
}

export function isShopCaughtUp(home: PosShopHome): boolean {
  return shopAttentionItems(home).length === 0
}
