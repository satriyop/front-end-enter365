import { useQuery } from '@tanstack/vue-query'
import { computed, unref, type MaybeRef } from 'vue'
import { api } from './client'

export interface TasksAnalysisReport {
  report_name: string
  from?: string | null
  to?: string | null
  totals: {
    count: number
    done: number
    overdue: number
    completion_rate: number
  }
  by_status: Array<{ status: string; count: number; overdue: number }>
  by_priority: Array<{ priority: string; count: number }>
  by_project: Array<{
    project_id: number
    project_number?: string | null
    project_name?: string | null
    count: number
    done: number
    overdue: number
  }>
  by_assignee: Array<{
    user_id?: number | null
    name?: string | null
    count: number
    done: number
  }>
}

export interface CustomerRatingsReport {
  report_name: string
  totals: { count: number; average: number | null }
  by_rating: Array<{ rating: number; count: number }>
  rows: Array<Record<string, unknown>>
}

export function useTasksAnalysis(filters: MaybeRef<{ from?: string; to?: string }>) {
  const params = computed(() => unref(filters))
  return useQuery({
    queryKey: computed(() => ['reports', 'tasks-analysis', params.value]),
    queryFn: async () => {
      const response = await api.get<{ data: TasksAnalysisReport }>('/reports/tasks-analysis', {
        params: params.value,
      })
      return response.data.data
    },
  })
}

export function useCustomerRatingsReport(projectId?: MaybeRef<number | undefined>) {
  const id = computed(() => unref(projectId))
  return useQuery({
    queryKey: computed(() => ['reports', 'customer-ratings', id.value]),
    queryFn: async () => {
      const response = await api.get<{ data: CustomerRatingsReport }>('/reports/customer-ratings', {
        params: id.value ? { project_id: id.value } : {},
      })
      return response.data.data
    },
  })
}
