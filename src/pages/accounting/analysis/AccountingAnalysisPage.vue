<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ANALYSIS_KIND_META,
  useAccountingAnalysis,
  type AnalysisKind,
} from '@/api/useAccountingAnalysis'
import { formatCurrency, toLocalISODate } from '@/utils/format'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'

const props = defineProps<{ kind: AnalysisKind }>()
const router = useRouter()
const meta = computed(() => ANALYSIS_KIND_META[props.kind])

const year = ref(new Date().getFullYear())
const from = ref(toLocalISODate().slice(0, 8) + '01')
const to = ref(toLocalISODate())
const asOfDate = ref(toLocalISODate())
const groupBy = ref('month')
const usdRate = ref('')

const filters = computed(() => ({
  year: year.value,
  from: from.value,
  to: to.value,
  as_of_date: asOfDate.value,
  group_by: groupBy.value,
  usd_rate: usdRate.value ? Number(usdRate.value) : undefined,
}))

const { data: report, isLoading, error } = useAccountingAnalysis(props.kind, filters)

const columns = computed<ResponsiveColumn[]>(() => {
  if (props.kind === 'tax-returns') {
    return [
      { key: 'period', label: 'Period', mobilePriority: 1 },
      { key: 'status', label: 'Status', mobilePriority: 2 },
      { key: 'output_tax', label: 'Output PPN', mobilePriority: 3 },
      { key: 'input_tax', label: 'Input PPN', showInMobile: false },
      { key: 'net_tax', label: 'Net', mobilePriority: 4 },
    ]
  }
  if (props.kind === 'unrealized-currencies') {
    return [
      { key: 'type', label: 'Type', mobilePriority: 1 },
      { key: 'reference', label: 'Reference', mobilePriority: 2 },
      { key: 'currency', label: 'Currency', mobilePriority: 3 },
      { key: 'outstanding', label: 'Outstanding', showInMobile: false },
      { key: 'booked_rate', label: 'Booked', showInMobile: false },
      { key: 'closing_rate', label: 'Closing', showInMobile: false },
      { key: 'unrealized_fx', label: 'Unrealized', mobilePriority: 4 },
    ]
  }
  if (props.kind === 'invoice-analysis') {
    return [
      { key: 'group', label: 'Group', mobilePriority: 1 },
      { key: 'count', label: 'Count', mobilePriority: 2 },
      { key: 'total_amount', label: 'Total', mobilePriority: 3 },
      { key: 'paid_amount', label: 'Paid', showInMobile: false },
      { key: 'outstanding', label: 'Outstanding', mobilePriority: 4 },
    ]
  }
  if (props.kind === 'analytic-report') {
    return [
      { key: 'code', label: 'Code', mobilePriority: 1 },
      { key: 'name', label: 'Analytic', mobilePriority: 2 },
      { key: 'income', label: 'Income', mobilePriority: 3 },
      { key: 'expense', label: 'Expense', showInMobile: false },
      { key: 'balance', label: 'Balance', mobilePriority: 4 },
    ]
  }
  if (props.kind === 'executive-summary') {
    return [
      { key: 'label', label: 'KPI', mobilePriority: 1 },
      { key: 'amount', label: 'Amount', mobilePriority: 2 },
    ]
  }
  return [
    { key: 'name', label: 'Budget', mobilePriority: 1 },
    { key: 'status', label: 'Status', mobilePriority: 2 },
    { key: 'budgeted_revenue', label: 'Budget revenue', mobilePriority: 3 },
    { key: 'actual_revenue', label: 'Actual revenue', showInMobile: false },
    { key: 'budgeted_expense', label: 'Budget expense', showInMobile: false },
    { key: 'actual_expense', label: 'Actual expense', mobilePriority: 4 },
  ]
})

