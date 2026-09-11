<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDepreciationSchedule, type DepreciationScheduleFilters } from '@/api/useFixedAssets'
import { formatCurrency, formatDate } from '@/utils/format'
import { Card, ResponsiveTable, Select, type ResponsiveColumn } from '@/components/ui'

const router = useRouter()
const filters = ref<DepreciationScheduleFilters>({
  page: 1,
  per_page: 50,
  status: '',
})
const { data, isLoading, error } = useDepreciationSchedule(filters)

function openLine(row: { fixed_asset_id: number }) {
  router.push('/accounting/assets/' + row.fixed_asset_id)
}

const columns: ResponsiveColumn[] = [
  { key: 'depreciation_date', label: 'Date', mobilePriority: 1 },
  { key: 'asset', label: 'Asset', mobilePriority: 2 },
  { key: 'amount', label: 'Amount', mobilePriority: 3 },
  { key: 'remaining_value', label: 'Remaining', showInMobile: false },
  { key: 'status', label: 'Status', mobilePriority: 4 },
]
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Depreciation Schedule</h1>
      <p class="text-slate-500 dark:text-slate-400">
        Review upcoming and posted depreciation across the asset register.
      </p>
    </div>

    <Card class="mb-4">
      <div class="p-4 max-w-xs">
        <Select
          :model-value="filters.status ?? ''"
          :options="[
            { value: '', label: 'All statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'posted', label: 'Posted' },
          ]"
          @update:model-value="(v) => { filters.status = v ? String(v) : '' }"
        />
      </div>
    </Card>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load depreciation schedule</div>
      <div v-else-if="!isLoading && !data?.data?.length" class="py-12 text-center text-slate-500">
        No depreciation lines yet. Confirm an asset to generate its board.
      </div>
      <ResponsiveTable
        v-else
        :items="data?.data ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="openLine"
      >
        <template #cell-depreciation_date="{ item }">{{ formatDate(item.depreciation_date) }}</template>
        <template #cell-asset="{ item }">{{ item.asset ? `${item.asset.code} · ${item.asset.name}` : item.fixed_asset_id }}</template>
        <template #cell-amount="{ item }">{{ formatCurrency(item.amount) }}</template>
        <template #cell-remaining_value="{ item }">{{ formatCurrency(item.remaining_value) }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
