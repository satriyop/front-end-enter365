import { invoiceSchema, type InvoiceFormData, type InvoiceItemFormData } from '@/utils/validation'
import type { CreateInvoiceData, CreateInvoiceItem } from '@/api/useInvoices'

export type InvoiceFormSubmitValues = {
  contact_id?: number | string | null
  invoice_date?: string
  due_date?: string
  description?: string
  reference?: string
  currency?: string
  exchange_rate?: number | string | null
  discount_amount?: number | string | null
  items?: Array<{
    product_id?: number | string | null
    description?: string
    quantity?: number | string | null
    unit?: string
    unit_price?: number | string | null
    tax_rate?: number | string | null
    tax_record_ids?: number[]
    taxes_manual?: boolean
    revenue_account_id?: number | string | null
  }>
}

export type InvoiceFormSubmitSuccess = {
  ok: true
  payload: CreateInvoiceData
}

export type InvoiceFormSubmitFailure = {
  ok: false
  errors: Record<string, string>
  message: string
}

export type InvoiceFormSubmitResult = InvoiceFormSubmitSuccess | InvoiceFormSubmitFailure

function coerceNumber(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) {
    return undefined
  }
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : undefined
}

function coerceId(value: unknown): number | null {
  const n = coerceNumber(value)
  if (n === undefined || n <= 0) {
    return null
  }
  return n
}

export function firstInvoiceFormError(errors: Record<string, unknown>): string {
  for (const value of Object.values(errors)) {
    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }
    if (Array.isArray(value) && typeof value[0] === 'string' && value[0].trim() !== '') {
      return value[0]
    }
  }
  return 'Please fix validation errors'
}

export function normalizeInvoiceForm(values: InvoiceFormSubmitValues): InvoiceFormData {
  const items: InvoiceItemFormData[] = (values.items ?? []).map((item) => ({
    product_id: coerceId(item.product_id),
    description: (item.description ?? '').trim(),
    quantity: coerceNumber(item.quantity) ?? 1,
    unit: item.unit || 'pcs',
    unit_price: coerceNumber(item.unit_price) ?? 0,
    tax_rate: coerceNumber(item.tax_rate) ?? 0,
    tax_record_ids: item.tax_record_ids ?? [],
    taxes_manual: item.taxes_manual ?? false,
    revenue_account_id: coerceId(item.revenue_account_id),
  }))

  return {
    contact_id: coerceId(values.contact_id) ?? (undefined as unknown as number),
    invoice_date: values.invoice_date ?? '',
    due_date: values.due_date ?? '',
    description: values.description ?? '',
    reference: values.reference ?? '',
    currency: values.currency || 'IDR',
    exchange_rate: coerceNumber(values.exchange_rate) ?? 1,
    discount_amount: coerceNumber(values.discount_amount) ?? 0,
    items,
  }
}

export function invoiceCreatePayload(form: InvoiceFormData): CreateInvoiceData | InvoiceFormSubmitFailure {
  const itemsPayload: CreateInvoiceItem[] = (form.items || [])
    .filter((item) => item.description.trim() !== '')
    .map((item) => ({
      product_id: item.product_id || undefined,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      tax_rate: item.tax_rate,
      revenue_account_id: item.revenue_account_id || undefined,
    }))

  if (itemsPayload.length === 0) {
    return {
      ok: false,
      errors: { items: 'At least one item with a description is required' },
      message: 'At least one item with a description is required',
    }
  }

  return {
    contact_id: form.contact_id,
    invoice_date: form.invoice_date,
    due_date: form.due_date,
    description: form.description || undefined,
    reference: form.reference || undefined,
    currency: form.currency || 'IDR',
    exchange_rate: form.exchange_rate || 1,
    discount_amount: form.discount_amount || undefined,
    items: itemsPayload,
  }
}

export function parseInvoiceForm(values: InvoiceFormSubmitValues): InvoiceFormSubmitResult {
  const normalized = normalizeInvoiceForm(values)
  const parsed = invoiceSchema.safeParse(normalized)

  if (!parsed.success) {
    const errors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'form'
      if (!errors[path]) {
        errors[path] = issue.message
      }
    }
    return {
      ok: false,
      errors,
      message: firstInvoiceFormError(errors),
    }
  }

  const payload = invoiceCreatePayload(parsed.data)
  if ('ok' in payload && payload.ok === false) {
    return payload
  }

  return { ok: true, payload }
}
