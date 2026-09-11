<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useAccountingLedgers,
  type AccountingLedger,
  type AccountingLedgerFilters,
} from '@/api/useAccountingLedgers'
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
} = useResourceList<AccountingLedger, AccountingLedgerFilters>({
  useListHook: useAccountingLedgers,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'currency_code', label: 'Currency', mobilePriority: 3 },
  { key: 'is_default', label: 'Default', showInMobile: false },
  { key: 'is_active', label: 'Status', showInMobile: false },
]

function openLedger(ledger: AccountingLedger) {
  router.push('/accounting/ledgers/' + ledger.id + '/edit')
}

function createLedger() {
  router.push('/accounting/ledgers/new')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Multi Ledgers</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Additional books besides the statutory ledger (for example IFRS or tax).
        </p>
      </div>
      <Button data-testid="ledger-create" @click="createLedger">
        <Plus class="w-4 h-4 mr-1" />
        New Ledger
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
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load ledgers</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No ledgers found</div>
      <ResponsiveTable
        v-else
        :items="items ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openLedger"
      >
        <template #cell-is_default="{ item }">{{ item.is_default ? 'Yes' : '' }}</template>
        <template #cell-is_active="{ item }">{{ item.is_active ? 'Active' : 'Inactive' }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
