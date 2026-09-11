<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useAnalyticDistributionModels,
  type AnalyticDistributionModel,
  type AnalyticDistributionModelFilters,
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
} = useResourceList<AnalyticDistributionModel, AnalyticDistributionModelFilters>({
  useListHook: useAnalyticDistributionModels,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'name', label: 'Name', mobilePriority: 1 },
  { key: 'account_prefix', label: 'Account prefix', mobilePriority: 2 },
  { key: 'sequence', label: 'Sequence', showInMobile: false },
  { key: 'is_active', label: 'Status', mobilePriority: 3 },
]

function openModel(model: AnalyticDistributionModel) {
  router.push('/accounting/analytic-distribution-models/' + model.id + '/edit')
}

function createModel() {
  router.push('/accounting/analytic-distribution-models/new')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Analytic Distribution Models</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Automatic analytic splits by partner, product, or GL account prefix.
        </p>
      </div>
      <Button data-testid="analytic-distribution-model-create" @click="createModel">
        <Plus class="w-4 h-4 mr-1" />
        New Distribution Model
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
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load distribution models</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No distribution models found</div>
      <ResponsiveTable
        v-else
        :items="items ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openModel"
      >
        <template #cell-is_active="{ item }">{{ item.is_active ? 'Active' : 'Inactive' }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
