<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useAnalyticBudgets,
  type AnalyticBudget,
  type AnalyticBudgetFilters,
} from '@/api/useAnalyticDimensions'
import { useResourceList } from '@/composables/useResourceList'
import { formatDate } from '@/utils/format'
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
} = useResourceList<AnalyticBudget, AnalyticBudgetFilters>({
  useListHook: useAnalyticBudgets,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'name', label: 'Name', mobilePriority: 1 },
  { key: 'date_from', label: 'From', mobilePriority: 2 },
  { key: 'date_to', label: 'To', mobilePriority: 3 },
  { key: 'status', label: 'Status', mobilePriority: 4 },
]

function openBudget(budget: AnalyticBudget) {
  router.push('/accounting/analytic-budgets/' + budget.id)
}

function createBudget() {
  router.push('/accounting/analytic-budgets/new')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Analytic Budgets</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Plan vs actual by analytic account, using posted analytic items.
        </p>
      </div>
      <Button data-testid="analytic-budget-create" @click="createBudget">
        <Plus class="w-4 h-4 mr-1" />
        New Analytic Budget
      </Button>
    </div>

    <Card class="mb-4">
      <div class="p-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            :model-value="filters.search ?? ''"
            class="pl-9"
            placeholder="Search name..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load analytic budgets</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No analytic budgets found</div>
      <ResponsiveTable
        v-else
        :items="items ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openBudget"
      >
        <template #cell-date_from="{ item }">{{ formatDate(item.date_from) }}</template>
        <template #cell-date_to="{ item }">{{ formatDate(item.date_to) }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
