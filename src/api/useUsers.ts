import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type User = components['schemas']['UserResource']
export type Role = components['schemas']['RoleResource']

export interface UserFilters {
  page?: number
  per_page?: number
  is_active?: boolean
  role?: string
  search?: string
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  is_active?: boolean
  roles?: number[]
}

export interface UpdateUserInput {
  name?: string
  email?: string
  is_active?: boolean
  roles?: number[]
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch paginated list of users
 */
export function useUsers(filters: Ref<UserFilters>) {
  return useQuery({
    queryKey: computed(() => ['users', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<User>>('/users', {
        params: cleanParams
      })
      return response.data
    },
  })
}

/**
 * Fetch single user by ID
 */
export function useUser(id: Ref<number>) {
  return useQuery({
    queryKey: computed(() => ['user', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: User }>(`/users/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value && id.value > 0),
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateUserInput) => {
      const response = await api.post<{ data: User; message: string }>('/users', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

/**
 * Update an existing user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateUserInput }) => {
      const response = await api.put<{ data: User; message: string }>(`/users/${id}`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
    },
  })
}

/**
 * Delete a user
 */
export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

/**
 * Toggle user active status
 */
export function useToggleUserActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await api.post<{ data: User; message: string }>(`/users/${id}/toggle-active`)
      return response.data.data
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
    },
  })
}

/**
 * Update user password
 */
export function useUpdateUserPassword() {
  return useMutation({
    mutationFn: async ({ id, password, password_confirmation }: {
      id: number
      password: string
      password_confirmation: string
    }) => {
      await api.post(`/users/${id}/password`, { password, password_confirmation })
    },
  })
}

/**
 * Lightweight user lookup for dropdowns (assignment, etc.)
 */
export function useUsersLookup() {
  return useQuery({
    queryKey: ['users', 'lookup'],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<User>>('/users', {
        params: { per_page: 100, is_active: true },
      })
      return response.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Assign roles to user
 */
export function useAssignRoles() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, roles }: { id: number; roles: number[] }) => {
      const response = await api.post<{ data: User; message: string }>(`/users/${id}/roles`, { roles })
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
    },
  })
}