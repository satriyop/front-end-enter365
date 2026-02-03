import { createCrudHooks } from './factory'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type Contact = components['schemas']['ContactResource']

export interface ContactFilters {
  page?: number
  per_page?: number
  type?: 'customer' | 'supplier' | 'both'
  search?: string
  is_active?: boolean
}

export type CreateContactData = components['schemas']['StoreContactRequest']

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<Contact, ContactFilters, CreateContactData>({
  resourceName: 'contacts',
  lookupParams: { is_active: true },
})

export const useContacts = hooks.useList
export const useContact = hooks.useSingle
export const useCreateContact = hooks.useCreate
export const useUpdateContact = hooks.useUpdate
export const useDeleteContact = hooks.useDelete

/**
 * Fetch contacts for dropdown/select (lightweight)
 * @param type Optional filter by contact type
 */
export function useContactsLookup(type?: 'customer' | 'supplier') {
  return hooks.useLookup({ type })
}
