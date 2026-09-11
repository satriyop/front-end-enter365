import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { customerCreditNoteJourney, vendorRefundJourney } from '../creditDocuments'
import { flattenNav, navigation } from '@/config/nav'

describe('accounting credit notes and vendor refunds (#141)', () => {
  it('labels the accounting journeys as Credit Notes and Vendor Refunds', () => {
    const notes = customerCreditNoteJourney('/accounting/credit-notes')
    expect(notes.listTitle).toBe('Credit Notes')
    expect(notes.newPath).toBe('/accounting/credit-notes/new')
    expect(notes.detailPath(9)).toBe('/accounting/credit-notes/9')

    const refunds = vendorRefundJourney('/accounting/vendor-refunds/new')
    expect(refunds.listTitle).toBe('Vendor Refunds')
    expect(refunds.newPath).toBe('/accounting/vendor-refunds/new')
    expect(refunds.detailPath(3)).toBe('/accounting/vendor-refunds/3')
  })

  it('keeps warehouse sales/purchase return labels on the original paths', () => {
    expect(customerCreditNoteJourney('/sales/sales-returns').listTitle).toBe('Sales Returns')
    expect(vendorRefundJourney('/purchasing/purchase-returns').listTitle).toBe('Purchase Returns')
  })

  it('pins Credit Notes and Vendor Refunds under Accounting in the sidebar', () => {
    const accounting = navigation.find((group) => group.label === 'Accounting')
    const names = accounting?.items.map((row) => row.name) ?? []
    expect(names).toContain('Credit Notes')
    expect(names).toContain('Vendor Refunds')
    expect(flattenNav().find((row) => row.name === 'Credit Notes')?.path).toBe('/accounting/credit-notes')
    expect(flattenNav().find((row) => row.name === 'Vendor Refunds')?.path).toBe('/accounting/vendor-refunds')
  })

  it('registers accounting routes so candidate URLs are not 404', () => {
    const router = readFileSync(resolve(__dirname, '../../../router/index.ts'), 'utf8')
    expect(router).toContain("path: 'accounting/credit-notes'")
    expect(router).toContain("path: 'accounting/credit-notes/new'")
    expect(router).toContain("path: 'accounting/vendor-refunds'")
    expect(router).toContain("path: 'accounting/vendor-refunds/new'")
    expect(router).toContain("path: 'credit-notes'")
    expect(router).toContain("path: 'vendor-refunds'")
    expect(router).toContain("prefix: '/credit-notes'")
    expect(router).toContain("prefix: '/vendor-refunds'")
  })
})
