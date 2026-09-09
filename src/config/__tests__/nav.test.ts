import { describe, expect, it } from 'vitest'
import { flattenNav, navItemVisible, navigation, posChrome, POS_NAV_ID } from '../nav'

function item(name: string) {
  const found = flattenNav().find((row) => row.name === name)
  if (!found) {
    throw new Error(`missing nav item ${name}`)
  }
  return found
}

describe('navigation permission keys', () => {
  it('uses seeder names for journals and reports', () => {
    expect(item('Journal Entries').permission).toBe('journals.view')
    expect(item('Laporan').permission).toBe('reports.financial')
  })

  it('puts Laporan under Accounting, not Finance (#129)', () => {
    const accounting = navigation.find((group) => group.label === 'Accounting')
    const finance = navigation.find((group) => group.label === 'Finance')
    expect(accounting?.items.map((row) => row.name)).toContain('Laporan')
    expect(accounting?.items.find((row) => row.name === 'Laporan')?.path).toBe('/reports')
    expect(finance?.items.map((row) => row.name)).not.toContain('Laporan')
    expect(finance?.items.map((row) => row.name)).not.toContain('Reports')
  })

  it('gates Reminders and Overdue on the invoices pack', () => {
    expect(item('Reminders').feature).toBe('invoices')
    expect(item('Overdue Management').feature).toBe('invoices')
  })

  it('hides Reminders when invoices is off even if invoices.view is granted', () => {
    const reminders = item('Reminders')
    expect(navItemVisible(reminders, {
      featureEnabled: () => false,
      hasPermission: () => true,
    })).toBe(false)
    expect(navItemVisible(reminders, {
      featureEnabled: (name) => name === 'invoices',
      hasPermission: (name) => name === 'invoices.view',
    })).toBe(true)
  })

  it('shows Journal Entries for journals.view', () => {
    expect(navItemVisible(item('Journal Entries'), {
      featureEnabled: () => true,
      hasPermission: (name) => name === 'journals.view',
    })).toBe(true)
    expect(navItemVisible(item('Journal Entries'), {
      featureEnabled: () => true,
      hasPermission: () => false,
    })).toBe(false)
  })

  it('does not use the old SPA-only permission strings', () => {
    const names = flattenNav().map((row) => row.permission).filter(Boolean)
    expect(names).not.toContain('journal_entries.view')
    expect(names).not.toContain('reports.view')
    expect(names).not.toContain('company_profiles.view')
    expect(names).not.toContain('roles.view')
    expect(navigation.length).toBeGreaterThan(0)
  })

  it('translates POS pack chrome only', () => {
    expect(posChrome('Journal Entries', true, POS_NAV_ID)).toBe('Jurnal')
    expect(posChrome('Journal Entries', false, POS_NAV_ID)).toBe('Journal Entries')
    expect(posChrome('Solar Proposals', true, POS_NAV_ID)).toBe('Solar Proposals')
    expect(posChrome('Adjust Stock', true)).toBe('Penyesuaian stok')
    expect(posChrome('Adjust Stock', false)).toBe('Adjust Stock')
    expect(posChrome('Inventory', true)).toBe('Inventori')
    expect(posChrome('Posted', true)).toBe('Diposting')
    expect(posChrome('Search...', true)).toBe('Cari...')
    expect(posChrome('Quotations', true, POS_NAV_ID)).toBe('Penawaran')
    expect(posChrome('Invoices', true, POS_NAV_ID)).toBe('Faktur')
    expect(posChrome('Quotations', false, POS_NAV_ID)).toBe('Quotations')
    expect(posChrome('Purchase Orders', true, POS_NAV_ID)).toBe('Pesanan Pembelian')
    expect(posChrome('Purchasing', true)).toBe('Pembelian')
    expect(posChrome('Payments', true, POS_NAV_ID)).toBe('Pembayaran')
    expect(posChrome('Bank Reconciliation', true, POS_NAV_ID)).toBe('Rekonsiliasi')
  })

  it('gates Payments and Bank Reconciliation on their packs', () => {
    expect(item('Payments').feature).toBe('payments')
    expect(item('Bank Reconciliation').feature).toBe('bank_reconciliation')
    expect(navItemVisible(item('Payments'), {
      featureEnabled: () => false,
      hasPermission: () => true,
    })).toBe(false)
    expect(navItemVisible(item('Bank Reconciliation'), {
      featureEnabled: (name) => name === 'bank_reconciliation',
      hasPermission: (name) => name === 'journals.view',
    })).toBe(true)
    expect(navItemVisible(item('Payments'), {
      featureEnabled: (name) => name === 'payments',
      hasPermission: (name) => name === 'payments.view',
    })).toBe(true)
  })
})
