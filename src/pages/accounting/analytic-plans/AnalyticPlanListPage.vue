<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useAnalyticPlans,
  type AnalyticPlan,
  type AnalyticPlanFilters,
} from '@/api/useAnalyticDimensions'
import { useResourceList } from '@/composables/useResourceList'
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
} = useResourceList<AnalyticPlan, AnalyticPlanFilters>({
  useListHook: useAnalyticPlans,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'default_applicability', label: 'Applicability', mobilePriority: 3 },
  { key: 'is_active', label: 'Status', showInMobile: false },
]

function openPlan(plan: AnalyticPlan) {
  router.push('/accounting/analytic-plans/' + plan.id + '/edit')
}

function createPlan() {
  router.push('/accounting/analytic-plans/new')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Analytic Plans</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Group analytic accounts the way Odoo Configuration › Analytic Plans does.
        </p>
      </div>
      <Button data-testid="analytic-plan-create" @click="createPlan">
        <Plus class="w-4 h-4 mr-1" />
        New Analytic Plan
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
            data-testid="analytic-plan-search"
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load analytic plans</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No analytic plans found</div>
      <ResponsiveTable
        v-else
        :items="items ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openPlan"
      >
        <template #cell-is_active="{ item }">{{ item.is_active ? 'Active' : 'Inactive' }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
