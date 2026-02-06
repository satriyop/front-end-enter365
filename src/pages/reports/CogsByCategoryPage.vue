<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">COGS by Category</h1>
        <p class="text-sm text-muted-foreground mt-1">HPP per Kategori Produk</p>
      </div>
      <Button variant="outline" @click="router.back()">
        Back to Reports
      </Button>
    </div>

    <!-- Date Range Filter -->
    <Card class="p-6">
      <h2 class="text-lg font-semibold text-foreground mb-4">Filter Period</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">Start Date</label>
          <Input
            v-model="startDate"
            type="date"
            placeholder="Start Date"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-foreground mb-2">End Date</label>
          <Input
            v-model="endDate"
            type="date"
            placeholder="End Date"
          />
        </div>
      </div>

      <!-- Quick Date Buttons -->
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" @click="setThisMonth">This Month</Button>
        <Button variant="outline" size="sm" @click="setLastMonth">Last Month</Button>
        <Button variant="outline" size="sm" @click="setThisQuarter">This Quarter</Button>
        <Button variant="outline" size="sm" @click="setThisYear">This Year</Button>
        <Button variant="outline" size="sm" @click="setLastYear">Last Year</Button>
      </div>
    </Card>

    <!-- Loading State -->
    <Card v-if="isLoading" class="p-8">
      <div class="text-center text-muted-foreground">Loading report...</div>
    </Card>

    <!-- Error State -->
    <Card v-else-if="error" class="p-8">
      <div class="text-center text-destructive">
        Error loading report: {{ error.message }}
      </div>
    </Card>

    <!-- Report Card -->
    <Card v-else-if="report" class="p-6">
      <!-- Report Header -->
      <div class="text-center mb-6">
        <h2 class="text-xl font-bold text-foreground">{{ report.report_name }}</h2>
        <p class="text-sm text-muted-foreground mt-1">
          Period: {{ formatDate(report.period.start) }} - {{ formatDate(report.period.end) }}
        </p>
      </div>

      <!-- Empty State -->
      <div v-if="!report.categories || report.categories.length === 0" class="text-center py-8 text-muted-foreground">
        No COGS data found for the selected period.
      </div>

      <!-- Report Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-3 px-4 font-semibold text-foreground">Category</th>
              <th class="text-right py-3 px-4 font-semibold text-foreground">Products</th>
              <th class="text-right py-3 px-4 font-semibold text-foreground">Qty Sold</th>
              <th class="text-right py-3 px-4 font-semibold text-foreground">Total COGS</th>
              <th class="text-right py-3 px-4 font-semibold text-foreground">% of Total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in report.categories"
              :key="index"
              class="border-b border-border hover:bg-muted/50 dark:hover:bg-muted/20 transition-colors"
            >
              <td class="py-3 px-4 text-foreground">{{ item.category }}</td>
              <td class="py-3 px-4 text-right text-foreground">{{ formatNumber(item.product_count) }}</td>
              <td class="py-3 px-4 text-right text-foreground">{{ formatNumber(item.qty_sold) }}</td>
              <td class="py-3 px-4 text-right text-foreground">{{ formatCurrency(item.total_cogs) }}</td>
              <td class="py-3 px-4 text-right text-foreground">{{ formatPercent(item.percentage) }}</td>
            </tr>
          </tbody>
          <tfoot class="border-t-2 border-border">
            <tr class="font-semibold bg-muted/30 dark:bg-muted/10">
              <td class="py-3 px-4 text-foreground">TOTAL</td>
              <td class="py-3 px-4 text-right text-foreground">{{ formatNumber(totalProducts) }}</td>
              <td class="py-3 px-4 text-right text-foreground">{{ formatNumber(totalQty) }}</td>
              <td class="py-3 px-4 text-right text-foreground">{{ formatCurrency(report.total_cogs) }}</td>
              <td class="py-3 px-4 text-right text-foreground">{{ formatPercent(100) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCogsByCategory } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format'

const router = useRouter()

// Date range state
const startDate = ref('')
const endDate = ref('')

// Computed refs for the hook
const startDateRef = computed(() => startDate.value)
const endDateRef = computed(() => endDate.value)

// Fetch report data
const { data: report, isLoading, error } = useCogsByCategory(startDateRef, endDateRef)

// Computed totals
const totalProducts = computed(() => {
  if (!report.value?.categories) return 0
  return report.value.categories.reduce((sum, item) => sum + item.product_count, 0)
})

const totalQty = computed(() => {
  if (!report.value?.categories) return 0
  return report.value.categories.reduce((sum, item) => sum + item.qty_sold, 0)
})

// Date formatting helper
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Quick date range helpers
function setThisMonth() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  startDate.value = start.toISOString().slice(0, 10)
  endDate.value = end.toISOString().slice(0, 10)
}

function setLastMonth() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth(), 0)
  startDate.value = start.toISOString().slice(0, 10)
  endDate.value = end.toISOString().slice(0, 10)
}

function setThisQuarter() {
  const now = new Date()
  const quarter = Math.floor(now.getMonth() / 3)
  const start = new Date(now.getFullYear(), quarter * 3, 1)
  const end = new Date(now.getFullYear(), quarter * 3 + 3, 0)
  startDate.value = start.toISOString().slice(0, 10)
  endDate.value = end.toISOString().slice(0, 10)
}

function setThisYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear(), 11, 31)
  startDate.value = start.toISOString().slice(0, 10)
  endDate.value = end.toISOString().slice(0, 10)
}

function setLastYear() {
  const now = new Date()
  const start = new Date(now.getFullYear() - 1, 0, 1)
  const end = new Date(now.getFullYear() - 1, 11, 31)
  startDate.value = start.toISOString().slice(0, 10)
  endDate.value = end.toISOString().slice(0, 10)
}

// Set default to this month on mount
setThisMonth()
</script>
