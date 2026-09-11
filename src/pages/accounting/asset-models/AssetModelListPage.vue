<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAssetModels, type AssetModel, type AssetModelFilters } from '@/api/useAssetModels'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Search } from 'lucide-vue-next'

const router = useRouter()

const {
  items: models,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
} = useResourceList<AssetModel, AssetModelFilters>({
  useListHook: useAssetModels,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'method', label: 'Method', mobilePriority: 3 },
  { key: 'method_number', label: 'Periods', showInMobile: false },
  { key: 'is_active', label: 'Status', showInMobile: false },
]

function openModel(model: AssetModel) {
  router.push(`/accounting/asset-models/${model.id}/edit`)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Asset Models</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Depreciation templates (method, duration, accounts) applied when creating assets.
        </p>
      </div>
      <Button data-testid="asset-model-create" @click="router.push('/accounting/asset-models/new')">
        <Plus class="w-4 h-4 mr-1" />
        New Asset Model
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
            data-testid="asset-model-search"
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load asset models</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No asset models found</div>
      <ResponsiveTable
        v-else
        :items="models ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openModel"
      >
        <template #cell-method="{ item }">{{ item.method }} / {{ item.method_period }}</template>
        <template #cell-is_active="{ item }">{{ item.is_active ? 'Active' : 'Inactive' }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
