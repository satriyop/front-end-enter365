<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useMaterialRequisition,
  useApproveMaterialRequisition,
  useIssueMaterialRequisition,
  useCancelMaterialRequisition,
  useDeleteMaterialRequisition,
  getMaterialRequisitionStatus,
  formatMRNumber,
  type IssueItemsData,
} from '@/api/useMaterialRequisitions'
import { getErrorMessage } from '@/api/client'
import { formatDate } from '@/utils/format'
import {
  ArrowLeft,
  CheckCircle,
  Package,
  Ban,
  Trash2,
  ClipboardList,
} from 'lucide-vue-next'

// UI Components
import { Button, Badge, Card, Modal, Input, PageSkeleton, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const mrId = computed(() => Number(route.params.id))

// Data fetching
const { data: mr, isLoading, error } = useMaterialRequisition(mrId)

// Mutations
const approveMutation = useApproveMaterialRequisition()
const issueMutation = useIssueMaterialRequisition()
const cancelMutation = useCancelMaterialRequisition()
const deleteMutation = useDeleteMaterialRequisition()

// Modal states
const showApproveModal = ref(false)
const showIssueModal = ref(false)
const showCancelModal = ref(false)
const showDeleteModal = ref(false)
const approvalNotes = ref('')
const cancelReason = ref('')
const issueNotes = ref('')

// Issue items state
const issueItems = ref<{ item_id: number; quantity_issued: number; max_quantity: number; name: string }[]>([])

function initIssueItems() {
  if (!mr.value?.items) return
  issueItems.value = mr.value.items
    .filter(item => Number(item.quantity_pending || 0) > 0)
    .map(item => ({
      item_id: Number(item.id),
      quantity_issued: 0,
      max_quantity: Number(item.quantity_pending || 0),
      name: item.product?.name || '-',
    }))
}

// Action handlers
async function handleApprove() {
  try {
    await approveMutation.mutateAsync({
      id: mrId.value,
      data: approvalNotes.value ? { notes: approvalNotes.value } : undefined,
    })
    showApproveModal.value = false
    approvalNotes.value = ''
    toast.success('Material requisition approved')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to approve requisition'))
  }
}

async function handleIssue() {
  const itemsToIssue = issueItems.value
    .filter(item => item.quantity_issued > 0)
    .map(item => ({
      item_id: item.item_id,
      quantity_issued: item.quantity_issued,
    }))

  if (itemsToIssue.length === 0) {
    toast.error('Please enter quantities to issue')
    return
  }

  try {
    const data: IssueItemsData = {
      items: itemsToIssue,
      issue_notes: issueNotes.value || undefined,
    }
    await issueMutation.mutateAsync({ id: mrId.value, data })
    showIssueModal.value = false
    issueItems.value = []
    issueNotes.value = ''
    toast.success('Materials issued successfully')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to issue materials'))
  }
}

async function handleCancel() {
  try {
    await cancelMutation.mutateAsync({
      id: mrId.value,
      reason: cancelReason.value || undefined,
    })
    showCancelModal.value = false
    cancelReason.value = ''
    toast.success('Material requisition cancelled')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to cancel requisition'))
  }
}

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(mrId.value)
    showDeleteModal.value = false
    toast.success('Material requisition deleted')
    router.push('/manufacturing/material-requisitions')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to delete requisition'))
  }
}

// Open issue modal
function openIssueModal() {
  initIssueItems()
  showIssueModal.value = true
}

// Set max quantity for issue
function setMaxQuantity(index: number) {
  const item = issueItems.value[index]
  if (item) {
    item.quantity_issued = item.max_quantity
  }
}

// Permission checks based on status
const canApprove = computed(() => mr.value?.status === 'pending')
const canIssue = computed(() => mr.value?.status === 'approved' || mr.value?.status === 'partial')
const canCancel = computed(() => ['draft', 'pending', 'approved'].includes(mr.value?.status || ''))
const canDelete = computed(() => mr.value?.status === 'draft')

// Line items table columns
const itemColumns: ResponsiveColumn[] = [
  { key: 'product', label: 'Product', mobilePriority: 1 },
  { key: 'requested', label: 'Requested', align: 'right', mobilePriority: 2 },
  { key: 'issued', label: 'Issued', align: 'right', showInMobile: false },
  { key: 'pending', label: 'Pending', align: 'right', mobilePriority: 3 },
  { key: 'status', label: 'Status', showInMobile: false },
]
</script>

