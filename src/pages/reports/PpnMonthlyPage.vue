<template>
  <div class="max-w-5xl mx-auto p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">PPN Monthly Detail</h1>
        <p class="text-muted-foreground mt-1">Detail PPN Bulanan</p>
      </div>
      <Button variant="ghost" @click="router.push('/reports')">
        Back to Reports
      </Button>
    </div>

    <!-- Filter Card -->
    <Card class="p-4">
      <div class="flex items-center gap-4">
        <label class="text-sm font-medium text-slate-900 dark:text-slate-100">Year:</label>
        <Input
          v-model.number="selectedYear"
          type="number"
          class="w-32"
          min="2020"
          max="2030"
        />
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="selectedYear = new Date().getFullYear() - 1"
          >
            Previous Year
          </Button>
          <Button
            variant="outline"
            size="sm"
            @click="selectedYear = new Date().getFullYear()"
          >
            Current Year
          </Button>
        </div>
      </div>
    </Card>

    <!-- Loading State -->
    <Card v-if="isLoading" class="p-8">
      <div class="text-center text-muted-foreground">
        Loading report...
      </div>
    </Card>

    <!-- Error State -->
    <Card v-else-if="error" class="p-8">
      <div class="text-center text-destructive">
        Failed to load report. Please try again.
      </div>
    </Card>

    <!-- Report Card -->
    <Card v-else-if="report" class="overflow-hidden">
      <!-- Report Header -->
      <div class="bg-slate-50 dark:bg-slate-800 p-6 text-center border-b border-border">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {{ report.report_name }}
        </h2>
        <p class="text-muted-foreground mt-1">Year {{ report.year }}</p>
      </div>

      <!-- Report Table -->
      <div class="overflow-x-auto">
        <table v-if="report.months.length > 0" class="w-full">
          <thead class="bg-slate-50 dark:bg-slate-800 border-b border-border">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Month
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Output PPN
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Input PPN
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Net PPN
              </th>
            </tr>
          </thead>
          <tbody class="bg-card divide-y divide-border">
            <tr
              v-for="month in report.months"
              :key="month.month"
              class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                {{ month.month_name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100">
                {{ formatCurrency(month.output) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100">
                {{ formatCurrency(month.input) }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium"
                :class="month.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
              >
                {{ formatCurrency(month.net) }}
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-slate-50 dark:bg-slate-800 border-t-2 border-border">
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-slate-100">
                TOTAL
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-900 dark:text-slate-100">
                {{ formatCurrency(report.total_output) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-900 dark:text-slate-100">
                {{ formatCurrency(report.total_input) }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-sm text-right font-bold"
                :class="report.total_net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
              >
                {{ formatCurrency(report.total_net) }}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Empty State -->
        <div v-else class="p-8 text-center text-muted-foreground">
          No data available for {{ report.year }}
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePpnMonthly } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const router = useRouter()

const selectedYear = ref(new Date().getFullYear())
const yearRef = computed(() => selectedYear.value)

const { data: report, isLoading, error } = usePpnMonthly(yearRef)
</script>
