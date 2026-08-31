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
    expect(item('Reports').permission).toBe('reports.financial')
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
  })
})
