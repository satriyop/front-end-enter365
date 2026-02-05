/**
 * Invoice Factory
 *
 * Creates test Invoice data matching the API InvoiceResource schema.
 */

import type { components } from '@/api/types'
import { createContact } from './contactFactory'
import { formatCurrency } from '@/utils/format'

export type Invoice = components['schemas']['InvoiceResource']
export type Status = components['schemas']['StatusResource']

let invoiceId = 1

const STATUS_MAP: Record<string, Status> = {
  draft: { value: 'draft', label: 'Draft', color: 'zinc', is_terminal: 'false', is_editable: 'true' },
  sent: { value: 'sent', label: 'Terkirim', color: 'blue', is_terminal: 'false', is_editable: 'false' },
  partial: { value: 'partial', label: 'Sebagian', color: 'indigo', is_terminal: 'false', is_editable: 'false' },
  paid: { value: 'paid', label: 'Lunas', color: 'green', is_terminal: 'true', is_editable: 'false' },
  overdue: { value: 'overdue', label: 'Jatuh Tempo', color: 'orange', is_terminal: 'false', is_editable: 'false' },
  void: { value: 'void', label: 'Dibatalkan', color: 'red', is_terminal: 'true', is_editable: 'false' },
}

/**
 * Create a single invoice with optional overrides
 */
export function createInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const id = invoiceId++
  const contact = createContact()
  const subtotal = 500000
  const taxAmount = Math.round(subtotal * 0.11)
  const total = subtotal + taxAmount

  const invoiceDate = new Date()
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  return {
    id: id,
    invoice_number: `INV-2024-${id.toString().padStart(4, '0')}`,
    contact_id: contact.id,
    contact,
    invoice_date: invoiceDate.toISOString().split('T')[0]!,
    due_date: dueDate.toISOString().split('T')[0]!,
    days_until_due: 30,
    is_overdue: false,
    currency: 'IDR',
    exchange_rate: 1,
    description: `Invoice for ${contact.name}`,
    reference: '',
    subtotal: subtotal,
    tax_amount: taxAmount,
    tax_rate: 11,
    discount_amount: 0,
    total_amount: total,
    paid_amount: 0,
    outstanding_amount: total,
    base_currency_total: total,
    formatted: {
      subtotal: formatCurrency(subtotal),
      discount_amount: formatCurrency(0),
      tax_amount: formatCurrency(taxAmount),
      total_amount: formatCurrency(total),
      paid_amount: formatCurrency(0),
      outstanding_amount: formatCurrency(total),
    },
    status: STATUS_MAP.draft!,
    status_label: 'Draft',
    journal_entry_id: null,
    has_journal_entry: false,
    receivable_account_id: 1,
    reminder_count: 0,
    last_reminder_at: '',
    created_by: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    actions: {
      can_edit: true,
      can_post: true,
      can_cancel: true,
      can_delete: true,
      can_mark_as_paid: false,
      can_mark_as_partial: false,
    },
    ...overrides,
  }
}

/**
 * Create multiple invoices
 */
export function createInvoices(count: number, overrides: Partial<Invoice> = {}): Invoice[] {
  return Array.from({ length: count }, () => createInvoice(overrides))
}

/**
 * Create a draft invoice
 */
export function createDraftInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return createInvoice({
    status: STATUS_MAP.draft,
    ...overrides,
  })
}

/**
 * Create a sent invoice
 */
export function createSentInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return createInvoice({
    status: STATUS_MAP.sent,
    ...overrides,
  })
}

/**
 * Create a partially paid invoice
 */
export function createPartiallyPaidInvoice(
  paidAmount: number,
  overrides: Partial<Invoice> = {}
): Invoice {
  const invoice = createInvoice(overrides)
  const total = invoice.total_amount
  return {
    ...invoice,
    status: STATUS_MAP.partial!,
    status_label: 'Sebagian',
    paid_amount: paidAmount,
    outstanding_amount: total - paidAmount,
    ...overrides,
  }
}

/**
 * Create a fully paid invoice
 */
export function createPaidInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const invoice = createInvoice(overrides)
  return {
    ...invoice,
    status: STATUS_MAP.paid!,
    status_label: 'Lunas',
    paid_amount: invoice.total_amount,
    outstanding_amount: 0,
    ...overrides,
  }
}

/**
 * Create an overdue invoice
 */
export function createOverdueInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return createInvoice({
    due_date: pastDate.toISOString().split('T')[0],
    status: STATUS_MAP.overdue!,
    status_label: 'Jatuh Tempo',
    is_overdue: true,
    ...overrides,
  })
}

/**
 * Reset factory to initial state
 */
export function resetInvoiceFactory(): void {
  invoiceId = 1
}