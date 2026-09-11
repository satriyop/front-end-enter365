import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { invoiceCreatePayload, parseInvoiceForm } from '../invoiceFormSubmit'

const liveLikeForm = {
  contact_id: 41,
  invoice_date: '2026-09-09',
  due_date: '2026-10-09',
  description: '',
  reference: '',
  currency: 'IDR',
  exchange_rate: 1,
  discount_amount: 0,
}

describe('invoice form submit (#136)', () => {
  it('creates a payload with product_id for a product line', () => {
    const result = parseInvoiceForm({
      ...liveLikeForm,
      items: [{
        product_id: 12,
        description: 'KT57-AIR - Air Mineral',
        quantity: 1,
        unit: 'btl',
        unit_price: 10000,
        tax_rate: 11,
        tax_record_ids: [3],
        taxes_manual: false,
        revenue_account_id: 40,
      }],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.payload.contact_id).toBe(41)
    expect(result.payload.items).toHaveLength(1)
    expect(result.payload.items[0]?.product_id).toBe(12)
    expect(result.payload.items[0]?.description).toBe('KT57-AIR - Air Mineral')
    expect(result.payload.items[0]?.unit_price).toBe(10000)
  })

  it('creates a draft payload for a description-only line', () => {
    const result = parseInvoiceForm({
      ...liveLikeForm,
      items: [{
        product_id: null,
        description: 'PARITY-E2E-0909',
        quantity: 1,
        unit: 'pcs',
        unit_price: 10000,
        tax_rate: 11,
        tax_record_ids: [],
        taxes_manual: true,
        revenue_account_id: null,
      }],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.payload.items[0]?.product_id).toBeUndefined()
    expect(result.payload.items[0]?.description).toBe('PARITY-E2E-0909')
  })

  it('coerces string select values so a product line still submits', () => {
    const result = parseInvoiceForm({
      ...liveLikeForm,
      contact_id: '41',
      items: [{
        product_id: '12',
        description: 'Air Mineral',
        quantity: '1',
        unit: 'pcs',
        unit_price: '10000',
        tax_rate: '11',
      }],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) {
      return
    }
    expect(result.payload.contact_id).toBe(41)
    expect(result.payload.items[0]?.product_id).toBe(12)
    expect(result.payload.items[0]?.quantity).toBe(1)
    expect(result.payload.items[0]?.unit_price).toBe(10000)
  })

  it('returns a visible error when there is no customer', () => {
    const result = parseInvoiceForm({
      ...liveLikeForm,
      contact_id: undefined,
      items: [{ description: 'Service', quantity: 1, unit: 'pcs', unit_price: 1000 }],
    })

    expect(result.ok).toBe(false)
    if (result.ok) {
      return
    }
    expect(result.message).toContain('customer')
    expect(result.errors.contact_id).toBeTruthy()
  })

  it('returns a visible items error instead of posting an empty line list', () => {
    const normalized = parseInvoiceForm({
      ...liveLikeForm,
      items: [{ product_id: null, description: '   ', quantity: 1, unit: 'pcs', unit_price: 10000 }],
    })
    expect(normalized.ok).toBe(false)
    if (normalized.ok) {
      return
    }
    expect(normalized.message.length).toBeGreaterThan(0)

    const filtered = invoiceCreatePayload({
      contact_id: 1,
      invoice_date: '2026-09-09',
      due_date: '2026-10-09',
      description: '',
      reference: '',
      currency: 'IDR',
      exchange_rate: 1,
      discount_amount: 0,
      items: [{
        product_id: null,
        description: '',
        quantity: 1,
        unit: 'pcs',
        unit_price: 10000,
        tax_rate: 11,
        tax_record_ids: [],
        taxes_manual: false,
        revenue_account_id: null,
      }],
    })
    expect(filtered).toMatchObject({
      ok: false,
      errors: { items: 'At least one item with a description is required' },
    })
  })

  it('wires New Invoice submit through parseInvoiceForm with a visible invalid path', () => {
    const form = readFileSync(resolve(__dirname, '../InvoiceFormPage.vue'), 'utf8')
    expect(form).toContain('parseInvoiceForm')
    expect(form).toContain('firstInvoiceFormError')
    expect(form).toContain('toast.error')
    expect(form).toContain('data-testid="invoice-form-error"')
    expect(form).not.toContain('handleSubmit(async (formValues)')
  })
})
