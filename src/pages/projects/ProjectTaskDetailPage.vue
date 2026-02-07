<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useProjectTask,
  useUpdateProjectTask,
  useDeleteProjectTask,
  useStartProjectTask,
  useCompleteProjectTask,
  useCancelProjectTask,
  useAddSubtask,
  useAddTaskDependency,
  useRemoveTaskDependency,
  useProjectTasks,
  type ProjectTask,
  type CreateProjectTaskData,
  type ProjectTaskFilters,
} from '@/api/useProjectTasks'
import { Button, Card, Badge, Modal, Textarea, Select, useToast } from '@/components/ui'
import { formatDate } from '@/utils/format'
import {
  ArrowLeft, Play, CheckCircle, XCircle, Edit, Trash2,
  Plus, Link, Unlink, Clock, User, AlertTriangle, ListTree,
} from 'lucide-vue-next'
import ProjectTaskModal from '@/components/projects/ProjectTaskModal.vue'
import type { ProjectTaskFormData } from '@/utils/validation'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const projectId = computed(() => route.params.projectId as string)
const taskId = computed(() => route.params.taskId as string)

// Queries
const { data: task, isLoading } = useProjectTask(projectId, taskId)

// All project tasks (for dependency picker)
const allTasksFilter = ref<ProjectTaskFilters>({ per_page: 100 })
const { data: allTasksResponse } = useProjectTasks(projectId, allTasksFilter)
const allTasks = computed(() => allTasksResponse.value?.data ?? [])

// Mutations
const updateMutation = useUpdateProjectTask()
const deleteMutation = useDeleteProjectTask()
const startMutation = useStartProjectTask()
const completeMutation = useCompleteProjectTask()
const cancelMutation = useCancelProjectTask()
const addSubtaskMutation = useAddSubtask()
const addDependencyMutation = useAddTaskDependency()
const removeDependencyMutation = useRemoveTaskDependency()

// Modal states
const showEditModal = ref(false)
const showSubtaskModal = ref(false)
const showCancelModal = ref(false)
const showDependencyModal = ref(false)
const cancelReason = ref('')
const selectedDependencyId = ref<number | null>(null)

// Priority badge mapping
const priorityVariants: Record<string, 'default' | 'info' | 'warning' | 'destructive'> = {
  low: 'default',
  normal: 'info',
  high: 'warning',
  urgent: 'destructive',
}

const isEditable = computed(() => String(task.value?.status.is_editable) === 'true')
const isTerminal = computed(() => String(task.value?.status.is_terminal) === 'true')

// Available tasks for dependency picker (exclude self, subtasks, and existing deps)
const availableDependencyTasks = computed(() => {
  if (!task.value) return []
  const currentId = task.value.id
  const existingDepIds = new Set((task.value.dependencies ?? []).map(d => d.id))
  return allTasks.value
    .filter(t => t.id !== currentId && !existingDepIds.has(t.id) && t.parent_id !== currentId)
    .map(t => ({ value: t.id, label: `${t.task_number} — ${t.title}` }))
})

// Actions
async function handleStart() {
  if (!task.value) return
  try {
    await startMutation.mutateAsync({ projectId: projectId.value, taskId: task.value.id })
    toast.success('Task started')
  } catch {
    toast.error('Failed to start task')
  }
}

async function handleComplete() {
  if (!task.value) return
  try {
    await completeMutation.mutateAsync({ projectId: projectId.value, taskId: task.value.id })
    toast.success('Task completed')
  } catch {
    toast.error('Failed to complete task')
  }
}

async function handleCancelConfirm() {
  if (!task.value) return
  try {
    await cancelMutation.mutateAsync({
      projectId: projectId.value,
      taskId: task.value.id,
      reason: cancelReason.value || undefined,
    })
    showCancelModal.value = false
    cancelReason.value = ''
    toast.success('Task cancelled')
  } catch {
    toast.error('Failed to cancel task')
  }
}

async function handleDelete() {
  if (!task.value || !confirm(`Delete "${task.value.title}"? This cannot be undone.`)) return
  try {
    await deleteMutation.mutateAsync({ projectId: projectId.value, taskId: task.value.id })
    toast.success('Task deleted')
    router.push(`/projects/${projectId.value}`)
  } catch {
    toast.error('Failed to delete task')
  }
}

