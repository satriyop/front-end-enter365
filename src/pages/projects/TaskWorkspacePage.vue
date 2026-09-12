<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useWorkspaceTasks,
  type ProjectTask,
  type WorkspaceTaskFilters,
} from '@/api/useProjectTasks'
import { useResourceList } from '@/composables/useResourceList'
import { Card, Input, Select, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatDate } from '@/utils/format'
import { Search } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const isMine = computed(() => route.name === 'my-tasks')

const {
  items,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
} = useResourceList<ProjectTask, WorkspaceTaskFilters>({
  useListHook: (listFilters) => useWorkspaceTasks(computed(() => (isMine.value ? 'my' : 'all')), listFilters),
  initialFilters: { page: 1, per_page: 25, search: '', status: '', priority: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'task_number', label: 'Number', mobilePriority: 1 },
  { key: 'title', label: 'Title', mobilePriority: 2 },
  { key: 'project', label: 'Project', mobilePriority: 3 },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'priority', label: 'Priority', showInMobile: false },
  { key: 'due_date', label: 'Due', mobilePriority: 4 },
]

const statusOptions = [
  { value: '', label: 'All status' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

const priorityOptions = [
  { value: '', label: 'All priority' },
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

function statusLabel(task: ProjectTask): string {
  const status = task.status as { label?: string; value?: string } | string | undefined
  if (status && typeof status === 'object') {
    return status.label || status.value || '—'
  }
  return status ? String(status) : '—'
}

function openTask(task: ProjectTask) {
  router.push('/projects/' + task.project_id + '/tasks/' + task.id)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {{ isMine ? 'My Tasks' : 'All Tasks' }}
        </h1>
        <p class="text-slate-500 dark:text-slate-400">
          {{ isMine ? 'Tasks assigned to you across projects.' : 'Every project task in one list.' }}
        </p>
      </div>
    </div>
    <Card class="mb-4">
      <div class="p-4 flex flex-wrap gap-3 items-end">
        <div class="relative flex-1 min-w-[200px]">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            :model-value="filters.search ?? ''"
            class="pl-9"
            placeholder="Search number or title..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
        <Select
          :model-value="filters.status ?? ''"
          :options="statusOptions"
          @update:model-value="(v) => updateFilter('status', v ? String(v) : '')"
        />
        <Select
          :model-value="filters.priority ?? ''"
          :options="priorityOptions"
          @update:model-value="(v) => updateFilter('priority', v ? String(v) : '')"
        />
      </div>
    </Card>
    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load tasks</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No tasks found</div>
      <ResponsiveTable
        v-else
        :items="items ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openTask"
      >
        <template #cell-project="{ item }">{{ item.project?.name ?? '—' }}</template>
        <template #cell-status="{ item }">{{ statusLabel(item) }}</template>
        <template #cell-due_date="{ item }">
          <span :class="item.is_overdue ? 'text-red-600 dark:text-red-400 font-medium' : ''">
            {{ item.due_date ? formatDate(item.due_date) : '—' }}
          </span>
        </template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
