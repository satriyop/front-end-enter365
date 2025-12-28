<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useWorkOrder,
  useConfirmWorkOrder,
  useStartWorkOrder,
  useCompleteWorkOrder,
  useCancelWorkOrder,
  useDeleteWorkOrder,
} from '@/api/useWorkOrders'
import { Button, Card, Badge, useToast } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const workOrderId = computed(() => route.params.id as string)
const { data: workOrder, isLoading } = useWorkOrder(workOrderId)

const confirmMutation = useConfirmWorkOrder()
const startMutation = useStartWorkOrder()
const completeMutation = useCompleteWorkOrder()
const cancelMutation = useCancelWorkOrder()
const deleteMutation = useDeleteWorkOrder()

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'destructive'> = {
  draft: 'default',
  confirmed: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'destructive',
}

const typeLabels: Record<string, string> = {
  production: 'Production',
  assembly: 'Assembly',
  installation: 'Installation',
  maintenance: 'Maintenance',
}

const priorityColors: Record<string, 'default' | 'info' | 'warning' | 'destructive'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'destructive',
}

async function handleConfirm() {
  if (!confirm('Confirm this work order? This will reserve materials.')) return
  try {
    await confirmMutation.mutateAsync(workOrderId.value)
    toast.success('Work order confirmed')
  } catch {
    toast.error('Failed to confirm work order')
  }
}

async function handleStart() {
  if (!confirm('Start this work order?')) return
  try {
    await startMutation.mutateAsync(workOrderId.value)
    toast.success('Work order started')
  } catch {
    toast.error('Failed to start work order')
  }
}

async function handleComplete() {
  if (!confirm('Mark this work order as completed?')) return
  try {
    await completeMutation.mutateAsync(workOrderId.value)
    toast.success('Work order completed')
  } catch {
    toast.error('Failed to complete work order')
  }
}

async function handleCancel() {
  const reason = prompt('Reason for cancellation (optional):')
  try {
    await cancelMutation.mutateAsync({ id: workOrderId.value, reason: reason || undefined })
    toast.success('Work order cancelled')
  } catch {
    toast.error('Failed to cancel work order')
  }
}

async function handleDelete() {
  if (!confirm('Delete this work order?')) return
  try {
    await deleteMutation.mutateAsync(workOrderId.value)
    toast.success('Work order deleted')
    router.push('/work-orders')
  } catch {
    toast.error('Failed to delete work order')
  }
}

