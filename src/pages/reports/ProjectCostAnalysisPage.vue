<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectCostAnalysis } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const startDate = ref('')
const endDate = ref('')

const startDateRef = computed(() => startDate.value || undefined)
const endDateRef = computed(() => endDate.value || undefined)

const { data: report, isPending, isError, error } = useProjectCostAnalysis(startDateRef, endDateRef)

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

const costTypeEntries = computed(() => {
  if (!report.value?.by_type) return []
  return Object.entries(report.value.by_type).map(([key, val]) => ({
    key,
    ...val,
  }))
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Project Cost Analysis</h1>
        <p class="text-muted-foreground mt-1">Analisis Biaya Proyek berdasarkan Tipe & Proyek</p>
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
      <p class="text-muted-foreground mt-4">Loading project cost data...</p>
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
      <!-- Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card class="p-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.totals.grand_total) }}</div>
            <div class="text-sm text-muted-foreground mt-2">Grand Total Cost</div>
          </div>
        </Card>
        <Card class="p-6">
          <div class="text-center">
            <div class="text-4xl font-bold text-foreground">{{ report.totals.cost_types_count }}</div>
            <div class="text-sm text-muted-foreground mt-2">Cost Types</div>
          </div>
        </Card>
        <Card class="p-6">
          <div class="text-center">
            <div class="text-4xl font-bold text-foreground">{{ report.totals.projects_count }}</div>
            <div class="text-sm text-muted-foreground mt-2">Projects</div>
          </div>
        </Card>
      </div>

      <!-- By Type -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">Cost by Type</h3>
          <div v-if="costTypeEntries.length === 0" class="text-center py-8 text-muted-foreground">
            No cost data available
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">Type</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Count</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in costTypeEntries"
                  :key="item.key"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td class="py-3 text-sm text-foreground">{{ item.label }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ item.count }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <!-- By Project -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">Cost by Project</h3>
          <div v-if="report.by_project.length === 0" class="text-center py-8 text-muted-foreground">
            No project cost data available
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">Project Number</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Project Name</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in report.by_project"
                  :key="item.project_id"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td class="py-3 font-mono text-sm text-foreground">{{ item.project_number || '-' }}</td>
                  <td class="py-3 text-sm text-foreground">{{ item.project_name || '-' }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.total_cost) }}</td>
                </tr>
              </tbody>
              <tfoot class="border-t-2 border-border">
                <tr class="font-semibold">
                  <td class="pt-3 text-sm text-foreground" colspan="2">Total</td>
                  <td class="pt-3 text-sm text-foreground text-right">{{ formatCurrency(report.totals.grand_total) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>
