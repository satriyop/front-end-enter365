<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useProject,
  useStartProject,
  useCompleteProject,
  useCancelProject,
  useDeleteProject,
  useHoldProject,
  useResumeProject,
  useUpdateProjectProgress,
} from '@/api/useProjects'
import { Button, Card, Badge, Modal, Input, Textarea, useToast } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'
import { Pause, Play, Check, AlertTriangle, Clock } from 'lucide-vue-next'
import ProjectCostsList from '@/components/projects/ProjectCostsList.vue'
import ProjectRevenuesList from '@/components/projects/ProjectRevenuesList.vue'
import ProjectTasksList from '@/components/projects/ProjectTasksList.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const projectId = computed(() => route.params.id as string)
const { data: project, isLoading } = useProject(projectId)

const startMutation = useStartProject()
const completeMutation = useCompleteProject()
const cancelMutation = useCancelProject()
const deleteMutation = useDeleteProject()
const holdMutation = useHoldProject()
const resumeMutation = useResumeProject()
const progressMutation = useUpdateProjectProgress()

// Hold modal state
const showHoldModal = ref(false)
const holdReason = ref('')

// Progress editing state
const isEditingProgress = ref(false)
const progressInput = ref(0)

function startEditingProgress() {
  progressInput.value = project.value?.progress_percentage ?? 0
  isEditingProgress.value = true
}

async function saveProgress() {
  try {
    await progressMutation.mutateAsync({ id: projectId.value, progress: progressInput.value })
    isEditingProgress.value = false
    toast.success('Progress updated')
  } catch {
    toast.error('Failed to update progress')
  }
}

// Tab state
const activeFinancialsTab = ref<'costs' | 'revenues' | 'tasks'>('costs')

// Status colors mapping for Badge component if needed
// const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'destructive'> = {
//   draft: 'default', planning: 'info', in_progress: 'warning',
//   on_hold: 'destructive', completed: 'success', cancelled: 'destructive',
// }

const priorityColors: Record<string, 'default' | 'info' | 'warning' | 'destructive'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'destructive',
}

async function handleStart() {
  if (!confirm('Start this project?')) return
  try {
    await startMutation.mutateAsync(projectId.value)
    toast.success('Project started')
  } catch {
    toast.error('Failed to start project')
  }
}

async function handleComplete() {
  if (!confirm('Mark this project as completed?')) return
  try {
    await completeMutation.mutateAsync(projectId.value)
    toast.success('Project completed')
  } catch {
    toast.error('Failed to complete project')
  }
}

async function handleCancel() {
  const reason = prompt('Reason for cancellation (optional):')
  try {
    await cancelMutation.mutateAsync({ id: projectId.value, reason: reason || undefined })
    toast.success('Project cancelled')
  } catch {
    toast.error('Failed to cancel project')
  }
}

async function handleDelete() {
  if (!confirm('Delete this project? This action cannot be undone.')) return
  try {
    await deleteMutation.mutateAsync(projectId.value)
    toast.success('Project deleted')
    router.push('/projects')
  } catch {
    toast.error('Failed to delete project')
  }
}

async function handleHold() {
  try {
    await holdMutation.mutateAsync({ id: projectId.value, reason: holdReason.value || undefined })
    showHoldModal.value = false
    holdReason.value = ''
    toast.success('Project put on hold')
  } catch {
    toast.error('Failed to put project on hold')
  }
}

