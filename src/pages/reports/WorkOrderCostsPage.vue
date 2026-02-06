<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkOrderCosts } from '@/api/useReports'
import { Button, Input, Card, Select } from '@/components/ui'
import { formatCurrency, formatPercent } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const startDate = ref('')
const endDate = ref('')
const status = ref('')
const projectId = ref('')

const startDateRef = computed(() => startDate.value || undefined)
const endDateRef = computed(() => endDate.value || undefined)
const statusRef = computed(() => status.value || undefined)
const projectIdRef = computed(() => projectId.value || undefined)

const { data: report, isPending, isError, error } = useWorkOrderCosts(startDateRef, endDateRef, statusRef, projectIdRef)

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
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
        <h1 class="text-3xl font-bold text-foreground">Work Order Costs</h1>
        <p class="text-muted-foreground mt-1">Biaya Perintah Kerja</p>
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
      <p class="text-muted-foreground mt-4">Loading work order cost data...</p>
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
            <div class="text-4xl font-bold text-foreground">{{ report.summary?.total_work_orders ?? 0 }}</div>
            <div class="text-sm text-muted-foreground mt-2">Total Work Orders</div>
          </div>
        </Card>
        <Card class="p-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.summary?.total_estimated ?? 0) }}</div>
            <div class="text-sm text-muted-foreground mt-2">Total Estimated</div>
          </div>
        </Card>
        <Card class="p-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.summary?.total_actual ?? 0) }}</div>
            <div class="text-sm text-muted-foreground mt-2">Total Actual</div>
          </div>
        </Card>
        <Card class="p-6" :class="(report.summary?.total_variance ?? 0) > 0 ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'">
          <div class="text-center">
            <div class="text-2xl font-bold" :class="getVarianceColor(report.summary?.total_variance ?? 0)">
              {{ formatCurrency(report.summary?.total_variance ?? 0) }}
            </div>
            <div class="text-sm text-muted-foreground mt-2">Total Variance</div>
          </div>
        </Card>
      </div>

      <!-- Work Orders Table -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">Work Orders</h3>
          <div v-if="!report.work_orders?.length" class="text-center py-8 text-muted-foreground">
            No work order cost data available
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
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">%</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in report.work_orders"
                  :key="item.id"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td class="py-3 font-mono text-sm text-foreground">{{ item.wo_number }}</td>
                  <td class="py-3 text-sm text-foreground">{{ item.name }}</td>
                  <td class="py-3 text-sm text-muted-foreground">{{ item.project || '-' }}</td>
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
