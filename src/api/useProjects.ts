/**
 * Projects API hooks
 * Level 2 Pattern: Types + Queries + Mutations in one file
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import type { Ref } from 'vue'
import type { components } from './types'

// Types from OpenAPI
export type Project = components['schemas']['ProjectResource']

export interface ProjectFilters {
  page?: number
  per_page?: number
  status?: string
  contact_id?: number
  search?: string
}

interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// Queries
export function useProjects(filters: Ref<ProjectFilters>) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      const f = filters.value
      if (f.page) params.set('page', String(f.page))
      if (f.per_page) params.set('per_page', String(f.per_page))
      if (f.status) params.set('status', f.status)
      if (f.contact_id) params.set('contact_id', String(f.contact_id))
      if (f.search) params.set('search', f.search)

      const response = await api.get<PaginatedResponse<Project>>(`/projects?${params}`)
      return response.data
    },
  })
}

export function useProject(id: Ref<number | string>) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      const response = await api.get<{ data: Project }>(`/projects/${id.value}`)
      return response.data.data
    },
    enabled: () => !!id.value,
  })
}

// Mutations
export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Partial<Project>) => {
      const response = await api.post<{ data: Project }>('/projects', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: Partial<Project> }) => {
      const response = await api.put<{ data: Project }>(`/projects/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      await api.delete(`/projects/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// Project Actions
export function useStartProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Project }>(`/projects/${id}/start`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useCompleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Project }>(`/projects/${id}/complete`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useCancelProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number | string; reason?: string }) => {
      const response = await api.post<{ data: Project }>(`/projects/${id}/cancel`, { reason })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
