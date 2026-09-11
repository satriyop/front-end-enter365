import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { applyInvoiceProductDefaults, toggleInvoiceLineTax, type InvoiceLineDraft } from '../invoiceLineDefaults'

function emptyLine(): InvoiceLineDraft {
  return {
    product_id: null,
    description: '',
    unit: 'pcs',
    unit_price: 0,
    tax_rate: 11,
    tax_record_ids: [],
    taxes_manual: false,
    revenue_account_id: null,
  }
}

describe('invoice line product defaults (#127)', () => {
  it('inherits selling price, sales taxes, and income account from the product', () => {
    const item = emptyLine()
    applyInvoiceProductDefaults(item, {
      id: 12,
      name: 'Kopi Tubruk',
      unit: 'cup',
      selling_price: 15000,
      tax_rate: 0,
      sales_account_id: 40,
      sales_taxes: [{ id: 3, rate: 11 }],
    })

    expect(item.product_id).toBe(12)
    expect(item.description).toBe('Kopi Tubruk')
    expect(item.unit).toBe('cup')
    expect(item.unit_price).toBe(15000)
    expect(item.tax_record_ids).toEqual([3])
    expect(item.tax_rate).toBe(11)
    expect(item.taxes_manual).toBe(false)
    expect(item.revenue_account_id).toBe(40)
  })

  it('lets the user override sales tax records', () => {
    const item = emptyLine()
    applyInvoiceProductDefaults(item, {
      id: 1,
      name: 'Item',
      selling_price: 1000,
      sales_taxes: [{ id: 3, rate: 11 }],
    })
    toggleInvoiceLineTax(item, 3, [{ id: 3, rate: 11 }, { id: 4, rate: 1 }])
    toggleInvoiceLineTax(item, 4, [{ id: 3, rate: 11 }, { id: 4, rate: 1 }])
    expect(item.tax_record_ids).toEqual([4])
    expect(item.tax_rate).toBe(1)
    expect(item.taxes_manual).toBe(true)
  })

  it('wires the New Invoice form to product pickers and sales tax records', () => {
    const form = readFileSync(resolve(__dirname, '../InvoiceFormPage.vue'), 'utf8')
    const validation = readFileSync(resolve(__dirname, '../../../utils/validation.ts'), 'utf8')

    expect(form).toContain('useProductsLookup')
    expect(form).toContain('useTaxRecords')
    expect(form).toContain('applyInvoiceProductDefaults')
    expect(form).toContain('invoice-item-${index}-product')
    expect(form).toContain('invoice-item-${index}-tax-records')
    expect(form).toContain("useTaxRecords('sales')")
    expect(form).toContain('parseInvoiceForm')
    expect(form).not.toContain('Tax (%)')
    expect(form).toContain('Tax (from line taxes)')
    expect(form).not.toContain('defineField(\'tax_rate\')')
    expect(form).toContain("setFieldValue(`items[${index}]`")
    expect(validation).toContain('tax_record_ids: z.array(z.number())')
  })
})
