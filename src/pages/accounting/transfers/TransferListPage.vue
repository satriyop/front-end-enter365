<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useAccountingTransfers,
  type AccountingTransfer,
  type AccountingTransferFilters,
} from '@/api/useAccountingTransfers'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Search } from 'lucide-vue-next'

const router = useRouter()
const {
  items: transfers,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
} = useResourceList<AccountingTransfer, AccountingTransferFilters>({
  useListHook: useAccountingTransfers,
  initialFilters: { page: 1, per_page: 50, search: '' },
})

const columns: ResponsiveColumn[] = [
  { key: 'transfer_number', label: 'Number', mobilePriority: 1 },
  { key: 'transfer_date', label: 'Date', mobilePriority: 2 },
  { key: 'from_account', label: 'From', mobilePriority: 3 },
  { key: 'to_account', label: 'To', mobilePriority: 4 },
  { key: 'amount', label: 'Amount', showInMobile: false },
  { key: 'status', label: 'Status', showInMobile: false },
]

function accountLabel(account: AccountingTransfer['from_account']): string {
  if (!account) return '—'
  return account.code + ' · ' + account.name
}

function openTransfer(transfer: AccountingTransfer) {
  router.push('/accounting/transfers/' + transfer.id)
}

function createTransfer() {
  router.push('/accounting/transfers/new')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Transfers</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Move liquidity between journals and accounts. Posting writes a balanced journal entry.
        </p>
      </div>
      <Button data-testid="transfer-create" @click="createTransfer">
        <Plus class="w-4 h-4 mr-1" />
        New Transfer
      </Button>
    </div>

    <Card class="mb-4">
      <div class="p-4">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            :model-value="filters.search ?? ''"
            class="pl-9"
            placeholder="Search number or memo..."
            data-testid="transfer-search"
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load transfers</div>
      <div v-else-if="isEmpty && !isLoading" class="py-12 text-center text-slate-500">No transfers found</div>
      <ResponsiveTable
        v-else
        :items="transfers ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openTransfer"
      >
        <template #cell-transfer_date="{ item }">{{ formatDate(item.transfer_date) }}</template>
        <template #cell-from_account="{ item }">{{ accountLabel(item.from_account) }}</template>
        <template #cell-to_account="{ item }">{{ accountLabel(item.to_account) }}</template>
        <template #cell-amount="{ item }">{{ formatCurrency(item.amount) }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
