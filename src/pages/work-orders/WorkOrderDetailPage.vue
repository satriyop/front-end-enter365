<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useWorkOrder,
  useConfirmWorkOrder,
  useStartWorkOrder,
  useCompleteWorkOrder,
  useCancelWorkOrder,
  useDeleteWorkOrder,
  useRecordOutput,
  useRecordConsumption,
  useCreateMaterialRequisition,
  type ConsumptionItem,
} from '@/api/useWorkOrders'
import { Button, Card, Badge, Modal, Input, CurrencyInput, FormField, useToast } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'
import { X, Package, ClipboardList, BarChart3, GitBranch } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const workOrderId = computed(() => route.params.id as string)
const { data: workOrder, isLoading } = useWorkOrder(workOrderId)

// Workflow mutations
const confirmMutation = useConfirmWorkOrder()
const startMutation = useStartWorkOrder()
const completeMutation = useCompleteWorkOrder()
const cancelMutation = useCancelWorkOrder()
const deleteMutation = useDeleteWorkOrder()

// Manufacturing execution mutations
const recordOutputMutation = useRecordOutput()
const recordConsumptionMutation = useRecordConsumption()
const materialRequisitionMutation = useCreateMaterialRequisition()

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

// ============================================
// Workflow handlers
// ============================================

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

// ============================================
// Record Output Modal
// ============================================

const showOutputModal = ref(false)
const outputQuantity = ref(0)
const outputScrapped = ref(0)
const outputErrors = ref<Record<string, string>>({})

function openOutputModal() {
  outputQuantity.value = 0
  outputScrapped.value = 0
  outputErrors.value = {}
  showOutputModal.value = true
}

async function handleRecordOutput() {
  outputErrors.value = {}
  if (outputQuantity.value <= 0 && outputScrapped.value <= 0) {
    outputErrors.value.quantity = 'Enter a quantity or scrapped amount'
    return
  }

  try {
    await recordOutputMutation.mutateAsync({
      id: workOrderId.value,
      data: {
        quantity: outputQuantity.value,
        scrapped: outputScrapped.value || undefined,
      },
    })
    toast.success('Output recorded successfully')
    showOutputModal.value = false
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string } } })?.response?.data
    toast.error(response?.message || 'Failed to record output')
  }
}

// ============================================
// Record Consumption Modal
// ============================================

const showConsumptionModal = ref(false)

interface ConsumptionRow {
  product_id: number | null
  product_name: string
  work_order_item_id: number | null
  quantity_consumed: number
  unit_cost: number
  batch_number: string
  notes: string
}

const consumptionRows = reactive<ConsumptionRow[]>([])
const consumptionErrors = ref<Record<string, string>>({})

function openConsumptionModal() {
  consumptionErrors.value = {}
  consumptionRows.length = 0

  // Pre-populate from WO material items
  const items = workOrder.value?.items
  if (items && Array.isArray(items)) {
    for (const item of items) {
      if (item.type === 'material' && item.product_id) {
        const remaining = Number(item.quantity_remaining ?? 0)
        if (remaining > 0) {
          consumptionRows.push({
            product_id: item.product_id,
            product_name: item.product?.name || item.description || `Product #${item.product_id}`,
            work_order_item_id: item.id,
            quantity_consumed: 0,
            unit_cost: Number(item.unit_cost) || 0,
            batch_number: '',
            notes: '',
          })
        }
      }
    }
  }

  // Add at least one empty row if no items
  if (consumptionRows.length === 0) {
    consumptionRows.push({
      product_id: null,
      product_name: '',
      work_order_item_id: null,
      quantity_consumed: 0,
      unit_cost: 0,
      batch_number: '',
      notes: '',
    })
  }

  showConsumptionModal.value = true
}

function removeConsumptionRow(index: number) {
  if (consumptionRows.length > 1) {
    consumptionRows.splice(index, 1)
  }
}

async function handleRecordConsumption() {
  consumptionErrors.value = {}

  const validRows = consumptionRows.filter(r => r.product_id && r.quantity_consumed > 0)
  if (validRows.length === 0) {
    consumptionErrors.value.items = 'Enter at least one item with quantity'
    return
  }

  const consumptions: ConsumptionItem[] = validRows.map(r => ({
    product_id: r.product_id!,
    work_order_item_id: r.work_order_item_id,
    quantity_consumed: r.quantity_consumed,
    unit_cost: r.unit_cost || undefined,
    batch_number: r.batch_number || undefined,
    notes: r.notes || undefined,
  }))

  try {
    await recordConsumptionMutation.mutateAsync({
      id: workOrderId.value,
      consumptions,
    })
    toast.success('Consumption recorded successfully')
    showConsumptionModal.value = false
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string } } })?.response?.data
    toast.error(response?.message || 'Failed to record consumption')
  }
}

