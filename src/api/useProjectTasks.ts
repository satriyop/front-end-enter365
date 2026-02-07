/**
 * Project Tasks API hooks
 *
 * Nested resource under projects — manual hooks (not createCrudHooks factory).
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { api, type PaginatedResponse } from './client'
import type { components } from './types'

// ============================================
// Types
// ============================================

export type ProjectTask = components['schemas']['TaskResource']

export interface ProjectTaskFilters {
  page?: number
  per_page?: number
  status?: string
  priority?: string
  assigned_to?: number
  parent_id?: number | null
  search?: string
  is_overdue?: boolean
}

export interface CreateProjectTaskData {
  title: string
  description?: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  assigned_to?: number | null
  start_date?: string
  due_date?: string
  estimated_hours?: number | null
  notes?: string
  parent_id?: number | null
}

export type UpdateProjectTaskData = Partial<CreateProjectTaskData>

export interface ProjectTaskStatistics {
  total: number
  by_status: Record<string, number>
  by_priority: Record<string, number>
  overdue_count: number
  completion_rate: number
  avg_completion_hours: number | null
}

// ============================================
// Helpers
// ============================================

function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined && v !== null),
  )
}

function invalidateTaskQueries(queryClient: ReturnType<typeof useQueryClient>, projectId?: number | string) {
  queryClient.invalidateQueries({ queryKey: ['project-tasks'] })
  if (projectId) {
    queryClient.invalidateQueries({ queryKey: ['project-task', String(projectId)] })
  }
  queryClient.invalidateQueries({ queryKey: ['projects'] })
}

// ============================================
// Query Hooks
// ============================================

export function useProjectTasks(projectId: Ref<number | string>, filters: Ref<ProjectTaskFilters>) {
  return useQuery({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryKey: computed(() => ['project-tasks', projectId.value, filters.value]) as any,
    queryFn: async () => {
      const params = cleanParams(filters.value as Record<string, unknown>)
      const response = await api.get<PaginatedResponse<ProjectTask>>(
        `/projects/${projectId.value}/tasks`,
        { params },
      )
      return response.data
    },
    enabled: computed(() => !!projectId.value),
  })
}

export function useProjectTask(projectId: Ref<number | string>, taskId: Ref<number | string | null | undefined>) {
  return useQuery({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryKey: computed(() => ['project-task', projectId.value, taskId.value]) as any,
    queryFn: async () => {
      if (!taskId.value) return null
      const response = await api.get<{ data: ProjectTask }>(
        `/projects/${projectId.value}/tasks/${taskId.value}`,
      )
      return response.data.data
    },
    enabled: computed(() => !!projectId.value && !!taskId.value),
  })
}

export function useProjectTaskStatistics(projectId: Ref<number | string>) {
  return useQuery({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryKey: computed(() => ['project-task-statistics', projectId.value]) as any,
    queryFn: async () => {
      const response = await api.get<{ data: ProjectTaskStatistics }>(
        `/projects/${projectId.value}/tasks-statistics`,
      )
      return response.data.data
    },
    enabled: computed(() => !!projectId.value),
  })
}

// ============================================
// CRUD Mutations
// ============================================

export function useCreateProjectTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number | string; data: CreateProjectTaskData }) => {
      const response = await api.post<{ data: ProjectTask }>(`/projects/${projectId}/tasks`, data)
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      invalidateTaskQueries(queryClient, variables.projectId)
    },
  })
}

export function useUpdateProjectTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, taskId, data }: { projectId: number | string; taskId: number; data: UpdateProjectTaskData }) => {
      const response = await api.put<{ data: ProjectTask }>(`/projects/${projectId}/tasks/${taskId}`, data)
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      invalidateTaskQueries(queryClient, variables.projectId)
    },
  })
}

export function useDeleteProjectTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, taskId }: { projectId: number | string; taskId: number }) => {
      await api.delete(`/projects/${projectId}/tasks/${taskId}`)
    },
    onSuccess: (_data, variables) => {
      invalidateTaskQueries(queryClient, variables.projectId)
    },
  })
}

// ============================================
// State Transition Mutations
// ============================================

export function useStartProjectTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, taskId }: { projectId: number | string; taskId: number }) => {
      const response = await api.post<{ data: ProjectTask }>(`/projects/${projectId}/tasks/${taskId}/start`)
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      invalidateTaskQueries(queryClient, variables.projectId)
    },
  })
}

export function useCompleteProjectTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, taskId }: { projectId: number | string; taskId: number }) => {
      const response = await api.post<{ data: ProjectTask }>(`/projects/${projectId}/tasks/${taskId}/complete`)
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      invalidateTaskQueries(queryClient, variables.projectId)
    },
  })
}

export function useCancelProjectTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, taskId, reason }: { projectId: number | string; taskId: number; reason?: string }) => {
      const response = await api.post<{ data: ProjectTask }>(`/projects/${projectId}/tasks/${taskId}/cancel`, { reason })
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      invalidateTaskQueries(queryClient, variables.projectId)
    },
  })
}

// ============================================
// Subtask & Dependency Mutations
// ============================================

export function useAddSubtask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, taskId, data }: { projectId: number | string; taskId: number; data: CreateProjectTaskData }) => {
      const response = await api.post<{ data: ProjectTask }>(
        `/projects/${projectId}/tasks/${taskId}/subtasks`,
        data,
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      invalidateTaskQueries(queryClient, variables.projectId)
    },
  })
}

export function useAddTaskDependency() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, taskId, dependencyId }: { projectId: number | string; taskId: number; dependencyId: number }) => {
      const response = await api.post<{ data: ProjectTask }>(
        `/projects/${projectId}/tasks/${taskId}/dependencies`,
        { dependency_id: dependencyId },
      )
      return response.data.data
    },
    onSuccess: (_data, variables) => {
      invalidateTaskQueries(queryClient, variables.projectId)
    },
  })
}

export function useRemoveTaskDependency() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, taskId, dependencyId }: { projectId: number | string; taskId: number; dependencyId: number }) => {
      await api.delete(`/projects/${projectId}/tasks/${taskId}/dependencies/${dependencyId}`)
    },
    onSuccess: (_data, variables) => {
      invalidateTaskQueries(queryClient, variables.projectId)
    },
  })
}

// ============================================
// Reorder Mutation
// ============================================

export function useReorderTasks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, taskIds }: { projectId: number | string; taskIds: number[] }) => {
      await api.post(`/projects/${projectId}/tasks/reorder`, { task_ids: taskIds })
    },
    onSuccess: (_data, variables) => {
      invalidateTaskQueries(queryClient, variables.projectId)
    },
  })
}
