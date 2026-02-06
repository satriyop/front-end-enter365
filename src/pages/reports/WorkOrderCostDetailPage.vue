<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkOrderCostDetail } from '@/api/useReports'
import { Button, Card, Badge } from '@/components/ui'
import { formatCurrency, formatPercent } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const workOrderId = computed(() => Number(route.params.id))

const { data: report, isPending, isError, error } = useWorkOrderCostDetail(workOrderId)

// Map WO status to Badge status prop
const statusMap: Record<string, string> = {
  draft: 'draft',
  released: 'pending',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
}

// Determine variance color (negative = under budget = good)
function varianceColor(variance: number) {
  if (variance < 0) return 'text-green-600 dark:text-green-400'
  if (variance > 0) return 'text-destructive'
  return 'text-foreground'
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">
          {{ report?.work_order.wo_number ?? 'Work Order Cost Detail' }}
        </h1>
        <p class="text-muted-foreground mt-1">Detail Biaya Work Order</p>
      </div>
      <Button variant="outline" @click="router.push('/reports/work-order-costs')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Report
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="isPending" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="text-muted-foreground mt-4">Loading work order data...</p>
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
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Cost Breakdown -->
          <Card>
            <div class="p-6">
              <h3 class="text-lg font-semibold text-foreground mb-4">Cost Breakdown</h3>
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="border-b border-border">
                    <tr class="text-left">
                      <th class="pb-3 text-sm font-semibold text-foreground">Cost Type</th>
                      <th class="pb-3 text-sm font-semibold text-foreground text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="border-b border-border">
                      <td class="py-3 text-sm text-foreground">Material Costs</td>
                      <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(report.costs.material_cost) }}</td>
                    </tr>
                    <tr class="border-b border-border">
                      <td class="py-3 text-sm text-foreground">Labor Costs</td>
                      <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(report.costs.labor_cost) }}</td>
                    </tr>
                    <tr class="border-b border-border">
                      <td class="py-3 text-sm text-foreground">Overhead Costs</td>
                      <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(report.costs.overhead_cost) }}</td>
                    </tr>
                  </tbody>
                  <tfoot class="border-t border-border">
                    <tr>
                      <td class="pt-3 text-sm font-semibold text-foreground">Total Actual Cost</td>
                      <td class="pt-3 text-sm font-semibold text-foreground text-right">
                        {{ formatCurrency(report.costs.actual_cost) }}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </Card>

          <!-- Planned vs Actual -->
          <Card>
            <div class="p-6">
              <h3 class="text-lg font-semibold text-foreground mb-4">Planned vs Actual Costs</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between py-3 border-b border-border">
                  <span class="text-sm text-foreground">Planned Cost</span>
                  <span class="text-lg font-semibold text-foreground">{{ formatCurrency(report.costs.planned_cost) }}</span>
                </div>
                <div class="flex items-center justify-between py-3 border-b border-border">
                  <span class="text-sm text-foreground">Actual Cost</span>
                  <span class="text-lg font-semibold text-foreground">{{ formatCurrency(report.costs.actual_cost) }}</span>
                </div>
                <div class="flex items-center justify-between py-3 pt-4 border-t border-border">
                  <span class="text-sm font-semibold text-foreground">Variance</span>
                  <div class="text-right">
                    <div class="text-xl font-bold" :class="varianceColor(report.costs.variance)">
                      {{ formatCurrency(Math.abs(report.costs.variance)) }}
                    </div>
                    <div class="text-xs" :class="varianceColor(report.costs.variance)">
                      {{ formatPercent(Math.abs(report.costs.variance_percent)) }}
                      {{ report.costs.variance < 0 ? 'under budget' : report.costs.variance > 0 ? 'over budget' : 'on budget' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <!-- Work Order Info -->
          <Card class="p-6">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">Work Order Info</h3>
            <div class="space-y-2">
              <p class="font-mono text-sm text-muted-foreground">{{ report.work_order.wo_number }}</p>
              <p class="text-lg font-semibold text-foreground">{{ report.work_order.name }}</p>
              <div v-if="report.work_order.project_name" class="text-sm text-muted-foreground">
                <span class="text-xs">Project:</span><br>
                {{ report.work_order.project_number }} - {{ report.work_order.project_name }}
              </div>
              <Badge :status="statusMap[report.work_order.status] ?? report.work_order.status">
                {{ report.work_order.status.replace('_', ' ') }}
              </Badge>
            </div>
          </Card>

          <!-- Completion -->
          <Card class="p-6">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">Completion Status</h3>
            <div class="space-y-3">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-muted-foreground">Progress</span>
                  <span class="text-lg font-bold text-foreground">{{ formatPercent(report.completion_percentage) }}</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div
                    class="bg-primary h-2 rounded-full transition-all duration-300"
                    :style="{ width: `${report.completion_percentage}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </Card>

          <!-- Budget Status -->
          <Card class="p-6">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">Budget Status</h3>
            <div class="text-center">
              <div v-if="report.costs.variance < 0" class="text-green-600 dark:text-green-400">
                <div class="text-3xl font-bold">{{ formatCurrency(Math.abs(report.costs.variance)) }}</div>
                <div class="text-sm mt-1">Under Budget</div>
              </div>
              <div v-else-if="report.costs.variance > 0" class="text-destructive">
                <div class="text-3xl font-bold">{{ formatCurrency(report.costs.variance) }}</div>
                <div class="text-sm mt-1">Over Budget</div>
              </div>
              <div v-else class="text-foreground">
                <div class="text-3xl font-bold">{{ formatCurrency(0) }}</div>
                <div class="text-sm mt-1">On Budget</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
