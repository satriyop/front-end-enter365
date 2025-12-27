<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInvoices, type InvoiceFilters } from '@/api/useInvoices'
import { formatCurrency, formatDate } from '@/utils/format'
import { Badge, Button, Input, Select, Pagination, EmptyState } from '@/components/ui'

// Filters state
const filters = ref<InvoiceFilters>({
  page: 1,
  per_page: 10,
  status: undefined,
  search: '',
})

// Fetch invoices
const { data, isLoading, error } = useInvoices(filters)

const invoices = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

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

function handlePageChange(page: number) {
  filters.value.page = page
}

function handleSearch(value: string | number) {
  filters.value.search = String(value)
  filters.value.page = 1
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Invoices</h1>
        <p class="text-slate-500">Manage sales invoices and receivables</p>
      </div>
      <RouterLink to="/invoices/new">
        <Button variant="primary">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Invoice
        </Button>
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search invoices..."
            @update:model-value="handleSearch"
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
    <div v-if="error" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <p class="text-red-500">Failed to load invoices</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="invoices.length === 0" class="bg-white rounded-xl border border-slate-200">
      <EmptyState
        title="No invoices found"
        description="Create your first invoice to start tracking receivables"
        action-label="New Invoice"
        @action="$router.push('/invoices/new')"
      />
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Invoice #
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Customer
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Amount
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Outstanding
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Due Date
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr
            v-for="invoice in invoices"
            :key="invoice.id"
            class="hover:bg-slate-50 cursor-pointer"
            @click="$router.push(`/invoices/${invoice.id}`)"
          >
            <td class="px-6 py-4">
              <span class="text-orange-600 hover:text-orange-700 font-medium">
                {{ invoice.invoice_number }}
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="font-medium text-slate-900">{{ invoice.contact?.name }}</div>
              <div class="text-sm text-slate-500">{{ invoice.description }}</div>
            </td>
            <td class="px-6 py-4 text-right font-medium text-slate-900">
              {{ formatCurrency(invoice.total_amount) }}
            </td>
            <td class="px-6 py-4 text-right">
              <span :class="invoice.outstanding_amount > 0 ? 'text-orange-600 font-medium' : 'text-slate-500'">
                {{ formatCurrency(invoice.outstanding_amount) }}
              </span>
            </td>
            <td class="px-6 py-4">
              <Badge :status="invoice.status as any" />
            </td>
            <td class="px-6 py-4 text-slate-500">
              {{ formatDate(invoice.due_date) }}
            </td>
            <td class="px-6 py-4 text-right" @click.stop>
              <RouterLink :to="`/invoices/${invoice.id}`">
                <Button variant="ghost" size="xs">View</Button>
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200">
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :per-page="pagination.per_page"
          @page-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>