// ============================================
// Material Requisition
// ============================================

async function handleCreateRequisition() {
  if (!confirm('Create a material requisition from this work order? Items will be auto-populated from the BOM.')) return

  try {
    const result = await materialRequisitionMutation.mutateAsync({
      workOrderId: workOrderId.value,
    })
    toast.success(`Material requisition ${result.requisition_number} created`)
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string } } })?.response?.data
    toast.error(response?.message || 'Failed to create material requisition')
  }
}

// ============================================
// Helpers
// ============================================

const isInProgress = computed(() => workOrder.value?.status.value === 'in_progress')
const isConfirmedOrInProgress = computed(() =>
  workOrder.value?.status.value === 'confirmed' || workOrder.value?.status.value === 'in_progress'
)

function formatPercent(value: string | number | undefined): string {
  if (value === undefined || value === null) return '0%'
  const num = typeof value === 'string' ? parseFloat(value) : value
  return `${num.toFixed(1)}%`
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-muted-foreground">Loading work order...</div>
    </div>

    <template v-else-if="workOrder">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-foreground">{{ workOrder.wo_number }}</h1>
            <Badge :variant="statusColors[workOrder.status.value] || 'default'">
              {{ workOrder.status.label }}
            </Badge>
            <Badge v-if="workOrder.type" variant="info">
              {{ typeLabels[workOrder.type.value] || workOrder.type.label }}
            </Badge>
            <Badge v-if="workOrder.priority" :variant="priorityColors[workOrder.priority.value] || 'default'">
              {{ workOrder.priority.label }}
            </Badge>
          </div>
          <p class="text-lg text-foreground/80">{{ workOrder.name }}</p>
          <p v-if="workOrder.project" class="text-muted-foreground">
            Project:
            <RouterLink :to="`/projects/${workOrder.project.id}`" class="text-primary hover:underline">
              {{ workOrder.project.project_number }}
            </RouterLink>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="ghost" @click="router.back()">Back</Button>
          <RouterLink v-if="workOrder.status.value === 'draft'" :to="`/work-orders/${workOrder.id}/edit`">
            <Button variant="secondary">Edit</Button>
          </RouterLink>
          <Button
            v-if="workOrder.status.value === 'draft'"
            @click="handleConfirm"
            :loading="confirmMutation.isPending.value"
          >
            Confirm
          </Button>
          <Button
            v-if="workOrder.status.value === 'confirmed'"
            @click="handleStart"
            :loading="startMutation.isPending.value"
          >
            Start
          </Button>
          <Button
            v-if="workOrder.status.value === 'in_progress'"
            variant="success"
            @click="handleComplete"
            :loading="completeMutation.isPending.value"
          >
            Complete
          </Button>
          <Button
            v-if="workOrder.status.value !== 'completed' && workOrder.status.value !== 'cancelled'"
            variant="destructive"
            @click="handleCancel"
            :loading="cancelMutation.isPending.value"
          >
            Cancel
          </Button>
          <Button
            v-if="workOrder.status.value === 'draft'"
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
          <!-- Work Order Details -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Work Order Details</h2>
            </template>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-muted-foreground">WO Number</dt>
                <dd class="font-mono text-foreground">{{ workOrder.wo_number }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Type</dt>
                <dd class="text-foreground">{{ typeLabels[workOrder.type.value] || workOrder.type.label }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Product</dt>
                <dd class="font-medium text-foreground">{{ workOrder.product?.name ?? '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Project</dt>
                <dd v-if="workOrder.project">
                  <RouterLink :to="`/projects/${workOrder.project.id}`" class="text-primary hover:underline">
                    {{ workOrder.project.project_number }} - {{ workOrder.project.name }}
                  </RouterLink>
                </dd>
                <dd v-else class="text-foreground">-</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Planned Start</dt>
                <dd class="text-foreground">{{ workOrder.planned_start_date ? formatDate(workOrder.planned_start_date) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Planned End</dt>
                <dd class="text-foreground">{{ workOrder.planned_end_date ? formatDate(workOrder.planned_end_date) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Actual Start</dt>
                <dd class="text-foreground">{{ workOrder.actual_start_date ? formatDate(workOrder.actual_start_date) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Actual End</dt>
                <dd class="text-foreground">{{ workOrder.actual_end_date ? formatDate(workOrder.actual_end_date) : '-' }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-muted-foreground">Description</dt>
                <dd class="whitespace-pre-wrap text-foreground">{{ workOrder.description || '-' }}</dd>
              </div>
              <div class="col-span-2" v-if="workOrder.notes">
                <dt class="text-sm text-muted-foreground">Notes</dt>
                <dd class="whitespace-pre-wrap text-foreground">{{ workOrder.notes }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Production Progress -->
          <Card>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="font-medium text-foreground">Production Progress</h2>
                <Button
                  v-if="isInProgress"
                  size="sm"
                  @click="openOutputModal"
                >
                  <Package class="w-4 h-4 mr-1" />
                  Record Output
                </Button>
              </div>
            </template>
            <div class="space-y-4">
              <div class="grid grid-cols-3 gap-4 text-center">
                <div class="p-4 bg-muted rounded-lg">
                  <div class="text-2xl font-bold text-foreground">{{ workOrder.quantity_ordered }}</div>
                  <div class="text-sm text-muted-foreground">Ordered</div>
                </div>
                <div class="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                  <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ workOrder.quantity_completed }}</div>
                  <div class="text-sm text-muted-foreground">Completed</div>
                </div>
                <div class="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                  <div class="text-2xl font-bold text-destructive">{{ workOrder.quantity_scrapped }}</div>
                  <div class="text-sm text-muted-foreground">Scrapped</div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-muted-foreground">Completion</span>
                  <span class="font-medium text-foreground">{{ formatPercent(workOrder.completion_percentage) }}</span>
                </div>
                <div class="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary rounded-full transition-all"
                    :style="{ width: formatPercent(workOrder.completion_percentage) }"
                  />
                </div>
              </div>
            </div>
          </Card>

          <!-- Manufacturing Actions -->
          <Card v-if="isConfirmedOrInProgress">
            <template #header>
              <h2 class="font-medium text-foreground">Manufacturing Actions</h2>
            </template>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                v-if="isInProgress"
                class="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                @click="openConsumptionModal"
              >
                <div class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <ClipboardList class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <div class="font-medium text-foreground">Record Consumption</div>
                  <div class="text-sm text-muted-foreground">Log material usage</div>
                </div>
              </button>

              <button
                class="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
                @click="handleCreateRequisition"
                :disabled="materialRequisitionMutation.isPending.value"
              >
                <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Package class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div class="font-medium text-foreground">Request Materials</div>
                  <div class="text-sm text-muted-foreground">Create material requisition</div>
                </div>
              </button>
            </div>
          </Card>
        </div>

        <div class="space-y-6">
          <!-- Quick Links -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Related</h2>
            </template>
            <div class="space-y-2">
              <RouterLink
                :to="`/work-orders/${workOrder.id}/cost-summary`"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <BarChart3 class="w-5 h-5 text-muted-foreground" />
                <div>
                  <div class="font-medium text-foreground text-sm">Cost Summary</div>
                  <div class="text-xs text-muted-foreground">Detailed cost breakdown</div>
                </div>
              </RouterLink>
              <RouterLink
                :to="`/work-orders/${workOrder.id}/sub-work-orders`"
                class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <GitBranch class="w-5 h-5 text-muted-foreground" />
                <div>
                  <div class="font-medium text-foreground text-sm">Sub Work Orders</div>
                  <div class="text-xs text-muted-foreground">Manage sub-tasks</div>
                </div>
              </RouterLink>
            </div>
          </Card>

          <!-- Estimated Costs -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Estimated Costs</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Material</dt>
                <dd class="text-foreground">{{ formatCurrency(Number(workOrder.estimated_material_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Labor</dt>
                <dd class="text-foreground">{{ formatCurrency(Number(workOrder.estimated_labor_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Overhead</dt>
                <dd class="text-foreground">{{ formatCurrency(Number(workOrder.estimated_overhead_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between border-t border-border pt-3 font-medium">
                <dt class="text-foreground">Total Estimated</dt>
                <dd class="text-foreground">{{ formatCurrency(Number(workOrder.estimated_total_cost) || 0) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Actual Costs -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Actual Costs</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Material</dt>
                <dd class="text-foreground">{{ formatCurrency(Number(workOrder.actual_material_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Labor</dt>
                <dd class="text-foreground">{{ formatCurrency(Number(workOrder.actual_labor_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Overhead</dt>
                <dd class="text-foreground">{{ formatCurrency(Number(workOrder.actual_overhead_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between border-t border-border pt-3 font-medium">
                <dt class="text-foreground">Total Actual</dt>
                <dd class="text-foreground">{{ formatCurrency(Number(workOrder.actual_total_cost) || 0) }}</dd>
              </div>
              <div class="flex justify-between text-sm" :class="Number(workOrder.cost_variance) >= 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400'">
                <dt>Variance</dt>
                <dd>{{ formatCurrency(Number(workOrder.cost_variance) || 0) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Timeline -->
          <Card v-if="workOrder.confirmed_at || workOrder.started_at || workOrder.completed_at">
            <template #header>
              <h2 class="font-medium text-foreground">Timeline</h2>
            </template>
            <dl class="space-y-2 text-sm">
              <div v-if="workOrder.confirmed_at" class="flex justify-between">
                <dt class="text-muted-foreground">Confirmed</dt>
                <dd class="text-foreground">{{ formatDate(workOrder.confirmed_at) }}</dd>
              </div>
              <div v-if="workOrder.started_at" class="flex justify-between">
                <dt class="text-muted-foreground">Started</dt>
                <dd class="text-foreground">{{ formatDate(workOrder.started_at) }}</dd>
              </div>
              <div v-if="workOrder.completed_at" class="flex justify-between">
                <dt class="text-muted-foreground">Completed</dt>
                <dd class="text-foreground">{{ formatDate(workOrder.completed_at) }}</dd>
              </div>
              <div v-if="workOrder.cancelled_at" class="flex justify-between text-destructive">
                <dt>Cancelled</dt>
                <dd>{{ formatDate(workOrder.cancelled_at) }}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- Record Output Modal -->
      <!-- ============================================ -->
      <Modal
        :open="showOutputModal"
        @update:open="showOutputModal = $event"
        title="Record Output"
        description="Record completed and scrapped quantities for this work order."
        size="md"
      >
        <div class="space-y-4">
          <FormField label="Quantity Completed" required :error="outputErrors.quantity">
            <Input
              v-model.number="outputQuantity"
              type="number"
              :min="0"
              step="0.0001"
              placeholder="0"
            />
          </FormField>

          <FormField label="Quantity Scrapped">
            <Input
              v-model.number="outputScrapped"
              type="number"
              :min="0"
              step="0.0001"
              placeholder="0"
            />
          </FormField>

          <div v-if="workOrder" class="p-3 bg-muted rounded-lg text-sm">
            <div class="flex justify-between mb-1">
              <span class="text-muted-foreground">Current completed:</span>
              <span class="font-medium text-foreground">{{ workOrder.quantity_completed }} / {{ workOrder.quantity_ordered }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">After this entry:</span>
              <span class="font-medium text-foreground">{{ (Number(workOrder.quantity_completed) + outputQuantity).toFixed(4) }} / {{ workOrder.quantity_ordered }}</span>
            </div>
          </div>
        </div>

        <template #footer>
          <Button variant="ghost" @click="showOutputModal = false">Cancel</Button>
          <Button
            @click="handleRecordOutput"
            :loading="recordOutputMutation.isPending.value"
          >
            Record Output
          </Button>
        </template>
      </Modal>

      <!-- ============================================ -->
      <!-- Record Consumption Modal -->
      <!-- ============================================ -->
      <Modal
        :open="showConsumptionModal"
        @update:open="showConsumptionModal = $event"
        title="Record Material Consumption"
        description="Log materials consumed during production."
        size="3xl"
      >
        <div class="space-y-4">
          <p v-if="consumptionErrors.items" class="text-sm text-destructive">
            {{ consumptionErrors.items }}
          </p>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-muted text-muted-foreground">
                <tr>
                  <th class="px-3 py-2 text-left">Material</th>
                  <th class="px-3 py-2 text-right w-28">Qty Consumed</th>
                  <th class="px-3 py-2 text-right w-36">Unit Cost</th>
                  <th class="px-3 py-2 text-left w-32">Batch #</th>
                  <th class="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="(row, index) in consumptionRows" :key="index" class="align-top">
                  <td class="px-3 py-2">
                    <div class="font-medium text-foreground">{{ row.product_name || 'No product' }}</div>
                    <div v-if="row.product_id" class="text-xs text-muted-foreground">ID: {{ row.product_id }}</div>
                  </td>
                  <td class="px-3 py-2">
                    <Input
                      v-model.number="row.quantity_consumed"
                      type="number"
                      :min="0"
                      step="0.0001"
                      size="sm"
                      class="text-right"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <CurrencyInput
                      v-model="row.unit_cost"
                      size="sm"
                      :min="0"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <Input
                      v-model="row.batch_number"
                      size="sm"
                      placeholder="Optional"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <button
                      type="button"
                      @click="removeConsumptionRow(index)"
                      :disabled="consumptionRows.length === 1"
                      class="text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <template #footer>
          <Button variant="ghost" @click="showConsumptionModal = false">Cancel</Button>
          <Button
            @click="handleRecordConsumption"
            :loading="recordConsumptionMutation.isPending.value"
          >
            Record Consumption
          </Button>
        </template>
      </Modal>
    </template>
  </div>
</template>
