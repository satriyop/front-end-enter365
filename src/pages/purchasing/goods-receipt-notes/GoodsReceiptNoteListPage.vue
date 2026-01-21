<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useGoodsReceiptNotes,
  getGRNStatus,
  formatGRNNumber,
  type GoodsReceiptNote,
  type GoodsReceiptNoteFilters,
  type GRNStatus,
} from '@/api/useGoodsReceiptNotes'
import { useResourceList } from '@/composables/useResourceList'
import { formatDate } from '@/utils/format'
import { Truck } from 'lucide-vue-next'

// UI Components
import { Button, Input, Select, Badge, Card, Pagination, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterGroup from '@/components/ui/FilterGroup.vue'

const router = useRouter()

// Resource list with filters and pagination
const {
  items: grns,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<GoodsReceiptNote, GoodsReceiptNoteFilters>({
  useListHook: useGoodsReceiptNotes,
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
  { value: 'receiving', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Handle status filter change
function handleStatusChange(value: string | number | null) {
  updateFilter('status', value === '' ? undefined : (value as GRNStatus))
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'grn_number', label: 'GRN Number', mobilePriority: 1 },
  { key: 'purchase_order', label: 'Purchase Order', mobilePriority: 2 },
  { key: 'warehouse', label: 'Warehouse', showInMobile: false },
  { key: 'receipt_date', label: 'Receipt Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'progress', label: 'Progress', mobilePriority: 3 },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'actions', label: '', showInMobile: false },
]

// Navigate to detail
function viewGRN(item: Record<string, unknown>) {
  router.push(`/purchasing/goods-receipt-notes/${item.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Goods Receipt Notes</h1>
        <p class="text-slate-500 dark:text-slate-400">Track incoming inventory from purchase orders</p>
      </div>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input
          :model-value="filters.search"
          placeholder="Search GRN number, DO number..."
          @update:model-value="(v) => updateFilter('search', String(v))"
        />
      </FilterGroup>

      <FilterGroup min-width="150px">
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
      <p class="text-red-500">Failed to load goods receipt notes</p>
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
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No goods receipt notes found</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        GRNs are created when receiving items from purchase orders
      </p>
      <RouterLink to="/purchasing/purchase-orders">
        <Button variant="secondary">
          View Purchase Orders
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="grns"
        :columns="columns"
        :loading="isLoading"
        title-field="grn_number"
        @row-click="viewGRN"
      >
        <!-- GRN Number -->
        <template #cell-grn_number="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatGRNNumber(item as GoodsReceiptNote) }}
          </span>
        </template>

        <!-- Purchase Order -->
        <template #cell-purchase_order="{ item }">
          <div v-if="(item as GoodsReceiptNote).purchase_order">
            <div class="font-medium text-slate-900 dark:text-slate-100">{{ (item as GoodsReceiptNote).purchase_order?.po_number }}</div>
            <div class="text-sm text-slate-500 dark:text-slate-400">{{ (item as GoodsReceiptNote).purchase_order?.contact?.name }}</div>
          </div>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- Warehouse -->
        <template #cell-warehouse="{ item }">
          <span v-if="(item as GoodsReceiptNote).warehouse" class="text-slate-900 dark:text-slate-100">
            {{ (item as GoodsReceiptNote).warehouse?.name }}
          </span>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- Progress -->
        <template #cell-progress="{ item }">
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden w-20">
              <div
                class="bg-primary-600 dark:bg-primary-400 h-full rounded-full transition-all"
                :style="{ width: `${(item as GoodsReceiptNote).receiving_progress || 0}%` }"
              />
            </div>
            <span class="text-sm text-slate-600 dark:text-slate-400">{{ (item as GoodsReceiptNote).receiving_progress || 0 }}%</span>
          </div>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <Badge :class="getGRNStatus(item as GoodsReceiptNote).color">
            {{ getGRNStatus(item as GoodsReceiptNote).label }}
          </Badge>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatGRNNumber(item as GoodsReceiptNote) }}
          </span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <Badge :class="getGRNStatus(item as GoodsReceiptNote).color">
            {{ getGRNStatus(item as GoodsReceiptNote).label }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <Button variant="ghost" size="xs" @click.stop="viewGRN(item as Record<string, unknown>)">
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
