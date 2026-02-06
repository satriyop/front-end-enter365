<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSubcontractorSummary } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency, formatPercent } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const startDate = ref('')
const endDate = ref('')

const startDateRef = computed(() => startDate.value || undefined)
const endDateRef = computed(() => endDate.value || undefined)

const { data: report, isPending, isError, error } = useSubcontractorSummary(startDateRef, endDateRef)

function setQuickRange(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  startDate.value = start.toISOString().slice(0, 10)
  endDate.value = end.toISOString().slice(0, 10)
}

function setThisMonth() {
  const now = new Date()
  startDate.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  endDate.value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
}

function setLastMonth() {
  const now = new Date()
  startDate.value = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
  endDate.value = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Subcontractor Summary</h1>
        <p class="text-muted-foreground mt-1">Ringkasan Subkontraktor</p>
      </div>
      <Button variant="outline" @click="router.push('/reports')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Reports
      </Button>
    </div>

    <!-- Filters -->
    <Card>
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Filter Period</h3>
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-foreground mb-2">Start Date</label>
            <Input v-model="startDate" type="date" />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-foreground mb-2">End Date</label>
            <Input v-model="endDate" type="date" />
          </div>
          <div class="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" @click="setQuickRange(30)">Last 30 Days</Button>
            <Button variant="outline" size="sm" @click="setThisMonth()">This Month</Button>
            <Button variant="outline" size="sm" @click="setLastMonth()">Last Month</Button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Loading -->
    <div v-if="isPending" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="text-muted-foreground mt-4">Loading subcontractor data...</p>
    </div>

    <!-- Error -->
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
        <Card class="p-6">
          <div class="text-center">
            <div class="text-4xl font-bold text-foreground">{{ report.totals.total_subcontractors }}</div>
            <div class="text-sm text-muted-foreground mt-2">Subcontractors</div>
          </div>
        </Card>
        <Card class="p-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.totals.total_agreed) }}</div>
            <div class="text-sm text-muted-foreground mt-2">Total Agreed</div>
          </div>
        </Card>
        <Card class="p-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.totals.total_paid) }}</div>
            <div class="text-sm text-muted-foreground mt-2">Total Paid</div>
          </div>
        </Card>
        <Card class="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <div class="text-center">
            <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ formatCurrency(report.totals.total_outstanding) }}</div>
            <div class="text-sm text-amber-700 dark:text-amber-300 mt-2">Outstanding</div>
          </div>
        </Card>
      </div>

      <!-- Subcontractors Table -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">Subcontractors</h3>
          <div v-if="report.subcontractors.length === 0" class="text-center py-8 text-muted-foreground">
            No subcontractor data available
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">Code</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Name</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">WOs</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Agreed</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Paid</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Outstanding</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Retention</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">On-Time %</th>
                  <th class="pb-3 text-sm font-semibold text-foreground"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="sc in report.subcontractors"
                  :key="sc.id"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  @click="router.push(`/reports/subcontractors/${sc.id}/summary`)"
                >
                  <td class="py-3 font-mono text-sm text-foreground">{{ sc.code }}</td>
                  <td class="py-3 text-sm text-foreground">{{ sc.name }}</td>
                  <td class="py-3 text-sm text-foreground text-right">
                    {{ sc.work_orders.total }}
                    <span class="text-xs text-muted-foreground">({{ sc.work_orders.completed }} done)</span>
                  </td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(sc.financials.total_agreed) }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(sc.financials.total_paid) }}</td>
                  <td class="py-3 text-sm text-amber-600 dark:text-amber-400 text-right">{{ formatCurrency(sc.financials.outstanding) }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(sc.financials.retention_held) }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatPercent(sc.performance.on_time_completion) }}</td>
                  <td class="py-3 text-sm text-right">
                    <Button variant="ghost" size="sm" @click.stop="router.push(`/reports/subcontractors/${sc.id}/summary`)">
                      View
                    </Button>
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
