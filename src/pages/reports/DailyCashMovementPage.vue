<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Daily Cash Movement</h1>
      <p class="text-muted-foreground">Mutasi Kas Harian</p>
    </div>

    <!-- Filter Card -->
    <Card>
      <div class="p-6 space-y-4">
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <Input
              v-model="startDate"
              type="date"
              class="w-full"
            />
          </div>

          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <Input
              v-model="endDate"
              type="date"
              class="w-full"
            />
          </div>

          <div class="flex gap-2">
            <Button
              variant="outline"
              @click="setThisMonth"
            >
              This Month
            </Button>
            <Button
              variant="outline"
              @click="setYearToDate"
            >
              Year to Date
            </Button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Loading State -->
    <Card v-if="isLoading">
      <div class="p-12 text-center">
        <div class="text-muted-foreground">Loading report...</div>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-else-if="error">
      <div class="p-12 text-center">
        <div class="text-destructive">Failed to load report</div>
      </div>
    </Card>

    <!-- Report Card -->
    <Card v-else-if="report">
      <div class="p-6">
        <!-- Report Header -->
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">
            {{ report.report_name }}
          </h2>
          <p class="text-sm text-muted-foreground">
            {{ formatDate(report.period.start) }} - {{ formatDate(report.period.end) }}
          </p>
        </div>

        <!-- Empty State -->
        <div v-if="!report.movements || report.movements.length === 0" class="py-12 text-center text-muted-foreground">
          No cash movements found
        </div>

        <!-- Report Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Date
                </th>
                <th class="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Receipts
                </th>
                <th class="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Payments
                </th>
                <th class="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Net
                </th>
                <th class="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Running Balance
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(movement, index) in report.movements"
                :key="index"
                class="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <td class="py-3 px-4 text-slate-900 dark:text-slate-100">
                  {{ formatDate(movement.date) }}
                </td>
                <td class="py-3 px-4 text-right font-mono text-green-600 dark:text-green-400">
                  {{ formatCurrency(movement.receipts) }}
                </td>
                <td class="py-3 px-4 text-right font-mono text-red-600 dark:text-red-400">
                  {{ formatCurrency(movement.payments) }}
                </td>
                <td
                  class="py-3 px-4 text-right font-mono"
                  :class="movement.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                >
                  {{ formatCurrency(movement.net) }}
                </td>
                <td class="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(movement.running_balance) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-slate-900 dark:border-slate-100 font-bold">
                <td class="py-3 px-4 text-slate-900 dark:text-slate-100">
                  TOTAL
                </td>
                <td class="py-3 px-4 text-right font-mono text-green-600 dark:text-green-400">
                  {{ formatCurrency(report.total_receipts) }}
                </td>
                <td class="py-3 px-4 text-right font-mono text-red-600 dark:text-red-400">
                  {{ formatCurrency(report.total_payments) }}
                </td>
                <td
                  class="py-3 px-4 text-right font-mono"
                  :class="report.net_movement >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                >
                  {{ formatCurrency(report.net_movement) }}
                </td>
                <td class="py-3 px-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDailyCashMovement } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency, formatDate, toLocalISODate } from '@/utils/format'

// Date range state
const startDate = ref(toLocalISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
const endDate = ref(toLocalISODate())

// Computed refs for query
const startDateRef = computed(() => startDate.value)
const endDateRef = computed(() => endDate.value)

// Fetch report data
const { data: report, isLoading, error } = useDailyCashMovement(startDateRef, endDateRef)

// Quick date range filters
function setThisMonth() {
  const now = new Date()
  startDate.value = toLocalISODate(new Date(now.getFullYear(), now.getMonth(), 1))
  endDate.value = toLocalISODate()
}

function setYearToDate() {
  const now = new Date()
  startDate.value = toLocalISODate(new Date(now.getFullYear(), 0, 1))
  endDate.value = toLocalISODate()
}
</script>
