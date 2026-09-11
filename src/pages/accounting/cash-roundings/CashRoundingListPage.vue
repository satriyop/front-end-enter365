<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCashRoundings, type CashRounding, type CashRoundingFilters } from '@/api/useCashRoundings'
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
} = useResourceList<CashRounding, CashRoundingFilters>({
  useListHook: useCashRoundings,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'name', label: 'Name', mobilePriority: 1 },
  { key: 'rounding', label: 'Unit', mobilePriority: 2 },
  { key: 'strategy', label: 'Strategy', mobilePriority: 3 },
  { key: 'is_active', label: 'Status', showInMobile: false },
]

function openRounding(rounding: CashRounding) {
  router.push('/accounting/cash-roundings/' + rounding.id + '/edit')
}

function createRounding() {
  router.push('/accounting/cash-roundings/new')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Cash Roundings</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Rounding rules for cash tenders. POS still uses the till unit until a rule is selected there.
        </p>
      </div>
      <Button data-testid="cash-rounding-create" @click="createRounding">
        <Plus class="w-4 h-4 mr-1" />
        New Cash Rounding
      </Button>
    </div>
    <Card class="mb-4">
      <div class="p-4 relative">
        <Search class="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          :model-value="filters.search ?? ''"
          class="pl-9"
          placeholder="Search name..."
          @update:model-value="(v) => updateFilter('search', String(v))"
        />
      </div>
    </Card>
    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load cash roundings</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No cash roundings found</div>
      <ResponsiveTable
        v-else
        :items="items ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openRounding"
      >
        <template #cell-is_active="{ item }">{{ item.is_active ? 'Active' : 'Inactive' }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
