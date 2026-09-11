<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCurrencies, type Currency, type CurrencyFilters } from '@/api/useCurrencies'
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
} = useResourceList<Currency, CurrencyFilters>({
  useListHook: useCurrencies,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'symbol', label: 'Symbol', mobilePriority: 3 },
  { key: 'is_base_currency', label: 'Base', showInMobile: false },
  { key: 'is_active', label: 'Status', showInMobile: false },
]

function openCurrency(currency: Currency) {
  router.push('/accounting/currencies/' + currency.id + '/edit')
}

function createCurrency() {
  router.push('/accounting/currencies/new')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Currencies</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Currency master. IDR is the statutory base; add rates via existing FX revaluation.
        </p>
      </div>
      <Button data-testid="currency-create" @click="createCurrency">
        <Plus class="w-4 h-4 mr-1" />
        New Currency
      </Button>
    </div>
    <Card class="mb-4">
      <div class="p-4 relative">
        <Search class="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          :model-value="filters.search ?? ''"
          class="pl-9"
          placeholder="Search code or name..."
          @update:model-value="(v) => updateFilter('search', String(v))"
        />
      </div>
    </Card>
    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load currencies</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No currencies found</div>
      <ResponsiveTable
        v-else
        :items="items ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openCurrency"
      >
        <template #cell-is_base_currency="{ item }">{{ item.is_base_currency ? 'Yes' : '' }}</template>
        <template #cell-is_active="{ item }">{{ item.is_active ? 'Active' : 'Inactive' }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
