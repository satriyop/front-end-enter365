<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useFixedAssets, type FixedAsset, type FixedAssetFilters } from '@/api/useFixedAssets'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Search } from 'lucide-vue-next'

const router = useRouter()

const {
  items: assets,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
} = useResourceList<FixedAsset, FixedAssetFilters>({
  useListHook: useFixedAssets,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'original_value', label: 'Original', mobilePriority: 3 },
  { key: 'book_value', label: 'Book value', mobilePriority: 4 },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'acquisition_date', label: 'Acquired', showInMobile: false },
]

function openAsset(asset: FixedAsset) {
  router.push(`/accounting/assets/${asset.id}`)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Assets</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Fixed asset register. Confirm to generate the depreciation schedule.
        </p>
      </div>
      <Button data-testid="asset-create" @click="router.push('/accounting/assets/new')">
        <Plus class="w-4 h-4 mr-1" />
        New Asset
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
            data-testid="asset-search"
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load assets</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No assets found</div>
      <ResponsiveTable
        v-else
        :items="assets ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openAsset"
      >
        <template #cell-original_value="{ item }">{{ formatCurrency(item.original_value) }}</template>
        <template #cell-book_value="{ item }">{{ formatCurrency(item.book_value) }}</template>
        <template #cell-acquisition_date="{ item }">{{ formatDate(item.acquisition_date) }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
