<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Changes in Equity
      </h1>
      <p class="text-sm text-muted-foreground">Laporan Perubahan Ekuitas</p>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="p-4">
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <Input v-model="startDate" type="date" />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <Input v-model="endDate" type="date" />
          </div>
          <div class="flex gap-2">
            <Button variant="outline" size="sm" @click="setThisMonth">
              This Month
            </Button>
            <Button variant="outline" size="sm" @click="setYearToDate">
              Year to Date
            </Button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="text-muted-foreground">Loading report...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-destructive">Failed to load report</p>
    </div>

    <!-- Report Content -->
    <Card v-else-if="report">
      <!-- Report Header -->
      <div class="border-b border-border p-6 text-center">
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">
          {{ report.report_name }}
        </h2>
        <p class="text-sm text-muted-foreground mt-1">
          Period: {{ formatDate(report.period.start_date) }} - {{ formatDate(report.period.end_date) }}
        </p>
      </div>

      <div class="p-6 space-y-8">
        <!-- Section 1: Opening Equity -->
        <div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Opening Equity
          </h3>
          <div class="border border-border rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Code
                  </th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Account Name
                  </th>
                  <th class="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="account in report.opening_equity" :key="account.account_id">
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {{ account.code }}
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {{ account.name }}
                  </td>
                  <td class="px-4 py-3 text-sm text-right text-slate-900 dark:text-slate-100">
                    {{ formatCurrency(account.opening_balance) }}
                  </td>
                </tr>
                <tr class="bg-slate-50 dark:bg-slate-800 font-semibold">
                  <td colspan="2" class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    Total Opening Equity
                  </td>
                  <td class="px-4 py-3 text-sm text-right text-slate-900 dark:text-slate-100">
                    {{ formatCurrency(report.total_opening_equity) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 2: Changes During Period -->
        <div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Changes During Period
          </h3>
          <div class="border border-border rounded-lg overflow-hidden">
            <table class="w-full">
              <tbody class="divide-y divide-border">
                <tr>
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    Capital Additions
                  </td>
                  <td class="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                    {{ formatCurrency(report.changes.capital_additions) }}
                  </td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    Capital Withdrawals
                  </td>
                  <td class="px-4 py-3 text-sm text-right" :class="report.changes.capital_withdrawals < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'">
                    {{ formatCurrency(report.changes.capital_withdrawals) }}
                  </td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    Net Income
                  </td>
                  <td class="px-4 py-3 text-sm text-right" :class="report.changes.net_income >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ formatCurrency(report.changes.net_income) }}
                  </td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    Dividends
                  </td>
                  <td class="px-4 py-3 text-sm text-right" :class="report.changes.dividends < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'">
                    {{ formatCurrency(report.changes.dividends) }}
                  </td>
                </tr>
                <tr>
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    Adjustments
                  </td>
                  <td class="px-4 py-3 text-sm text-right" :class="report.changes.adjustments >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ formatCurrency(report.changes.adjustments) }}
                  </td>
                </tr>
                <tr class="bg-slate-50 dark:bg-slate-800 font-semibold border-t-2 border-slate-300 dark:border-slate-600">
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    Total Changes
                  </td>
                  <td class="px-4 py-3 text-sm text-right" :class="report.changes.total_changes >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ formatCurrency(report.changes.total_changes) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 3: Closing Equity -->
        <div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Closing Equity
          </h3>
          <div class="border border-border rounded-lg overflow-hidden">
            <table class="w-full">
              <thead class="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Code
                  </th>
                  <th class="px-4 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Account Name
                  </th>
                  <th class="px-4 py-3 text-right text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr v-for="account in report.closing_equity" :key="account.account_id">
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {{ account.code }}
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {{ account.name }}
                  </td>
                  <td class="px-4 py-3 text-sm text-right text-slate-900 dark:text-slate-100">
                    {{ formatCurrency(account.closing_balance) }}
                  </td>
                </tr>
                <tr class="bg-slate-50 dark:bg-slate-800 font-semibold border-t-2 border-slate-300 dark:border-slate-600">
                  <td colspan="2" class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    Total Closing Equity
                  </td>
                  <td class="px-4 py-3 text-sm text-right text-slate-900 dark:text-slate-100">
                    {{ formatCurrency(report.total_closing_equity) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChangesInEquity } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

// Date range filters - default to current month
const startDate = ref(
  new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .slice(0, 10)
)
const endDate = ref(new Date().toISOString().slice(0, 10))

// Computed refs for reactivity
const startDateRef = computed(() => startDate.value)
const endDateRef = computed(() => endDate.value)

// Fetch report data
const { data: report, isLoading, error } = useChangesInEquity(startDateRef, endDateRef)

// Quick date range setters
function setThisMonth() {
  const now = new Date()
  startDate.value = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10)
  endDate.value = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10)
}

function setYearToDate() {
  const now = new Date()
  startDate.value = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
  endDate.value = now.toISOString().slice(0, 10)
}

// Format date for display
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>
