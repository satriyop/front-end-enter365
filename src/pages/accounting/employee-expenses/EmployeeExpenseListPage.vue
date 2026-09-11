<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useEmployeeExpenses,
  type EmployeeExpense,
  type EmployeeExpenseFilters,
} from '@/api/useEmployeeExpenses'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Search } from 'lucide-vue-next'

const router = useRouter()
const {
  items,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
} = useResourceList<EmployeeExpense, EmployeeExpenseFilters>({
  useListHook: useEmployeeExpenses,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'expense_number', label: 'Number', mobilePriority: 1 },
  { key: 'expense_date', label: 'Date', mobilePriority: 2 },
  { key: 'description', label: 'Description', mobilePriority: 3 },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'total_amount', label: 'Amount', mobilePriority: 4 },
]

function openExpense(expense: EmployeeExpense) {
  router.push('/accounting/employee-expenses/' + expense.id)
}

function createExpense() {
  router.push('/accounting/employee-expenses/new')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Employee Expenses</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Vendor-side employee expenses: submit, approve, then post to the ledger.
        </p>
      </div>
      <Button data-testid="employee-expense-create" @click="createExpense">
        <Plus class="w-4 h-4 mr-1" />
        New Expense
      </Button>
    </div>
    <Card class="mb-4">
      <div class="p-4 relative">
        <Search class="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          :model-value="filters.search ?? ''"
          class="pl-9"
          placeholder="Search number or description..."
          @update:model-value="(v) => updateFilter('search', String(v))"
        />
      </div>
    </Card>
    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load employee expenses</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No employee expenses found</div>
      <ResponsiveTable
        v-else
        :items="items ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openExpense"
      >
        <template #cell-expense_date="{ item }">{{ item.expense_date ? formatDate(item.expense_date) : '—' }}</template>
        <template #cell-total_amount="{ item }">{{ formatCurrency(item.total_amount) }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
