<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCogsByProduct } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'
import { formatCurrency, formatNumber, formatPercent, toLocalISODate } from '@/utils/format'

const router = useRouter()

// Date range state
const startDate = ref('')
const endDate = ref('')

// Computed refs for hook (only pass when both dates are set)
const startDateParam = computed(() => startDate.value || undefined)
const endDateParam = computed(() => endDate.value || undefined)

// Fetch report data
const { data: report, isLoading, error } = useCogsByProduct(startDateParam, endDateParam)

// Quick date range helpers
function setThisMonth() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  startDate.value = toLocalISODate(start)
  endDate.value = toLocalISODate(end)
}

function setLastMonth() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 0)
  startDate.value = toLocalISODate(start)
  endDate.value = toLocalISODate(end)
}

function setThisYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear(), 11, 31)
  startDate.value = toLocalISODate(start)
  endDate.value = toLocalISODate(end)
}

function clearDates() {
  startDate.value = ''
  endDate.value = ''
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <Button
        variant="ghost"
        size="sm"
        @click="router.push('/reports')"
        class="mb-4"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Reports
      </Button>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">COGS by Product</h1>
      <p class="text-slate-600 dark:text-slate-400 mt-1">HPP per Produk</p>
    </div>

    <!-- Date Range Filter -->
    <Card class="p-6">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Filter Period</h2>
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Start Date
          </label>
          <Input
            v-model="startDate"
            type="date"
          />
        </div>
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            End Date
          </label>
          <Input
            v-model="endDate"
            type="date"
          />
        </div>
      </div>
      <div class="flex flex-wrap gap-2 mt-4">
        <Button variant="outline" size="sm" @click="setThisMonth">This Month</Button>
        <Button variant="outline" size="sm" @click="setLastMonth">Last Month</Button>
        <Button variant="outline" size="sm" @click="setThisYear">This Year</Button>
        <Button variant="outline" size="sm" @click="clearDates">Clear</Button>
      </div>
    </Card>

    <!-- Loading State -->
    <Card v-if="isLoading" class="p-12">
      <div class="text-center text-slate-600 dark:text-slate-400">
        Loading report...
      </div>
    </Card>

    <!-- Error State -->
    <Card v-else-if="error" class="p-12">
      <div class="text-center text-destructive">
        Failed to load report. Please try again.
      </div>
    </Card>

    <!-- Report Content -->
    <Card v-else-if="report" class="overflow-hidden">
      <!-- Report Header -->
      <div class="p-6 text-center border-b border-border bg-slate-50 dark:bg-slate-800">
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">
          {{ report.report_name }}
        </h2>
        <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Period: {{ report.period.start }} to {{ report.period.end }}
        </p>
      </div>

      <!-- Report Table -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 dark:bg-slate-800 border-b border-border">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                SKU
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Product Name
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Category
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Qty Sold
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Avg Unit Cost
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Total COGS
              </th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                %
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border bg-card">
            <tr
              v-if="report.products.length === 0"
              class="hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <td colspan="7" class="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                No product COGS data found
              </td>
            </tr>
            <tr
              v-for="product in report.products"
              :key="product.product_id"
              class="hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <td class="px-4 py-3 text-sm font-mono text-slate-600 dark:text-slate-400">
                {{ product.sku }}
              </td>
              <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                {{ product.name }}
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                {{ product.category }}
              </td>
              <td class="px-4 py-3 text-sm text-right text-slate-900 dark:text-slate-100">
                {{ formatNumber(product.qty_sold) }}
              </td>
              <td class="px-4 py-3 text-sm text-right text-slate-900 dark:text-slate-100">
                {{ formatCurrency(product.avg_unit_cost) }}
              </td>
              <td class="px-4 py-3 text-sm text-right font-semibold text-slate-900 dark:text-slate-100">
                {{ formatCurrency(product.total_cogs) }}
              </td>
              <td class="px-4 py-3 text-sm text-right text-slate-600 dark:text-slate-400">
                {{ formatPercent(product.percentage) }}
              </td>
            </tr>
          </tbody>
          <tfoot v-if="report.products.length > 0" class="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-600">
            <tr>
              <td colspan="5" class="px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 text-right">
                TOTAL
              </td>
              <td class="px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 text-right">
                {{ formatCurrency(report.total_cogs) }}
              </td>
              <td class="px-4 py-3 text-sm font-bold text-slate-900 dark:text-slate-100 text-right">
                100%
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  </div>
</template>
