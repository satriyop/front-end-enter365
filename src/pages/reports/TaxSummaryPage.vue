<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePpnMonthly } from '@/api/useReports'
import { Button, Card, Input } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const router = useRouter()

const year = ref(new Date().getFullYear())
const yearRef = computed(() => year.value)

const { data: report, isLoading, error } = usePpnMonthly(yearRef)

// Calculate quarterly totals
const quarterlyData = computed(() => {
  if (!report.value?.months) return []

  const quarters = [
    { name: 'Q1 (Jan-Mar)', months: [1, 2, 3] },
    { name: 'Q2 (Apr-Jun)', months: [4, 5, 6] },
    { name: 'Q3 (Jul-Sep)', months: [7, 8, 9] },
    { name: 'Q4 (Oct-Dec)', months: [10, 11, 12] },
  ]

  return quarters.map(q => {
    const quarterMonths = report.value!.months.filter(m => q.months.includes(m.month))
    return {
      name: q.name,
      output: quarterMonths.reduce((sum, m) => sum + m.output, 0),
      input: quarterMonths.reduce((sum, m) => sum + m.input, 0),
      net: quarterMonths.reduce((sum, m) => sum + m.net, 0),
    }
  })
})

function formatAmount(amount: number): string {
  const formatted = formatCurrency(Math.abs(amount))
  return amount < 0 ? `(${formatted})` : formatted
}

function getNetClass(net: number): string {
  return net >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Tax Summary</h1>
        <p class="text-slate-500 dark:text-slate-400">Ringkasan Pajak - Taxes collected and paid</p>
      </div>
      <Button variant="ghost" @click="router.push('/reports')">Back to Reports</Button>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
          <Input v-model.number="year" type="number" class="w-28" :min="2020" :max="2030" />
        </div>
        <Button variant="secondary" size="sm" @click="year = new Date().getFullYear()">
          This Year
        </Button>
        <Button variant="secondary" size="sm" @click="year = year - 1">
          Previous Year
        </Button>
      </div>
    </Card>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading report...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-500">Failed to load report</div>
    </div>

    <!-- Report Content -->
    <div v-else-if="report" class="space-y-6">
      <!-- Annual Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Output VAT</div>
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">
            {{ formatCurrency(report.total_output || 0) }}
          </div>
          <div class="text-xs text-slate-400 dark:text-slate-500 mt-1">PPN Keluaran {{ year }}</div>
        </Card>
        <Card class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Input VAT</div>
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ formatCurrency(report.total_input || 0) }}
          </div>
          <div class="text-xs text-slate-400 dark:text-slate-500 mt-1">PPN Masukan {{ year }}</div>
        </Card>
        <Card
          class="text-center"
          :class="report.total_net >= 0 ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'"
        >
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Net VAT Payable</div>
          <div class="text-2xl font-bold" :class="getNetClass(report.total_net)">
            {{ formatAmount(report.total_net) }}
          </div>
          <div class="text-xs mt-1" :class="report.total_net >= 0 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'">
            {{ report.total_net >= 0 ? 'Annual Tax Liability' : 'Refundable / Carry Forward' }}
          </div>
        </Card>
      </div>

      <!-- Quarterly Summary -->
      <Card>
        <div class="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Quarterly Summary</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">Tax breakdown by quarter for {{ year }}</p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="quarter in quarterlyData" :key="quarter.name" class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{{ quarter.name }}</div>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500 dark:text-slate-400">Output</span>
                <span class="font-mono text-red-600 dark:text-red-400">{{ formatCurrency(quarter.output) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 dark:text-slate-400">Input</span>
                <span class="font-mono text-green-600 dark:text-green-400">{{ formatCurrency(quarter.input) }}</span>
              </div>
              <div class="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span class="font-medium text-slate-700 dark:text-slate-300">Net</span>
                <span class="font-mono font-semibold" :class="getNetClass(quarter.net)">{{ formatAmount(quarter.net) }}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Monthly Detail -->
      <Card>
        <div class="border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Monthly Breakdown</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">Detailed tax by month for {{ year }}</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Month</th>
                <th class="text-right px-4 py-3 font-medium text-red-600 dark:text-red-400">Output VAT</th>
                <th class="text-right px-4 py-3 font-medium text-green-600 dark:text-green-400">Input VAT</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Net VAT</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Cumulative</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr
                v-for="(month, index) in report.months"
                :key="month.month"
                class="hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <td class="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{{ month.month_name }}</td>
                <td class="text-right px-4 py-3 font-mono text-red-600 dark:text-red-400">
                  {{ month.output > 0 ? formatCurrency(month.output) : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-green-600 dark:text-green-400">
                  {{ month.input > 0 ? formatCurrency(month.input) : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono font-semibold" :class="getNetClass(month.net)">
                  {{ formatAmount(month.net) }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatAmount(report.months.slice(0, index + 1).reduce((sum, m) => sum + m.net, 0)) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-100 dark:bg-slate-800 font-semibold">
              <tr>
                <td class="px-4 py-3 text-slate-900 dark:text-slate-100">TOTAL {{ year }}</td>
                <td class="text-right px-4 py-3 font-mono text-red-700 dark:text-red-400">
                  {{ formatCurrency(report.total_output) }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-green-700 dark:text-green-400">
                  {{ formatCurrency(report.total_input) }}
                </td>
                <td class="text-right px-4 py-3 font-mono" :class="getNetClass(report.total_net)">
                  {{ formatAmount(report.total_net) }}
                </td>
                <td class="text-right px-4 py-3 font-mono" :class="getNetClass(report.total_net)">
                  {{ formatAmount(report.total_net) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <!-- Quick Links -->
      <div class="flex flex-wrap gap-2">
        <RouterLink to="/reports/vat">
          <Button variant="secondary" size="sm">Detailed VAT Report</Button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
