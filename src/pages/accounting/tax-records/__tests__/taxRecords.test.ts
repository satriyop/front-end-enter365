import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('tax records admin (#100)', () => {
  it('exposes Taxes nav, list, and posting fields', () => {
    const nav = readFileSync(resolve(__dirname, '../../../../config/nav.ts'), 'utf8')
    const list = readFileSync(resolve(__dirname, '../TaxRecordListPage.vue'), 'utf8')
    const form = readFileSync(resolve(__dirname, '../TaxRecordFormPage.vue'), 'utf8')
    const api = readFileSync(resolve(__dirname, '../../../../api/useTaxRecords.ts'), 'utf8')

    expect(nav).toContain("name: 'Taxes'")
    expect(nav).toContain('/accounting/tax-records')
    expect(list).toContain('New Tax')
    expect(form).toContain('invoice_account_id')
    expect(form).toContain('refund_account_id')
    expect(form).toContain('tax_tag_id')
    expect(form).toContain('computation')
    expect(form).toContain('is_active')
    expect(api).toContain('useUpdateTaxRecord')
    expect(api).toContain('useDeleteTaxRecord')
  })
})
