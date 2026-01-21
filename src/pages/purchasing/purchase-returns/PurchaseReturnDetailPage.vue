<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  usePurchaseReturn,
  useSubmitPurchaseReturn,
  useApprovePurchaseReturn,
  useRejectPurchaseReturn,
  useCompletePurchaseReturn,
  useCancelPurchaseReturn,
  useDeletePurchaseReturn,
  getPurchaseReturnStatus,
  formatReturnNumber,
} from '@/api/usePurchaseReturns'
import { getErrorMessage } from '@/api/client'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
} from 'lucide-vue-next'

// UI Components
import { Button, Badge, Card, Modal, PageSkeleton, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const returnId = computed(() => Number(route.params.id))

// Data fetching
const { data: purchaseReturn, isLoading, error } = usePurchaseReturn(returnId)

// Mutations
const submitMutation = useSubmitPurchaseReturn()
const approveMutation = useApprovePurchaseReturn()
const rejectMutation = useRejectPurchaseReturn()
const completeMutation = useCompletePurchaseReturn()
const cancelMutation = useCancelPurchaseReturn()
const deleteMutation = useDeletePurchaseReturn()

// Modal states
const showRejectModal = ref(false)
const showCancelModal = ref(false)
const showDeleteModal = ref(false)
const rejectReason = ref('')
const cancelReason = ref('')

// Action handlers
async function handleSubmit() {
  try {
    await submitMutation.mutateAsync(returnId.value)
    toast.success('Return submitted for approval')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to submit return'))
  }
}

async function handleApprove() {
  try {
    await approveMutation.mutateAsync(returnId.value)
    toast.success('Return approved')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to approve return'))
  }
}

async function handleReject() {
  try {
    await rejectMutation.mutateAsync({ id: returnId.value, reason: rejectReason.value })
    showRejectModal.value = false
    rejectReason.value = ''
    toast.success('Return rejected')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to reject return'))
  }
}

async function handleComplete() {
  try {
    await completeMutation.mutateAsync(returnId.value)
    toast.success('Return completed, inventory updated')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to complete return'))
  }
}

async function handleCancel() {
  try {
    await cancelMutation.mutateAsync({ id: returnId.value, reason: cancelReason.value })
    showCancelModal.value = false
    cancelReason.value = ''
    toast.success('Return cancelled')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to cancel return'))
  }
}

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(returnId.value)
    showDeleteModal.value = false
    toast.success('Return deleted')
    router.push('/purchasing/purchase-returns')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to delete return'))
  }
}

// Computed flags for action availability
const canEdit = computed(() => purchaseReturn.value?.status === 'draft')
const canSubmit = computed(() => purchaseReturn.value?.status === 'draft')
const canApprove = computed(() => purchaseReturn.value?.status === 'pending')
const canReject = computed(() => purchaseReturn.value?.status === 'pending')
const canComplete = computed(() => purchaseReturn.value?.status === 'approved')
const canCancel = computed(() => ['draft', 'pending', 'approved'].includes(purchaseReturn.value?.status || ''))
const canDelete = computed(() => purchaseReturn.value?.status === 'draft')

// Line items table columns
const itemColumns: ResponsiveColumn[] = [
  { key: 'item', label: 'Item', mobilePriority: 1 },
  { key: 'quantity', label: 'Qty', align: 'right', mobilePriority: 3 },
  { key: 'unit_price', label: 'Price', align: 'right', showInMobile: false },
  { key: 'total', label: 'Total', align: 'right', mobilePriority: 2 },
]
</script>