async function handleResume() {
  if (!confirm('Resume this project?')) return
  try {
    await resumeMutation.mutateAsync(projectId.value)
    toast.success('Project resumed')
  } catch {
    toast.error('Failed to resume project')
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading project...</div>
    </div>

    <template v-else-if="project">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ project.project_number }}</h1>
            <Badge :status="project.status">
              {{ project.status.label }}
            </Badge>
            <Badge v-if="project.priority" :variant="priorityColors[project.priority] || 'default'">
              {{ project.priority }}
            </Badge>
          </div>
          <p class="text-lg text-slate-700 dark:text-slate-300">{{ project.name }}</p>
          <p class="text-slate-500 dark:text-slate-400">{{ project.contact?.name }}</p>
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" @click="router.back()">Back</Button>
          <RouterLink v-if="project.status.value === 'draft'" :to="`/projects/${project.id}/edit`">
            <Button variant="secondary">Edit</Button>
          </RouterLink>
          <Button
            v-if="project.status.value === 'draft' || project.status.value === 'planning'"
           
            @click="handleStart"
            :loading="startMutation.isPending.value"
          >
            Start Project
          </Button>
          <Button
            v-if="project.status.value === 'in_progress'"
            variant="success"
            @click="handleComplete"
            :loading="completeMutation.isPending.value"
          >
            Complete
          </Button>
          <!-- Hold button (in_progress only) -->
          <Button
            v-if="project.status.value === 'in_progress'"
            variant="warning"
            @click="showHoldModal = true"
          >
            <Pause class="w-4 h-4 mr-2" />
            Hold
          </Button>
          <!-- Resume button (on_hold only) -->
          <Button
            v-if="project.status.value === 'on_hold'"
            @click="handleResume"
            :loading="resumeMutation.isPending.value"
          >
            <Play class="w-4 h-4 mr-2" />
            Resume
          </Button>
          <Button
            v-if="project.status.value !== 'completed' && project.status.value !== 'cancelled'"
            variant="destructive"
            @click="handleCancel"
            :loading="cancelMutation.isPending.value"
          >
            Cancel
          </Button>
          <Button
            v-if="project.status.value === 'draft'"
            variant="ghost"
            @click="handleDelete"
            :loading="deleteMutation.isPending.value"
          >
            Delete
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900 dark:text-slate-100">Project Details</h2>
            </template>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Project Number</dt>
                <dd class="font-mono text-slate-900 dark:text-slate-100">{{ project.project_number }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Customer</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ project.contact?.name ?? '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Location</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ project.location || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Quotation</dt>
                <dd v-if="project.quotation">
                  <RouterLink :to="`/quotations/${project.quotation.id}`" class="text-primary-600 dark:text-primary-400 hover:underline">
                    {{ project.quotation.quotation_number }}
                  </RouterLink>
                </dd>
                <dd v-else class="text-slate-900 dark:text-slate-100">-</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Planned Start</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatDate(project.start_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Planned End</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatDate(project.end_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Actual Start</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ project.actual_start_date ? formatDate(project.actual_start_date) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Actual End</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ project.actual_end_date ? formatDate(project.actual_end_date) : '-' }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Description</dt>
                <dd class="whitespace-pre-wrap text-slate-900 dark:text-slate-100">{{ project.description || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Progress Section -->
          <Card>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="font-medium text-foreground">Progress</h2>
                <Button
                  v-if="!isEditingProgress && (project.status.value === 'in_progress' || project.status.value === 'on_hold')"
                  variant="ghost"
                  size="sm"
                  @click="startEditingProgress"
                >
                  Update
                </Button>
              </div>
            </template>
            <div class="space-y-4">
              <!-- Editing mode -->
              <div v-if="isEditingProgress" class="flex items-center gap-3">
                <Input
                  v-model.number="progressInput"
                  type="number"
                  :min="0"
                  :max="100"
                  class="w-24"
                  size="sm"
                  @keydown.enter="saveProgress"
                  @keydown.escape="isEditingProgress = false"
                />
                <span class="text-sm text-muted-foreground">%</span>
                <Button
                  size="sm"
                  :loading="progressMutation.isPending.value"
                  @click="saveProgress"
                >
                  <Check class="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button variant="ghost" size="sm" @click="isEditingProgress = false">
                  Cancel
                </Button>
              </div>
              <!-- Display mode -->
              <div v-else>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-muted-foreground">Completion</span>
                  <span class="font-medium text-foreground">{{ project.progress_percentage ?? 0 }}%</span>
                </div>
                <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary-500 rounded-full transition-all"
                    :style="{ width: `${project.progress_percentage ?? 0}%` }"
                  />
                </div>
              </div>
            </div>
          </Card>

          <!-- Costs & Revenues Section -->
          <Card :padding="false">
            <!-- Tabs Header -->
            <div class="flex gap-1 p-1 m-4 mb-0 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                @click="activeFinancialsTab = 'costs'"
                class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                :class="activeFinancialsTab === 'costs'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'"
              >
                Costs
                <span
                  v-if="project.costs_count"
                  class="px-1.5 py-0.5 text-xs rounded-full"
                  :class="activeFinancialsTab === 'costs' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-slate-200 dark:bg-slate-700'"
                >
                  {{ project.costs_count }}
                </span>
              </button>
              <button
                type="button"
                @click="activeFinancialsTab = 'revenues'"
                class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                :class="activeFinancialsTab === 'revenues'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'"
              >
                Revenues
                <span
                  v-if="project.revenues_count"
                  class="px-1.5 py-0.5 text-xs rounded-full"
                  :class="activeFinancialsTab === 'revenues' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-200 dark:bg-slate-700'"
                >
                  {{ project.revenues_count }}
                </span>
              </button>
              <button
                type="button"
                @click="activeFinancialsTab = 'tasks'"
                class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2"
                :class="activeFinancialsTab === 'tasks'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'"
              >
                Tasks
                <span
                  v-if="project.tasks_count"
                  class="px-1.5 py-0.5 text-xs rounded-full"
                  :class="activeFinancialsTab === 'tasks' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-200 dark:bg-slate-700'"
                >
                  {{ project.tasks_count }}
                </span>
              </button>
            </div>

            <!-- Tab Content -->
            <div class="p-4">
              <ProjectCostsList
                v-if="activeFinancialsTab === 'costs'"
                :project-id="project.id"
                :costs="project.costs || []"
              />
              <ProjectRevenuesList
                v-if="activeFinancialsTab === 'revenues'"
                :project-id="project.id"
                :revenues="project.revenues || []"
              />
              <ProjectTasksList
                v-if="activeFinancialsTab === 'tasks'"
                :project-id="project.id"
              />
            </div>
          </Card>
        </div>

        <div class="space-y-6">
          <!-- Financial Summary -->
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900 dark:text-slate-100">Financials</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Contract Amount</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(Number(project.contract_amount) || 0) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Budget</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatCurrency(Number(project.budget_amount) || 0) }}</dd>
              </div>
              <div class="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
                <dt class="text-slate-500 dark:text-slate-400">Total Cost</dt>
                <dd class="text-orange-600 dark:text-orange-400">{{ formatCurrency(Number(project.total_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Total Revenue</dt>
                <dd class="text-green-600 dark:text-green-400">{{ formatCurrency(Number(project.total_revenue) || 0) }}</dd>
              </div>
              <div class="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-3 text-lg font-medium">
                <dt class="text-slate-900 dark:text-slate-100">Gross Profit</dt>
                <dd :class="Number(project.gross_profit) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                  {{ formatCurrency(Number(project.gross_profit) || 0) }}
                </dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-slate-500 dark:text-slate-400">Margin</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ project.profit_margin?.toFixed(1) ?? 0 }}%</dd>
              </div>

              <!-- Budget Health -->
              <div class="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
                <div class="flex justify-between text-sm">
                  <dt class="text-slate-500 dark:text-slate-400">Budget Utilization</dt>
                  <dd
                    :class="{
                      'text-green-600 dark:text-green-400': (project.budget_utilization ?? 0) < 80,
                      'text-amber-600 dark:text-amber-400': (project.budget_utilization ?? 0) >= 80 && (project.budget_utilization ?? 0) <= 100,
                      'text-red-600 dark:text-red-400': (project.budget_utilization ?? 0) > 100
                    }"
                    class="font-medium"
                  >
                    {{ project.budget_utilization?.toFixed(1) ?? 0 }}%
                  </dd>
                </div>
                <div class="flex justify-between text-sm">
                  <dt class="text-slate-500 dark:text-slate-400">Budget Variance</dt>
                  <dd
                    :class="{
                      'text-green-600 dark:text-green-400': Number(project.budget_variance || 0) > 0,
                      'text-red-600 dark:text-red-400': Number(project.budget_variance || 0) < 0
                    }"
                    class="font-medium"
                  >
                    {{ Number(project.budget_variance || 0) >= 0 ? '+' : '' }}{{ formatCurrency(Number(project.budget_variance) || 0) }}
                  </dd>
                </div>
                <div v-if="project.is_over_budget" class="flex items-center gap-2 text-xs">
                  <Badge variant="destructive" class="flex items-center gap-1">
                    <AlertTriangle class="w-3 h-3" />
                    Over Budget
                  </Badge>
                </div>
              </div>
            </dl>
          </Card>

          <!-- Schedule Status -->
          <Card v-if="project.status.value === 'in_progress' || project.status.value === 'on_hold'">
            <template #header>
              <h2 class="font-medium text-slate-900 dark:text-slate-100">Schedule Status</h2>
            </template>
            <div class="space-y-3">
              <div v-if="project.is_overdue" class="flex items-center gap-2">
                <AlertTriangle class="w-5 h-5 text-red-600 dark:text-red-400" />
                <span class="font-medium text-red-600 dark:text-red-400">Overdue</span>
              </div>
              <div v-else-if="project.days_until_deadline !== null" class="flex items-center gap-2">
                <Clock class="w-5 h-5 text-muted-foreground" />
                <span class="text-foreground">
                  Due in <span class="font-medium">{{ project.days_until_deadline }}</span> day{{ project.days_until_deadline !== 1 ? 's' : '' }}
                </span>
              </div>
              <div v-if="project.duration_days !== null" class="text-sm text-muted-foreground">
                Duration: {{ project.duration_days }} day{{ project.duration_days !== 1 ? 's' : '' }}
              </div>
            </div>
          </Card>

          <!-- Quick Actions -->
          <Card v-if="project.status.value === 'in_progress' || project.status.value === 'on_hold'">
            <div class="space-y-2">
              <RouterLink v-if="project.status.value === 'in_progress'" :to="`/work-orders/new?project_id=${project.id}`">
                <Button variant="secondary" class="w-full">Create Work Order</Button>
              </RouterLink>
              <RouterLink v-if="project.status.value === 'in_progress'" :to="`/invoices/new?project_id=${project.id}`">
                <Button variant="secondary" class="w-full">Create Invoice</Button>
              </RouterLink>
            </div>
          </Card>
        </div>
      </div>

      <!-- Hold Modal -->
      <Modal :open="showHoldModal" title="Put Project On Hold" @update:open="showHoldModal = $event">
        <p class="text-slate-600 dark:text-slate-400 mb-4">
          Put this project on hold? This will pause all work on the project.
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason (optional)</label>
          <Textarea
            v-model="holdReason"
            :rows="3"
            placeholder="Enter reason for putting on hold..."
          />
        </div>
        <template #footer>
          <Button variant="ghost" @click="showHoldModal = false">Cancel</Button>
          <Button
            variant="warning"
            :loading="holdMutation.isPending.value"
            @click="handleHold"
          >
            <Pause class="w-4 h-4 mr-2" />
            Put On Hold
          </Button>
        </template>
      </Modal>
    </template>
  </div>
</template>
