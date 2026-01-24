<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useSubcontractorWorkOrder,
  useSubcontractorWorkOrderInvoices,
  useAssignSubcontractor,
  useStartSubcontractorWorkOrder,
  useUpdateSubcontractorWorkOrderProgress,
  useCompleteSubcontractorWorkOrder,
  useCancelSubcontractorWorkOrder,
  useCreateSubcontractorInvoice,
  useDeleteSubcontractorWorkOrder,
  getSubcontractorWorkOrderStatus,
  formatSCWONumber,
  type CreateSubcontractorInvoiceData,
} from '@/api/useSubcontractorWorkOrders'
import { useContactsLookup } from '@/api/useContacts'
import { getErrorMessage } from '@/api/client'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  ArrowLeft,
  Edit,
  UserPlus,
  Play,
  CheckCircle,
  Ban,
  Trash2,
  FileText,
  HardHat,
  TrendingUp,
} from 'lucide-vue-next'

// UI Components
import { Button, Badge, Card, Modal, Input, Select, PageSkeleton, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const scwoId = computed(() => Number(route.params.id))

// Data fetching
const { data: scwo, isLoading, error } = useSubcontractorWorkOrder(scwoId)
const { data: invoices } = useSubcontractorWorkOrderInvoices(scwoId)

// Subcontractors lookup (suppliers)
const { data: subcontractors } = useContactsLookup('supplier')

// Mutations
const assignMutation = useAssignSubcontractor()
const startMutation = useStartSubcontractorWorkOrder()
const progressMutation = useUpdateSubcontractorWorkOrderProgress()
const completeMutation = useCompleteSubcontractorWorkOrder()
const cancelMutation = useCancelSubcontractorWorkOrder()
const createInvoiceMutation = useCreateSubcontractorInvoice()
const deleteMutation = useDeleteSubcontractorWorkOrder()

// Modal states
const showAssignModal = ref(false)
const showStartModal = ref(false)
const showProgressModal = ref(false)
const showCompleteModal = ref(false)
const showCancelModal = ref(false)
const showInvoiceModal = ref(false)
const showDeleteModal = ref(false)

// Form data
const assignData = ref({ subcontractor_id: 0, notes: '' })
const startNotes = ref('')
const progressData = ref({ completion_percentage: 0, notes: '' })
const completeNotes = ref('')
const cancelReason = ref('')
const invoiceData = ref<CreateSubcontractorInvoiceData>({
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: '',
  gross_amount: 0,
  retention_held: 0,
  other_deductions: 0,
  description: '',
  notes: '',
})

// Subcontractor options for select
const subcontractorOptions = computed(() => {
  if (!subcontractors.value) return []
  return subcontractors.value.map(s => ({ value: s.id, label: s.name }))
})

// Action handlers
async function handleAssign() {
  if (!assignData.value.subcontractor_id) {
    toast.error('Please select a subcontractor')
    return
  }
  try {
    await assignMutation.mutateAsync({
      id: scwoId.value,
      data: {
        subcontractor_id: assignData.value.subcontractor_id,
        notes: assignData.value.notes || undefined,
      },
    })
    showAssignModal.value = false
    assignData.value = { subcontractor_id: 0, notes: '' }
    toast.success('Subcontractor assigned successfully')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to assign subcontractor'))
  }
}

async function handleStart() {
  try {
    await startMutation.mutateAsync({
      id: scwoId.value,
      notes: startNotes.value || undefined,
    })
    showStartModal.value = false
    startNotes.value = ''
    toast.success('Work order started')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to start work order'))
  }
}

async function handleUpdateProgress() {
  if (progressData.value.completion_percentage < 0 || progressData.value.completion_percentage > 100) {
    toast.error('Progress must be between 0 and 100')
    return
  }
  try {
    await progressMutation.mutateAsync({
      id: scwoId.value,
      data: {
        completion_percentage: progressData.value.completion_percentage,
        notes: progressData.value.notes || undefined,
      },
    })
    showProgressModal.value = false
    progressData.value = { completion_percentage: 0, notes: '' }
    toast.success('Progress updated')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to update progress'))
  }
}

async function handleComplete() {
  try {
    await completeMutation.mutateAsync({
      id: scwoId.value,
      notes: completeNotes.value || undefined,
    })
    showCompleteModal.value = false
    completeNotes.value = ''
    toast.success('Work order completed')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to complete work order'))
  }
}

async function handleCancel() {
  try {
    await cancelMutation.mutateAsync({
      id: scwoId.value,
      reason: cancelReason.value || undefined,
    })
    showCancelModal.value = false
    cancelReason.value = ''
    toast.success('Work order cancelled')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to cancel work order'))
  }
}

async function handleCreateInvoice() {
  if (!invoiceData.value.invoice_date || !invoiceData.value.due_date || !invoiceData.value.gross_amount) {
    toast.error('Please fill in required fields')
    return
  }
  try {
    const result = await createInvoiceMutation.mutateAsync({
      id: scwoId.value,
      data: invoiceData.value,
    })
    showInvoiceModal.value = false
    resetInvoiceForm()
    toast.success('Invoice created successfully')
    router.push(`/manufacturing/subcontractor-invoices/${result.id}`)
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to create invoice'))
  }
}

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(scwoId.value)
    showDeleteModal.value = false
    toast.success('Work order deleted')
    router.push('/manufacturing/subcontractor-work-orders')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to delete work order'))
  }
}

