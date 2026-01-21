<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useSubcontractorInvoices,
  getSubcontractorInvoiceStatus,
  formatSCInvoiceNumber,
  type SubcontractorInvoice,
  type SubcontractorInvoiceFilters,
  type SubcontractorInvoiceStatus,
} from '@/api/useSubcontractorInvoices'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import { FileText } from 'lucide-vue-next'

// UI Components
import { Button, Input, Select, Badge, Card, Pagination, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterGroup from '@/components/ui/FilterGroup.vue'

const router = useRouter()

// Resource list with filters and pagination
const {
  items: invoices,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<SubcontractorInvoice, SubcontractorInvoiceFilters>({
  useListHook: useSubcontractorInvoices,
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
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'converted', label: 'Converted to Bill' },
]

// Handle status filter change
function handleStatusChange(value: string | number | null) {
  updateFilter('status', value === '' ? undefined : (value as SubcontractorInvoiceStatus))
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'invoice_number', label: 'Invoice #', mobilePriority: 1 },
  { key: 'subcontractor', label: 'Subcontractor', mobilePriority: 2 },
  { key: 'work_order', label: 'Work Order', showInMobile: false },
  { key: 'invoice_date', label: 'Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'net_amount', label: 'Amount', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(Number(v) || 0) },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'actions', label: '', showInMobile: false },
]

// Navigate to detail
function viewInvoice(item: Record<string, unknown>) {
  router.push(`/manufacturing/subcontractor-invoices/${item.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Subcontractor Invoices</h1>
        <p class="text-slate-500 dark:text-slate-400">Review and approve invoices from subcontractors</p>
      </div>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input
          :model-value="filters.search"
          placeholder="Search invoice number, subcontractor..."
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
      <p class="text-red-500">Failed to load subcontractor invoices</p>
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
      <FileText class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No subcontractor invoices found</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Invoices are created from subcontractor work orders
      </p>
      <RouterLink to="/manufacturing/subcontractor-work-orders">
        <Button variant="secondary">
          View Work Orders
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="invoices"
        :columns="columns"
        :loading="isLoading"
        title-field="invoice_number"
        @row-click="viewInvoice"
      >
        <!-- Invoice Number -->
        <template #cell-invoice_number="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatSCInvoiceNumber(item as SubcontractorInvoice) }}
          </span>
        </template>

        <!-- Subcontractor -->
        <template #cell-subcontractor="{ item }">
          <span v-if="(item as SubcontractorInvoice).subcontractor" class="font-medium text-slate-900 dark:text-slate-100">
            {{ (item as SubcontractorInvoice).subcontractor?.name }}
          </span>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- Work Order -->
        <template #cell-work_order="{ item }">
          <span v-if="(item as SubcontractorInvoice).subcontractor_work_order" class="text-slate-600 dark:text-slate-400">
            {{ (item as SubcontractorInvoice).subcontractor_work_order?.sc_wo_number }}
          </span>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <Badge :class="getSubcontractorInvoiceStatus(item as SubcontractorInvoice).color">
            {{ getSubcontractorInvoiceStatus(item as SubcontractorInvoice).label }}
          </Badge>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatSCInvoiceNumber(item as SubcontractorInvoice) }}
          </span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <Badge :class="getSubcontractorInvoiceStatus(item as SubcontractorInvoice).color">
            {{ getSubcontractorInvoiceStatus(item as SubcontractorInvoice).label }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <Button variant="ghost" size="xs" @click.stop="viewInvoice(item as Record<string, unknown>)">
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
