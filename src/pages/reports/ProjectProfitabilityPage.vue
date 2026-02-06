<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectProfitability } from '@/api/useReports'
import { Button, Input, Card, Select, Badge } from '@/components/ui'
import { formatCurrency, formatPercent } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const startDate = ref('')
const endDate = ref('')
const status = ref('')

const startDateRef = computed(() => startDate.value || undefined)
const endDateRef = computed(() => endDate.value || undefined)
const statusRef = computed(() => status.value || undefined)

const { data: report, isPending, isError, error } = useProjectProfitability(startDateRef, endDateRef, statusRef)

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

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
        <h1 class="text-3xl font-bold text-foreground">Project Profitability</h1>
        <p class="text-muted-foreground mt-1">Analisis Profitabilitas Proyek</p>
      </div>
      <Button variant="outline" @click="router.push('/reports')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Reports
      </Button>
    </div>

    <!-- Filters -->
    <Card>
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Filter</h3>
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-foreground mb-2">Start Date</label>
            <Input v-model="startDate" type="date" />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-foreground mb-2">End Date</label>
            <Input v-model="endDate" type="date" />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-foreground mb-2">Status</label>
            <Select v-model="status" :options="statusOptions" />
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
      <p class="text-muted-foreground mt-4">Loading project profitability data...</p>
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
            <div class="text-4xl font-bold text-foreground">{{ report.totals.projects_count }}</div>
            <div class="text-sm text-muted-foreground mt-2">Total Projects</div>
          </div>
        </Card>
        <Card class="p-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.totals.total_revenue) }}</div>
            <div class="text-sm text-muted-foreground mt-2">Total Revenue</div>
          </div>
        </Card>
        <Card class="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ report.totals.profitable_count }}</div>
            <div class="text-sm text-green-700 dark:text-green-300 mt-2">Profitable</div>
          </div>
        </Card>
        <Card class="p-6 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div class="text-center">
            <div class="text-2xl font-bold text-destructive dark:text-red-400">{{ report.totals.loss_count }}</div>
            <div class="text-sm text-red-700 dark:text-red-300 mt-2">Loss-Making</div>
          </div>
        </Card>
      </div>

      <!-- Projects Table -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">Projects</h3>
          <div v-if="report.projects.length === 0" class="text-center py-8 text-muted-foreground">
            No projects found for selected filters
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">Project</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Customer</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Status</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Contract</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Total Cost</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Profit</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Margin</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="project in report.projects"
                  :key="project.id"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td class="py-3">
                    <div class="font-mono text-sm text-foreground">{{ project.project_number }}</div>
                    <div class="text-xs text-muted-foreground">{{ project.name }}</div>
                  </td>
                  <td class="py-3 text-sm text-muted-foreground">{{ project.customer || '-' }}</td>
                  <td class="py-3"><Badge :status="project.status">{{ project.status }}</Badge></td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(project.contract_amount) }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(project.costs.total) }}</td>
                  <td class="py-3 text-sm text-right" :class="project.gross_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive dark:text-red-400'">
                    {{ formatCurrency(project.gross_profit) }}
                  </td>
                  <td class="py-3 text-sm text-right" :class="project.profit_margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive dark:text-red-400'">
                    {{ formatPercent(project.profit_margin) }}
                  </td>
                </tr>
              </tbody>
              <tfoot class="border-t-2 border-border">
                <tr class="font-semibold">
                  <td class="pt-3 text-sm text-foreground" colspan="3">Total</td>
                  <td class="pt-3 text-sm text-foreground text-right">{{ formatCurrency(report.totals.total_contract) }}</td>
                  <td class="pt-3 text-sm text-foreground text-right">{{ formatCurrency(report.totals.total_costs) }}</td>
                  <td class="pt-3 text-sm text-right" :class="report.totals.total_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive dark:text-red-400'">
                    {{ formatCurrency(report.totals.total_profit) }}
                  </td>
                  <td class="pt-3 text-sm text-right">{{ formatPercent(report.totals.average_margin) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>
