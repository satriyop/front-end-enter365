<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useDownPayments,
  useDownPaymentStatistics,
  getDownPaymentStatus,
  getDownPaymentType,
  formatDPNumber,
  type DownPayment,
  type DownPaymentFilters,
  type DownPaymentType,
  type DownPaymentStatus,
} from '@/api/useDownPayments'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import { Wallet, Plus, ArrowDownCircle, ArrowUpCircle, DollarSign } from 'lucide-vue-next'

// UI Components
import { Button, Input, Select, Badge, Card, Pagination, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterGroup from '@/components/ui/FilterGroup.vue'

const router = useRouter()

// Statistics
const { data: stats } = useDownPaymentStatistics()

// Resource list with filters and pagination
const {
  items: downPayments,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<DownPayment, DownPaymentFilters>({
  useListHook: useDownPayments,
  initialFilters: {
    page: 1,
    per_page: 20,
    type: undefined,
    status: undefined,
    search: '',
  },
})

// Type options for filter
const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'receivable', label: 'Customer Advance' },
  { value: 'payable', label: 'Vendor Advance' },
]

// Status options for filter
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'fully_applied', label: 'Fully Applied' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Handle filter changes
function handleTypeChange(value: string | number | null) {
  updateFilter('type', value === '' ? undefined : (value as DownPaymentType))
}

function handleStatusChange(value: string | number | null) {
  updateFilter('status', value === '' ? undefined : (value as DownPaymentStatus))
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'dp_number', label: 'DP #', mobilePriority: 1 },
  { key: 'contact', label: 'Contact', mobilePriority: 2 },
  { key: 'type', label: 'Type', showInMobile: false },
  { key: 'dp_date', label: 'Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'amount', label: 'Amount', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(v as number) },
  { key: 'remaining', label: 'Remaining', align: 'right', showInMobile: false },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'actions', label: '', showInMobile: false },
]

// Navigate to detail
function viewDownPayment(item: Record<string, unknown>) {
  router.push(`/finance/down-payments/${item.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Down Payments</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage advance payments from customers and to vendors</p>
      </div>
      <RouterLink to="/finance/down-payments/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Down Payment
        </Button>
      </RouterLink>
    </div>

    <!-- Statistics Cards -->
    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <ArrowDownCircle class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Customer Advances</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(stats.by_type?.receivable?.remaining ?? 0) }}
            </p>
            <p class="text-xs text-slate-400">{{ stats.by_type?.receivable?.count ?? 0 }} active</p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <ArrowUpCircle class="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Vendor Advances</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(stats.by_type?.payable?.remaining ?? 0) }}
            </p>
            <p class="text-xs text-slate-400">{{ stats.by_type?.payable?.count ?? 0 }} active</p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <DollarSign class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Total Applied</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(stats.total_applied ?? 0) }}
            </p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Wallet class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Total Remaining</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(stats.total_remaining ?? 0) }}
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
          placeholder="Search DP number, contact..."
          @update:model-value="(v) => updateFilter('search', String(v))"
        />
      </FilterGroup>

      <FilterGroup min-width="180px">
        <Select
          :model-value="filters.type || ''"
          :options="typeOptions"
          placeholder="Type"
          @update:model-value="handleTypeChange"
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
      <p class="text-red-500">Failed to load down payments</p>
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
      <Wallet class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No down payments found</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Record advance payments from customers or to vendors
      </p>
      <RouterLink to="/finance/down-payments/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Create Down Payment
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="downPayments"
        :columns="columns"
        :loading="isLoading"
        title-field="dp_number"
        @row-click="viewDownPayment"
      >
        <!-- DP Number -->
        <template #cell-dp_number="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatDPNumber(item as DownPayment) }}
          </span>
        </template>

        <!-- Contact -->
        <template #cell-contact="{ item }">
          <span class="font-medium text-slate-900 dark:text-slate-100">
            {{ (item as DownPayment).contact?.name || '-' }}
          </span>
        </template>

        <!-- Type -->
        <template #cell-type="{ item }">
          <Badge :class="getDownPaymentType(item as DownPayment).color">
            {{ getDownPaymentType(item as DownPayment).label }}
          </Badge>
        </template>

        <!-- Remaining -->
        <template #cell-remaining="{ item }">
          <span
            :class="[
              Number((item as DownPayment).remaining_amount || 0) > 0
                ? 'text-green-600 dark:text-green-400'
                : 'text-slate-400'
            ]"
          >
            {{ formatCurrency(Number((item as DownPayment).remaining_amount) || 0) }}
          </span>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <Badge :class="getDownPaymentStatus(item as DownPayment).color">
            {{ getDownPaymentStatus(item as DownPayment).label }}
          </Badge>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatDPNumber(item as DownPayment) }}
          </span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <Badge :class="getDownPaymentStatus(item as DownPayment).color">
            {{ getDownPaymentStatus(item as DownPayment).label }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <Button variant="ghost" size="xs" @click.stop="viewDownPayment(item as Record<string, unknown>)">
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
