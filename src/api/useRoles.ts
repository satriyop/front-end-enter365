import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type Role = components['schemas']['RoleResource']
export type Permission = components['schemas']['PermissionResource']
export type StoreRoleRequest = components['schemas']['StoreRoleRequest']
export type UpdateRoleRequest = components['schemas']['UpdateRoleRequest']

export interface RoleFilters {
  page?: number
  per_page?: number
  search?: string
}

export interface PermissionFilters {
  page?: number
  per_page?: number
  group?: string
  search?: string
}

export interface GroupedPermission {
  group: string
  group_label: string
  permissions: Permission[]
}

// ============================================
// Role Query Hooks
// ============================================

/**
 * Fetch paginated list of roles
 */
export function useRoles(filters: Ref<RoleFilters>) {
  return useQuery({
    queryKey: computed(() => ['roles', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<Role>>('/roles', {
        params: cleanParams
      })
      return response.data
    },
  })
}

/**
 * Fetch all roles (non-paginated for dropdowns)
 */
export function useAllRoles() {
  return useQuery({
    queryKey: ['roles', 'all'],
    queryFn: async () => {
      const response = await api.get<{ data: Role[] }>('/roles', {
        params: { per_page: 100 } // Or a separate endpoint if available
      })
      return response.data.data
    },
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * Fetch single role by ID
 */
export function useRole(id: Ref<number | string | null>) {
  return useQuery({
    queryKey: computed(() => ['role', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: Role }>(`/roles/${id.value}`)
      return response.data.data
    },
    enabled: computed(() => !!id.value),
  })
}

/**
 * Fetch users with a specific role
 */
export function useRoleUsers(id: Ref<number | string | null>) {
  return useQuery({
    queryKey: computed(() => ['role', id.value, 'users']),
    queryFn: async () => {
      const response = await api.get<{ role: Partial<Role>; users: any[] }>(`/roles/${id.value}/users`)
      return response.data
    },
    enabled: computed(() => !!id.value),
  })
}

// ============================================
// Permission Query Hooks
// ============================================

/**
 * Fetch paginated list of permissions
 */
export function usePermissions(filters: Ref<PermissionFilters>) {
  return useQuery({
    queryKey: computed(() => ['permissions', filters.value]),
    queryFn: async () => {
      const cleanParams = Object.fromEntries(
        Object.entries(filters.value).filter(([, v]) => v !== '' && v !== undefined && v !== null)
      )
      const response = await api.get<PaginatedResponse<Permission>>('/permissions', {
        params: cleanParams
      })
      return response.data
    },
  })
}

/**
 * Fetch permissions grouped by group
 */
export function useGroupedPermissions() {
  return useQuery({
    queryKey: ['permissions', 'grouped'],
    queryFn: async () => {
      const response = await api.get<{ data: GroupedPermission[] }>('/permissions/grouped')
      return response.data.data
    },
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  })
}

/**
 * Fetch available permission groups
 */
export function usePermissionGroups() {
  return useQuery({
    queryKey: ['permissions', 'groups'],
    queryFn: async () => {
      const response = await api.get<{ data: { name: string; label: string }[] }>('/permissions/groups')
      return response.data.data
    },
    staleTime: 60 * 60 * 1000,
  })
}

// ============================================
// Role Mutation Hooks
// ============================================

/**
 * Create a new role
 */
export function useCreateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: StoreRoleRequest) => {
      const response = await api.post<{ data: Role }>('/roles', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

/**
 * Update an existing role
 */
export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRoleRequest }) => {
      const response = await api.put<{ data: Role; message: string }>(`/roles/${id}`, data)
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
      queryClient.invalidateQueries({ queryKey: ['role', variables.id] })
    },
  })
}

/**
 * Delete a role
 */
export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/roles/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
  })
}

/**
 * Sync permissions for a role
 */
export function useSyncRolePermissions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, permissions }: { id: number; permissions: number[] }) => {
      const response = await api.post<{ data: Role; message: string }>(`/roles/${id}/permissions`, { permissions })
      return response.data.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role', variables.id] })
    },
  })
}
