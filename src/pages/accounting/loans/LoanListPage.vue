<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLoans, type Loan, type LoanFilters } from '@/api/useLoans'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Search } from 'lucide-vue-next'

const router = useRouter()

const {
  items: loans,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
} = useResourceList<Loan, LoanFilters>({
  useListHook: useLoans,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'principal', label: 'Principal', mobilePriority: 3 },
  { key: 'remaining_principal', label: 'Remaining', mobilePriority: 4 },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'start_date', label: 'Start', showInMobile: false },
]

function openLoan(loan: Loan) {
  router.push('/accounting/loans/' + loan.id)
}

function createLoan() {
  router.push('/accounting/loans/new')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Loans</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Loan register. Confirm to generate the amortization schedule and post disbursement.
        </p>
      </div>
      <Button data-testid="loan-create" @click="createLoan">
        <Plus class="w-4 h-4 mr-1" />
        New Loan
      </Button>
    </div>

    <Card class="mb-4">
      <div class="p-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            :model-value="filters.search ?? ''"
            class="pl-9"
            placeholder="Search code or name..."
            data-testid="loan-search"
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load loans</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No loans found</div>
      <ResponsiveTable
        v-else
        :items="loans ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openLoan"
      >
        <template #cell-principal="{ item }">{{ formatCurrency(item.principal) }}</template>
        <template #cell-remaining_principal="{ item }">{{ formatCurrency(item.remaining_principal) }}</template>
        <template #cell-start_date="{ item }">{{ formatDate(item.start_date) }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
