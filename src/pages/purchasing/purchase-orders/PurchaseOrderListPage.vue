<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  usePurchaseOrders,
  usePurchaseOrderStatistics,
  getPurchaseOrderStatus,
  formatPONumber,
  type PurchaseOrder,
  type PurchaseOrderFilters,
  type PurchaseOrderStatus,
} from '@/api/usePurchaseOrders'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  Plus,
  Package,
  Clock,
  CheckCircle,
  TruckIcon,
  FileText,
} from 'lucide-vue-next'

// UI Components
import { Button, Input, Select, Badge, Card, Pagination, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterGroup from '@/components/ui/FilterGroup.vue'

const router = useRouter()

// Resource list with filters and pagination
const {
  items: purchaseOrders,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<PurchaseOrder, PurchaseOrderFilters>({
  useListHook: usePurchaseOrders,
  initialFilters: {
    page: 1,
    per_page: 20,
    status: undefined,
    search: '',
  },
})

// Statistics
const { data: stats } = usePurchaseOrderStatistics()

// Status options for filter
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'partial', label: 'Partially Received' },
  { value: 'received', label: 'Fully Received' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'rejected', label: 'Rejected' },
]

// Handle status filter change
function handleStatusChange(value: string | number | null) {
  updateFilter('status', value === '' ? undefined : (value as PurchaseOrderStatus))
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'po_number', label: 'PO Number', mobilePriority: 1 },
  { key: 'contact', label: 'Vendor', mobilePriority: 2 },
  { key: 'total', label: 'Amount', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(v as number) },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'expected_date', label: 'Expected', showInMobile: false, format: (v) => v ? formatDate(v as string) : '-' },
  { key: 'actions', label: '', showInMobile: false },
]

// Navigate to detail
function viewPO(item: Record<string, unknown>) {
  router.push(`/purchasing/purchase-orders/${item.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Purchase Orders</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage vendor purchase orders</p>
      </div>
      <RouterLink to="/purchasing/purchase-orders/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Purchase Order
        </Button>
      </RouterLink>
    </div>

    <!-- Statistics Cards -->
    <div v-if="stats" class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <FileText class="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Draft</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ stats.draft_count || 0 }}</p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Clock class="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Pending</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ stats.pending_count || 0 }}</p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <CheckCircle class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Approved</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ stats.approved_count || 0 }}</p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Package class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Partial</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ stats.partial_count || 0 }}</p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <TruckIcon class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Received</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ stats.received_count || 0 }}</p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input
          :model-value="filters.search"
          placeholder="Search PO number, vendor..."
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
      <p class="text-red-500">Failed to load purchase orders</p>
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
      <Package class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No purchase orders found</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Create your first purchase order to start ordering from vendors
      </p>
      <RouterLink to="/purchasing/purchase-orders/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Create Purchase Order
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="purchaseOrders"
        :columns="columns"
        :loading="isLoading"
        title-field="full_number"
        subtitle-field="contact.name"
        @row-click="viewPO"
      >
        <!-- PO Number -->
        <template #cell-po_number="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatPONumber(item as PurchaseOrder) }}
          </span>
        </template>

        <!-- Vendor with subject -->
        <template #cell-contact="{ item }">
          <div class="font-medium text-slate-900 dark:text-slate-100">{{ (item as PurchaseOrder).contact?.name || '-' }}</div>
          <div v-if="(item as PurchaseOrder).subject" class="text-sm text-slate-500 dark:text-slate-400">{{ (item as PurchaseOrder).subject }}</div>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <Badge :class="getPurchaseOrderStatus(item as PurchaseOrder).color">
            {{ getPurchaseOrderStatus(item as PurchaseOrder).label }}
          </Badge>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatPONumber(item as PurchaseOrder) }}
          </span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <Badge :class="getPurchaseOrderStatus(item as PurchaseOrder).color">
            {{ getPurchaseOrderStatus(item as PurchaseOrder).label }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <Button variant="ghost" size="xs" @click.stop="viewPO(item as Record<string, unknown>)">
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
