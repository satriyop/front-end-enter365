<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  useGoodsReceiptNote,
  useStartReceiving,
  useCompleteGRN,
  useCancelGRN,
  useUpdateGRNItem,
  getGRNStatus,
  formatGRNNumber,
  type GoodsReceiptNoteItem,
  type UpdateGoodsReceiptNoteItemData,
} from '@/api/useGoodsReceiptNotes'
import { getErrorMessage } from '@/api/client'
import { formatDate } from '@/utils/format'
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  AlertTriangle,
} from 'lucide-vue-next'

// UI Components
import { Button, Badge, Card, Modal, Input, PageSkeleton, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'

const route = useRoute()
const toast = useToast()

const grnId = computed(() => Number(route.params.id))

// Data fetching
const { data: grn, isLoading, error } = useGoodsReceiptNote(grnId)

// Mutations
const startReceivingMutation = useStartReceiving()
const completeMutation = useCompleteGRN()
const cancelMutation = useCancelGRN()
const updateItemMutation = useUpdateGRNItem()

// Modal states
const showCancelModal = ref(false)
const showItemModal = ref(false)
const selectedItem = ref<GoodsReceiptNoteItem | null>(null)
const editingQuantity = ref({
  received: 0,
  rejected: 0,
  rejection_reason: '',
})

// Action handlers
async function handleStartReceiving() {
  try {
    await startReceivingMutation.mutateAsync(grnId.value)
    toast.success('Receiving process started')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to start receiving'))
  }
}

async function handleComplete() {
  try {
    await completeMutation.mutateAsync(grnId.value)
    toast.success('GRN completed, inventory updated')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to complete GRN'))
  }
}

async function handleCancel() {
  try {
    await cancelMutation.mutateAsync(grnId.value)
    showCancelModal.value = false
    toast.success('GRN cancelled')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to cancel GRN'))
  }
}

function openItemModal(item: GoodsReceiptNoteItem) {
  selectedItem.value = item
  editingQuantity.value = {
    received: Number(item.quantity_received) || 0,
    rejected: Number(item.quantity_rejected) || 0,
    rejection_reason: item.rejection_reason || '',
  }
  showItemModal.value = true
}

async function handleUpdateItem() {
  if (!selectedItem.value) return

  const data: UpdateGoodsReceiptNoteItemData = {
    quantity_received: editingQuantity.value.received,
    quantity_rejected: editingQuantity.value.rejected,
    rejection_reason: editingQuantity.value.rejection_reason || undefined,
  }

  try {
    await updateItemMutation.mutateAsync({
      grnId: grnId.value,
      itemId: Number(selectedItem.value.id),
      data,
    })
    showItemModal.value = false
    selectedItem.value = null
    toast.success('Item updated')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to update item'))
  }
}

// Set max quantity for an item
function setMaxReceived() {
  if (selectedItem.value) {
    editingQuantity.value.received = Number(selectedItem.value.quantity_ordered)
    editingQuantity.value.rejected = 0
  }
}

// Line items table columns
const itemColumns: ResponsiveColumn[] = [
  { key: 'item', label: 'Item', mobilePriority: 1 },
  { key: 'ordered', label: 'Ordered', align: 'right', mobilePriority: 3 },
  { key: 'received', label: 'Received', align: 'right', mobilePriority: 2 },
  { key: 'rejected', label: 'Rejected', align: 'right', showInMobile: false },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'actions', label: '', showInMobile: false },
]

// Calculate if all items are fully received
const isFullyReceived = computed(() => {
  if (!grn.value?.items) return false
  return grn.value.items.every(item =>
    Number(item.quantity_received) + Number(item.quantity_rejected) >= Number(item.quantity_ordered)
  )
})
</script>