<template>
  <div>
    <!-- Loading -->
    <PageSkeleton v-if="isLoading" type="detail" />

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500 dark:text-red-400">
      {{ getErrorMessage(error, 'Failed to load purchase return') }}
    </div>

    <!-- Content -->
    <template v-else-if="purchaseReturn">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/purchasing/purchase-returns" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft class="w-4 h-4" />
          Purchase Returns
        </RouterLink>
        <span>/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ formatReturnNumber(purchaseReturn) }}</span>
      </div>

      <!-- Header Card -->
      <Card class="mb-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ formatReturnNumber(purchaseReturn) }}
              </h1>
              <Badge :class="getPurchaseReturnStatus(purchaseReturn).color">
                {{ getPurchaseReturnStatus(purchaseReturn).label }}
              </Badge>
            </div>
            <p class="text-slate-500 dark:text-slate-400">{{ purchaseReturn.contact?.name }}</p>
            <p v-if="purchaseReturn.reason" class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Reason: {{ purchaseReturn.reason }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <!-- Edit (draft only) -->
            <RouterLink v-if="canEdit" :to="`/purchasing/purchase-returns/${returnId}/edit`">
              <Button variant="secondary" size="sm">
                <Edit class="w-4 h-4 mr-1" />
                Edit
              </Button>
            </RouterLink>

            <!-- Submit (draft) -->
            <Button
              v-if="canSubmit"
              size="sm"
              :loading="submitMutation.isPending.value"
              @click="handleSubmit"
            >
              <Send class="w-4 h-4 mr-1" />
              Submit
            </Button>

            <!-- Approve (pending) -->
            <Button
              v-if="canApprove"
              variant="success"
              size="sm"
              :loading="approveMutation.isPending.value"
              @click="handleApprove"
            >
              <CheckCircle class="w-4 h-4 mr-1" />
              Approve
            </Button>

            <!-- Reject (pending) -->
            <Button
              v-if="canReject"
              variant="destructive"
              size="sm"
              @click="showRejectModal = true"
            >
              <XCircle class="w-4 h-4 mr-1" />
              Reject
            </Button>

            <!-- Complete (approved) -->
            <Button
              v-if="canComplete"
              variant="success"
              size="sm"
              :loading="completeMutation.isPending.value"
              @click="handleComplete"
            >
              <CheckCircle class="w-4 h-4 mr-1" />
              Complete & Update Inventory
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
                <dt class="text-sm text-slate-500 dark:text-slate-400">Return Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(purchaseReturn.return_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Vendor</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ purchaseReturn.contact?.name || '-' }}</dd>
              </div>
              <div v-if="purchaseReturn.bill">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Related Bill</dt>
                <dd>
                  <RouterLink :to="`/bills/${purchaseReturn.bill_id}`" class="text-primary-600 dark:text-primary-400 hover:underline">
                    {{ purchaseReturn.bill.bill_number }}
                  </RouterLink>
                </dd>
              </div>
              <div v-if="purchaseReturn.warehouse">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Warehouse</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ purchaseReturn.warehouse.name }}</dd>
              </div>
              <div v-if="purchaseReturn.reason">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Reason</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ purchaseReturn.reason }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Items Card -->
          <Card :padding="false">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Return Items</h2>
            </template>

            <ResponsiveTable
              :items="purchaseReturn.items || []"
              :columns="itemColumns"
              title-field="description"
            >
              <!-- Item -->
              <template #cell-item="{ item }">
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ item.product?.name || item.description }}
                </div>
              </template>

              <!-- Quantity -->
              <template #cell-quantity="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ item.quantity }} {{ item.unit }}</span>
              </template>

              <!-- Unit Price -->
              <template #cell-unit_price="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ formatCurrency(item.unit_price) }}</span>
              </template>

              <!-- Total -->
              <template #cell-total="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(item.line_total) }}</span>
              </template>

              <!-- Mobile title -->
              <template #mobile-title="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.product?.name || item.description }}</span>
              </template>
            </ResponsiveTable>
          </Card>

          <!-- Notes -->
          <Card v-if="purchaseReturn.notes">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
            </template>
            <p class="text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ purchaseReturn.notes }}</p>
          </Card>

          <!-- Rejection Reason -->
          <Card v-if="purchaseReturn.rejection_reason" class="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <template #header>
              <h2 class="font-semibold text-red-700 dark:text-red-400">Rejection Reason</h2>
            </template>
            <p class="text-red-700 dark:text-red-400">{{ purchaseReturn.rejection_reason }}</p>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Summary</h2>
            </template>

            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Subtotal</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(purchaseReturn.subtotal) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Tax ({{ purchaseReturn.tax_rate }}%)</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(purchaseReturn.tax_amount) }}</dd>
              </div>
              <hr class="border-slate-200 dark:border-slate-700" />
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900 dark:text-slate-100">Total</dt>
                <dd class="font-bold text-lg text-primary-600 dark:text-primary-400">{{ formatCurrency(purchaseReturn.total_amount) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Activity Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Activity</h2>
            </template>

            <ul class="space-y-3 text-sm">
              <li v-if="purchaseReturn.completed_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Completed</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(purchaseReturn.completed_at) }}</p>
                </div>
              </li>
              <li v-if="purchaseReturn.rejected_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-red-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Rejected</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(purchaseReturn.rejected_at) }}</p>
                </div>
              </li>
              <li v-if="purchaseReturn.approved_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Approved</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(purchaseReturn.approved_at) }}</p>
                </div>
              </li>
              <li v-if="purchaseReturn.submitted_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-amber-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Submitted</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(purchaseReturn.submitted_at) }}</p>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Created</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(purchaseReturn.created_at) }}</p>
                </div>
              </li>
            </ul>
          </Card>

          <!-- Journal Entry Link -->
          <Card v-if="purchaseReturn.journal_entry">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Accounting</h2>
            </template>
            <RouterLink
              :to="`/accounting/journal-entries/${purchaseReturn.journal_entry_id}`"
              class="text-primary-600 dark:text-primary-400 hover:underline"
            >
              View Journal Entry: {{ purchaseReturn.journal_entry.entry_number }}
            </RouterLink>
          </Card>
        </div>
      </div>
    </template>

    <!-- Reject Modal -->
    <Modal :open="showRejectModal" title="Reject Return" size="sm" @update:open="showRejectModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Please provide a reason for rejecting this return.
      </p>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Reason
        </label>
        <textarea
          v-model="rejectReason"
          rows="3"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter rejection reason..."
        />
      </div>
      <template #footer>
        <Button variant="ghost" @click="showRejectModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="rejectMutation.isPending.value"
          @click="handleReject"
        >
          Reject
        </Button>
      </template>
    </Modal>

    <!-- Cancel Modal -->
    <Modal :open="showCancelModal" title="Cancel Return" size="sm" @update:open="showCancelModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Are you sure you want to cancel this return?
      </p>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Reason (optional)
        </label>
        <textarea
          v-model="cancelReason"
          rows="2"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter cancellation reason..."
        />
      </div>
      <template #footer>
        <Button variant="ghost" @click="showCancelModal = false">No, Keep It</Button>
        <Button
          variant="destructive"
          :loading="cancelMutation.isPending.value"
          @click="handleCancel"
        >
          Yes, Cancel Return
        </Button>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Return" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this return? This action cannot be undone.
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
