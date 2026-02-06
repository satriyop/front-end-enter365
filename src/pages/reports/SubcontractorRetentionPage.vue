<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useSubcontractorRetention } from '@/api/useReports'
import { Button, Card, Badge } from '@/components/ui'
import { formatCurrency, formatPercent, formatDate } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const { data: report, isPending, isError, error } = useSubcontractorRetention()
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Subcontractor Retention</h1>
        <p class="text-muted-foreground mt-1">Retensi Subkontraktor</p>
      </div>
      <Button variant="outline" @click="router.push('/reports')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Reports
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="isPending" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="text-muted-foreground mt-4">Loading retention data...</p>
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
            <div class="text-4xl font-bold text-foreground">{{ report.totals.work_orders_count }}</div>
            <div class="text-sm text-muted-foreground mt-2">Work Orders</div>
          </div>
        </Card>
        <Card class="p-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.totals.total_retention_held) }}</div>
            <div class="text-sm text-muted-foreground mt-2">Total Retention Held</div>
          </div>
        </Card>
        <Card class="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ formatCurrency(report.totals.releasable_amount) }}</div>
            <div class="text-sm text-green-700 dark:text-green-300 mt-2">Releasable</div>
          </div>
        </Card>
        <Card class="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <div class="text-center">
            <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ formatCurrency(report.totals.pending_amount) }}</div>
            <div class="text-sm text-amber-700 dark:text-amber-300 mt-2">Pending</div>
          </div>
        </Card>
      </div>

      <!-- By Subcontractor -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">Retention by Subcontractor</h3>
          <div v-if="report.by_subcontractor.length === 0" class="text-center py-8 text-muted-foreground">
            No retention data available
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">Subcontractor</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">WOs</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Total Retention</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Releasable</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, idx) in report.by_subcontractor"
                  :key="idx"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td class="py-3 text-sm text-foreground">{{ item.subcontractor }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ item.work_orders_count }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.total_retention) }}</td>
                  <td class="py-3 text-sm text-green-600 dark:text-green-400 text-right">{{ formatCurrency(item.releasable_amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <!-- Detailed Retentions -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">Retention Details</h3>
          <div v-if="report.retentions.length === 0" class="text-center py-8 text-muted-foreground">
            No retention records
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">SC WO#</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Name</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Subcontractor</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Agreed</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Retention %</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Retention</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">End Date</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Releasable</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in report.retentions"
                  :key="item.id"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td class="py-3 font-mono text-sm text-foreground">{{ item.sc_wo_number }}</td>
                  <td class="py-3 text-sm text-foreground">{{ item.name }}</td>
                  <td class="py-3 text-sm text-muted-foreground">{{ item.subcontractor_name || '-' }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.agreed_amount) }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatPercent(item.retention_percent) }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.retention_amount) }}</td>
                  <td class="py-3 text-sm text-muted-foreground">{{ formatDate(item.actual_end || item.scheduled_end) }}</td>
                  <td class="py-3">
                    <Badge :status="item.is_releasable ? 'approved' : 'draft'">
                      {{ item.is_releasable ? 'Yes' : 'No' }}
                    </Badge>
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
