<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  usePurchaseOrder,
  useSubmitPurchaseOrder,
  useApprovePurchaseOrder,
  useRejectPurchaseOrder,
  useCancelPurchaseOrder,
  useReceivePurchaseOrder,
  useConvertPurchaseOrderToBill,
  useDuplicatePurchaseOrder,
  useDeletePurchaseOrder,
  getPurchaseOrderStatus,
  formatPONumber,
  type ReceiveItemData,
} from '@/api/usePurchaseOrders'
import { getErrorMessage } from '@/api/client'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle,
  XCircle,
  Ban,
  Package,
  FileText,
  Copy,
  Trash2,
  Printer,
  TruckIcon,
} from 'lucide-vue-next'

// UI Components
import { Button, Badge, Card, Modal, Input, PageSkeleton, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const poId = computed(() => Number(route.params.id))

// Data fetching
const { data: po, isLoading, error } = usePurchaseOrder(poId)

// Mutations
const submitMutation = useSubmitPurchaseOrder()
const approveMutation = useApprovePurchaseOrder()
const rejectMutation = useRejectPurchaseOrder()
const cancelMutation = useCancelPurchaseOrder()
const receiveMutation = useReceivePurchaseOrder()
const convertMutation = useConvertPurchaseOrderToBill()
const duplicateMutation = useDuplicatePurchaseOrder()
const deleteMutation = useDeletePurchaseOrder()

// Modal states
const showRejectModal = ref(false)
const showCancelModal = ref(false)
const showReceiveModal = ref(false)
const showDeleteModal = ref(false)
const rejectReason = ref('')
const cancelReason = ref('')

// Receive items state
const receiveItems = ref<ReceiveItemData[]>([])

function initReceiveItems() {
  if (!po.value?.items) return
  receiveItems.value = po.value.items
    .filter(item => Number(item.quantity_remaining) > 0)
    .map(item => ({
      item_id: Number(item.id),
      quantity: 0,
    }))
}

// Action handlers
async function handleSubmit() {
  try {
    await submitMutation.mutateAsync(poId.value)
    toast.success('Purchase order submitted for approval')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to submit purchase order'))
  }
}

async function handleApprove() {
  try {
    await approveMutation.mutateAsync(poId.value)
    toast.success('Purchase order approved')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to approve purchase order'))
  }
}

async function handleReject() {
  if (!rejectReason.value.trim()) {
    toast.error('Rejection reason is required')
    return
  }
  try {
    await rejectMutation.mutateAsync({ id: poId.value, reason: rejectReason.value })
    showRejectModal.value = false
    rejectReason.value = ''
    toast.success('Purchase order rejected')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to reject purchase order'))
  }
}

async function handleCancel() {
  if (!cancelReason.value.trim()) {
    toast.error('Cancellation reason is required')
    return
  }
  try {
    await cancelMutation.mutateAsync({ id: poId.value, reason: cancelReason.value })
    showCancelModal.value = false
    cancelReason.value = ''
    toast.success('Purchase order cancelled')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to cancel purchase order'))
  }
}

async function handleReceive() {
  const itemsToReceive = receiveItems.value.filter(item => item.quantity > 0)
  if (itemsToReceive.length === 0) {
    toast.error('Please enter quantities to receive')
    return
  }
  try {
    await receiveMutation.mutateAsync({ id: poId.value, items: itemsToReceive })
    showReceiveModal.value = false
    receiveItems.value = []
    toast.success('Items received successfully')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to receive items'))
  }
}

async function handleConvertToBill() {
  try {
    const result = await convertMutation.mutateAsync(poId.value)
    toast.success('Bill created successfully')
    router.push(`/bills/${result.bill_id}`)
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to convert to bill'))
  }
}

async function handleDuplicate() {
  try {
    const duplicate = await duplicateMutation.mutateAsync(poId.value)
    toast.success('Purchase order duplicated')
    router.push(`/purchasing/purchase-orders/${duplicate.id}/edit`)
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to duplicate purchase order'))
  }
}

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(poId.value)
    showDeleteModal.value = false
    toast.success('Purchase order deleted')
    router.push('/purchasing/purchase-orders')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to delete purchase order'))
  }
}

