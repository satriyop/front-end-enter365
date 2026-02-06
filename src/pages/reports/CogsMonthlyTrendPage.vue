<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCogsMonthlyTrend } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const router = useRouter()
const selectedYear = ref(new Date().getFullYear())

const yearRef = computed(() => selectedYear.value)
const { data: report, isLoading, error } = useCogsMonthlyTrend(yearRef)

function goToPreviousYear() {
  selectedYear.value--
}

function goToCurrentYear() {
  selectedYear.value = new Date().getFullYear()
}

function goToNextYear() {
  selectedYear.value++
}

function goBack() {
  router.push({ name: 'reports' })
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6 p-6">
    <!-- Header -->
    <div class="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        @click="goBack"
        class="mb-2"
      >
        <ArrowLeft class="h-4 w-4 mr-2" />
        Back to Reports
      </Button>
      <h1 class="text-3xl font-bold text-foreground">
        COGS Monthly Trend
      </h1>
      <p class="text-muted-foreground">
        Tren HPP Bulanan
      </p>
    </div>

    <!-- Filter Card -->
    <Card class="p-4">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="text-sm font-medium text-foreground">Year:</span>
        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            @click="goToPreviousYear"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <Input
            v-model.number="selectedYear"
            type="number"
            class="w-32"
            min="2020"
            max="2030"
          />
          <Button
            variant="outline"
            size="sm"
            @click="goToNextYear"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          @click="goToCurrentYear"
        >
          Current Year
        </Button>
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
      <div class="p-6 border-b border-border bg-muted/30 dark:bg-muted/10">
        <h2 class="text-xl font-bold text-center text-foreground">
          {{ report.report_name }}
        </h2>
        <p class="text-center text-muted-foreground mt-1">
          Year {{ report.year }}
        </p>
      </div>

      <!-- Report Table -->
      <div class="overflow-x-auto">
        <table
          v-if="report.months.length > 0"
          class="w-full"
        >
          <thead>
            <tr class="border-b border-border bg-muted/50 dark:bg-muted/20">
              <th class="px-6 py-3 text-left text-sm font-semibold text-foreground">
                Month
              </th>
              <th class="px-6 py-3 text-right text-sm font-semibold text-foreground">
                Beginning Inventory
              </th>
              <th class="px-6 py-3 text-right text-sm font-semibold text-foreground">
                Purchases
              </th>
              <th class="px-6 py-3 text-right text-sm font-semibold text-foreground">
                Ending Inventory
              </th>
              <th class="px-6 py-3 text-right text-sm font-semibold text-foreground">
                COGS
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="month in report.months"
              :key="month.month"
              class="border-b border-border hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors"
            >
              <td class="px-6 py-4 text-sm text-foreground">
                {{ month.month_name }}
              </td>
              <td class="px-6 py-4 text-sm text-right text-foreground font-mono">
                {{ formatCurrency(month.beginning_inventory) }}
              </td>
              <td class="px-6 py-4 text-sm text-right text-foreground font-mono">
                {{ formatCurrency(month.purchases) }}
              </td>
              <td class="px-6 py-4 text-sm text-right text-foreground font-mono">
                {{ formatCurrency(month.ending_inventory) }}
              </td>
              <td class="px-6 py-4 text-sm text-right text-foreground font-mono font-semibold">
                {{ formatCurrency(month.cogs) }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-border bg-muted/50 dark:bg-muted/20">
              <td class="px-6 py-4 text-sm font-bold text-foreground">
                TOTAL
              </td>
              <td class="px-6 py-4 text-sm text-right text-muted-foreground">
                -
              </td>
              <td class="px-6 py-4 text-sm text-right text-muted-foreground">
                -
              </td>
              <td class="px-6 py-4 text-sm text-right text-muted-foreground">
                -
              </td>
              <td class="px-6 py-4 text-sm text-right text-foreground font-mono font-bold">
                {{ formatCurrency(report.total_cogs) }}
              </td>
            </tr>
          </tfoot>
        </table>

        <!-- Empty State -->
        <div
          v-else
          class="p-12 text-center text-muted-foreground"
        >
          No monthly data found for {{ report.year }}
        </div>
      </div>
    </Card>
  </div>
</template>
