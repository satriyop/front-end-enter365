import { describe, expect, it } from 'vitest'
import {
  SEARCH_NAV_ITEMS,
  SEARCH_QUICK_ACTIONS,
  catalogVisible,
  isPosAcquisitionPreset,
  searchResultVisible,
} from '../searchCatalog'

describe('search catalog pack gating', () => {
  it('hides Invoices and New Invoice when the invoices pack is off', () => {
    const enabled = (feature: string) => feature !== 'invoices'

    const actions = catalogVisible(SEARCH_QUICK_ACTIONS, enabled)
    const nav = catalogVisible(SEARCH_NAV_ITEMS, enabled)

    expect(actions.map((item) => item.label)).not.toContain('New Invoice')
    expect(nav.map((item) => item.label)).not.toContain('Invoices')
    expect(actions.map((item) => item.label)).toContain('New Contact')
    expect(searchResultVisible('invoice', enabled)).toBe(false)
    expect(searchResultVisible('contact', enabled)).toBe(true)
  })

  it('shows Invoices when the invoices pack is on', () => {
    const enabled = () => true

    expect(catalogVisible(SEARCH_QUICK_ACTIONS, enabled).map((item) => item.label))
      .toContain('New Invoice')
    expect(catalogVisible(SEARCH_NAV_ITEMS, enabled).map((item) => item.label))
      .toContain('Invoices')
    expect(searchResultVisible('invoice', enabled)).toBe(true)
  })

  it('treats parity as a POS-acquisition preset', () => {
    expect(isPosAcquisitionPreset('pos')).toBe(true)
    expect(isPosAcquisitionPreset('parity')).toBe(true)
    expect(isPosAcquisitionPreset('general')).toBe(false)
  })
})