<template>
  <div>
    <!-- Loading -->
    <PageSkeleton v-if="isLoading" type="detail" />

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500 dark:text-red-400">
      {{ getErrorMessage(error, 'Failed to load material requisition') }}
    </div>

    <!-- Content -->
    <template v-else-if="mr">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/manufacturing/material-requisitions" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft class="w-4 h-4" />
          Material Requisitions
        </RouterLink>
        <span>/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ formatMRNumber(mr) }}</span>
      </div>

      <!-- Header Card -->
      <Card class="mb-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ formatMRNumber(mr) }}
              </h1>
              <Badge :class="getMaterialRequisitionStatus(mr).color">
                {{ getMaterialRequisitionStatus(mr).label }}
              </Badge>
            </div>
            <p v-if="mr.work_order" class="text-slate-500 dark:text-slate-400">
              Work Order: {{ mr.work_order.wo_number }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <!-- Approve (pending) -->
            <Button
              v-if="canApprove"
              variant="success"
              size="sm"
              @click="showApproveModal = true"
            >
              <CheckCircle class="w-4 h-4 mr-1" />
              Approve
            </Button>

            <!-- Issue Materials (approved/partial) -->
            <Button
              v-if="canIssue"
              size="sm"
              @click="openIssueModal"
            >
              <Package class="w-4 h-4 mr-1" />
              Issue Materials
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
                <dt class="text-sm text-slate-500 dark:text-slate-400">Work Order</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  <RouterLink
                    v-if="mr.work_order"
                    :to="`/work-orders/${mr.work_order.id}`"
                    class="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {{ mr.work_order.wo_number }} - {{ mr.work_order.name }}
                  </RouterLink>
                  <span v-else>-</span>
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Warehouse</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ mr.warehouse?.name || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Required Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(mr.required_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Total Items</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ mr.total_items || 0 }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Requested Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(mr.requested_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Created At</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(mr.created_at) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Items Card -->
          <Card :padding="false">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Requested Items</h2>
            </template>

            <ResponsiveTable
              :items="mr.items || []"
              :columns="itemColumns"
              title-field="product.name"
            >
              <!-- Product -->
              <template #cell-product="{ item }">
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ ((item as Record<string, unknown>).product as Record<string, unknown>)?.name || '-' }}
                </div>
                <div v-if="((item as Record<string, unknown>).product as Record<string, unknown>)?.sku" class="text-sm text-slate-500 dark:text-slate-400">
                  {{ ((item as Record<string, unknown>).product as Record<string, unknown>)?.sku }}
                </div>
              </template>

              <!-- Requested -->
              <template #cell-requested="{ item }">
                <span class="text-slate-900 dark:text-slate-100">
                  {{ (item as Record<string, unknown>).quantity_requested }}
                  {{ (item as Record<string, unknown>).unit || '' }}
                </span>
              </template>

              <!-- Issued -->
              <template #cell-issued="{ item }">
                <span class="text-slate-900 dark:text-slate-100">
                  {{ (item as Record<string, unknown>).quantity_issued || 0 }}
                </span>
              </template>

              <!-- Pending -->
              <template #cell-pending="{ item }">
                <span
                  :class="[
                    Number((item as Record<string, unknown>).quantity_pending || 0) > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-green-600 dark:text-green-400'
                  ]"
                >
                  {{ (item as Record<string, unknown>).quantity_pending || 0 }}
                </span>
              </template>

              <!-- Status -->
              <template #cell-status="{ item }">
                <Badge
                  v-if="Number((item as Record<string, unknown>).quantity_pending || 0) === 0"
                  class="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  Issued
                </Badge>
                <Badge
                  v-else-if="Number((item as Record<string, unknown>).quantity_issued || 0) > 0"
                  class="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                >
                  Partial
                </Badge>
                <Badge v-else class="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Pending
                </Badge>
              </template>

              <!-- Mobile title -->
              <template #mobile-title="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">
                  {{ ((item as Record<string, unknown>).product as Record<string, unknown>)?.name || '-' }}
                </span>
              </template>
            </ResponsiveTable>
          </Card>

          <!-- Notes -->
          <Card v-if="mr.notes">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
            </template>
            <p class="text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ mr.notes }}</p>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Summary</h2>
            </template>

            <div class="space-y-4">
              <div class="flex items-center justify-center">
                <div class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <ClipboardList class="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
              </div>

              <dl class="space-y-3">
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Total Items</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ mr.total_items || 0 }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Total Quantity</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ mr.total_quantity || 0 }}</dd>
                </div>
              </dl>
            </div>
          </Card>

          <!-- Activity Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Activity</h2>
            </template>

            <ul class="space-y-3 text-sm">
              <li v-if="mr.approved_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Approved</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(mr.approved_at) }}</p>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Created</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(mr.created_at) }}</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </template>

    <!-- Approve Modal -->
    <Modal :open="showApproveModal" title="Approve Requisition" size="sm" @update:open="showApproveModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Are you sure you want to approve this material requisition?
      </p>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Notes (optional)
        </label>
        <textarea
          v-model="approvalNotes"
          rows="3"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter approval notes..."
        />
      </div>
      <template #footer>
        <Button variant="ghost" @click="showApproveModal = false">Cancel</Button>
        <Button
          variant="success"
          :loading="approveMutation.isPending.value"
          @click="handleApprove"
        >
          Approve
        </Button>
      </template>
    </Modal>

    <!-- Issue Modal -->
    <Modal :open="showIssueModal" title="Issue Materials" size="lg" @update:open="showIssueModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Enter the quantities to issue for each item.
      </p>

      <div class="space-y-4">
        <div
          v-for="(issueItem, index) in issueItems"
          :key="issueItem.item_id"
          class="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
        >
          <div class="flex-1">
            <p class="font-medium text-slate-900 dark:text-slate-100">
              {{ issueItem.name }}
            </p>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Pending: {{ issueItem.max_quantity }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Input
              v-model.number="issueItem.quantity_issued"
              type="number"
              class="w-24"
              :min="0"
              :max="issueItem.max_quantity"
            />
            <Button
              variant="ghost"
              size="xs"
              @click="setMaxQuantity(index)"
            >
              Max
            </Button>
          </div>
        </div>
      </div>

      <div class="mt-4">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Issue Notes (optional)
        </label>
        <textarea
          v-model="issueNotes"
          rows="2"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter issue notes..."
        />
      </div>

      <template #footer>
        <Button variant="ghost" @click="showIssueModal = false">Cancel</Button>
        <Button
          :loading="issueMutation.isPending.value"
          @click="handleIssue"
        >
          <Package class="w-4 h-4 mr-1" />
          Issue Materials
        </Button>
      </template>
    </Modal>

    <!-- Cancel Modal -->
    <Modal :open="showCancelModal" title="Cancel Requisition" size="sm" @update:open="showCancelModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Please provide a reason for cancelling this requisition.
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
          Cancel Requisition
        </Button>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Requisition" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this material requisition? This action cannot be undone.
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
