<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  deferredBasePath,
  deferredLabel,
  useDeferredEntries,
  type DeferredEntry,
  type DeferredEntryFilters,
  type DeferredKind,
} from '@/api/useDeferredEntries'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Search } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const kind = computed<DeferredKind>(() => (route.meta.kind === 'revenue' ? 'revenue' : 'expense'))
const basePath = computed(() => deferredBasePath(kind.value))
const title = computed(() => deferredLabel(kind.value))

const {
  items,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
} = useResourceList<DeferredEntry, DeferredEntryFilters>({
  useListHook: useDeferredEntries(kind.value),
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'amount', label: 'Amount', mobilePriority: 3 },
  { key: 'remaining_amount', label: 'Remaining', mobilePriority: 4 },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'start_date', label: 'Start', showInMobile: false },
]

function openEntry(entry: DeferredEntry) {
  router.push(basePath.value + '/' + entry.id)
}

function createEntry() {
  router.push(basePath.value + '/new')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ title }}</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Confirm to generate the recognition schedule and post the origination journal.
        </p>
      </div>
      <Button data-testid="deferred-create" @click="createEntry">
        <Plus class="w-4 h-4 mr-1" />
        New {{ kind === 'expense' ? 'Deferred Expense' : 'Deferred Revenue' }}
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
            data-testid="deferred-search"
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load {{ title.toLowerCase() }}</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No entries found</div>
      <ResponsiveTable
        v-else
        :items="items ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openEntry"
      >
        <template #cell-amount="{ item }">{{ formatCurrency(item.amount) }}</template>
        <template #cell-remaining_amount="{ item }">{{ formatCurrency(item.remaining_amount) }}</template>
        <template #cell-start_date="{ item }">{{ formatDate(item.start_date) }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
