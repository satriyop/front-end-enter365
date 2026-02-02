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
    credit_limit: 0,
    payment_term_days: 30,
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
 * Reset factory to initial state
 */
export function resetContactFactory(): void {
  contactId = 1
}
