import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'
import type { components } from './types'

// ============================================
// Types from OpenAPI spec
// ============================================

export type Contact = components['schemas']['ContactResource']

export interface ContactFilters {
  page?: number
  per_page?: number
  type?: 'customer' | 'supplier' | 'both'
  search?: string
  is_active?: boolean
}

export interface CreateContactData {
  code: string
  name: string
  type: 'customer' | 'supplier' | 'both'
  email?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  npwp?: string | null
  nik?: string | null
  credit_limit?: number
  payment_term_days?: number
  is_active?: boolean
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch paginated list of contacts
 */
export function useContacts(filters: Ref<ContactFilters>) {
  return useQuery({
    queryKey: computed(() => ['contacts', filters.value]),
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Contact>>('/contacts', {
        params: filters.value
      })
      return response.data
    },
  })
}

/**
 * Fetch single contact by ID
 */
export function useContact(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['contact', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: Contact }>(`/contacts/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

/**
 * Fetch contacts for dropdown/select (lightweight)
 */
export function useContactsLookup(type?: 'customer' | 'supplier') {
  return useQuery({
    queryKey: ['contacts', 'lookup', type],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Contact>>('/contacts', {
        params: {
          per_page: 100,
          is_active: true,
          type: type,
        }
      })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create new contact
 */
export function useCreateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateContactData) => {
      const response = await api.post<{ data: Contact }>('/contacts', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}

/**
 * Update contact
 */
export function useUpdateContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateContactData> }) => {
      const response = await api.put<{ data: Contact }>(`/contacts/${id}`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.setQueryData(['contact', data.id], data)
    },
  })
}

/**
 * Delete contact
 */
export function useDeleteContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/contacts/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      queryClient.removeQueries({ queryKey: ['contact', id] })
    },
  })
}
