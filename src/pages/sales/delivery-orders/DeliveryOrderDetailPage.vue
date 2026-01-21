<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useDeliveryOrder,
  useConfirmDeliveryOrder,
  useShipDeliveryOrder,
  useDeliverDeliveryOrder,
  useCancelDeliveryOrder,
  useDeleteDeliveryOrder,
  useDuplicateDeliveryOrder,
  getDeliveryOrderStatus,
  formatDONumber,
  type ShipDeliveryOrderData,
  type DeliverDeliveryOrderData,
} from '@/api/useDeliveryOrders'
import { formatDate, formatDateTime } from '@/utils/format'
import {
  ArrowLeft,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  FileText,
  MapPin,
  Calendar,
  User,
  Clock,
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

// Fetch delivery order
const { data: deliveryOrder, isLoading, error } = useDeliveryOrder(id)

// Mutations
const confirmMutation = useConfirmDeliveryOrder()
const shipMutation = useShipDeliveryOrder()
const deliverMutation = useDeliverDeliveryOrder()
const cancelMutation = useCancelDeliveryOrder()
const deleteMutation = useDeleteDeliveryOrder()
const duplicateMutation = useDuplicateDeliveryOrder()

// Computed for workflow permissions
const canConfirm = computed(() => deliveryOrder.value?.status === 'draft')
const canShip = computed(() => deliveryOrder.value?.status === 'confirmed')
const canDeliver = computed(() => deliveryOrder.value?.status === 'shipped')
const canCancel = computed(() => ['draft', 'confirmed'].includes(deliveryOrder.value?.status || ''))
const canEdit = computed(() => deliveryOrder.value?.status === 'draft')
const canDelete = computed(() => deliveryOrder.value?.status === 'draft')

// Modals
const showShipModal = ref(false)
const showDeliverModal = ref(false)
const showCancelModal = ref(false)
const showDeleteModal = ref(false)

// Form data
const shipData = ref<ShipDeliveryOrderData>({
  shipping_date: new Date().toISOString().split('T')[0],
  tracking_number: '',
  driver_name: '',
  vehicle_number: '',
})

const deliverData = ref<DeliverDeliveryOrderData>({
  received_date: new Date().toISOString().split('T')[0],
  received_by: '',
  delivery_notes: '',
})

const cancelReason = ref('')

// Workflow actions
async function handleConfirm() {
  await confirmMutation.mutateAsync(id.value)
}

async function handleShip() {
  await shipMutation.mutateAsync({ id: id.value, data: shipData.value })
  showShipModal.value = false
}

async function handleDeliver() {
  await deliverMutation.mutateAsync({ id: id.value, data: deliverData.value })
  showDeliverModal.value = false
}

async function handleCancel() {
  await cancelMutation.mutateAsync({ id: id.value, reason: cancelReason.value })
  showCancelModal.value = false
  cancelReason.value = ''
}

async function handleDelete() {
  await deleteMutation.mutateAsync(id.value)
  router.push('/sales/delivery-orders')
}

async function handleDuplicate() {
  const newDO = await duplicateMutation.mutateAsync(id.value)
  router.push(`/sales/delivery-orders/${newDO.id}`)
}

function goBack() {
  router.push('/sales/delivery-orders')
}

// Progress calculation
const deliveryProgress = computed(() => {
  if (!deliveryOrder.value?.items?.length) return 0
  const total = deliveryOrder.value.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
  const delivered = deliveryOrder.value.items.reduce((sum, item) => sum + (item.quantity_delivered || 0), 0)
  return total > 0 ? Math.round((delivered / total) * 100) : 0
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
            {{ deliveryOrder ? formatDONumber(deliveryOrder) : 'Loading...' }}
          </h1>
          <Badge v-if="deliveryOrder" :class="getDeliveryOrderStatus(deliveryOrder).color">
            {{ getDeliveryOrderStatus(deliveryOrder).label }}
          </Badge>
        </div>
        <p class="text-slate-500 dark:text-slate-400">
          {{ deliveryOrder?.contact?.name || '' }}
        </p>
      </div>

      <!-- Actions -->
      <div v-if="deliveryOrder" class="flex items-center gap-2">
        <!-- Confirm -->
        <Button
          v-if="canConfirm"
          @click="handleConfirm"
          :disabled="confirmMutation.isPending.value"
        >
          <Package class="w-4 h-4 mr-2" />
          Confirm
        </Button>

        <!-- Ship -->
        <Button
          v-if="canShip"
          @click="showShipModal = true"
        >
          <Truck class="w-4 h-4 mr-2" />
          Ship
        </Button>

        <!-- Deliver -->
        <Button
          v-if="canDeliver"
          variant="success"
          @click="showDeliverModal = true"
        >
          <CheckCircle class="w-4 h-4 mr-2" />
          Mark Delivered
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
                @click="router.push(`/sales/delivery-orders/${id}/edit`)"
              >
                <Edit class="w-4 h-4" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                class="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                @click="handleDuplicate"
              >
                <Copy class="w-4 h-4" />
                Duplicate
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
        <span>Loading delivery order...</span>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-else-if="error" class="text-center py-12">
      <p class="text-red-500">Failed to load delivery order</p>
    </Card>

    <!-- Content -->
    <div v-else-if="deliveryOrder" class="space-y-6">
      <!-- Delivery Progress Banner -->
      <Card
        v-if="['confirmed', 'shipped'].includes(deliveryOrder.status)"
        class="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-blue-700 dark:text-blue-300">Delivery Progress</span>
          <span class="text-sm text-blue-600 dark:text-blue-400">{{ deliveryProgress }}%</span>
        </div>
        <div class="h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
          <div
            class="h-full bg-blue-500 rounded-full transition-all"
            :style="{ width: `${deliveryProgress}%` }"
          />
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
                DO Date
              </dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ formatDate(deliveryOrder.do_date) }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <FileText class="w-4 h-4" />
                Invoice
              </dt>
              <dd>
                <RouterLink
                  v-if="deliveryOrder.invoice"
                  :to="`/invoices/${deliveryOrder.invoice.id}`"
                  class="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {{ deliveryOrder.invoice.invoice_number }}
                </RouterLink>
                <span v-else class="text-slate-400">-</span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Package class="w-4 h-4" />
                Warehouse
              </dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ deliveryOrder.warehouse?.name || '-' }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <User class="w-4 h-4" />
                Created By
              </dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ deliveryOrder.creator?.name || '-' }}
              </dd>
            </div>
          </dl>
        </Card>

        <!-- Shipping Info -->
        <Card>
          <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Shipping Information</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <MapPin class="w-4 h-4" />
                Address
              </dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100 text-right max-w-[200px]">
                {{ deliveryOrder.shipping_address || deliveryOrder.contact?.address || '-' }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Method</dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ deliveryOrder.shipping_method || '-' }}
              </dd>
            </div>
            <div v-if="deliveryOrder.tracking_number" class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Tracking #</dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ deliveryOrder.tracking_number }}
              </dd>
            </div>
            <div v-if="deliveryOrder.driver_name" class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Driver</dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ deliveryOrder.driver_name }}
              </dd>
            </div>
            <div v-if="deliveryOrder.vehicle_number" class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Vehicle</dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ deliveryOrder.vehicle_number }}
              </dd>
            </div>
          </dl>
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
                <th class="text-center py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Delivered</th>
                <th class="text-left py-3 px-4 text-sm font-medium text-slate-500 dark:text-slate-400">Unit</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in deliveryOrder.items"
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
                <td class="py-3 px-4 text-center">
                  <span
                    :class="[
                      (item.quantity_delivered || 0) >= (item.quantity || 0)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-amber-600 dark:text-amber-400'
                    ]"
                  >
                    {{ item.quantity_delivered || 0 }}
                  </span>
                </td>
                <td class="py-3 px-4 text-slate-600 dark:text-slate-400">
                  {{ item.unit || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <!-- Notes -->
      <Card v-if="deliveryOrder.notes">
        <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">Notes</h3>
        <p class="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{{ deliveryOrder.notes }}</p>
      </Card>

      <!-- Activity Timeline -->
      <Card>
        <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">Activity</h3>
        <div class="space-y-4">
          <div v-if="deliveryOrder.delivered_at" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle class="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-slate-100">Delivered</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ formatDateTime(deliveryOrder.delivered_at) }}
                <span v-if="deliveryOrder.received_by"> - Received by {{ deliveryOrder.received_by }}</span>
              </p>
            </div>
          </div>

          <div v-if="deliveryOrder.shipped_at" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Truck class="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-slate-100">Shipped</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ formatDateTime(deliveryOrder.shipped_at) }}
              </p>
            </div>
          </div>

          <div v-if="deliveryOrder.confirmed_at" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Package class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p class="font-medium text-slate-900 dark:text-slate-100">Confirmed</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                {{ formatDateTime(deliveryOrder.confirmed_at) }}
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
                {{ formatDateTime(deliveryOrder.created_at) }}
                <span v-if="deliveryOrder.creator"> by {{ deliveryOrder.creator.name }}</span>
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Ship Modal -->
    <Modal
      :open="showShipModal"
      title="Ship Delivery Order"
      @close="showShipModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Shipping Date
          </label>
          <Input v-model="shipData.shipping_date" type="date" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Tracking Number
          </label>
          <Input v-model="shipData.tracking_number" placeholder="Enter tracking number" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Driver Name
          </label>
          <Input v-model="shipData.driver_name" placeholder="Enter driver name" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Vehicle Number
          </label>
          <Input v-model="shipData.vehicle_number" placeholder="Enter vehicle number" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showShipModal = false">Cancel</Button>
          <Button @click="handleShip" :disabled="shipMutation.isPending.value">
            <Truck class="w-4 h-4 mr-2" />
            Ship
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Deliver Modal -->
    <Modal
      :open="showDeliverModal"
      title="Mark as Delivered"
      @close="showDeliverModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Received Date
          </label>
          <Input v-model="deliverData.received_date" type="date" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Received By
          </label>
          <Input v-model="deliverData.received_by" placeholder="Name of person who received" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Delivery Notes
          </label>
          <Input v-model="deliverData.delivery_notes" placeholder="Any notes about the delivery" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showDeliverModal = false">Cancel</Button>
          <Button variant="success" @click="handleDeliver" :disabled="deliverMutation.isPending.value">
            <CheckCircle class="w-4 h-4 mr-2" />
            Mark Delivered
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Cancel Modal -->
    <Modal
      :open="showCancelModal"
      title="Cancel Delivery Order"
      @close="showCancelModal = false"
    >
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Are you sure you want to cancel this delivery order?
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
            Cancel Order
          </Button>
        </div>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal
      :open="showDeleteModal"
      title="Delete Delivery Order"
      @close="showDeleteModal = false"
    >
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this delivery order? This action cannot be undone.
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