<template>
  <div>
    <!-- Loading -->
    <PageSkeleton v-if="isLoading" type="detail" />

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500 dark:text-red-400">
      {{ getErrorMessage(error, 'Failed to load goods receipt note') }}
    </div>

    <!-- Content -->
    <template v-else-if="grn">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/purchasing/goods-receipt-notes" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft class="w-4 h-4" />
          Goods Receipt Notes
        </RouterLink>
        <span>/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ formatGRNNumber(grn) }}</span>
      </div>

      <!-- Header Card -->
      <Card class="mb-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ formatGRNNumber(grn) }}
              </h1>
              <Badge :class="getGRNStatus(grn).color">
                {{ getGRNStatus(grn).label }}
              </Badge>
            </div>
            <p v-if="grn.purchase_order" class="text-slate-500 dark:text-slate-400">
              From PO: {{ grn.purchase_order.po_number }}
              <span v-if="grn.purchase_order.contact"> - {{ grn.purchase_order.contact.name }}</span>
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <!-- Start Receiving (draft) -->
            <Button
              v-if="grn.status.value === 'draft'"
              size="sm"
              :loading="startReceivingMutation.isPending.value"
              @click="handleStartReceiving"
            >
              <Play class="w-4 h-4 mr-1" />
              Start Receiving
            </Button>

            <!-- Complete (receiving, when all items checked) -->
            <Button
              v-if="grn.can_complete && isFullyReceived"
              variant="success"
              size="sm"
              :loading="completeMutation.isPending.value"
              @click="handleComplete"
            >
              <CheckCircle class="w-4 h-4 mr-1" />
              Complete & Update Inventory
            </Button>

            <!-- View PO -->
            <RouterLink v-if="grn.purchase_order_id" :to="`/purchasing/purchase-orders/${grn.purchase_order_id}`">
              <Button variant="secondary" size="sm">
                View Purchase Order
              </Button>
            </RouterLink>

            <!-- Cancel -->
            <Button
              v-if="grn.can_cancel"
              variant="ghost"
              size="sm"
              class="text-red-500 hover:text-red-600"
              @click="showCancelModal = true"
            >
              <XCircle class="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </Card>

      <!-- Receiving Progress Banner -->
      <Card
        v-if="grn.status.value === 'receiving'"
        class="mb-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <Truck class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-blue-600 dark:text-blue-400 font-medium">Receiving in Progress</p>
            <div class="flex items-center gap-2">
              <div class="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-2 overflow-hidden">
                <div
                  class="bg-blue-600 dark:bg-blue-400 h-full rounded-full transition-all"
                  :style="{ width: `${grn.receiving_progress || 0}%` }"
                />
              </div>
              <span class="text-sm font-medium text-blue-700 dark:text-blue-300">{{ grn.receiving_progress || 0 }}%</span>
            </div>
            <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Click on items below to update received quantities
            </p>
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
                <dt class="text-sm text-slate-500 dark:text-slate-400">Receipt Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(grn.receipt_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Warehouse</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ grn.warehouse?.name || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Supplier DO Number</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ grn.supplier_do_number || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Supplier Invoice Number</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ grn.supplier_invoice_number || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Vehicle Number</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ grn.vehicle_number || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Driver Name</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ grn.driver_name || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Items Card -->
          <Card :padding="false">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Items</h2>
            </template>

            <ResponsiveTable
              :items="grn.items || []"
              :columns="itemColumns"
              title-field="product.name"
            >
              <!-- Item -->
              <template #cell-item="{ item }">
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ item.product?.name || '-' }}
                </div>
                <div v-if="item.lot_number" class="text-sm text-slate-500 dark:text-slate-400">
                  Lot: {{ item.lot_number }}
                </div>
              </template>

              <!-- Ordered -->
              <template #cell-ordered="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ item.quantity_ordered }}</span>
              </template>

              <!-- Received -->
              <template #cell-received="{ item }">
                <span
                  :class="[
                    'font-medium',
                    Number(item.quantity_received) >= Number(item.quantity_ordered)
                      ? 'text-green-600 dark:text-green-400'
                      : Number(item.quantity_received) > 0
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-slate-500 dark:text-slate-400'
                  ]"
                >
                  {{ item.quantity_received }}
                </span>
              </template>

              <!-- Rejected -->
              <template #cell-rejected="{ item }">
                <span v-if="Number(item.quantity_rejected) > 0" class="text-red-600 dark:text-red-400">
                  {{ item.quantity_rejected }}
                </span>
                <span v-else class="text-slate-400">-</span>
              </template>

              <!-- Status -->
              <template #cell-status="{ item }">
                <div class="flex items-center gap-1">
                  <CheckCircle
                    v-if="Number(item.quantity_received) + Number(item.quantity_rejected) >= Number(item.quantity_ordered)"
                    class="w-4 h-4 text-green-500"
                  />
                  <AlertTriangle
                    v-else-if="Number(item.quantity_received) > 0"
                    class="w-4 h-4 text-yellow-500"
                  />
                  <Package v-else class="w-4 h-4 text-slate-400" />
                </div>
              </template>

              <!-- Mobile title -->
              <template #mobile-title="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.product?.name || '-' }}</span>
              </template>

              <!-- Actions -->
              <template #actions="{ item }">
                <Button
                  v-if="grn.status.value === 'receiving'"
                  variant="ghost"
                  size="xs"
                  @click.stop="openItemModal(item)"
                >
                  Update
                </Button>
              </template>
            </ResponsiveTable>
          </Card>

          <!-- Notes -->
          <Card v-if="grn.notes">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
            </template>
            <p class="text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ grn.notes }}</p>
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
                <dt class="text-slate-500 dark:text-slate-400">Total Items</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ grn.total_items }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Qty Ordered</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ grn.total_quantity_ordered }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Qty Received</dt>
                <dd class="font-medium text-green-600 dark:text-green-400">{{ grn.total_quantity_received }}</dd>
              </div>
              <div v-if="Number(grn.total_quantity_rejected) > 0" class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Qty Rejected</dt>
                <dd class="font-medium text-red-600 dark:text-red-400">{{ grn.total_quantity_rejected }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Activity Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Activity</h2>
            </template>

            <ul class="space-y-3 text-sm">
              <li v-if="grn.completed_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Completed</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(grn.completed_at) }}</p>
                </div>
              </li>
              <li v-if="grn.cancelled_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-red-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Cancelled</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(grn.cancelled_at) }}</p>
                </div>
              </li>
              <li v-if="grn.received_by_user" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Received by {{ grn.received_by_user.name }}</p>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Created</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(grn.created_at) }}</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </template>

    <!-- Cancel Modal -->
    <Modal :open="showCancelModal" title="Cancel GRN" size="sm" @update:open="showCancelModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to cancel this goods receipt note?
        This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showCancelModal = false">No, Keep It</Button>
        <Button
          variant="destructive"
          :loading="cancelMutation.isPending.value"
          @click="handleCancel"
        >
          Yes, Cancel GRN
        </Button>
      </template>
    </Modal>

    <!-- Update Item Modal -->
    <Modal :open="showItemModal" title="Update Received Quantity" size="sm" @update:open="showItemModal = $event">
      <div v-if="selectedItem" class="space-y-4">
        <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <p class="font-medium text-slate-900 dark:text-slate-100">
            {{ selectedItem.product?.name || '-' }}
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Ordered: {{ selectedItem.quantity_ordered }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Quantity Received
          </label>
          <div class="flex gap-2">
            <Input
              v-model.number="editingQuantity.received"
              type="number"
              :min="0"
              :max="Number(selectedItem.quantity_ordered)"
            />
            <Button variant="ghost" size="sm" @click="setMaxReceived">
              Max
            </Button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Quantity Rejected
          </label>
          <Input
            v-model.number="editingQuantity.rejected"
            type="number"
            :min="0"
            :max="Number(selectedItem.quantity_ordered) - editingQuantity.received"
          />
        </div>

        <div v-if="editingQuantity.rejected > 0">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Rejection Reason
          </label>
          <textarea
            v-model="editingQuantity.rejection_reason"
            rows="2"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Reason for rejection..."
          />
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showItemModal = false">Cancel</Button>
        <Button
          :loading="updateItemMutation.isPending.value"
          @click="handleUpdateItem"
        >
          Update
        </Button>
      </template>
    </Modal>
  </div>
</template>