async function handleEditSubmit(data: ProjectTaskFormData) {
  if (!task.value) return
  try {
    await updateMutation.mutateAsync({
      projectId: projectId.value,
      taskId: task.value.id,
      data: {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority,
        assigned_to: data.assigned_to ?? undefined,
        start_date: data.start_date || undefined,
        due_date: data.due_date || undefined,
        estimated_hours: data.estimated_hours ?? undefined,
        notes: data.notes || undefined,
      },
    })
    showEditModal.value = false
    toast.success('Task updated')
  } catch {
    toast.error('Failed to update task')
  }
}

async function handleSubtaskSubmit(data: ProjectTaskFormData) {
  if (!task.value) return
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
    await addSubtaskMutation.mutateAsync({
      projectId: projectId.value,
      taskId: task.value.id,
      data: payload,
    })
    showSubtaskModal.value = false
    toast.success('Subtask added')
  } catch {
    toast.error('Failed to add subtask')
  }
}

// Subtask inline actions
async function handleStartSubtask(subtask: ProjectTask) {
  try {
    await startMutation.mutateAsync({ projectId: projectId.value, taskId: subtask.id })
    toast.success('Subtask started')
  } catch {
    toast.error('Failed to start subtask')
  }
}

async function handleCompleteSubtask(subtask: ProjectTask) {
  try {
    await completeMutation.mutateAsync({ projectId: projectId.value, taskId: subtask.id })
    toast.success('Subtask completed')
  } catch {
    toast.error('Failed to complete subtask')
  }
}

async function handleCancelSubtask(subtask: ProjectTask) {
  try {
    await cancelMutation.mutateAsync({ projectId: projectId.value, taskId: subtask.id })
    toast.success('Subtask cancelled')
  } catch {
    toast.error('Failed to cancel subtask')
  }
}

// Dependency actions
async function handleAddDependency() {
  if (!task.value || !selectedDependencyId.value) return
  try {
    await addDependencyMutation.mutateAsync({
      projectId: projectId.value,
      taskId: task.value.id,
      dependencyId: selectedDependencyId.value,
    })
    showDependencyModal.value = false
    selectedDependencyId.value = null
    toast.success('Dependency added')
  } catch {
    toast.error('Failed to add dependency')
  }
}

