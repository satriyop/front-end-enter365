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
export type ProjectCost = components['schemas']['ProjectCostResource']
export type ProjectRevenue = components['schemas']['ProjectRevenueResource']

export interface ProjectFilters {
  page?: number
  per_page?: number
  status?: string
  contact_id?: number
  search?: string
}

export type CreateProjectData = Partial<Project>

// Cost data types based on API spec
export interface CreateProjectCostData {
  type: 'material' | 'labor' | 'subcontractor' | 'equipment' | 'overhead' | 'other'
  description: string
  quantity?: number | null
  unit?: string | null
  unit_cost: number
  date?: string | null
  reference?: string | null
  notes?: string | null
}

export type UpdateProjectCostData = Partial<CreateProjectCostData>

// Revenue data types based on API spec
export interface CreateProjectRevenueData {
  type: 'invoice' | 'down_payment' | 'milestone' | 'other'
  description: string
  amount: number
  date?: string | null
  reference?: string | null
  notes?: string | null
}

export type UpdateProjectRevenueData = Partial<CreateProjectRevenueData>

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
export const useProjectsLookup = hooks.useLookup

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

export function useHoldProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, reason }: { id: number | string; reason?: string }) => {
      const response = await api.post<{ data: Project }>(`/projects/${id}/hold`, { reason })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useResumeProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      const response = await api.post<{ data: Project }>(`/projects/${id}/resume`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// ============================================
// Progress Hook
// ============================================

export function useUpdateProjectProgress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, progress }: { id: number | string; progress: number }) => {
      const response = await api.post<{ data: Project }>(`/projects/${id}/update-progress`, { progress })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// ============================================
// Cost CRUD Hooks
// ============================================

export function useAddProjectCost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number | string; data: CreateProjectCostData }) => {
      const response = await api.post<{ data: ProjectCost }>(`/projects/${projectId}/costs`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProjectCost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, costId, data }: { projectId: number | string; costId: number; data: UpdateProjectCostData }) => {
      const response = await api.put<{ data: ProjectCost }>(`/projects/${projectId}/costs/${costId}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProjectCost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, costId }: { projectId: number | string; costId: number }) => {
      await api.delete(`/projects/${projectId}/costs/${costId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// ============================================
// Revenue CRUD Hooks
// ============================================

export function useAddProjectRevenue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number | string; data: CreateProjectRevenueData }) => {
      const response = await api.post<{ data: ProjectRevenue }>(`/projects/${projectId}/revenues`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useUpdateProjectRevenue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, revenueId, data }: { projectId: number | string; revenueId: number; data: UpdateProjectRevenueData }) => {
      const response = await api.put<{ data: ProjectRevenue }>(`/projects/${projectId}/revenues/${revenueId}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export function useDeleteProjectRevenue() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, revenueId }: { projectId: number | string; revenueId: number }) => {
      await api.delete(`/projects/${projectId}/revenues/${revenueId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}
