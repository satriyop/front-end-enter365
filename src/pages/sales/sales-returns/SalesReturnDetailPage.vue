<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useSalesReturn,
  useSubmitSalesReturn,
  useApproveSalesReturn,
  useRejectSalesReturn,
  useCompleteSalesReturn,
  useCancelSalesReturn,
  useDeleteSalesReturn,
  getSalesReturnStatus,
  formatReturnNumber,
} from '@/api/useSalesReturns'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Calendar,
  User,
  Clock,
  BookOpen,
} from 'lucide-vue-next'
import {
  DropdownMenuRoot,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuPortal,
} from 'radix-vue'

// UI Components
import { Button, Badge, Card, Modal, Input } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))

// Fetch sales return
const { data: salesReturn, isLoading, error } = useSalesReturn(id)

// Mutations
const submitMutation = useSubmitSalesReturn()
const approveMutation = useApproveSalesReturn()
const rejectMutation = useRejectSalesReturn()
const completeMutation = useCompleteSalesReturn()
const cancelMutation = useCancelSalesReturn()
const deleteMutation = useDeleteSalesReturn()

// Computed for workflow permissions
const canSubmit = computed(() => salesReturn.value?.status.value === 'draft')
const canApprove = computed(() => salesReturn.value?.status.value === 'pending')
const canReject = computed(() => salesReturn.value?.status.value === 'pending')
const canComplete = computed(() => salesReturn.value?.status.value === 'approved')
const canCancel = computed(() => ['draft', 'pending', 'approved'].includes(salesReturn.value?.status.value || ''))
const canEdit = computed(() => salesReturn.value?.status.value === 'draft')
const canDelete = computed(() => salesReturn.value?.status.value === 'draft')

// Modals
const showRejectModal = ref(false)
const showCancelModal = ref(false)
const showDeleteModal = ref(false)

// Form data
const rejectReason = ref('')
const cancelReason = ref('')

// Workflow actions
async function handleSubmit() {
  await submitMutation.mutateAsync(id.value)
}

async function handleApprove() {
  await approveMutation.mutateAsync(id.value)
}

async function handleReject() {
  await rejectMutation.mutateAsync({ id: id.value, reason: rejectReason.value })
  showRejectModal.value = false
  rejectReason.value = ''
}

async function handleComplete() {
  await completeMutation.mutateAsync(id.value)
}

async function handleCancel() {
  await cancelMutation.mutateAsync({ id: id.value, reason: cancelReason.value })
  showCancelModal.value = false
  cancelReason.value = ''
}

async function handleDelete() {
  await deleteMutation.mutateAsync(id.value)
  router.push('/sales/sales-returns')
}

