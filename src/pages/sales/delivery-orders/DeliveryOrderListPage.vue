<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useDeliveryOrders,
  useDeliveryOrderStatistics,
  getDeliveryOrderStatus,
  formatDONumber,
  type DeliveryOrder,
  type DeliveryOrderFilters,
  type DeliveryOrderStatus,
} from '@/api/useDeliveryOrders'
import { useResourceList } from '@/composables/useResourceList'
import { formatDate } from '@/utils/format'
import { Truck, Plus, Package, CheckCircle, Clock } from 'lucide-vue-next'

// UI Components
import { Button, Input, Select, Badge, Card, Pagination, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterGroup from '@/components/ui/FilterGroup.vue'

const router = useRouter()

// Statistics
const { data: stats } = useDeliveryOrderStatistics()

// Resource list with filters and pagination
const {
  items: deliveryOrders,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<DeliveryOrder, DeliveryOrderFilters>({
  useListHook: useDeliveryOrders,
  initialFilters: {
    page: 1,
    per_page: 20,
    status: undefined,
    search: '',
  },
})

// Status options for filter
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Handle status filter change
function handleStatusChange(value: string | number | null) {
  updateFilter('status', value === '' ? undefined : (value as DeliveryOrderStatus))
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'do_number', label: 'DO #', mobilePriority: 1 },
  { key: 'customer', label: 'Customer', mobilePriority: 2 },
  { key: 'invoice', label: 'Invoice', showInMobile: false },
  { key: 'do_date', label: 'Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'items_count', label: 'Items', align: 'center', showInMobile: false },
  { key: 'progress', label: 'Progress', showInMobile: false },
  { key: 'status', label: 'Status', mobilePriority: 3 },
  { key: 'actions', label: '', showInMobile: false },
]

// Navigate to detail
function viewDeliveryOrder(item: Record<string, unknown>) {
  router.push(`/sales/delivery-orders/${item.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Delivery Orders</h1>
        <p class="text-slate-500 dark:text-slate-400">Track shipments and deliveries to customers</p>
      </div>
      <RouterLink to="/sales/delivery-orders/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Delivery Order
        </Button>
      </RouterLink>
    </div>

    <!-- Statistics Cards -->
    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Package class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Confirmed</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ stats.by_status?.confirmed ?? 0 }}
            </p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Truck class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Shipped</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ stats.by_status?.shipped ?? 0 }}
            </p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Delivered</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ stats.delivered_this_month ?? 0 }}
            </p>
            <p class="text-xs text-slate-400">This month</p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Clock class="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Pending Delivery</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ stats.pending_delivery ?? 0 }}
            </p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input
          :model-value="filters.search"
          placeholder="Search DO number, customer..."
          @update:model-value="(v) => updateFilter('search', String(v))"
        />
      </FilterGroup>

      <FilterGroup min-width="180px">
        <Select
          :model-value="filters.status || ''"
          :options="statusOptions"
          placeholder="Status"
          @update:model-value="handleStatusChange"
        />
      </FilterGroup>
    </FilterBar>

    <!-- Error State -->
    <Card v-if="error" class="text-center py-8">
      <p class="text-red-500">Failed to load delivery orders</p>
    </Card>

    <!-- Loading State -->
    <Card v-else-if="isLoading" class="text-center py-8">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </Card>

    <!-- Empty State -->
    <Card v-else-if="isEmpty" class="text-center py-12">
      <Truck class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No delivery orders found</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Create a delivery order to track shipments to customers
      </p>
      <RouterLink to="/sales/delivery-orders/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Create Delivery Order
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="deliveryOrders"
        :columns="columns"
        :loading="isLoading"
        title-field="do_number"
        @row-click="viewDeliveryOrder"
      >
        <!-- DO Number -->
        <template #cell-do_number="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatDONumber(item as DeliveryOrder) }}
          </span>
        </template>

        <!-- Customer -->
        <template #cell-customer="{ item }">
          <span class="font-medium text-slate-900 dark:text-slate-100">
            {{ (item as DeliveryOrder).contact?.name || '-' }}
          </span>
        </template>

        <!-- Invoice -->
        <template #cell-invoice="{ item }">
          <span v-if="(item as DeliveryOrder).invoice" class="text-slate-600 dark:text-slate-400">
            {{ (item as DeliveryOrder).invoice?.invoice_number }}
          </span>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- Progress -->
        <template #cell-progress="{ item }">
          <div v-if="(item as DeliveryOrder).delivery_progress !== undefined" class="flex items-center gap-2">
            <div class="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden max-w-[100px]">
              <div
                class="h-full bg-green-500 rounded-full transition-all"
                :style="{ width: `${(item as DeliveryOrder).delivery_progress}%` }"
              />
            </div>
            <span class="text-xs text-slate-500 dark:text-slate-400">
              {{ (item as DeliveryOrder).delivery_progress }}%
            </span>
          </div>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <Badge :class="getDeliveryOrderStatus(item as DeliveryOrder).color">
            {{ getDeliveryOrderStatus(item as DeliveryOrder).label }}
          </Badge>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatDONumber(item as DeliveryOrder) }}
          </span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <Badge :class="getDeliveryOrderStatus(item as DeliveryOrder).color">
            {{ getDeliveryOrderStatus(item as DeliveryOrder).label }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <Button variant="ghost" size="xs" @click.stop="viewDeliveryOrder(item as Record<string, unknown>)">
            View
          </Button>
        </template>
      </ResponsiveTable>

      <!-- Pagination -->
      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :per-page="pagination.per_page"
          @page-change="goToPage"
        />
      </div>
    </Card>
  </div>
</template>
