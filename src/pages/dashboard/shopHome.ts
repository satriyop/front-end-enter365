import type { PosShopHome } from '@/api/usePos'
import { formatCurrency } from '@/utils/format'

export interface ShopAttentionItem {
  type: 'warning' | 'destructive'
  label: string
  count: number
  link: string
}

export function continueSession(home: PosShopHome): { id: number; session_number: string } | null {
  if (home.open_sessions.length === 0) {
    return null
  }
  return home.open_sessions.find((row) => row.hold_count > 0) ?? home.open_sessions[0] ?? null
}

export function shopContinueLink(home: PosShopHome): { to: string; label: string } | null {
  const session = continueSession(home)
  if (!session) {
    return null
  }
  return { to: `/kasir?session=${session.id}`, label: 'Lanjut sesi' }
}

export function shopAttentionItems(home: PosShopHome): ShopAttentionItem[] {
  const items: ShopAttentionItem[] = []
  const resume = continueSession(home)

  if (home.open_sessions.length > 0 && resume) {
    items.push({
      type: 'warning',
      label: 'Sesi kasir terbuka',
      count: home.open_sessions.length,
      link: `/kasir?session=${resume.id}`,
    })
  }

  const held = home.open_sessions.find((row) => row.hold_count > 0)
  if (home.open_hold_count > 0 && held) {
    items.push({
      type: 'warning',
      label: 'Pesanan tertahan',
      count: home.open_hold_count,
      link: `/kasir?session=${held.id}&holds=1`,
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

export function sessionAgeLabel(openedAt: string | null, now = new Date()): string {
  if (!openedAt) {
    return ''
  }
  const opened = new Date(openedAt)
  if (Number.isNaN(opened.getTime())) {
    return ''
  }
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (opened < startToday) {
    const yesterday = new Date(startToday)
    yesterday.setDate(yesterday.getDate() - 1)
    if (opened >= yesterday) {
      return 'terbuka sejak kemarin'
    }
    return `terbuka sejak ${opened.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
  }
  return `terbuka ${opened.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
}

function recentOf(home: PosShopHome): PosShopHome['recent'] {
  return home.recent ?? {
    yesterday_sale_count: 0,
    yesterday_omzet_amount: 0,
    week_sale_count: 0,
    week_omzet_amount: 0,
    last_sale_number: null,
    last_sold_at: null,
  }
}

export function shopOmzetCard(home: PosShopHome): { label: string; value: string; hint: string } {
  const recent = recentOf(home)
  if (home.today.omzet_amount > 0) {
    return {
      label: 'Omzet hari ini',
      value: formatCurrency(home.today.omzet_amount),
      hint: `${home.today.sale_count} struk`,
    }
  }
  if (recent.yesterday_omzet_amount > 0) {
    return {
      label: 'Omzet kemarin',
      value: formatCurrency(recent.yesterday_omzet_amount),
      hint: `${recent.yesterday_sale_count} struk · hari ini Rp 0`,
    }
  }
  if (recent.week_omzet_amount > 0) {
    return {
      label: 'Omzet 7 hari',
      value: formatCurrency(recent.week_omzet_amount),
      hint: `${recent.week_sale_count} struk · hari ini Rp 0`,
    }
  }
  return {
    label: 'Omzet hari ini',
    value: formatCurrency(0),
    hint: '0 struk',
  }
}

export function shopLastSaleCard(home: PosShopHome): { value: string; hint: string } {
  const recent = recentOf(home)
  const number = recent.last_sale_number ?? home.today.last_sale_number
  const at = recent.last_sold_at ?? home.today.last_sold_at
  if (!number) {
    return { value: '—', hint: 'Belum ada penjualan' }
  }
  const when = at ? new Date(at) : null
  const hint = when && !Number.isNaN(when.getTime())
    ? when.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Struk terakhir'
  return { value: number, hint }
}

export function journalUraian(description: string, reference?: string | null): string {
  const desc = description.trim()
  const ref = (reference ?? '').trim()
  if (!ref || desc.includes(ref)) {
    return desc
  }
  return `${desc} (${ref})`
}
