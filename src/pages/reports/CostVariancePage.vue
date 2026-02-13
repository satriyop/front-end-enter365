<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCostVariance } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency, formatPercent, toLocalISODate } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

// Date range state
const startDate = ref('')
const endDate = ref('')

// Computed date refs for the query
const startDateRef = computed(() => startDate.value)
const endDateRef = computed(() => endDate.value)

// Fetch report data
const { data: report, isPending, isError, error } = useCostVariance(startDateRef, endDateRef)

// Quick date range helpers
function setQuickRange(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)

  startDate.value = toLocalISODate(start)
  endDate.value = toLocalISODate(end)
}

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

// Format variance with color
function getVarianceColor(variance: number): string {
  if (variance > 0) return 'text-destructive dark:text-red-400'
  if (variance < 0) return 'text-green-600 dark:text-green-400'
  return 'text-muted-foreground'
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Cost Variance Analysis</h1>
        <p class="text-muted-foreground mt-1">Analisis Varians Biaya Produksi</p>
      </div>
      <Button variant="outline" @click="router.push('/reports')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Reports
      </Button>
    </div>

    <!-- Date Range Filter -->
    <Card>
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Filter Period</h3>
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-foreground mb-2">
              Start Date
            </label>
            <Input
              v-model="startDate"
              type="date"
              placeholder="Start date"
            />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-foreground mb-2">
              End Date
            </label>
            <Input
              v-model="endDate"
              type="date"
              placeholder="End date"
            />
          </div>
          <div class="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" @click="setQuickRange(7)">
              Last 7 Days
            </Button>
            <Button variant="outline" size="sm" @click="setQuickRange(30)">
              Last 30 Days
            </Button>
            <Button variant="outline" size="sm" @click="setThisMonth()">
              This Month
            </Button>
            <Button variant="outline" size="sm" @click="setLastMonth()">
              Last Month
            </Button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Loading State -->
    <div v-if="isPending" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="text-muted-foreground mt-4">Loading cost variance data...</p>
    </div>

    <!-- Error State -->
    <Card v-else-if="isError" class="p-6">
      <div class="text-center text-destructive">
        <p class="font-semibold">Error loading report</p>
        <p class="text-sm mt-2">{{ error?.message || 'Unknown error' }}</p>
      </div>
    </Card>

    <!-- Report Content -->
    <template v-else-if="report">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Work Orders -->
        <Card class="p-6">
          <div class="text-center">
            <div class="text-4xl font-bold text-foreground">
              {{ report.summary.total_work_orders }}
            </div>
            <div class="text-sm text-muted-foreground mt-2">
              Total Work Orders
            </div>
          </div>
        </Card>

        <!-- Over Budget -->
        <Card class="p-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div class="text-center">
            <div class="text-4xl font-bold text-destructive dark:text-red-400">
              {{ report.summary.over_budget }}
            </div>
            <div class="text-sm text-red-700 dark:text-red-300 mt-2">
              Over Budget
            </div>
          </div>
        </Card>

        <!-- Under Budget -->
        <Card class="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div class="text-center">
            <div class="text-4xl font-bold text-green-600 dark:text-green-400">
              {{ report.summary.under_budget }}
            </div>
            <div class="text-sm text-green-700 dark:text-green-300 mt-2">
              Under Budget
            </div>
          </div>
        </Card>

        <!-- On Budget -->
        <Card class="p-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div class="text-center">
            <div class="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {{ report.summary.on_budget }}
            </div>
            <div class="text-sm text-blue-700 dark:text-blue-300 mt-2">
              On Budget
            </div>
          </div>
        </Card>
      </div>

      <!-- Over Budget Items -->
      <Card class="border-t-4 border-t-red-500 dark:border-t-red-600">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-destructive dark:text-red-400 mb-4">
            Over Budget Work Orders
          </h3>
          <div v-if="report.over_budget_items.length === 0" class="text-center py-8 text-muted-foreground">
            No work orders in this category
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">WO Number</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Name</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Project</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Estimated</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Actual</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Variance</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Variance %</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in report.over_budget_items"
                  :key="item.id"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td class="py-3 font-mono text-sm text-foreground">{{ item.wo_number }}</td>
                  <td class="py-3 text-sm text-foreground">{{ item.name }}</td>
                  <td class="py-3 text-sm text-muted-foreground">{{ item.project }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.estimated_cost) }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.actual_cost) }}</td>
                  <td class="py-3 text-sm text-right" :class="getVarianceColor(item.variance)">
                    {{ formatCurrency(item.variance) }}
                  </td>
                  <td class="py-3 text-sm text-right" :class="getVarianceColor(item.variance)">
                    {{ formatPercent(item.variance_percent) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <!-- Under Budget Items -->
      <Card class="border-t-4 border-t-green-500 dark:border-t-green-600">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-green-600 dark:text-green-400 mb-4">
            Under Budget Work Orders
          </h3>
          <div v-if="report.under_budget_items.length === 0" class="text-center py-8 text-muted-foreground">
            No work orders in this category
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">WO Number</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Name</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Project</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Estimated</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Actual</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Variance</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Variance %</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in report.under_budget_items"
                  :key="item.id"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td class="py-3 font-mono text-sm text-foreground">{{ item.wo_number }}</td>
                  <td class="py-3 text-sm text-foreground">{{ item.name }}</td>
                  <td class="py-3 text-sm text-muted-foreground">{{ item.project }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.estimated_cost) }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.actual_cost) }}</td>
                  <td class="py-3 text-sm text-right" :class="getVarianceColor(item.variance)">
                    {{ formatCurrency(item.variance) }}
                  </td>
                  <td class="py-3 text-sm text-right" :class="getVarianceColor(item.variance)">
                    {{ formatPercent(item.variance_percent) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <!-- On Budget Items -->
      <Card class="border-t-4 border-t-blue-500 dark:border-t-blue-600">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
            On Budget Work Orders
          </h3>
          <div v-if="report.on_budget_items.length === 0" class="text-center py-8 text-muted-foreground">
            No work orders in this category
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">WO Number</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Name</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Project</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Estimated</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Actual</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Variance</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Variance %</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in report.on_budget_items"
                  :key="item.id"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td class="py-3 font-mono text-sm text-foreground">{{ item.wo_number }}</td>
                  <td class="py-3 text-sm text-foreground">{{ item.name }}</td>
                  <td class="py-3 text-sm text-muted-foreground">{{ item.project }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.estimated_cost) }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.actual_cost) }}</td>
                  <td class="py-3 text-sm text-right" :class="getVarianceColor(item.variance)">
                    {{ formatCurrency(item.variance) }}
                  </td>
                  <td class="py-3 text-sm text-right" :class="getVarianceColor(item.variance)">
                    {{ formatPercent(item.variance_percent) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>
