<script setup lang="ts">
import { ref } from 'vue'
import { useAnalyticItems, type AnalyticItemFilters } from '@/api/useAnalyticDimensions'
import { formatCurrency, formatDate } from '@/utils/format'
import { Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'

const filters = ref<AnalyticItemFilters>({
  page: 1,
  per_page: 50,
  from: '',
  to: '',
})
const { data, isLoading, error } = useAnalyticItems(filters)

const columns: ResponsiveColumn[] = [
  { key: 'entry_date', label: 'Date', mobilePriority: 1 },
  { key: 'entry_number', label: 'Journal', mobilePriority: 2 },
  { key: 'analytic_account', label: 'Analytic', mobilePriority: 3 },
  { key: 'amount', label: 'Amount', mobilePriority: 4 },
  { key: 'percentage', label: '%', showInMobile: false },
]
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Analytic Items</h1>
      <p class="text-slate-500 dark:text-slate-400">
        Posted journal analytic distribution, exploded into the analytic ledger.
      </p>
    </div>

    <Card class="mb-4">
      <div class="p-4 flex flex-col sm:flex-row gap-3">
        <Input
          :model-value="filters.from ?? ''"
          type="date"
          @update:model-value="(v) => { filters.from = String(v) }"
        />
        <Input
          :model-value="filters.to ?? ''"
          type="date"
          @update:model-value="(v) => { filters.to = String(v) }"
        />
      </div>
    </Card>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load analytic items</div>
      <div v-else-if="!isLoading && !data?.data?.length" class="py-12 text-center text-slate-500">
        No analytic items yet. Post a journal entry with analytic distribution.
      </div>
      <ResponsiveTable
        v-else
        :items="data?.data ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
      >
        <template #cell-entry_date="{ item }">{{ item.entry_date ? formatDate(item.entry_date) : '' }}</template>
        <template #cell-analytic_account="{ item }">
          {{ item.analytic_account ? item.analytic_account.code + ' · ' + item.analytic_account.name : item.analytic_account_id }}
        </template>
        <template #cell-amount="{ item }">{{ formatCurrency(item.amount) }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
