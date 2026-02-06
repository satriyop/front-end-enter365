<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectProfitabilityDetail } from '@/api/useReports'
import { Button, Card, Badge } from '@/components/ui'
import { formatCurrency, formatPercent, formatDate } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => Number(route.params.id))

const { data: report, isPending, isError, error } = useProjectProfitabilityDetail(projectId)

// Map project status to Badge status prop
const statusMap: Record<string, string> = {
  draft: 'draft',
  planning: 'pending',
  in_progress: 'in_progress',
  completed: 'completed',
  on_hold: 'cancelled',
  cancelled: 'cancelled',
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">
          {{ report?.project.name ?? 'Project Profitability Detail' }}
        </h1>
        <p class="text-muted-foreground mt-1">Detail Profitabilitas Proyek</p>
      </div>
      <Button variant="outline" @click="router.push('/reports/project-profitability')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Report
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="isPending" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="text-muted-foreground mt-4">Loading project data...</p>
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
              <div v-if="report.cost_breakdown.length === 0" class="text-center py-8 text-muted-foreground">
                No cost data available
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full">
                  <thead class="border-b border-border">
                    <tr class="text-left">
                      <th class="pb-3 text-sm font-semibold text-foreground">Category</th>
                      <th class="pb-3 text-sm font-semibold text-foreground text-right">Amount</th>
                      <th class="pb-3 text-sm font-semibold text-foreground text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in report.cost_breakdown"
                      :key="item.category"
                      class="border-b border-border last:border-0"
                    >
                      <td class="py-3 text-sm text-foreground capitalize">{{ item.category }}</td>
                      <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.amount) }}</td>
                      <td class="py-3 text-sm text-muted-foreground text-right">{{ formatPercent(item.percentage) }}</td>
                    </tr>
                  </tbody>
                  <tfoot class="border-t border-border">
                    <tr>
                      <td class="pt-3 text-sm font-semibold text-foreground">Total Costs</td>
                      <td class="pt-3 text-sm font-semibold text-foreground text-right">
                        {{ formatCurrency(report.financials.total_costs) }}
                      </td>
                      <td class="pt-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </Card>

          <!-- Revenue Timeline -->
          <Card>
            <div class="p-6">
              <h3 class="text-lg font-semibold text-foreground mb-4">Revenue Timeline</h3>
              <div v-if="report.revenue_timeline.length === 0" class="text-center py-8 text-muted-foreground">
                No revenue data available
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full">
                  <thead class="border-b border-border">
                    <tr class="text-left">
                      <th class="pb-3 text-sm font-semibold text-foreground">Month</th>
                      <th class="pb-3 text-sm font-semibold text-foreground text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in report.revenue_timeline"
                      :key="item.month"
                      class="border-b border-border last:border-0"
                    >
                      <td class="py-3 text-sm text-foreground">{{ item.month }}</td>
                      <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.revenue) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <!-- Project Info -->
          <Card class="p-6">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">Project Info</h3>
            <div class="space-y-2">
              <p class="font-mono text-sm text-muted-foreground">{{ report.project.project_number }}</p>
              <p class="text-lg font-semibold text-foreground">{{ report.project.name }}</p>
              <div v-if="report.project.customer" class="text-sm text-muted-foreground">
                <span class="text-xs">Customer:</span> {{ report.project.customer }}
              </div>
              <Badge :status="statusMap[report.project.status] ?? report.project.status">
                {{ report.project.status.replace('_', ' ') }}
              </Badge>
              <div v-if="report.project.start_date" class="text-sm text-muted-foreground">
                Start: {{ formatDate(report.project.start_date) }}
              </div>
              <div v-if="report.project.end_date" class="text-sm text-muted-foreground">
                End: {{ formatDate(report.project.end_date) }}
              </div>
            </div>
          </Card>

          <!-- Financial Summary -->
          <Card class="p-6">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">Financial Summary</h3>
            <div class="space-y-3">
              <div>
                <div class="text-xs text-muted-foreground">Contract Amount</div>
                <div class="text-lg font-bold text-foreground">{{ formatCurrency(report.project.contract_amount) }}</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">Budget Amount</div>
                <div class="text-lg font-bold text-foreground">{{ formatCurrency(report.project.budget_amount) }}</div>
              </div>
              <div class="pt-3 border-t border-border">
                <div class="text-xs text-muted-foreground">Total Revenue</div>
                <div class="text-lg font-bold text-foreground">{{ formatCurrency(report.financials.total_revenue) }}</div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">Total Costs</div>
                <div class="text-lg font-bold text-foreground">{{ formatCurrency(report.financials.total_costs) }}</div>
              </div>
              <div class="pt-3 border-t border-border">
                <div class="text-xs text-muted-foreground">Gross Profit</div>
                <div class="text-xl font-bold" :class="report.financials.gross_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'">
                  {{ formatCurrency(report.financials.gross_profit) }}
                </div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">Profit Margin</div>
                <div class="text-xl font-bold" :class="report.financials.profit_margin >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'">
                  {{ formatPercent(report.financials.profit_margin) }}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
