<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuotations, type QuotationFilters } from '@/api/useQuotations'
import { formatCurrency, formatDate } from '@/utils/format'

// Filters state
const filters = ref<QuotationFilters>({
  page: 1,
  per_page: 10,
  status: '',
  search: '',
})

// Fetch quotations
const { data, isLoading, error } = useQuotations(filters)

const quotations = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

// Status badge styles
function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    submitted: 'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-slate-100 text-slate-500',
    converted: 'bg-blue-100 text-blue-700',
  }
  return classes[status] ?? 'bg-slate-100 text-slate-700'
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    expired: 'Expired',
    converted: 'Converted',
  }
  return labels[status] ?? status
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Quotations</h1>
        <p class="text-slate-500">Manage sales quotations and proposals</p>
      </div>
      <button class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium">
        + New Quotation
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search quotations..."
            class="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <!-- Status Filter -->
        <select
          v-model="filters.status"
          class="px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="converted">Converted</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="p-8 text-center text-slate-500">
        Loading...
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="p-8 text-center text-red-500">
        Failed to load quotations
      </div>

      <!-- Empty State -->
      <div v-else-if="quotations.length === 0" class="p-8 text-center">
        <div class="text-4xl mb-2">📋</div>
        <div class="text-slate-900 font-medium">No quotations found</div>
        <div class="text-slate-500 text-sm">Create your first quotation to get started</div>
      </div>

      <!-- Data Table -->
      <table v-else class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Quotation #
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Customer
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Amount
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Valid Until
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr
            v-for="quotation in quotations"
            :key="quotation.id"
            class="hover:bg-slate-50"
          >
            <td class="px-6 py-4">
              <RouterLink
                :to="`/quotations/${quotation.id}`"
                class="text-primary-600 hover:text-primary-700 font-medium"
              >
                {{ quotation.quotation_number }}
              </RouterLink>
            </td>
            <td class="px-6 py-4">
              <div class="font-medium text-slate-900">{{ quotation.contact?.company_name }}</div>
              <div class="text-sm text-slate-500">{{ quotation.subject }}</div>
            </td>
            <td class="px-6 py-4 text-right font-medium text-slate-900">
              {{ formatCurrency(quotation.grand_total) }}
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(quotation.status)"
              >
                {{ getStatusLabel(quotation.status) }}
              </span>
            </td>
            <td class="px-6 py-4 text-slate-500">
              {{ formatDate(quotation.valid_until) }}
            </td>
            <td class="px-6 py-4 text-right">
              <button class="text-slate-400 hover:text-slate-600">
                ⋮
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <div class="text-sm text-slate-500">
          Showing {{ (pagination.current_page - 1) * pagination.per_page + 1 }}
          to {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }}
          of {{ pagination.total }}
        </div>
        <div class="flex gap-2">
          <button
            :disabled="pagination.current_page === 1"
            class="px-3 py-1 rounded border border-slate-300 text-sm disabled:opacity-50"
            @click="filters.page = pagination.current_page - 1"
          >
            Previous
          </button>
          <button
            :disabled="pagination.current_page === pagination.last_page"
            class="px-3 py-1 rounded border border-slate-300 text-sm disabled:opacity-50"
            @click="filters.page = pagination.current_page + 1"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
