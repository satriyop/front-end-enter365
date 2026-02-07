/**
 * Contact Factory
 *
 * Creates test Contact data matching the API ContactResource schema.
 */

import type { components } from '@/api/types'

export type Contact = components['schemas']['ContactResource']

let contactId = 1

/**
 * Create a single contact with optional overrides
 */
export function createContact(overrides: Partial<Contact> = {}): Contact {
  const id = contactId++
  return {
    id: id,
    code: `CUST-${id.toString().padStart(4, '0')}`,
    name: `Contact ${id}`,
    type: 'customer',
    email: `contact${id}@example.com`,
    phone: `08123456${id.toString().padStart(4, '0')}`,
    address: `Jl. Test No. ${id}`,
    city: 'Jakarta',
    province: 'DKI Jakarta',
    postal_code: '12345',
    npwp: '',
    nik: '',
    // Payment terms
    credit_limit: 0,
    currency: 'IDR',
    payment_term_days: 30,
    early_discount_percent: '0',
    early_discount_days: 0,
    // Bank account
    bank_name: null,
    bank_account_number: null,
    bank_account_name: null,
    // Subcontractor
    is_subcontractor: false,
    subcontractor_services: null,
    hourly_rate: null,
    daily_rate: null,
    notes: null,
    // Status
    is_active: true,
    receivable_balance: '0',
    payable_balance: '0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create multiple contacts
 */
export function createContacts(count: number, overrides: Partial<Contact> = {}): Contact[] {
  return Array.from({ length: count }, () => createContact(overrides))
}

/**
 * Create a customer contact
 */
export function createCustomer(overrides: Partial<Contact> = {}): Contact {
  return createContact({
    type: 'customer',
    ...overrides,
  })
}

/**
 * Create a vendor/supplier contact
 */
export function createVendor(overrides: Partial<Contact> = {}): Contact {
  return createContact({
    type: 'vendor',
    ...overrides,
  })
}

/**
 * Create a subcontractor contact
 */
export function createSubcontractor(overrides: Partial<Contact> = {}): Contact {
  return createContact({
    type: 'supplier',
    is_subcontractor: true,
    hourly_rate: 150000,
    daily_rate: 1000000,
    subcontractor_services: ['Welding', 'Fabrication'],
    ...overrides,
  })
}

/**
 * Reset factory to initial state
 */
export function resetContactFactory(): void {
  contactId = 1
}
