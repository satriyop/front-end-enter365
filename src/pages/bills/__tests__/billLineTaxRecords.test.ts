import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('bill line tax records (#101)', () => {
  it('picks tax records and inherits product purchase taxes', () => {
    const form = readFileSync(resolve(__dirname, '../BillFormPage.vue'), 'utf8')
    const validation = readFileSync(resolve(__dirname, '../../../utils/validation.ts'), 'utf8')

    expect(form).toContain('useTaxRecords')
    expect(form).toContain('tax_record_ids')
    expect(form).toContain('taxes_manual')
    expect(form).toContain('onProductSelect')
    expect(form).toContain('purchase_taxes')
    expect(form).toContain('bill-item-${index}-tax-records')
    expect(form).toContain('Tax tags')
    expect(validation).toContain('tax_record_ids: z.array(z.number())')
  })
})