function resetInvoiceForm() {
  invoiceData.value = {
    invoice_date: new Date().toISOString().slice(0, 10),
    due_date: '',
    gross_amount: 0,
    retention_held: 0,
    other_deductions: 0,
    description: '',
    notes: '',
  }
}

function openProgressModal() {
  progressData.value.completion_percentage = Number(scwo.value?.completion_percentage || 0)
  showProgressModal.value = true
}

// Permission checks based on status
const canEdit = computed(() => scwo.value?.status === 'draft')
const canAssign = computed(() => scwo.value?.status === 'draft')
const canStart = computed(() => scwo.value?.status === 'assigned')
const canUpdateProgress = computed(() => scwo.value?.status === 'in_progress')
const canComplete = computed(() => scwo.value?.status === 'in_progress')
const canCancel = computed(() => ['draft', 'assigned', 'in_progress'].includes(scwo.value?.status || ''))
const canCreateInvoice = computed(() => ['in_progress', 'completed'].includes(scwo.value?.status || ''))
const canDelete = computed(() => scwo.value?.status === 'draft')

// Invoice table columns
const invoiceColumns: ResponsiveColumn[] = [
  { key: 'invoice_number', label: 'Invoice #', mobilePriority: 1 },
  { key: 'invoice_date', label: 'Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'net_amount', label: 'Amount', align: 'right', mobilePriority: 2, format: (v) => formatCurrency(Number(v) || 0) },
  { key: 'status', label: 'Status', mobilePriority: 3 },
]

function viewInvoice(item: Record<string, unknown>) {
  router.push(`/manufacturing/subcontractor-invoices/${item.id}`)
}
</script>

<template>
  <div>
    <!-- Loading -->
    <PageSkeleton v-if="isLoading" type="detail" />

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500 dark:text-red-400">
      {{ getErrorMessage(error, 'Failed to load work order') }}
    </div>

    <!-- Content -->
    <template v-else-if="scwo">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/manufacturing/subcontractor-work-orders" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft class="w-4 h-4" />
          Subcontractor Work Orders
        </RouterLink>
        <span>/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ formatSCWONumber(scwo) }}</span>
      </div>

      <!-- Header Card -->
      <Card class="mb-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ formatSCWONumber(scwo) }}
              </h1>
              <Badge :class="getSubcontractorWorkOrderStatus(scwo).color">
                {{ getSubcontractorWorkOrderStatus(scwo).label }}
              </Badge>
            </div>
            <p class="text-lg text-slate-700 dark:text-slate-300">{{ scwo.name }}</p>
            <p v-if="scwo.subcontractor" class="text-slate-500 dark:text-slate-400">
              Subcontractor: {{ scwo.subcontractor.name }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <!-- Edit (draft only) -->
            <RouterLink v-if="canEdit" :to="`/manufacturing/subcontractor-work-orders/${scwoId}/edit`">
              <Button variant="secondary" size="sm">
                <Edit class="w-4 h-4 mr-1" />
                Edit
              </Button>
            </RouterLink>

            <!-- Assign Subcontractor (draft) -->
            <Button
              v-if="canAssign"
              size="sm"
              @click="showAssignModal = true"
            >
              <UserPlus class="w-4 h-4 mr-1" />
              Assign Subcontractor
            </Button>

            <!-- Start (assigned) -->
            <Button
              v-if="canStart"
              variant="success"
              size="sm"
              @click="showStartModal = true"
            >
              <Play class="w-4 h-4 mr-1" />
              Start Work
            </Button>

            <!-- Update Progress (in_progress) -->
            <Button
              v-if="canUpdateProgress"
              variant="secondary"
              size="sm"
              @click="openProgressModal"
            >
              <TrendingUp class="w-4 h-4 mr-1" />
              Update Progress
            </Button>

            <!-- Complete (in_progress) -->
            <Button
              v-if="canComplete"
              variant="success"
              size="sm"
              @click="showCompleteModal = true"
            >
              <CheckCircle class="w-4 h-4 mr-1" />
              Complete
            </Button>

            <!-- Create Invoice (in_progress/completed) -->
            <Button
              v-if="canCreateInvoice"
              size="sm"
              @click="showInvoiceModal = true"
            >
              <FileText class="w-4 h-4 mr-1" />
              Create Invoice
            </Button>

            <!-- Cancel -->
            <Button
              v-if="canCancel"
              variant="ghost"
              size="sm"
              class="text-red-500 hover:text-red-600"
              @click="showCancelModal = true"
            >
              <Ban class="w-4 h-4 mr-1" />
              Cancel
            </Button>

            <!-- Delete (draft only) -->
            <Button
              v-if="canDelete"
              variant="ghost"
              size="sm"
              class="text-red-500 hover:text-red-600"
              @click="showDeleteModal = true"
            >
              <Trash2 class="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </Card>

      <!-- Progress Banner -->
      <Card
        v-if="scwo.status === 'in_progress'"
        class="mb-6 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
            <HardHat class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-purple-600 dark:text-purple-400 font-medium">Work Progress</p>
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-purple-200 dark:bg-purple-800 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-purple-600 dark:bg-purple-400 h-full rounded-full transition-all"
                  :style="{ width: `${scwo.completion_percentage || 0}%` }"
                />
              </div>
              <span class="text-sm font-medium text-purple-700 dark:text-purple-300">{{ scwo.completion_percentage || 0 }}%</span>
            </div>
          </div>
        </div>
      </Card>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Details Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Details</h2>
            </template>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Subcontractor</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ scwo.subcontractor?.name || 'Not assigned' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Work Order</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  <RouterLink
                    v-if="scwo.work_order"
                    :to="`/work-orders/${scwo.work_order.id}`"
                    class="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {{ scwo.work_order.wo_number }}
                  </RouterLink>
                  <span v-else>-</span>
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Scheduled Start</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(scwo.scheduled_start_date) }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Scheduled End</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(scwo.scheduled_end_date) }}
                </dd>
              </div>
              <div v-if="scwo.actual_start_date">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Actual Start</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(scwo.actual_start_date) }}
                </dd>
              </div>
              <div v-if="scwo.actual_end_date">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Actual End</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(scwo.actual_end_date) }}
                </dd>
              </div>
              <div v-if="scwo.work_location" class="sm:col-span-2">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Work Location</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ scwo.work_location }}</dd>
              </div>
              <div v-if="scwo.location_address" class="sm:col-span-2">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Location Address</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ scwo.location_address }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Scope of Work -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Scope of Work</h2>
            </template>
            <p class="text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ scwo.scope_of_work || '-' }}</p>
          </Card>

          <!-- Description -->
          <Card v-if="scwo.description">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Description</h2>
            </template>
            <p class="text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ scwo.description }}</p>
          </Card>

          <!-- Invoices -->
          <Card v-if="invoices && invoices.length > 0" :padding="false">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Invoices</h2>
            </template>

            <ResponsiveTable
              :items="invoices"
              :columns="invoiceColumns"
              title-field="invoice_number"
              @row-click="viewInvoice"
            >
              <!-- Invoice Number -->
              <template #cell-invoice_number="{ item }">
                <span class="text-primary-600 dark:text-primary-400 font-medium">
                  {{ (item as Record<string, unknown>).invoice_number || `SCI-${(item as Record<string, unknown>).id}` }}
                </span>
              </template>

              <!-- Status -->
              <template #cell-status="{ item }">
                <Badge :status="(item as any).status.value">
                  {{ (item as any).status.label }}
                </Badge>
              </template>
            </ResponsiveTable>
          </Card>

          <!-- Notes -->
          <Card v-if="scwo.notes">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
            </template>
            <p class="text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ scwo.notes }}</p>
          </Card>

          <!-- Cancellation Reason -->
          <Card v-if="scwo.cancellation_reason" class="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <template #header>
              <h2 class="font-semibold text-red-700 dark:text-red-400">Cancellation Reason</h2>
            </template>
            <p class="text-red-700 dark:text-red-400">{{ scwo.cancellation_reason }}</p>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Financial Summary Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Financial Summary</h2>
            </template>

            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Agreed Amount</dt>
                <dd class="font-bold text-lg text-primary-600 dark:text-primary-400">
                  {{ formatCurrency(scwo.agreed_amount) }}
                </dd>
              </div>
              <hr class="border-slate-200 dark:border-slate-700" />
              <div v-if="scwo.retention_percent" class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Retention ({{ scwo.retention_percent }}%)</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(Number(scwo.agreed_amount) * Number(scwo.retention_percent) / 100) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Total Invoiced</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatCurrency((scwo as Record<string, unknown>).total_invoiced_amount as number || 0) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Total Paid</dt>
                <dd class="font-medium text-green-600 dark:text-green-400">
                  {{ formatCurrency((scwo as Record<string, unknown>).total_paid_amount as number || 0) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Remaining</dt>
                <dd class="font-medium text-amber-600 dark:text-amber-400">
                  {{ formatCurrency(Number(scwo.agreed_amount || 0) - Number((scwo as Record<string, unknown>).total_invoiced_amount as number || 0)) }}
                </dd>
              </div>
            </dl>
          </Card>

          <!-- Activity Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Activity</h2>
            </template>

            <ul class="space-y-3 text-sm">
              <li v-if="scwo.completed_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Completed</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(scwo.completed_at) }}</p>
                </div>
              </li>
              <li v-if="scwo.cancelled_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-red-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Cancelled</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(scwo.cancelled_at) }}</p>
                </div>
              </li>
              <li v-if="scwo.started_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-purple-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Work Started</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(scwo.started_at) }}</p>
                </div>
              </li>
              <li v-if="scwo.assigned_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Assigned</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(scwo.assigned_at) }}</p>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Created</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(scwo.created_at) }}</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </template>

    <!-- Assign Modal -->
    <Modal :open="showAssignModal" title="Assign Subcontractor" size="sm" @update:open="showAssignModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Select a subcontractor to assign to this work order.
      </p>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Subcontractor <span class="text-red-500">*</span>
          </label>
          <Select
            v-model="assignData.subcontractor_id"
            :options="subcontractorOptions"
            placeholder="Select subcontractor..."
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            v-model="assignData.notes"
            rows="2"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter notes..."
          />
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showAssignModal = false">Cancel</Button>
        <Button
          :loading="assignMutation.isPending.value"
          @click="handleAssign"
        >
          Assign
        </Button>
      </template>
    </Modal>

    <!-- Start Modal -->
    <Modal :open="showStartModal" title="Start Work" size="sm" @update:open="showStartModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Are you sure you want to start this work order?
      </p>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Notes (optional)
        </label>
        <textarea
          v-model="startNotes"
          rows="2"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter notes..."
        />
      </div>
      <template #footer>
        <Button variant="ghost" @click="showStartModal = false">Cancel</Button>
        <Button
          variant="success"
          :loading="startMutation.isPending.value"
          @click="handleStart"
        >
          Start Work
        </Button>
      </template>
    </Modal>

    <!-- Progress Modal -->
    <Modal :open="showProgressModal" title="Update Progress" size="sm" @update:open="showProgressModal = $event">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Completion Percentage <span class="text-red-500">*</span>
          </label>
          <div class="flex items-center gap-2">
            <Input
              v-model.number="progressData.completion_percentage"
              type="number"
              min="0"
              max="100"
              class="flex-1"
            />
            <span class="text-slate-500 dark:text-slate-400">%</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            v-model="progressData.notes"
            rows="2"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter progress notes..."
          />
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showProgressModal = false">Cancel</Button>
        <Button
          :loading="progressMutation.isPending.value"
          @click="handleUpdateProgress"
        >
          Update Progress
        </Button>
      </template>
    </Modal>

    <!-- Complete Modal -->
    <Modal :open="showCompleteModal" title="Complete Work Order" size="sm" @update:open="showCompleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Are you sure you want to mark this work order as complete?
      </p>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Notes (optional)
        </label>
        <textarea
          v-model="completeNotes"
          rows="2"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter completion notes..."
        />
      </div>
      <template #footer>
        <Button variant="ghost" @click="showCompleteModal = false">Cancel</Button>
        <Button
          variant="success"
          :loading="completeMutation.isPending.value"
          @click="handleComplete"
        >
          Complete
        </Button>
      </template>
    </Modal>

    <!-- Cancel Modal -->
    <Modal :open="showCancelModal" title="Cancel Work Order" size="sm" @update:open="showCancelModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Please provide a reason for cancelling this work order.
      </p>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Reason
        </label>
        <textarea
          v-model="cancelReason"
          rows="3"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter cancellation reason..."
        />
      </div>
      <template #footer>
        <Button variant="ghost" @click="showCancelModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="cancelMutation.isPending.value"
          @click="handleCancel"
        >
          Cancel Work Order
        </Button>
      </template>
    </Modal>

    <!-- Create Invoice Modal -->
    <Modal :open="showInvoiceModal" title="Create Invoice" size="md" @update:open="showInvoiceModal = $event">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Invoice Date <span class="text-red-500">*</span>
            </label>
            <Input v-model="invoiceData.invoice_date" type="date" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Due Date <span class="text-red-500">*</span>
            </label>
            <Input v-model="invoiceData.due_date" type="date" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Gross Amount <span class="text-red-500">*</span>
          </label>
          <Input v-model.number="invoiceData.gross_amount" type="number" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Retention Held
            </label>
            <Input v-model.number="invoiceData.retention_held" type="number" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Other Deductions
            </label>
            <Input v-model.number="invoiceData.other_deductions" type="number" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            v-model="invoiceData.description"
            rows="2"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Invoice description..."
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes
          </label>
          <textarea
            v-model="invoiceData.notes"
            rows="2"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Additional notes..."
          />
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showInvoiceModal = false">Cancel</Button>
        <Button
          :loading="createInvoiceMutation.isPending.value"
          @click="handleCreateInvoice"
        >
          Create Invoice
        </Button>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Work Order" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this work order? This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="deleteMutation.isPending.value"
          @click="handleDelete"
        >
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