const rows = computed(() => (report.value?.rows ?? []) as Array<Record<string, unknown>>)
const rowKey = computed(() => {
  if (props.kind === 'tax-returns') return 'period'
  if (props.kind === 'unrealized-currencies') return 'reference'
  if (props.kind === 'invoice-analysis') return 'group'
  if (props.kind === 'analytic-report') return 'analytic_account_id'
  if (props.kind === 'executive-summary') return 'label'
  return 'id'
})
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
      <div v-if="kind === 'tax-returns'">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
        <Input v-model.number="year" type="number" class="w-28" data-testid="analysis-year" />
      </div>
      <div v-if="kind === 'unrealized-currencies' || kind === 'budget-report'">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">As of date</label>
        <Input v-model="asOfDate" type="date" class="w-40" data-testid="analysis-as-of" />
      </div>
      <div v-if="kind === 'unrealized-currencies'">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">USD closing rate</label>
        <Input v-model="usdRate" type="number" class="w-36" placeholder="16000" data-testid="analysis-usd-rate" />
      </div>
      <div v-if="kind === 'invoice-analysis' || kind === 'analytic-report' || kind === 'executive-summary'">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From</label>
        <Input v-model="from" type="date" class="w-40" data-testid="analysis-from" />
      </div>
      <div v-if="kind === 'invoice-analysis' || kind === 'analytic-report' || kind === 'executive-summary'">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To</label>
        <Input v-model="to" type="date" class="w-40" data-testid="analysis-to" />
      </div>
      <div v-if="kind === 'invoice-analysis'">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group by</label>
        <select
          v-model="groupBy"
          class="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
          data-testid="analysis-group-by"
        >
          <option value="month">Month</option>
          <option value="partner">Partner</option>
          <option value="status">Status</option>
        </select>
      </div>
    </Card>

    <div v-if="report?.totals || report?.kpis" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card v-if="kind === 'tax-returns'" class="p-4">
        <div class="text-sm text-slate-500">Output PPN</div>
        <div class="text-xl font-semibold">{{ formatCurrency(report?.totals?.output_tax ?? 0) }}</div>
      </Card>
      <Card v-if="kind === 'tax-returns'" class="p-4">
        <div class="text-sm text-slate-500">Input PPN</div>
        <div class="text-xl font-semibold">{{ formatCurrency(report?.totals?.input_tax ?? 0) }}</div>
      </Card>
      <Card v-if="kind === 'tax-returns'" class="p-4">
        <div class="text-sm text-slate-500">Net</div>
        <div class="text-xl font-semibold">{{ formatCurrency(report?.totals?.net_tax ?? 0) }}</div>
      </Card>
      <Card v-if="kind === 'unrealized-currencies'" class="p-4">
        <div class="text-sm text-slate-500">Gain</div>
        <div class="text-xl font-semibold">{{ formatCurrency(report?.totals?.total_gain ?? 0) }}</div>
      </Card>
      <Card v-if="kind === 'unrealized-currencies'" class="p-4">
        <div class="text-sm text-slate-500">Loss</div>
        <div class="text-xl font-semibold">{{ formatCurrency(report?.totals?.total_loss ?? 0) }}</div>
      </Card>
      <Card v-if="kind === 'invoice-analysis'" class="p-4">
        <div class="text-sm text-slate-500">Invoices</div>
        <div class="text-xl font-semibold">{{ report?.totals?.count ?? 0 }}</div>
      </Card>
      <Card v-if="kind === 'invoice-analysis'" class="p-4">
        <div class="text-sm text-slate-500">Total</div>
        <div class="text-xl font-semibold">{{ formatCurrency(report?.totals?.total_amount ?? 0) }}</div>
      </Card>
      <Card v-if="kind === 'executive-summary'" class="p-4">
        <div class="text-sm text-slate-500">Sales</div>
        <div class="text-xl font-semibold">{{ formatCurrency(report?.kpis?.sales_total ?? 0) }}</div>
      </Card>
      <Card v-if="kind === 'executive-summary'" class="p-4">
        <div class="text-sm text-slate-500">Purchases</div>
        <div class="text-xl font-semibold">{{ formatCurrency(report?.kpis?.purchase_total ?? 0) }}</div>
      </Card>
      <Card v-if="kind === 'executive-summary'" class="p-4">
        <div class="text-sm text-slate-500">Net operating</div>
        <div class="text-xl font-semibold">{{ formatCurrency(report?.kpis?.net_operating ?? 0) }}</div>
      </Card>
    </div>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load report</div>
      <div v-else-if="!isLoading && !rows.length" class="py-12 text-center text-slate-500">No rows for this period</div>
      <ResponsiveTable
        v-else
        :items="rows"
        :columns="columns"
        :loading="isLoading"
        :row-key="rowKey"
      >
        <template #cell-output_tax="{ item }">{{ formatCurrency(Number(item.output_tax ?? 0)) }}</template>
        <template #cell-input_tax="{ item }">{{ formatCurrency(Number(item.input_tax ?? 0)) }}</template>
        <template #cell-net_tax="{ item }">{{ formatCurrency(Number(item.net_tax ?? 0)) }}</template>
        <template #cell-outstanding="{ item }">{{ formatCurrency(Number(item.outstanding ?? 0)) }}</template>
        <template #cell-unrealized_fx="{ item }">{{ formatCurrency(Number(item.unrealized_fx ?? 0)) }}</template>
        <template #cell-total_amount="{ item }">{{ formatCurrency(Number(item.total_amount ?? 0)) }}</template>
        <template #cell-paid_amount="{ item }">{{ formatCurrency(Number(item.paid_amount ?? 0)) }}</template>
        <template #cell-income="{ item }">{{ formatCurrency(Number(item.income ?? 0)) }}</template>
        <template #cell-expense="{ item }">{{ formatCurrency(Number(item.expense ?? 0)) }}</template>
        <template #cell-balance="{ item }">{{ formatCurrency(Number(item.balance ?? 0)) }}</template>
        <template #cell-amount="{ item }">{{ formatCurrency(Number(item.amount ?? 0)) }}</template>
        <template #cell-budgeted_revenue="{ item }">{{ formatCurrency(Number(item.budgeted_revenue ?? 0)) }}</template>
        <template #cell-actual_revenue="{ item }">{{ formatCurrency(Number(item.actual_revenue ?? 0)) }}</template>
        <template #cell-budgeted_expense="{ item }">{{ formatCurrency(Number(item.budgeted_expense ?? 0)) }}</template>
        <template #cell-actual_expense="{ item }">{{ formatCurrency(Number(item.actual_expense ?? 0)) }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