async function handleRemoveDependency(depId: number) {
  if (!task.value) return
  try {
    await removeDependencyMutation.mutateAsync({
      projectId: projectId.value,
      taskId: task.value.id,
      dependencyId: depId,
    })
    toast.success('Dependency removed')
  } catch {
    toast.error('Failed to remove dependency')
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-muted-foreground">Loading task...</div>
    </div>

    <template v-else-if="task">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" @click="router.push(`/projects/${projectId}`)">
              <ArrowLeft class="w-4 h-4 mr-1" />
              Back
            </Button>
            <span class="text-sm font-mono text-muted-foreground">{{ task.task_number }}</span>
          </div>
          <div class="flex items-center gap-3 mb-1">
            <h1 class="text-2xl font-semibold text-foreground">{{ task.title }}</h1>
            <Badge :status="task.status" dot>{{ task.status.label }}</Badge>
            <Badge :variant="priorityVariants[task.priority] || 'default'">{{ task.priority }}</Badge>
            <Badge v-if="task.is_overdue" variant="destructive">
              <AlertTriangle class="w-3 h-3 mr-1" />
              Overdue
            </Badge>
          </div>
          <p v-if="task.parent" class="text-sm text-muted-foreground">
            Subtask of
            <RouterLink
              :to="`/projects/${projectId}/tasks/${task.parent.id}`"
              class="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {{ task.parent.task_number }} — {{ task.parent.title }}
            </RouterLink>
          </p>
          <p v-if="task.project" class="text-sm text-muted-foreground">
            Project:
            <RouterLink
              :to="`/projects/${projectId}`"
              class="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {{ task.project.project_number }} — {{ task.project.name }}
            </RouterLink>
          </p>
        </div>
        <div class="flex gap-2 shrink-0">
          <Button
            v-if="task.status.value === 'todo'"
            @click="handleStart"
            :loading="startMutation.isPending.value"
          >
            <Play class="w-4 h-4 mr-2" />
            Start
          </Button>
          <Button
            v-if="task.status.value === 'in_progress'"
            variant="success"
            @click="handleComplete"
            :loading="completeMutation.isPending.value"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            Complete
          </Button>
          <Button
            v-if="isEditable"
            variant="secondary"
            @click="showEditModal = true"
          >
            <Edit class="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            v-if="!isTerminal"
            variant="destructive"
            @click="showCancelModal = true"
          >
            <XCircle class="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            v-if="isEditable"
            variant="ghost"
            @click="handleDelete"
            :loading="deleteMutation.isPending.value"
          >
            <Trash2 class="w-4 h-4" />
          </Button>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content (left 2/3) -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Description & Notes -->
          <Card v-if="task.description || task.notes">
            <template #header>
              <h2 class="font-medium text-foreground">Details</h2>
            </template>
            <div class="space-y-4">
              <div v-if="task.description">
                <dt class="text-sm text-muted-foreground mb-1">Description</dt>
                <dd class="whitespace-pre-wrap text-foreground">{{ task.description }}</dd>
              </div>
              <div v-if="task.notes">
                <dt class="text-sm text-muted-foreground mb-1">Notes</dt>
                <dd class="whitespace-pre-wrap text-foreground">{{ task.notes }}</dd>
              </div>
            </div>
          </Card>

          <!-- Subtasks -->
          <Card v-if="!task.is_subtask">
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="font-medium text-foreground flex items-center gap-2">
                  <ListTree class="w-4 h-4" />
                  Subtasks
                  <span
                    v-if="task.subtasks_count"
                    class="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                  >
                    {{ task.subtasks_count }}
                  </span>
                </h2>
                <Button size="sm" @click="showSubtaskModal = true">
                  <Plus class="w-4 h-4 mr-1" />
                  Add Subtask
                </Button>
              </div>
            </template>
            <div v-if="!task.subtasks?.length" class="text-center py-6 text-muted-foreground text-sm">
              No subtasks yet.
            </div>
            <div v-else class="divide-y divide-slate-200 dark:divide-slate-700">
              <div
                v-for="subtask in task.subtasks"
                :key="subtask.id"
                class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <Badge :status="subtask.status" dot class="shrink-0">{{ subtask.status.label }}</Badge>
                  <RouterLink
                    :to="`/projects/${projectId}/tasks/${subtask.id}`"
                    class="text-sm font-medium text-foreground hover:text-primary-600 dark:hover:text-primary-400 truncate"
                  >
                    {{ subtask.title }}
                  </RouterLink>
                  <span v-if="subtask.assignee" class="text-xs text-muted-foreground shrink-0">
                    {{ subtask.assignee.name }}
                  </span>
                </div>
                <div class="flex gap-1 shrink-0">
                  <Button
                    v-if="subtask.status.value === 'todo'"
                    variant="ghost" size="sm" title="Start"
                    @click="handleStartSubtask(subtask)"
                  >
                    <Play class="w-3.5 h-3.5 text-blue-500" />
                  </Button>
                  <Button
                    v-if="subtask.status.value === 'in_progress'"
                    variant="ghost" size="sm" title="Complete"
                    @click="handleCompleteSubtask(subtask)"
                  >
                    <CheckCircle class="w-3.5 h-3.5 text-green-500" />
                  </Button>
                  <Button
                    v-if="String(subtask.status.is_terminal) === 'false'"
                    variant="ghost" size="sm" title="Cancel"
                    class="text-red-500 hover:text-red-600"
                    @click="handleCancelSubtask(subtask)"
                  >
                    <XCircle class="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <!-- Dependencies -->
          <Card>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="font-medium text-foreground flex items-center gap-2">
                  <Link class="w-4 h-4" />
                  Dependencies
                  <span
                    v-if="task.dependencies?.length"
                    class="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                  >
                    {{ task.dependencies.length }}
                  </span>
                </h2>
                <Button
                  v-if="!isTerminal"
                  size="sm"
                  @click="showDependencyModal = true"
                >
                  <Plus class="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </template>
            <div v-if="!task.dependencies?.length" class="text-center py-6 text-muted-foreground text-sm">
              No dependencies. This task can start independently.
            </div>
            <div v-else class="divide-y divide-slate-200 dark:divide-slate-700">
              <div
                v-for="dep in task.dependencies"
                :key="dep.id"
                class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <Badge :status="dep.status" dot class="shrink-0">{{ dep.status.label }}</Badge>
                  <RouterLink
                    :to="`/projects/${projectId}/tasks/${dep.id}`"
                    class="text-sm font-medium text-foreground hover:text-primary-600 dark:hover:text-primary-400 truncate"
                  >
                    {{ dep.task_number }} — {{ dep.title }}
                  </RouterLink>
                </div>
                <Button
                  v-if="!isTerminal"
                  variant="ghost"
                  size="sm"
                  title="Remove dependency"
                  class="text-red-500 hover:text-red-600 shrink-0"
                  :loading="removeDependencyMutation.isPending.value"
                  @click="handleRemoveDependency(dep.id)"
                >
                  <Unlink class="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <!-- Sidebar (right 1/3) -->
        <div class="space-y-6">
          <!-- Assignment -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Assignment</h2>
            </template>
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <User class="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p class="text-sm font-medium text-foreground">
                  {{ task.assignee?.name ?? 'Unassigned' }}
                </p>
                <p v-if="task.creator" class="text-xs text-muted-foreground">
                  Created by {{ task.creator.name }}
                </p>
              </div>
            </div>
          </Card>

          <!-- Schedule -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Schedule</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Start Date</dt>
                <dd class="text-sm text-foreground">{{ task.start_date ? formatDate(task.start_date) : '—' }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Due Date</dt>
                <dd
                  class="text-sm"
                  :class="task.is_overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-foreground'"
                >
                  {{ task.due_date ? formatDate(task.due_date) : '—' }}
                </dd>
              </div>
              <div v-if="task.completed_at" class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Completed</dt>
                <dd class="text-sm text-green-600 dark:text-green-400">{{ formatDate(task.completed_at) }}</dd>
              </div>
              <div v-if="task.is_overdue" class="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <AlertTriangle class="w-4 h-4 text-red-500" />
                <span class="text-sm font-medium text-red-600 dark:text-red-400">Overdue</span>
              </div>
            </dl>
          </Card>

          <!-- Time Tracking -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground flex items-center gap-2">
                <Clock class="w-4 h-4" />
                Time
              </h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Estimated</dt>
                <dd class="text-sm text-foreground">
                  {{ task.estimated_hours != null ? `${task.estimated_hours}h` : '—' }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Actual</dt>
                <dd class="text-sm text-foreground">
                  {{ task.actual_hours != null ? `${task.actual_hours}h` : '—' }}
                </dd>
              </div>
            </dl>
          </Card>

          <!-- Progress (for parent tasks with subtasks) -->
          <Card v-if="task.subtasks_count && task.progress != null">
            <template #header>
              <h2 class="font-medium text-foreground">Progress</h2>
            </template>
            <div>
              <div class="flex justify-between text-sm mb-1">
                <span class="text-muted-foreground">Subtask completion</span>
                <span class="font-medium text-foreground">{{ Math.round(task.progress) }}%</span>
              </div>
              <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary-500 rounded-full transition-all"
                  :style="{ width: `${task.progress}%` }"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- Edit Task Modal -->
      <ProjectTaskModal
        :open="showEditModal"
        :task="task"
        :is-loading="updateMutation.isPending.value"
        @update:open="showEditModal = $event"
        @submit="handleEditSubmit"
      />

      <!-- Add Subtask Modal -->
      <ProjectTaskModal
        :open="showSubtaskModal"
        :parent-task="task"
        :is-loading="addSubtaskMutation.isPending.value"
        @update:open="showSubtaskModal = $event"
        @submit="handleSubtaskSubmit"
      />

      <!-- Cancel Modal -->
      <Modal :open="showCancelModal" title="Cancel Task" @update:open="showCancelModal = $event">
        <p class="text-muted-foreground mb-4">
          Cancel this task? This action cannot be easily reversed.
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-foreground mb-1">Reason (optional)</label>
          <Textarea
            v-model="cancelReason"
            :rows="3"
            placeholder="Enter reason for cancellation..."
          />
        </div>
        <template #footer>
          <Button variant="ghost" @click="showCancelModal = false">Back</Button>
          <Button
            variant="destructive"
            :loading="cancelMutation.isPending.value"
            @click="handleCancelConfirm"
          >
            <XCircle class="w-4 h-4 mr-2" />
            Cancel Task
          </Button>
        </template>
      </Modal>

      <!-- Add Dependency Modal -->
      <Modal :open="showDependencyModal" title="Add Dependency" @update:open="showDependencyModal = $event">
        <p class="text-sm text-muted-foreground mb-4">
          Select a task that must be completed before this task can start.
        </p>
        <Select
          v-model="selectedDependencyId"
          :options="availableDependencyTasks"
          placeholder="Select a task..."
        />
        <template #footer>
          <Button variant="ghost" @click="showDependencyModal = false">Cancel</Button>
          <Button
            :disabled="!selectedDependencyId"
            :loading="addDependencyMutation.isPending.value"
            @click="handleAddDependency"
          >
            <Link class="w-4 h-4 mr-2" />
            Add Dependency
          </Button>
        </template>
      </Modal>
    </template>
  </div>
</template>
