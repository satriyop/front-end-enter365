<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useFiscalPositions, type FiscalPosition, type FiscalPositionFilters } from '@/api/useFiscalPositions'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Search } from 'lucide-vue-next'

const router = useRouter()

const {
  items: positions,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
} = useResourceList<FiscalPosition, FiscalPositionFilters>({
  useListHook: useFiscalPositions,
  initialFilters: {
    page: 1,
    per_page: 50,
    search: '',
  },
})

const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'tax_maps', label: 'Tax maps', mobilePriority: 3 },
  { key: 'account_maps', label: 'Account maps', showInMobile: false },
  { key: 'is_active', label: 'Status', showInMobile: false },
]

function openPosition(position: FiscalPosition) {
  router.push(`/accounting/fiscal-positions/${position.id}/edit`)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Fiscal Positions</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Map taxes and accounts by customer/vendor position. This is not Fiscal Periods (open/close/lock).
        </p>
      </div>
      <Button data-testid="fiscal-position-create" @click="router.push('/accounting/fiscal-positions/new')">
        <Plus class="w-4 h-4 mr-1" />
        New Fiscal Position
      </Button>
    </div>

    <Card class="mb-4">
      <div class="flex flex-col sm:flex-row gap-3 p-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            :model-value="filters.search ?? ''"
            class="pl-9"
            placeholder="Search code or name..."
            data-testid="fiscal-position-search"
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load fiscal positions</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No fiscal positions found</div>
      <ResponsiveTable
        v-else
        :items="positions ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openPosition"
      >
        <template #cell-tax_maps="{ item }">{{ item.tax_maps?.length ?? 0 }}</template>
        <template #cell-account_maps="{ item }">{{ item.account_maps?.length ?? 0 }}</template>
        <template #cell-is_active="{ item }">{{ item.is_active ? 'Active' : 'Inactive' }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
