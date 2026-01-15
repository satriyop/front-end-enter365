<script setup lang="ts">
import { usePayments, type PaymentFilters, type Payment } from '@/api/usePayments'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Select, Pagination, EmptyState, Badge } from '@/components/ui'
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
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payment #</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Method</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          <tr v-for="payment in payments" :key="payment.id" class="hover:bg-slate-50 dark:hover:bg-slate-800">
            <td class="px-6 py-4">
              <RouterLink :to="`/payments/${payment.id}`" class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
                {{ payment.payment_number }}
              </RouterLink>
            </td>
            <td class="px-6 py-4">
              <Badge :variant="payment.type === 'receive' ? 'success' : 'warning'">
                {{ payment.type === 'receive' ? 'Received' : 'Paid' }}
              </Badge>
            </td>
            <td class="px-6 py-4 text-slate-900 dark:text-slate-100">
              {{ payment.contact?.name ?? '-' }}
            </td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400">
              {{ formatDate(payment.payment_date) }}
            </td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400 capitalize">
              {{ payment.payment_method }}
            </td>
            <td class="px-6 py-4 text-right font-medium">
              {{ formatCurrency(payment.amount) }}
            </td>
            <td class="px-6 py-4">
              <Badge :variant="payment.is_voided ? 'destructive' : 'success'">
                {{ payment.is_voided ? 'Voided' : 'Active' }}
              </Badge>
            </td>
          </tr>
        </tbody>
      </table>

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
