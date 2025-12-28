<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProject, useStartProject, useCompleteProject, useCancelProject, useDeleteProject } from '@/api/useProjects'
import { Button, Card, Badge, useToast } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const projectId = computed(() => route.params.id as string)
const { data: project, isLoading } = useProject(projectId)

const startMutation = useStartProject()
const completeMutation = useCompleteProject()
const cancelMutation = useCancelProject()
const deleteMutation = useDeleteProject()

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'destructive'> = {
  draft: 'default',
  planning: 'info',
  in_progress: 'warning',
  on_hold: 'destructive',
  completed: 'success',
  cancelled: 'destructive',
}

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
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-slate-500">Loading project...</div>
    </div>

    <template v-else-if="project">
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-slate-900">{{ project.project_number }}</h1>
            <Badge :variant="statusColors[project.status] || 'default'">
              {{ project.status }}
            </Badge>
            <Badge v-if="project.priority" :variant="priorityColors[project.priority] || 'default'">
              {{ project.priority }}
            </Badge>
          </div>
          <p class="text-lg text-slate-700">{{ project.name }}</p>
          <p class="text-slate-500">{{ project.contact?.name }}</p>
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" @click="router.back()">Back</Button>
          <RouterLink v-if="project.status === 'draft'" :to="`/projects/${project.id}/edit`">
            <Button variant="secondary">Edit</Button>
          </RouterLink>
          <Button
            v-if="project.status === 'draft' || project.status === 'planning'"
           
            @click="handleStart"
            :loading="startMutation.isPending.value"
          >
            Start Project
          </Button>
          <Button
            v-if="project.status === 'in_progress'"
            variant="success"
            @click="handleComplete"
            :loading="completeMutation.isPending.value"
          >
            Complete
          </Button>
          <Button
            v-if="project.status !== 'completed' && project.status !== 'cancelled'"
            variant="destructive"
            @click="handleCancel"
            :loading="cancelMutation.isPending.value"
          >
            Cancel
          </Button>
          <Button
            v-if="project.status === 'draft'"
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
              <h2 class="font-medium text-slate-900">Project Details</h2>
            </template>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500">Project Number</dt>
                <dd class="font-mono">{{ project.project_number }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Customer</dt>
                <dd class="font-medium">{{ project.contact?.name ?? '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Location</dt>
                <dd>{{ project.location || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Quotation</dt>
                <dd v-if="project.quotation">
                  <RouterLink :to="`/quotations/${project.quotation.id}`" class="text-primary-600 hover:underline">
                    {{ project.quotation.quotation_number }}
                  </RouterLink>
                </dd>
                <dd v-else>-</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Planned Start</dt>
                <dd>{{ formatDate(project.start_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Planned End</dt>
                <dd>{{ formatDate(project.end_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Actual Start</dt>
                <dd>{{ project.actual_start_date ? formatDate(project.actual_start_date) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Actual End</dt>
                <dd>{{ project.actual_end_date ? formatDate(project.actual_end_date) : '-' }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-slate-500">Description</dt>
                <dd class="whitespace-pre-wrap">{{ project.description || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Progress Section -->
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Progress</h2>
            </template>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-slate-500">Completion</span>
                  <span class="font-medium">{{ project.progress_percentage ?? 0 }}%</span>
                </div>
                <div class="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary-500 rounded-full transition-all"
                    :style="{ width: `${project.progress_percentage ?? 0}%` }"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div class="space-y-6">
          <!-- Financial Summary -->
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Financials</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500">Contract Amount</dt>
                <dd class="font-medium">{{ formatCurrency(Number(project.contract_amount) || 0) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Budget</dt>
                <dd>{{ formatCurrency(Number(project.budget_amount) || 0) }}</dd>
              </div>
              <div class="flex justify-between border-t pt-3">
                <dt class="text-slate-500">Total Cost</dt>
                <dd class="text-orange-600">{{ formatCurrency(Number(project.total_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Total Revenue</dt>
                <dd class="text-green-600">{{ formatCurrency(Number(project.total_revenue) || 0) }}</dd>
              </div>
              <div class="flex justify-between border-t pt-3 text-lg font-medium">
                <dt>Gross Profit</dt>
                <dd :class="Number(project.gross_profit) >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ formatCurrency(Number(project.gross_profit) || 0) }}
                </dd>
              </div>
              <div class="flex justify-between text-sm">
                <dt class="text-slate-500">Margin</dt>
                <dd>{{ project.profit_margin?.toFixed(1) ?? 0 }}%</dd>
              </div>
            </dl>
          </Card>

          <!-- Quick Actions -->
          <Card v-if="project.status === 'in_progress'">
            <div class="space-y-2">
              <RouterLink :to="`/work-orders/new?project_id=${project.id}`">
                <Button variant="secondary" class="w-full">Create Work Order</Button>
              </RouterLink>
              <RouterLink :to="`/invoices/new?project_id=${project.id}`">
                <Button variant="secondary" class="w-full">Create Invoice</Button>
              </RouterLink>
            </div>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
