/**
 * Invoice Factory
 *
 * Creates test Invoice data matching the API InvoiceResource schema.
 */

import type { components } from '@/api/types'
import { createContact } from './contactFactory'

export type Invoice = components['schemas']['InvoiceResource']

let invoiceId = 1

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
    id: String(id),
    invoice_number: `INV-2024-${id.toString().padStart(4, '0')}`,
    contact_id: contact.id,
    contact,
    invoice_date: invoiceDate.toISOString().split('T')[0]!,
    due_date: dueDate.toISOString().split('T')[0]!,
    description: `Invoice for ${contact.name}`,
    reference: '',
    subtotal: String(subtotal),
    tax_amount: String(taxAmount),
    tax_rate: 11,
    discount_amount: '0',
    total_amount: String(total),
    paid_amount: '0',
    outstanding_amount: String(total),
    status: 'draft',
    journal_entry_id: '',
    receivable_account_id: '1',
    created_by: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
    status: 'draft',
    ...overrides,
  })
}

/**
 * Create a sent invoice
 */
export function createSentInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return createInvoice({
    status: 'sent',
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
  const total = Number(invoice.total_amount)
  return {
    ...invoice,
    status: 'partial',
    paid_amount: String(paidAmount),
    outstanding_amount: String(total - paidAmount),
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
    status: 'paid',
    paid_amount: invoice.total_amount,
    outstanding_amount: '0',
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
    status: 'overdue',
    ...overrides,
  })
}

/**
 * Reset factory to initial state
 */
export function resetInvoiceFactory(): void {
  invoiceId = 1
}
