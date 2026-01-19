<script setup lang="ts">
import { watch, computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useInvoices, type Invoice, type InvoiceFilters } from '@/api/useInvoices'
import { useResourceList } from '@/composables/useResourceList'
import { useBulkSelection } from '@/composables/useBulkSelection'
import { formatCurrency, formatDate } from '@/utils/format'
import { Badge, Button, Input, Select, Pagination, EmptyState, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import BulkActionsBar from '@/components/BulkActionsBar.vue'

const toast = useToast()
const queryClient = useQueryClient()

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
} = useResourceList<Invoice, InvoiceFilters>({
  useListHook: useInvoices,
  initialFilters: {
    page: 1,
    per_page: 10,
    status: undefined,
    search: '',
  },
})

// Bulk selection
const {
  selectedCount,
  isAllSelected,
  isSomeSelected,
  isSelected,
  toggleItem,
  toggleAll,
  clearSelection,
  getSelectedIds,
} = useBulkSelection({
  items: invoices,
  getItemId: (inv) => inv.id,
})

// Clear selection when page/filters change
watch([() => filters.value.page, () => filters.value.status], () => {
  clearSelection()
})

// Status options
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'posted', label: 'Posted' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
]

// Table columns with mobile priorities
const columns: ResponsiveColumn[] = [
  { key: 'invoice_number', label: 'Invoice #', mobilePriority: 1 },
  { key: 'contact.name', label: 'Customer', mobilePriority: 2 },
  { key: 'total_amount', label: 'Amount', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(v as number) },
  { key: 'outstanding_amount', label: 'Outstanding', align: 'right', mobilePriority: 4, format: (v) => formatCurrency(v as number) },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'due_date', label: 'Due Date', showInMobile: false, format: (v) => formatDate(v as string) },
]

// Bulk delete mutation
const bulkDeleteMutation = useMutation({
  mutationFn: async (ids: (number | string)[]) => {
    await api.post('/invoices/bulk-delete', { ids })
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    clearSelection()
    toast.success('Invoices deleted successfully')
  },
  onError: () => {
    toast.error('Failed to delete invoices')
  },
})

// Bulk actions
const bulkActions = computed(() => [
  {
    label: 'Delete',
    variant: 'destructive' as const,
    loading: bulkDeleteMutation.isPending.value,
    action: async () => {
      if (confirm(`Delete ${selectedCount.value} invoice(s)?`)) {
        await bulkDeleteMutation.mutateAsync(getSelectedIds())
      }
    },
  },
])
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Invoices</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage sales invoices and receivables</p>
      </div>
      <RouterLink to="/invoices/new">
        <Button>
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Button>
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search invoices..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>

        <!-- Status Filter -->
        <div class="w-48">
          <Select
            v-model="filters.status"
            :options="statusOptions"
            placeholder="All Status"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500">Failed to load invoices</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="isEmpty" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No invoices found"
        description="Create your first invoice to start tracking receivables"
        action-label="New Invoice"
        @action="$router.push('/invoices/new')"
      />
    </div>

    <!-- Table -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <ResponsiveTable
        :items="invoices"
        :columns="columns"
        :loading="isLoading"
        :selectable="true"
        :selected-keys="new Set(getSelectedIds())"
        title-field="invoice_number"
        subtitle-field="contact.name"
        status-field="status"
        @row-click="(item) => $router.push(`/invoices/${item.id}`)"
        @select="(keys) => {
          clearSelection()
          keys.forEach((k) => {
            const inv = invoices.find((i) => i.id === k)
            if (inv) toggleItem(inv)
          })
        }"
      >
        <!-- Custom cell: Invoice number with link styling -->
        <template #cell-invoice_number="{ item }">
          <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
            {{ item.invoice_number }}
          </span>
        </template>

        <!-- Custom cell: Customer with description -->
        <template #cell-contact\.name="{ item }">
          <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.contact?.name }}</div>
          <div class="text-sm text-slate-500 dark:text-slate-400">{{ item.description }}</div>
        </template>

        <!-- Custom cell: Outstanding with color -->
        <template #cell-outstanding_amount="{ item }">
          <span :class="item.outstanding_amount > 0 ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-slate-500 dark:text-slate-400'">
            {{ formatCurrency(item.outstanding_amount) }}
          </span>
        </template>

        <!-- Custom cell: Status badge -->
        <template #cell-status="{ item }">
          <Badge :status="item.status" />
        </template>

        <!-- Mobile status slot -->
        <template #mobile-status="{ item }">
          <Badge :status="item.status" />
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ item.invoice_number }}
          </span>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <RouterLink :to="`/invoices/${item.id}`">
            <Button variant="ghost" size="xs">View</Button>
          </RouterLink>
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
    </div>

    <!-- Bulk Actions Bar -->
    <BulkActionsBar
      :selected-count="selectedCount"
      :actions="bulkActions"
      @clear="clearSelection"
    />
  </div>
</template>
