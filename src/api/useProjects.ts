/**
 * Projects API hooks
 */

import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from './client'
import { createCrudHooks } from './factory'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type Project = components['schemas']['ProjectResource']

export interface ProjectFilters {
  page?: number
  per_page?: number
  status?: string
  contact_id?: number
  search?: string
}

export type CreateProjectData = Partial<Project>

// ============================================
// CRUD Hooks (via factory)
// ============================================

const hooks = createCrudHooks<Project, ProjectFilters, CreateProjectData>({
  resourceName: 'projects',
  singularName: 'project',
})

export const useProjects = hooks.useList
export const useProject = hooks.useSingle
export const useCreateProject = hooks.useCreate
export const useUpdateProject = hooks.useUpdate
export const useDeleteProject = hooks.useDelete

// ============================================
// Custom Action Hooks
// ============================================

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
