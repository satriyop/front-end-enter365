/**
 * Quotation Factory
 *
 * Creates test Quotation data matching the API QuotationResource schema.
 */

import type { components } from '@/api/types'
import { createContact } from './contactFactory'

export type Quotation = components['schemas']['QuotationResource']
export type Status = components['schemas']['StatusResource']

let quotationId = 1

const statusMap: Record<string, Status> = {
  draft: { value: 'draft', label: 'Draft', color: 'zinc', is_terminal: false, is_editable: true },
  submitted: { value: 'submitted', label: 'Diajukan', color: 'yellow', is_terminal: false, is_editable: false },
  approved: { value: 'approved', label: 'Disetujui', color: 'green', is_terminal: false, is_editable: false },
  rejected: { value: 'rejected', label: 'Ditolak', color: 'red', is_terminal: false, is_editable: false },
  expired: { value: 'expired', label: 'Kedaluwarsa', color: 'orange', is_terminal: true, is_editable: false },
  converted: { value: 'converted', label: 'Dikonversi', color: 'blue', is_terminal: true, is_editable: false },
}

/**
 * Create a single quotation with optional overrides
 */
export function createQuotation(overrides: Partial<Quotation> = {}): Quotation {
  const id = quotationId++
  const contact = createContact()
  const subtotal = 300000
  const taxAmount = Math.round(subtotal * 0.11)
  const total = subtotal + taxAmount

  const quotationDate = new Date()
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  return {
    id: id,
    quotation_number: `QUO-2024-${id.toString().padStart(4, '0')}`,
    revision: 0,
    full_number: `QUO-2024-${id.toString().padStart(4, '0')}`,
    contact_id: contact.id,
    contact,
    quotation_date: quotationDate.toISOString().split('T')[0]!,
    valid_until: validUntil.toISOString().split('T')[0]!,
    days_until_expiry: 30,
    is_expired: false,
    reference: '',
    subject: `Quotation for ${contact.name}`,
    quotation_type: 'standard',
    is_multi_option: false,
    variant_group_id: null,
    selected_variant_id: null,
    has_selected_variant: false,
    status: statusMap.draft!,
    status_label: 'Draft',
    currency: 'IDR',
    exchange_rate: 1,
    subtotal: subtotal,
    discount_type: null,
    discount_value: 0,
    discount_amount: 0,
    tax_rate: 11,
    tax_amount: taxAmount,
    total: total,
    base_currency_total: total,
    notes: '',
    terms_conditions: '',
    created_by: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    can_edit: true,
    can_submit: true,
    can_approve: false,
    can_reject: false,
    can_convert: false,
    can_revise: false,
    follow_up_count: 0,
    priority: 'medium',
    priority_label: 'Normal',
    needs_follow_up: false,
    ...overrides,
  }
}

/**
 * Create multiple quotations
 */
export function createQuotations(count: number, overrides: Partial<Quotation> = {}): Quotation[] {
  return Array.from({ length: count }, () => createQuotation(overrides))
}

/**
 * Create a draft quotation
 */
export function createDraftQuotation(overrides: Partial<Quotation> = {}): Quotation {
  return createQuotation({
    status: statusMap.draft,
    status_label: 'Draft',
    ...overrides,
  })
}

/**
 * Create a submitted quotation
 */
export function createSubmittedQuotation(overrides: Partial<Quotation> = {}): Quotation {
  return createQuotation({
    status: statusMap.submitted,
    status_label: 'Submitted',
    can_edit: false,
    can_submit: false,
    can_approve: true,
    can_reject: true,
    ...overrides,
  })
}

/**
 * Create an approved quotation
 */
export function createApprovedQuotation(overrides: Partial<Quotation> = {}): Quotation {
  return createQuotation({
    status: statusMap.approved,
    status_label: 'Approved',
    can_edit: false,
    can_submit: false,
    can_convert: true,
    ...overrides,
  })
}

/**
 * Create an expired quotation
 */
export function createExpiredQuotation(overrides: Partial<Quotation> = {}): Quotation {
  const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return createQuotation({
    valid_until: pastDate.toISOString().split('T')[0]!,
    is_expired: true,
    days_until_expiry: -7,
    status: statusMap.expired,
    ...overrides,
  })
}

/**
 * Reset factory to initial state
 */
export function resetQuotationFactory(): void {
  quotationId = 1
}