function formatPercent(value: string | number | undefined): string {
  if (value === undefined || value === null) return '0%'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return `${num.toFixed(1)}%`
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-slate-500">Loading work order...</div>
    </div>

    <template v-else-if="workOrder">
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-slate-900">{{ workOrder.wo_number }}</h1>
            <Badge :variant="statusColors[workOrder.status] || 'default'">
              {{ workOrder.status }}
            </Badge>
            <Badge v-if="workOrder.type" variant="info">
              {{ typeLabels[workOrder.type] || workOrder.type }}
            </Badge>
            <Badge v-if="workOrder.priority" :variant="priorityColors[workOrder.priority] || 'default'">
              {{ workOrder.priority }}
            </Badge>
          </div>
          <p class="text-lg text-slate-700">{{ workOrder.name }}</p>
          <p v-if="workOrder.project" class="text-slate-500">
            Project:
            <RouterLink :to="`/projects/${workOrder.project.id}`" class="text-primary-600 hover:underline">
              {{ workOrder.project.project_number }}
            </RouterLink>
          </p>
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" @click="router.back()">Back</Button>
          <RouterLink v-if="workOrder.status === 'draft'" :to="`/work-orders/${workOrder.id}/edit`">
            <Button variant="secondary">Edit</Button>
          </RouterLink>
          <Button
            v-if="workOrder.status === 'draft'"
           
            @click="handleConfirm"
            :loading="confirmMutation.isPending.value"
          >
            Confirm
          </Button>
          <Button
            v-if="workOrder.status === 'confirmed'"
           
            @click="handleStart"
            :loading="startMutation.isPending.value"
          >
            Start
          </Button>
          <Button
            v-if="workOrder.status === 'in_progress'"
            variant="success"
            @click="handleComplete"
            :loading="completeMutation.isPending.value"
          >
            Complete
          </Button>
          <Button
            v-if="workOrder.status !== 'completed' && workOrder.status !== 'cancelled'"
            variant="destructive"
            @click="handleCancel"
            :loading="cancelMutation.isPending.value"
          >
            Cancel
          </Button>
          <Button
            v-if="workOrder.status === 'draft'"
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
              <h2 class="font-medium text-slate-900">Work Order Details</h2>
            </template>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500">WO Number</dt>
                <dd class="font-mono">{{ workOrder.wo_number }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Type</dt>
                <dd>{{ typeLabels[workOrder.type] || workOrder.type }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Product</dt>
                <dd class="font-medium">{{ workOrder.product?.name ?? '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Project</dt>
                <dd v-if="workOrder.project">
                  <RouterLink :to="`/projects/${workOrder.project.id}`" class="text-primary-600 hover:underline">
                    {{ workOrder.project.project_number }} - {{ workOrder.project.name }}
                  </RouterLink>
                </dd>
                <dd v-else>-</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Planned Start</dt>
                <dd>{{ workOrder.planned_start_date ? formatDate(workOrder.planned_start_date) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Planned End</dt>
                <dd>{{ workOrder.planned_end_date ? formatDate(workOrder.planned_end_date) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Actual Start</dt>
                <dd>{{ workOrder.actual_start_date ? formatDate(workOrder.actual_start_date) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Actual End</dt>
                <dd>{{ workOrder.actual_end_date ? formatDate(workOrder.actual_end_date) : '-' }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-slate-500">Description</dt>
                <dd class="whitespace-pre-wrap">{{ workOrder.description || '-' }}</dd>
              </div>
              <div class="col-span-2" v-if="workOrder.notes">
                <dt class="text-sm text-slate-500">Notes</dt>
                <dd class="whitespace-pre-wrap">{{ workOrder.notes }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Quantities -->
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Production Progress</h2>
            </template>
            <div class="space-y-4">
              <div class="grid grid-cols-3 gap-4 text-center">
                <div class="p-4 bg-slate-50 rounded-lg">
                  <div class="text-2xl font-bold text-slate-900">{{ workOrder.quantity_ordered }}</div>
                  <div class="text-sm text-slate-500">Ordered</div>
                </div>
                <div class="p-4 bg-green-50 rounded-lg">
                  <div class="text-2xl font-bold text-green-600">{{ workOrder.quantity_completed }}</div>
                  <div class="text-sm text-slate-500">Completed</div>
                </div>
                <div class="p-4 bg-red-50 rounded-lg">
                  <div class="text-2xl font-bold text-red-600">{{ workOrder.quantity_scrapped }}</div>
                  <div class="text-sm text-slate-500">Scrapped</div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-slate-500">Completion</span>
                  <span class="font-medium">{{ formatPercent(workOrder.completion_percentage) }}</span>
                </div>
                <div class="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary-500 rounded-full transition-all"
                    :style="{ width: formatPercent(workOrder.completion_percentage) }"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div class="space-y-6">
          <!-- Cost Summary -->
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Estimated Costs</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500">Material</dt>
                <dd>{{ formatCurrency(Number(workOrder.estimated_material_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Labor</dt>
                <dd>{{ formatCurrency(Number(workOrder.estimated_labor_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Overhead</dt>
                <dd>{{ formatCurrency(Number(workOrder.estimated_overhead_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between border-t pt-3 font-medium">
                <dt>Total Estimated</dt>
                <dd>{{ formatCurrency(Number(workOrder.estimated_total_cost) || 0) }}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Actual Costs</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500">Material</dt>
                <dd>{{ formatCurrency(Number(workOrder.actual_material_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Labor</dt>
                <dd>{{ formatCurrency(Number(workOrder.actual_labor_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Overhead</dt>
                <dd>{{ formatCurrency(Number(workOrder.actual_overhead_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between border-t pt-3 font-medium">
                <dt>Total Actual</dt>
                <dd>{{ formatCurrency(Number(workOrder.actual_total_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between text-sm" :class="Number(workOrder.cost_variance) >= 0 ? 'text-red-600' : 'text-green-600'">
                <dt>Variance</dt>
                <dd>{{ formatCurrency(Number(workOrder.cost_variance) || 0) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Timestamps -->
          <Card v-if="workOrder.confirmed_at || workOrder.started_at || workOrder.completed_at">
            <template #header>
              <h2 class="font-medium text-slate-900">Timeline</h2>
            </template>
            <dl class="space-y-2 text-sm">
              <div v-if="workOrder.confirmed_at" class="flex justify-between">
                <dt class="text-slate-500">Confirmed</dt>
                <dd>{{ formatDate(workOrder.confirmed_at) }}</dd>
              </div>
              <div v-if="workOrder.started_at" class="flex justify-between">
                <dt class="text-slate-500">Started</dt>
                <dd>{{ formatDate(workOrder.started_at) }}</dd>
              </div>
              <div v-if="workOrder.completed_at" class="flex justify-between">
                <dt class="text-slate-500">Completed</dt>
                <dd>{{ formatDate(workOrder.completed_at) }}</dd>
              </div>
              <div v-if="workOrder.cancelled_at" class="flex justify-between text-red-600">
                <dt>Cancelled</dt>
                <dd>{{ formatDate(workOrder.cancelled_at) }}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
