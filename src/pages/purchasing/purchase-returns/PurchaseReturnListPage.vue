<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  usePurchaseReturns,
  getPurchaseReturnStatus,
  formatReturnNumber,
  type PurchaseReturn,
  type PurchaseReturnFilters,
  type PurchaseReturnStatus,
} from '@/api/usePurchaseReturns'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import { RotateCcw, Plus } from 'lucide-vue-next'

// UI Components
import { Button, Input, Select, Badge, Card, Pagination, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterGroup from '@/components/ui/FilterGroup.vue'

const router = useRouter()

// Resource list with filters and pagination
const {
  items: purchaseReturns,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<PurchaseReturn, PurchaseReturnFilters>({
  useListHook: usePurchaseReturns,
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
  { value: 'submitted', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Handle status filter change
function handleStatusChange(value: string | number | null) {
  updateFilter('status', value === '' ? undefined : (value as PurchaseReturnStatus))
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'return_number', label: 'Return #', mobilePriority: 1 },
  { key: 'vendor', label: 'Vendor', mobilePriority: 2 },
  { key: 'bill', label: 'Bill', showInMobile: false },
  { key: 'return_date', label: 'Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'total_amount', label: 'Amount', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(v as number) },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'actions', label: '', showInMobile: false },
]

// Navigate to detail
function viewReturn(item: Record<string, unknown>) {
  router.push(`/purchasing/purchase-returns/${item.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Purchase Returns</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage returns to vendors</p>
      </div>
      <RouterLink to="/purchasing/purchase-returns/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Return
        </Button>
      </RouterLink>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input
          :model-value="filters.search"
          placeholder="Search return number, vendor..."
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
      <p class="text-red-500">Failed to load purchase returns</p>
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
      <RotateCcw class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No purchase returns found</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Create a return when you need to send goods back to a vendor
      </p>
      <RouterLink to="/purchasing/purchase-returns/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Create Return
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="purchaseReturns"
        :columns="columns"
        :loading="isLoading"
        title-field="return_number"
        @row-click="viewReturn"
      >
        <!-- Return Number -->
        <template #cell-return_number="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatReturnNumber(item as PurchaseReturn) }}
          </span>
        </template>

        <!-- Vendor -->
        <template #cell-vendor="{ item }">
          <span class="font-medium text-slate-900 dark:text-slate-100">
            {{ (item as PurchaseReturn).contact?.name || '-' }}
          </span>
        </template>

        <!-- Bill -->
        <template #cell-bill="{ item }">
          <span v-if="(item as PurchaseReturn).bill" class="text-slate-600 dark:text-slate-400">
            {{ (item as PurchaseReturn).bill?.bill_number }}
          </span>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <Badge :class="getPurchaseReturnStatus(item as PurchaseReturn).color">
            {{ getPurchaseReturnStatus(item as PurchaseReturn).label }}
          </Badge>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatReturnNumber(item as PurchaseReturn) }}
          </span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <Badge :class="getPurchaseReturnStatus(item as PurchaseReturn).color">
            {{ getPurchaseReturnStatus(item as PurchaseReturn).label }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <Button variant="ghost" size="xs" @click.stop="viewReturn(item as Record<string, unknown>)">
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
