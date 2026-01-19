<script setup lang="ts">
import { usePayments, type PaymentFilters, type Payment } from '@/api/usePayments'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Select, Pagination, EmptyState, Badge, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'

// Resource list with filters and pagination (no delete for payments)
const {
  items: payments,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<Payment, PaymentFilters>({
  useListHook: usePayments,
  initialFilters: {
    page: 1,
    per_page: 10,
    type: undefined,
    search: '',
  },
})

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'receive', label: 'Received' },
  { value: 'pay', label: 'Paid' },
]

// Table columns with mobile priorities
const columns: ResponsiveColumn[] = [
  { key: 'payment_number', label: 'Payment #', mobilePriority: 1 },
  { key: 'type', label: 'Type', mobilePriority: 4 },
  { key: 'contact.name', label: 'Contact', mobilePriority: 2 },
  { key: 'payment_date', label: 'Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'payment_method', label: 'Method', showInMobile: false },
  { key: 'amount', label: 'Amount', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(v as number) },
  { key: 'is_voided', label: 'Status', showInMobile: false },
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Payments</h1>
        <p class="text-slate-500 dark:text-slate-400">Track incoming and outgoing payments</p>
      </div>
      <RouterLink to="/payments/new">
        <Button>
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Payment
        </Button>
      </RouterLink>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search payments..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
        <div class="w-40">
          <Select v-model="filters.type" :options="typeOptions" placeholder="All Types" />
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500 dark:text-red-400">Failed to load payments</p>
    </div>

    <div v-else-if="isLoading" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <div v-else-if="isEmpty" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No payments found"
        description="Record payments for invoices and bills"
        action-label="New Payment"
        @action="$router.push('/payments/new')"
      />
    </div>

    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <ResponsiveTable
        :items="payments"
        :columns="columns"
        :loading="isLoading"
        title-field="payment_number"
        subtitle-field="contact.name"
        @row-click="(item) => $router.push(`/payments/${item.id}`)"
      >
        <!-- Custom cell: Payment number -->
        <template #cell-payment_number="{ item }">
          <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
            {{ item.payment_number }}
          </span>
        </template>

        <!-- Custom cell: Type badge -->
        <template #cell-type="{ item }">
          <Badge :variant="item.type === 'receive' ? 'success' : 'warning'">
            {{ item.type === 'receive' ? 'Received' : 'Paid' }}
          </Badge>
        </template>

        <!-- Custom cell: Contact -->
        <template #cell-contact\.name="{ item }">
          {{ item.contact?.name ?? '-' }}
        </template>

        <!-- Custom cell: Payment method -->
        <template #cell-payment_method="{ item }">
          <span class="capitalize">{{ item.payment_method }}</span>
        </template>

        <!-- Custom cell: Status -->
        <template #cell-is_voided="{ item }">
          <Badge :variant="item.is_voided ? 'destructive' : 'success'">
            {{ item.is_voided ? 'Voided' : 'Active' }}
          </Badge>
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ item.payment_number }}
          </span>
        </template>

        <!-- Mobile status slot -->
        <template #mobile-status="{ item }">
          <Badge :variant="item.type === 'receive' ? 'success' : 'warning'">
            {{ item.type === 'receive' ? 'Received' : 'Paid' }}
          </Badge>
        </template>
      </ResponsiveTable>

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
  </div>
</template>
