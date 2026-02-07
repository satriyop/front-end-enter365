<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  useProjectTasks,
  useCreateProjectTask,
  useUpdateProjectTask,
  useDeleteProjectTask,
  useStartProjectTask,
  useCompleteProjectTask,
  useCancelProjectTask,
  useProjectTaskStatistics,
  type ProjectTask,
  type CreateProjectTaskData,
  type ProjectTaskFilters,
} from '@/api/useProjectTasks'
import { Button, Badge, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatDate } from '@/utils/format'
import { Plus, Edit, Trash2, Play, CheckCircle, XCircle, ListTree, AlertTriangle } from 'lucide-vue-next'
import ProjectTaskModal from './ProjectTaskModal.vue'
import type { ProjectTaskFormData } from '@/utils/validation'

interface Props {
  projectId: number | string
}

const props = defineProps<Props>()
const router = useRouter()
const toast = useToast()

// Filters
const filters = ref<ProjectTaskFilters>({ per_page: 50 })
const projectIdRef = computed(() => props.projectId)

// Queries
const { data: tasksResponse, isLoading } = useProjectTasks(projectIdRef, filters)
const { data: statistics } = useProjectTaskStatistics(projectIdRef)

const tasks = computed(() => tasksResponse.value?.data ?? [])
const rootTasks = computed(() => tasks.value.filter(t => !t.parent_id))

// Mutations
const createMutation = useCreateProjectTask()
const updateMutation = useUpdateProjectTask()
const deleteMutation = useDeleteProjectTask()
const startMutation = useStartProjectTask()
const completeMutation = useCompleteProjectTask()
const cancelMutation = useCancelProjectTask()

// Modal state
const showModal = ref(false)
const editingTask = ref<ProjectTask | null>(null)

// Priority badge mapping
const priorityVariants: Record<string, 'default' | 'info' | 'warning' | 'destructive'> = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'destructive',
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'task_number', label: '#', mobilePriority: 3 },
  { key: 'title', label: 'Title', mobilePriority: 1 },
  { key: 'status', label: 'Status', mobilePriority: 2 },
  { key: 'priority', label: 'Priority', showInMobile: false },
  { key: 'assignee', label: 'Assignee', showInMobile: false },
  { key: 'due_date', label: 'Due Date', showInMobile: false },
  { key: 'actions', label: '', align: 'right', mobilePriority: 3 },
]

const isSubmitLoading = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value,
)

function openAddModal() {
  editingTask.value = null
  showModal.value = true
}

function openEditModal(task: ProjectTask) {
  editingTask.value = task
  showModal.value = true
}

function navigateToTask(task: ProjectTask) {
  router.push(`/projects/${props.projectId}/tasks/${task.id}`)
}

async function handleSubmit(data: ProjectTaskFormData) {
  try {
    const payload: CreateProjectTaskData = {
      title: data.title,
      description: data.description || undefined,
      priority: data.priority,
      assigned_to: data.assigned_to ?? undefined,
      start_date: data.start_date || undefined,
      due_date: data.due_date || undefined,
      estimated_hours: data.estimated_hours ?? undefined,
      notes: data.notes || undefined,
    }

    if (editingTask.value) {
      await updateMutation.mutateAsync({
        projectId: props.projectId,
        taskId: editingTask.value.id,
        data: payload,
      })
      toast.success('Task updated')
    } else {
      await createMutation.mutateAsync({
        projectId: props.projectId,
        data: payload,
      })
      toast.success('Task created')
    }
    showModal.value = false
    editingTask.value = null
  } catch {
    toast.error(editingTask.value ? 'Failed to update task' : 'Failed to create task')
  }
}

async function handleDelete(task: ProjectTask) {
  if (!confirm(`Delete "${task.title}"?`)) return
  try {
    await deleteMutation.mutateAsync({ projectId: props.projectId, taskId: task.id })
    toast.success('Task deleted')
  } catch {
    toast.error('Failed to delete task')
  }
}

async function handleStart(task: ProjectTask) {
  try {
    await startMutation.mutateAsync({ projectId: props.projectId, taskId: task.id })
    toast.success('Task started')
  } catch {
    toast.error('Failed to start task')
  }
}

async function handleComplete(task: ProjectTask) {
  try {
    await completeMutation.mutateAsync({ projectId: props.projectId, taskId: task.id })
    toast.success('Task completed')
  } catch {
    toast.error('Failed to complete task')
  }
}

async function handleCancel(task: ProjectTask) {
  try {
    await cancelMutation.mutateAsync({ projectId: props.projectId, taskId: task.id })
    toast.success('Task cancelled')
  } catch {
    toast.error('Failed to cancel task')
  }
}
</script>

