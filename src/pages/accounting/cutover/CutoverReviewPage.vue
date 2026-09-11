<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CUTOVER_KIND_META, useCutoverReview, type CutoverKind } from '@/api/useCutoverReviews'
import { formatCurrency, formatDate, toLocalISODate } from '@/utils/format'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'

const props = defineProps<{ kind: CutoverKind }>()
const router = useRouter()
const asOfDate = ref(toLocalISODate())
const meta = computed(() => CUTOVER_KIND_META[props.kind])
const { data: report, isLoading, error } = useCutoverReview(props.kind, asOfDate)

const columns: ResponsiveColumn[] = [
  { key: 'number', label: 'Number', mobilePriority: 1 },
  { key: 'date', label: 'Date', mobilePriority: 2 },
  { key: 'partner', label: 'Partner', mobilePriority: 3 },
  { key: 'reference', label: 'Reference', showInMobile: false },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'amount', label: 'Amount', mobilePriority: 4 },
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ meta.title }}</h1>
        <p class="text-slate-500 dark:text-slate-400">{{ meta.description }}</p>
      </div>
      <Button variant="ghost" @click="router.push('/reports')">Back to Reports</Button>
    </div>

    <Card class="mb-4 p-4 flex flex-wrap items-end gap-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">As of date</label>
        <Input v-model="asOfDate" type="date" class="w-40" data-testid="cutover-as-of" />
      </div>
    </Card>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <Card class="p-4">
        <div class="text-sm text-slate-500">Documents</div>
        <div class="text-xl font-semibold">{{ report?.totals.count ?? 0 }}</div>
      </Card>
      <Card class="p-4">
        <div class="text-sm text-slate-500">Amount</div>
        <div class="text-xl font-semibold">{{ formatCurrency(report?.totals.amount ?? 0) }}</div>
      </Card>
    </div>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load review</div>
      <div v-else-if="!isLoading && !(report?.rows.length)" class="py-12 text-center text-slate-500">
        No open cutover items as of this date
      </div>
      <ResponsiveTable
        v-else
        :items="report?.rows ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
      >
        <template #cell-date="{ item }">{{ item.date ? formatDate(item.date) : '—' }}</template>
        <template #cell-amount="{ item }">{{ formatCurrency(item.amount) }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