// Open receive modal
function openReceiveModal() {
  initReceiveItems()
  showReceiveModal.value = true
}

// Get remaining quantity for an item
function getRemainingQuantity(itemId: number | string): number {
  const item = po.value?.items?.find(i => i.id === itemId)
  return item ? Number(item.quantity_remaining) : 0
}

// Set max quantity for receive
function setMaxQuantity(index: number, itemId: number | string) {
  const item = receiveItems.value[index]
  if (item) {
    item.quantity = getRemainingQuantity(itemId)
  }
}

// Line items table columns
const itemColumns: ResponsiveColumn[] = [
  { key: 'item', label: 'Item', mobilePriority: 1 },
  { key: 'quantity', label: 'Qty', align: 'right', mobilePriority: 3 },
  { key: 'received', label: 'Received', align: 'right', showInMobile: false },
  { key: 'unit_price', label: 'Price', align: 'right', showInMobile: false },
  { key: 'line_total', label: 'Total', align: 'right', mobilePriority: 2 },
]
</script>

<template>
  <div>
    <!-- Loading -->
    <PageSkeleton v-if="isLoading" type="detail" />

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500 dark:text-red-400">
      {{ getErrorMessage(error, 'Failed to load purchase order') }}
    </div>

    <!-- Content -->
    <template v-else-if="po">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/purchasing/purchase-orders" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft class="w-4 h-4" />
          Purchase Orders
        </RouterLink>
        <span>/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ formatPONumber(po) }}</span>
      </div>

      <!-- Header Card -->
      <Card class="mb-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ formatPONumber(po) }}
              </h1>
              <Badge :status="po.status">
                {{ po.status_label }}
              </Badge>
            </div>
            <p class="text-slate-500 dark:text-slate-400">{{ po.contact?.name }}</p>
            <p v-if="po.subject" class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ po.subject }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <!-- Print -->
            <Button variant="ghost" size="sm">
              <Printer class="w-4 h-4 mr-1" />
              Print
            </Button>

            <!-- Duplicate -->
            <Button
              variant="ghost"
              size="sm"
              :loading="duplicateMutation.isPending.value"
              @click="handleDuplicate"
            >
              <Copy class="w-4 h-4 mr-1" />
              Duplicate
            </Button>

            <!-- Edit (draft only) -->
            <RouterLink v-if="po.can_edit" :to="`/purchasing/purchase-orders/${poId}/edit`">
              <Button variant="secondary" size="sm">
                <Edit class="w-4 h-4 mr-1" />
                Edit
              </Button>
            </RouterLink>

            <!-- Submit (draft) -->
            <Button
              v-if="po.can_submit"
              size="sm"
              :loading="submitMutation.isPending.value"
              @click="handleSubmit"
            >
              <Send class="w-4 h-4 mr-1" />
              Submit
            </Button>

            <!-- Approve (pending) -->
            <Button
              v-if="po.can_approve"
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
              v-if="po.can_reject"
              variant="destructive"
              size="sm"
              @click="showRejectModal = true"
            >
              <XCircle class="w-4 h-4 mr-1" />
              Reject
            </Button>

            <!-- Receive Items (approved/partial) -->
            <Button
              v-if="po.can_receive"
              variant="secondary"
              size="sm"
              @click="openReceiveModal"
            >
              <Package class="w-4 h-4 mr-1" />
              Receive Items
            </Button>

            <!-- Convert to Bill (received) -->
            <Button
              v-if="po.can_convert"
              size="sm"
              :loading="convertMutation.isPending.value"
              @click="handleConvertToBill"
            >
              <FileText class="w-4 h-4 mr-1" />
              Create Bill
            </Button>

            <!-- Cancel (approved/partial, not fully received) -->
            <Button
              v-if="po.can_cancel"
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
              v-if="po.can_edit"
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

      <!-- Receiving Progress Banner -->
      <Card
        v-if="po.status.value === 'partial' || po.status.value === 'approved'"
        class="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <TruckIcon class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-blue-600 dark:text-blue-400 font-medium">Receiving Progress</p>
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-blue-600 dark:bg-blue-400 h-full rounded-full transition-all"
                  :style="{ width: `${po.receiving_progress || 0}%` }"
                />
              </div>
              <span class="text-sm font-medium text-blue-700 dark:text-blue-300">{{ po.receiving_progress || 0 }}%</span>
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
                <dt class="text-sm text-slate-500 dark:text-slate-400">PO Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(po.po_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Expected Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ po.expected_date ? formatDate(po.expected_date) : '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Vendor</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ po.contact?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Reference</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ po.reference || '-' }}</dd>
              </div>
              <div v-if="po.currency !== 'IDR'">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Currency</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ po.currency }} ({{ po.exchange_rate }})</dd>
              </div>
              <div v-if="po.shipping_address">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Shipping Address</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ po.shipping_address }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Items Card -->
          <Card :padding="false">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Line Items</h2>
            </template>

            <ResponsiveTable
              :items="po.items || []"
              :columns="itemColumns"
              title-field="description"
            >
              <!-- Item -->
              <template #cell-item="{ item }">
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ item.product?.name || item.description }}
                </div>
                <div v-if="item.product?.name && item.description !== item.product?.name" class="text-sm text-slate-500 dark:text-slate-400">
                  {{ item.description }}
                </div>
              </template>

              <!-- Quantity -->
              <template #cell-quantity="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ item.quantity }} {{ item.unit }}</span>
              </template>

              <!-- Received -->
              <template #cell-received="{ item }">
                <div class="text-right">
                  <span class="text-slate-900 dark:text-slate-100">{{ item.quantity_received }}</span>
                  <span v-if="Number(item.quantity_remaining) > 0" class="text-slate-500 dark:text-slate-400 text-xs ml-1">
                    ({{ item.quantity_remaining }} left)
                  </span>
                  <CheckCircle v-else class="w-4 h-4 text-green-500 inline ml-1" />
                </div>
              </template>

              <!-- Unit Price -->
              <template #cell-unit_price="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ formatCurrency(item.unit_price) }}</span>
              </template>

              <!-- Line Total -->
              <template #cell-line_total="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(item.line_total) }}</span>
              </template>

              <!-- Mobile title -->
              <template #mobile-title="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.product?.name || item.description }}</span>
              </template>
            </ResponsiveTable>
          </Card>

          <!-- Notes & Terms -->
          <Card v-if="po.notes || po.terms_conditions">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Notes & Terms</h2>
            </template>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-if="po.notes">
                <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Notes</h3>
                <p class="text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ po.notes }}</p>
              </div>
              <div v-if="po.terms_conditions">
                <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Terms & Conditions</h3>
                <p class="text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ po.terms_conditions }}</p>
              </div>
            </div>
          </Card>

          <!-- Rejection/Cancellation Reason -->
          <Card v-if="po.rejection_reason || po.cancellation_reason" class="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <template #header>
              <h2 class="font-semibold text-red-700 dark:text-red-400">
                {{ po.cancellation_reason ? 'Cancellation Reason' : 'Rejection Reason' }}
              </h2>
            </template>
            <p class="text-red-700 dark:text-red-400">{{ po.cancellation_reason || po.rejection_reason }}</p>
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
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(po.subtotal) }}</dd>
              </div>
              <div v-if="po.discount_amount" class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">
                  Discount
                  <span v-if="po.discount_type === 'percentage'" class="text-xs">({{ po.discount_value }}%)</span>
                </dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">-{{ formatCurrency(po.discount_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Tax ({{ po.tax_rate }}%)</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(po.tax_amount) }}</dd>
              </div>
              <hr class="border-slate-200 dark:border-slate-700" />
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900 dark:text-slate-100">Total</dt>
                <dd class="font-bold text-lg text-primary-600 dark:text-primary-400">{{ formatCurrency(po.total) }}</dd>
              </div>
              <div v-if="po.currency !== 'IDR'" class="flex justify-between text-sm">
                <dt class="text-slate-500 dark:text-slate-400">Base Currency</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(po.base_currency_total) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Activity Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Activity</h2>
            </template>

            <ul class="space-y-3 text-sm">
              <li v-if="po.fully_received_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Fully Received</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(po.fully_received_at) }}</p>
                </div>
              </li>
              <li v-if="po.first_received_at && !po.fully_received_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-purple-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Partially Received</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(po.first_received_at) }}</p>
                </div>
              </li>
              <li v-if="po.converted_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Converted to Bill</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(po.converted_at) }}</p>
                </div>
              </li>
              <li v-if="po.cancelled_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-red-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Cancelled</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(po.cancelled_at) }}</p>
                </div>
              </li>
              <li v-if="po.rejected_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-red-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Rejected</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(po.rejected_at) }}</p>
                </div>
              </li>
              <li v-if="po.approved_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Approved</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(po.approved_at) }}</p>
                </div>
              </li>
              <li v-if="po.submitted_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-amber-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Submitted</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(po.submitted_at) }}</p>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Created</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(po.created_at) }}</p>
                </div>
              </li>
            </ul>
          </Card>

          <!-- Linked Bill -->
          <Card v-if="po.converted_to_bill_id">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Linked Bill</h2>
            </template>
            <RouterLink
              :to="`/bills/${po.converted_to_bill_id}`"
              class="text-primary-600 dark:text-primary-400 hover:underline"
            >
              View Bill #{{ po.converted_to_bill_id }}
            </RouterLink>
          </Card>
        </div>
      </div>
    </template>

    <!-- Reject Modal -->
    <Modal :open="showRejectModal" title="Reject Purchase Order" size="sm" @update:open="showRejectModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Please provide a reason for rejecting this purchase order.
      </p>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Reason <span class="text-red-500">*</span>
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
    <Modal :open="showCancelModal" title="Cancel Purchase Order" size="sm" @update:open="showCancelModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Please provide a reason for cancelling this purchase order.
      </p>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Reason <span class="text-red-500">*</span>
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
          Cancel PO
        </Button>
      </template>
    </Modal>

    <!-- Receive Items Modal -->
    <Modal :open="showReceiveModal" title="Receive Items" size="lg" @update:open="showReceiveModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Enter the quantities received for each item.
      </p>

      <div class="space-y-4">
        <div
          v-for="(receiveItem, index) in receiveItems"
          :key="receiveItem.item_id"
          class="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
        >
          <div class="flex-1">
            <p class="font-medium text-slate-900 dark:text-slate-100">
              {{ po?.items?.find(i => Number(i.id) === receiveItem.item_id)?.description }}
            </p>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Remaining: {{ getRemainingQuantity(receiveItem.item_id) }}
              {{ po?.items?.find(i => Number(i.id) === receiveItem.item_id)?.unit }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Input
              v-model.number="receiveItem.quantity"
              type="number"
              class="w-24"
              :min="0"
              :max="getRemainingQuantity(receiveItem.item_id)"
            />
            <Button
              variant="ghost"
              size="xs"
              @click="setMaxQuantity(index, receiveItem.item_id)"
            >
              Max
            </Button>
          </div>
        </div>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showReceiveModal = false">Cancel</Button>
        <Button
          :loading="receiveMutation.isPending.value"
          @click="handleReceive"
        >
          <Package class="w-4 h-4 mr-1" />
          Receive Items
        </Button>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Purchase Order" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this purchase order? This action cannot be undone.
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