<template>
  <div>
    <!-- Statistics Summary -->
    <div v-if="statistics" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
        <div class="text-2xl font-semibold text-foreground">{{ statistics.total }}</div>
        <div class="text-xs text-muted-foreground">Total</div>
      </div>
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
        <div class="text-2xl font-semibold text-blue-600 dark:text-blue-400">{{ statistics.by_status?.in_progress ?? 0 }}</div>
        <div class="text-xs text-muted-foreground">In Progress</div>
      </div>
      <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
        <div class="text-2xl font-semibold text-green-600 dark:text-green-400">{{ statistics.by_status?.done ?? 0 }}</div>
        <div class="text-xs text-muted-foreground">Done</div>
      </div>
      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
        <div class="text-2xl font-semibold text-red-600 dark:text-red-400">{{ statistics.overdue_count ?? 0 }}</div>
        <div class="text-xs text-muted-foreground">Overdue</div>
      </div>
    </div>

    <!-- Header with Add button -->
    <div class="flex items-center justify-between mb-4">
      <span class="text-sm text-muted-foreground">
        {{ rootTasks.length }} task{{ rootTasks.length !== 1 ? 's' : '' }}
      </span>
      <Button size="sm" @click="openAddModal">
        <Plus class="w-4 h-4 mr-2" />
        Add Task
      </Button>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="text-center py-8 text-muted-foreground">
      Loading tasks...
    </div>

    <!-- Empty state -->
    <div v-else-if="rootTasks.length === 0" class="text-center py-8 text-muted-foreground">
      <p>No tasks yet.</p>
      <p class="text-sm mt-1">Add tasks to track project work.</p>
    </div>

    <!-- Tasks table -->
    <ResponsiveTable
      v-else
      :items="rootTasks"
      :columns="columns"
      title-field="title"
      clickable
      @row-click="navigateToTask"
    >
      <template #cell-task_number="{ item }">
        <span class="text-xs font-mono text-muted-foreground">{{ item.task_number }}</span>
      </template>

      <template #cell-title="{ item }">
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ item.title }}</span>
          <span
            v-if="item.subtasks_count"
            class="inline-flex items-center gap-0.5 text-xs text-muted-foreground"
            :title="`${item.subtasks_count} subtask${item.subtasks_count !== 1 ? 's' : ''}`"
          >
            <ListTree class="w-3.5 h-3.5" />
            {{ item.subtasks_count }}
          </span>
          <AlertTriangle
            v-if="item.is_overdue"
            class="w-3.5 h-3.5 text-red-500"
            title="Overdue"
          />
        </div>
      </template>

      <template #cell-status="{ item }">
        <Badge :status="item.status" dot>
          {{ item.status.label }}
        </Badge>
      </template>

      <template #cell-priority="{ item }">
        <Badge :variant="priorityVariants[item.priority] || 'default'">
          {{ item.priority }}
        </Badge>
      </template>

      <template #cell-assignee="{ item }">
        <span class="text-sm text-slate-600 dark:text-slate-400">
          {{ item.assignee?.name ?? '—' }}
        </span>
      </template>

      <template #cell-due_date="{ item }">
        <span
          class="text-sm"
          :class="item.is_overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-500 dark:text-slate-400'"
        >
          {{ item.due_date ? formatDate(item.due_date) : '—' }}
        </span>
      </template>

      <template #cell-actions="{ item }">
        <div class="flex gap-1 justify-end" @click.stop>
          <!-- Start button (todo only) -->
          <Button
            v-if="item.status.value === 'todo'"
            variant="ghost"
            size="sm"
            title="Start"
            :loading="startMutation.isPending.value"
            @click="handleStart(item)"
          >
            <Play class="w-4 h-4 text-blue-500" />
          </Button>

          <!-- Complete button (in_progress only) -->
          <Button
            v-if="item.status.value === 'in_progress'"
            variant="ghost"
            size="sm"
            title="Complete"
            :loading="completeMutation.isPending.value"
            @click="handleComplete(item)"
          >
            <CheckCircle class="w-4 h-4 text-green-500" />
          </Button>

          <!-- Edit button (editable only) -->
          <Button
            v-if="String(item.status.is_editable) === 'true'"
            variant="ghost"
            size="sm"
            title="Edit"
            @click="openEditModal(item)"
          >
            <Edit class="w-4 h-4" />
          </Button>

          <!-- Cancel button (non-terminal) -->
          <Button
            v-if="String(item.status.is_terminal) === 'false'"
            variant="ghost"
            size="sm"
            title="Cancel"
            class="text-red-500 hover:text-red-600"
            @click="handleCancel(item)"
          >
            <XCircle class="w-4 h-4" />
          </Button>

          <!-- Delete button (editable only) -->
          <Button
            v-if="String(item.status.is_editable) === 'true'"
            variant="ghost"
            size="sm"
            title="Delete"
            class="text-red-500 hover:text-red-600"
            :loading="deleteMutation.isPending.value"
            @click="handleDelete(item)"
          >
            <Trash2 class="w-4 h-4" />
          </Button>
        </div>
      </template>

      <template #mobile-title="{ item }">
        <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.title }}</span>
      </template>
    </ResponsiveTable>

    <!-- Task Modal -->
    <ProjectTaskModal
      :open="showModal"
      :task="editingTask"
      :is-loading="isSubmitLoading"
      @update:open="showModal = $event"
      @submit="handleSubmit"
    />
  </div>
</template>
