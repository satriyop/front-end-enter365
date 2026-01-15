/**
 * CRUD Hooks Factory
 *
 * Standardized factory for creating TanStack Query hooks for CRUD operations.
 * Reduces boilerplate across API hook files.
 *
 * @example
 * ```ts
 * import { createCrudHooks } from '@/api/factory'
 *
 * const hooks = createCrudHooks<Contact, ContactFilters, CreateContactData>({
 *   resourceName: 'contacts',
 * })
 *
 * export const useContacts = hooks.useList
 * export const useContact = hooks.useSingle
 * export const useContactsLookup = hooks.useLookup
 * export const useCreateContact = hooks.useCreate
 * export const useUpdateContact = hooks.useUpdate
 * export const useDeleteContact = hooks.useDelete
 * ```
 */

export { createCrudHooks } from './createCrudHooks'
export type { CrudHooksConfig, BaseFilters } from './types'
