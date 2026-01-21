<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useDownPayment,
  useRefundDownPayment,
  useCancelDownPayment,
  useDeleteDownPayment,
  useUnapplyDownPayment,
  getDownPaymentStatus,
  getDownPaymentType,
  formatDPNumber,
  type RefundDownPaymentData,
} from '@/api/useDownPayments'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'
import {
  ArrowLeft,
  RefreshCcw,
  XCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  User,
  Clock,
  CreditCard,
  FileText,
  BookOpen,
  Undo2,
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

// Fetch down payment
const { data: downPayment, isLoading, error } = useDownPayment(id)

// Mutations
const refundMutation = useRefundDownPayment()
const cancelMutation = useCancelDownPayment()
const deleteMutation = useDeleteDownPayment()
const unapplyMutation = useUnapplyDownPayment()

// Computed for workflow permissions
const hasRemaining = computed(() => Number(downPayment.value?.remaining_amount || 0) > 0)
const canRefund = computed(() => downPayment.value?.status === 'active' && hasRemaining.value)
const canCancel = computed(() => downPayment.value?.status === 'active' && !downPayment.value?.applications?.length)
const canEdit = computed(() => downPayment.value?.status === 'active' && !downPayment.value?.applications?.length)
const canDelete = computed(() => downPayment.value?.status === 'active' && !downPayment.value?.applications?.length)

// Modals
const showRefundModal = ref(false)
const showCancelModal = ref(false)
const showDeleteModal = ref(false)
const showUnapplyModal = ref(false)
const selectedApplicationId = ref<number | null>(null)

// Form data
const refundData = ref<RefundDownPaymentData>({
  refund_amount: 0,
  refund_date: new Date().toISOString().split('T')[0],
  notes: '',
})
const cancelReason = ref('')

// Initialize refund amount when modal opens
function openRefundModal() {
  refundData.value.refund_amount = Number(downPayment.value?.remaining_amount || 0)
  showRefundModal.value = true
}

// Workflow actions
async function handleRefund() {
  await refundMutation.mutateAsync({ id: id.value, data: refundData.value })
  showRefundModal.value = false
}

async function handleCancel() {
  await cancelMutation.mutateAsync({ id: id.value, reason: cancelReason.value })
  showCancelModal.value = false
  cancelReason.value = ''
}

async function handleDelete() {
  await deleteMutation.mutateAsync(id.value)
  router.push('/finance/down-payments')
}

function openUnapplyModal(applicationId: number) {
  selectedApplicationId.value = applicationId
  showUnapplyModal.value = true
}

async function handleUnapply() {
  if (selectedApplicationId.value) {
    await unapplyMutation.mutateAsync({
      downPaymentId: id.value,
      applicationId: selectedApplicationId.value,
    })
    showUnapplyModal.value = false
    selectedApplicationId.value = null
  }
}

function goBack() {
  router.push('/finance/down-payments')
}

// Progress calculation
const usageProgress = computed(() => {
  if (!downPayment.value?.amount) return 0
  const applied = Number(downPayment.value.applied_amount || 0)
  const total = Number(downPayment.value.amount)
  return Math.round((applied / total) * 100)
})
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
            {{ downPayment ? formatDPNumber(downPayment) : 'Loading...' }}
          </h1>
          <Badge v-if="downPayment" :class="getDownPaymentStatus(downPayment).color">
            {{ getDownPaymentStatus(downPayment).label }}
          </Badge>
          <Badge v-if="downPayment" :class="getDownPaymentType(downPayment).color">
            {{ getDownPaymentType(downPayment).label }}
          </Badge>
        </div>
        <p class="text-slate-500 dark:text-slate-400">
          {{ downPayment?.contact?.name || '' }}
        </p>
      </div>

      <!-- Actions -->
      <div v-if="downPayment" class="flex items-center gap-2">
        <!-- Refund -->
        <Button
          v-if="canRefund"
          variant="outline"
          @click="openRefundModal"
        >
          <RefreshCcw class="w-4 h-4 mr-2" />
          Refund
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
                @click="router.push(`/finance/down-payments/${id}/edit`)"
              >
                <Edit class="w-4 h-4" />
                Edit
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
        <span>Loading down payment...</span>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-else-if="error" class="text-center py-12">
      <p class="text-red-500">Failed to load down payment</p>
    </Card>

    <!-- Content -->
    <div v-else-if="downPayment" class="space-y-6">
      <!-- Usage Progress -->
      <Card v-if="downPayment.status === 'active'" class="p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Usage</span>
          <span class="text-sm text-slate-500 dark:text-slate-400">
            {{ formatCurrency(Number(downPayment.applied_amount) || 0) }} of {{ formatCurrency(Number(downPayment.amount) || 0) }}
          </span>
        </div>
        <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-primary-500 rounded-full transition-all"
            :style="{ width: `${usageProgress}%` }"
          />
        </div>
        <div class="flex justify-between mt-2 text-sm">
          <span class="text-slate-500 dark:text-slate-400">Applied: {{ usageProgress }}%</span>
          <span class="text-green-600 dark:text-green-400 font-medium">
            Remaining: {{ formatCurrency(Number(downPayment.remaining_amount) || 0) }}
          </span>
        </div>
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
                Date
              </dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ formatDate(downPayment.dp_date) }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <CreditCard class="w-4 h-4" />
                Payment Method
              </dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ downPayment.payment_method || '-' }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <BookOpen class="w-4 h-4" />
                Cash Account
              </dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ downPayment.cash_account?.name || '-' }}
              </dd>
            </div>
            <div v-if="downPayment.reference" class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <FileText class="w-4 h-4" />
                Reference
              </dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ downPayment.reference }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <User class="w-4 h-4" />
                Created By
              </dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ downPayment.creator?.name || '-' }}
              </dd>
            </div>
          </dl>
        </Card>

        <!-- Amounts -->
        <Card>
          <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Amounts</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Total Amount</dt>
              <dd class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {{ formatCurrency(Number(downPayment.amount) || 0) }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Applied</dt>
              <dd class="font-medium text-blue-600 dark:text-blue-400">
                {{ formatCurrency(Number(downPayment.applied_amount) || 0) }}
              </dd>
            </div>
            <div class="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-700">
              <dt class="text-slate-900 dark:text-slate-100 font-medium">Remaining</dt>
              <dd class="text-lg font-semibold text-green-600 dark:text-green-400">
                {{ formatCurrency(Number(downPayment.remaining_amount) || 0) }}
              </dd>
            </div>
          </dl>

          <!-- Refund info -->
          <div v-if="downPayment.refunded_at" class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p class="text-sm text-purple-600 dark:text-purple-400">
              Refunded on {{ formatDateTime(downPayment.refunded_at) }}
            </p>
          </div>
        </Card>
      </div>

      <!-- Description & Notes -->
      <Card v-if="downPayment.description || downPayment.notes">
        <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Details</h3>
        <div class="space-y-4">
          <div v-if="downPayment.description">
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Description</p>
            <p class="text-slate-900 dark:text-slate-100">{{ downPayment.description }}</p>
          </div>
          <div v-if="downPayment.notes">
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-1">Notes</p>
            <p class="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{{ downPayment.notes }}</p>
          </div>
        </div>
      </Card>

      <!-- Applications Table -->
      <Card v-if="downPayment.applications?.length">
        <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Applications</h3>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-200 dark:border-slate-700">
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Document</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Date</th>
                <th class="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Amount</th>
                <th class="text-right py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="app in downPayment.applications"
                :key="app.id"
                class="border-b border-slate-100 dark:border-slate-800 last:border-0"
              >
                <td class="py-3 px-4">
                  <RouterLink
                    v-if="app.applicable"
                    :to="app.applicable_type === 'invoice'
                      ? `/invoices/${app.applicable.id}`
                      : `/bills/${app.applicable.id}`"
                    class="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                  >
                    {{ app.applicable.number || '-' }}
                  </RouterLink>
                  <span v-else class="text-slate-400">-</span>
                </td>
                <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                  {{ formatDate(app.applied_date) }}
                </td>
                <td class="py-3 px-4 text-right font-medium text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(Number(app.amount) || 0) }}
                </td>
                <td class="py-3 px-4 text-right">
                  <Button
                    v-if="downPayment.status === 'active'"
                    variant="ghost"
                    size="xs"
                    @click="openUnapplyModal(Number(app.id))"
                  >
                    <Undo2 class="w-3 h-3 mr-1" />
                    Reverse
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <!-- Activity Timeline -->
      <Card>
        <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Activity</h3>
        <div class="space-y-4">
          <div v-if="downPayment.refunded_at" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <RefreshCcw class="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-slate-100">Refunded</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ formatDateTime(downPayment.refunded_at) }}
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
                {{ formatDateTime(downPayment.created_at) }}
                <span v-if="downPayment.creator"> by {{ downPayment.creator.name }}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Refund Modal -->
    <Modal
      :open="showRefundModal"
      title="Refund Down Payment"
      @close="showRefundModal = false"
    >
      <div class="space-y-4">
        <p class="text-slate-600 dark:text-slate-400">
          Refund the remaining balance to the {{ downPayment?.type === 'receivable' ? 'customer' : 'vendor' }}.
        </p>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Refund Amount
          </label>
          <Input
            v-model.number="refundData.refund_amount"
            type="number"
            :max="downPayment?.remaining_amount"
          />
          <p class="text-xs text-slate-500 mt-1">
            Max: {{ formatCurrency(Number(downPayment?.remaining_amount) || 0) }}
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Refund Date
          </label>
          <Input v-model="refundData.refund_date" type="date" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes (optional)
          </label>
          <Input v-model="refundData.notes" placeholder="Enter notes" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showRefundModal = false">Cancel</Button>
          <Button @click="handleRefund" :disabled="refundMutation.isPending.value">
            <RefreshCcw class="w-4 h-4 mr-2" />
            Refund
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Unapply Modal -->
    <Modal
      :open="showUnapplyModal"
      title="Reverse Application"
      @close="showUnapplyModal = false"
    >
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to reverse this application? The amount will be returned to the down payment balance.
      </p>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showUnapplyModal = false">Cancel</Button>
          <Button variant="warning" @click="handleUnapply" :disabled="unapplyMutation.isPending.value">
            <Undo2 class="w-4 h-4 mr-2" />
            Reverse
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Cancel Modal -->
    <Modal
      :open="showCancelModal"
      title="Cancel Down Payment"
      @close="showCancelModal = false"
    >
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Are you sure you want to cancel this down payment?
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
            Cancel
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal
      :open="showDeleteModal"
      title="Delete Down Payment"
      @close="showDeleteModal = false"
    >
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this down payment? This action cannot be undone.
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