function goBack() {
  router.push('/sales/sales-returns')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="icon" @click="goBack">
        <ArrowLeft class="w-5 h-5" />
      </Button>
      <div class="flex-1">
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {{ salesReturn ? formatReturnNumber(salesReturn) : 'Loading...' }}
          </h1>
          <Badge v-if="salesReturn" :class="getSalesReturnStatus(salesReturn).color">
            {{ getSalesReturnStatus(salesReturn).label }}
          </Badge>
        </div>
        <p class="text-slate-500 dark:text-slate-400">
          {{ salesReturn?.contact?.name || '' }}
        </p>
      </div>

      <!-- Actions -->
      <div v-if="salesReturn" class="flex items-center gap-2">
        <!-- Submit -->
        <Button
          v-if="canSubmit"
          @click="handleSubmit"
          :disabled="submitMutation.isPending.value"
        >
          <Send class="w-4 h-4 mr-2" />
          Submit
        </Button>

        <!-- Approve -->
        <Button
          v-if="canApprove"
          variant="success"
          @click="handleApprove"
          :disabled="approveMutation.isPending.value"
        >
          <CheckCircle class="w-4 h-4 mr-2" />
          Approve
        </Button>

        <!-- Reject -->
        <Button
          v-if="canReject"
          variant="destructive"
          @click="showRejectModal = true"
        >
          <XCircle class="w-4 h-4 mr-2" />
          Reject
        </Button>

        <!-- Complete -->
        <Button
          v-if="canComplete"
          variant="success"
          @click="handleComplete"
          :disabled="completeMutation.isPending.value"
        >
          <CheckCircle class="w-4 h-4 mr-2" />
          Complete
        </Button>

        <!-- More actions dropdown -->
        <DropdownMenuRoot>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="icon">
              <MoreHorizontal class="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuPortal>
            <DropdownMenuContent
              class="min-w-[180px] bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1 z-50"
              :side-offset="5"
              align="end"
            >
              <DropdownMenuItem
                v-if="canEdit"
                class="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                @click="router.push(`/sales/sales-returns/${id}/edit`)"
              >
                <Edit class="w-4 h-4" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                v-if="salesReturn.journal_entry"
                class="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                @click="router.push(`/accounting/journal-entries/${salesReturn.journal_entry.id}`)"
              >
                <BookOpen class="w-4 h-4" />
                View Journal Entry
              </DropdownMenuItem>

              <DropdownMenuSeparator class="h-px bg-slate-200 dark:bg-slate-700 my-1" />

              <DropdownMenuItem
                v-if="canCancel"
                class="flex items-center gap-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded cursor-pointer"
                @click="showCancelModal = true"
              >
                <XCircle class="w-4 h-4" />
                Cancel
              </DropdownMenuItem>

              <DropdownMenuItem
                v-if="canDelete"
                class="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer"
                @click="showDeleteModal = true"
              >
                <Trash2 class="w-4 h-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenuPortal>
        </DropdownMenuRoot>
      </div>
    </div>

    <!-- Loading State -->
    <Card v-if="isLoading" class="text-center py-12">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading sales return...</span>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-else-if="error" class="text-center py-12">
      <p class="text-red-500">Failed to load sales return</p>
    </Card>

    <!-- Content -->
    <div v-else-if="salesReturn" class="space-y-6">
        <!-- Rejection Reason -->
        <Alert
          v-if="salesReturn.status.value === 'rejected' && salesReturn.rejection_reason"
          variant="destructive"
          class="mb-6"
        >
        <p class="text-sm font-medium text-red-700 dark:text-red-300">Rejection Reason</p>
        <p class="text-red-600 dark:text-red-400">{{ salesReturn.rejection_reason }}</p>
      </Card>

      <!-- Info Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- General Info -->
        <Card>
          <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">General Information</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Calendar class="w-4 h-4" />
                Return Date
              </dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ formatDate(salesReturn.return_date) }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <FileText class="w-4 h-4" />
                Invoice
              </dt>
              <dd>
                <RouterLink
                  v-if="salesReturn.invoice"
                  :to="`/invoices/${salesReturn.invoice.id}`"
                  class="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {{ salesReturn.invoice.invoice_number }}
                </RouterLink>
                <span v-else class="text-slate-400">-</span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Warehouse</dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ salesReturn.warehouse?.name || '-' }}
              </dd>
            </div>
            <div v-if="salesReturn.reason" class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Reason</dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ salesReturn.reason }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <User class="w-4 h-4" />
                Created By
              </dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ salesReturn.creator?.name || '-' }}
              </dd>
            </div>
          </dl>
        </Card>

        <!-- Amounts -->
        <Card>
          <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Amounts</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Subtotal</dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ formatCurrency(salesReturn.subtotal || 0) }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">
                Tax ({{ salesReturn.tax_rate || 0 }}%)
              </dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ formatCurrency(salesReturn.tax_amount || 0) }}
              </dd>
            </div>
            <div class="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
              <dt class="text-slate-900 dark:text-slate-100 font-medium">Total</dt>
              <dd class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {{ formatCurrency(salesReturn.total_amount || 0) }}
              </dd>
            </div>
          </dl>

          <!-- Journal Entry Link -->
          <div v-if="salesReturn.journal_entry" class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <RouterLink
              :to="`/accounting/journal-entries/${salesReturn.journal_entry.id}`"
              class="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
            >
              <BookOpen class="w-4 h-4" />
              View Journal Entry ({{ salesReturn.journal_entry.entry_number }})
            </RouterLink>
          </div>
        </Card>
      </div>

      <!-- Items Table -->
      <Card>
        <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Items</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700">
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Product</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Description</th>
                <th class="text-center py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Qty</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Unit</th>
                <th class="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Unit Price</th>
                <th class="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in salesReturn.items"
                :key="item.id"
                class="border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <td class="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                  {{ item.product?.name || '-' }}
                </td>
                <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                  {{ item.description || '-' }}
                </td>
                <td class="py-3 px-4 text-center text-slate-900 dark:text-slate-100">
                  {{ item.quantity }}
                </td>
                <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                  {{ item.unit || '-' }}
                </td>
                <td class="py-3 px-4 text-right text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(Number(item.unit_price) || 0) }}
                </td>
                <td class="py-3 px-4 text-right font-medium text-slate-900 dark:text-slate-100">
                  {{ formatCurrency((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <!-- Notes -->
      <Card v-if="salesReturn.notes">
        <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Notes</h3>
        <p class="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{{ salesReturn.notes }}</p>
      </Card>

      <!-- Activity Timeline -->
      <Card>
        <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Activity</h3>
        <div class="space-y-4">
          <div v-if="salesReturn.completed_at" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle class="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-slate-100">Completed</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ formatDateTime(salesReturn.completed_at) }}
              </p>
            </div>
          </div>

          <div v-if="salesReturn.rejected_at" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle class="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-slate-100">Rejected</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ formatDateTime(salesReturn.rejected_at) }}
              </p>
            </div>
          </div>

          <div v-if="salesReturn.approved_at" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle class="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-slate-100">Approved</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ formatDateTime(salesReturn.approved_at) }}
              </p>
            </div>
          </div>

          <div v-if="salesReturn.submitted_at" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Send class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-slate-100">Submitted</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ formatDateTime(salesReturn.submitted_at) }}
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Clock class="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-slate-100">Created</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ formatDateTime(salesReturn.created_at) }}
                <span v-if="salesReturn.creator"> by {{ salesReturn.creator.name }}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Reject Modal -->
    <Modal
      :open="showRejectModal"
      title="Reject Sales Return"
      @close="showRejectModal = false"
    >
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Reason (optional)
        </label>
        <Input v-model="rejectReason" placeholder="Enter rejection reason" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showRejectModal = false">Cancel</Button>
          <Button variant="destructive" @click="handleReject" :disabled="rejectMutation.isPending.value">
            <XCircle class="w-4 h-4 mr-2" />
            Reject
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Cancel Modal -->
    <Modal
      :open="showCancelModal"
      title="Cancel Sales Return"
      @close="showCancelModal = false"
    >
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Are you sure you want to cancel this sales return?
      </p>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Reason (optional)
        </label>
        <Input v-model="cancelReason" placeholder="Enter cancellation reason" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showCancelModal = false">Keep</Button>
          <Button variant="warning" @click="handleCancel" :disabled="cancelMutation.isPending.value">
            <XCircle class="w-4 h-4 mr-2" />
            Cancel Return
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal
      :open="showDeleteModal"
      title="Delete Sales Return"
      @close="showDeleteModal = false"
    >
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this sales return? This action cannot be undone.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showDeleteModal = false">Cancel</Button>
          <Button variant="destructive" @click="handleDelete" :disabled="deleteMutation.isPending.value">
            <Trash2 class="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </template>
    </Modal>
  </div>
</template>
