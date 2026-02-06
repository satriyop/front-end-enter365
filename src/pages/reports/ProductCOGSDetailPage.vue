<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductCOGSDetail } from '@/api/useReports'
import { Button, Card } from '@/components/ui'
import { formatCurrency, formatPercent, formatNumber } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const productId = computed(() => Number(route.params.id))

const { data: report, isPending, isError, error } = useProductCOGSDetail(productId)
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">
          {{ report?.product.name ?? 'Product COGS Detail' }}
        </h1>
        <p class="text-muted-foreground mt-1">Detail COGS Produk</p>
      </div>
      <Button variant="outline" @click="router.push('/reports/cogs-by-product')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Report
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="isPending" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="text-muted-foreground mt-4">Loading product data...</p>
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
          <!-- COGS Breakdown -->
          <Card>
            <div class="p-6">
              <h3 class="text-lg font-semibold text-foreground mb-4">COGS Breakdown by Component</h3>
              <div v-if="report.breakdown.length === 0" class="text-center py-8 text-muted-foreground">
                No breakdown data available
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full">
                  <thead class="border-b border-border">
                    <tr class="text-left">
                      <th class="pb-3 text-sm font-semibold text-foreground">Component</th>
                      <th class="pb-3 text-sm font-semibold text-foreground text-right">Amount</th>
                      <th class="pb-3 text-sm font-semibold text-foreground text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in report.breakdown"
                      :key="item.component"
                      class="border-b border-border last:border-0"
                    >
                      <td class="py-3 text-sm text-foreground capitalize">{{ item.component }}</td>
                      <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.amount) }}</td>
                      <td class="py-3 text-sm text-muted-foreground text-right">{{ formatPercent(item.percentage) }}</td>
                    </tr>
                  </tbody>
                  <tfoot class="border-t border-border">
                    <tr>
                      <td class="pt-3 text-sm font-semibold text-foreground">Total COGS</td>
                      <td class="pt-3 text-sm font-semibold text-foreground text-right">
                        {{ formatCurrency(report.summary.total_cogs) }}
                      </td>
                      <td class="pt-3"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </Card>

          <!-- Monthly Trend -->
          <Card>
            <div class="p-6">
              <h3 class="text-lg font-semibold text-foreground mb-4">Monthly COGS Trend</h3>
              <div v-if="report.monthly_trend.length === 0" class="text-center py-8 text-muted-foreground">
                No monthly data available
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full">
                  <thead class="border-b border-border">
                    <tr class="text-left">
                      <th class="pb-3 text-sm font-semibold text-foreground">Month</th>
                      <th class="pb-3 text-sm font-semibold text-foreground text-right">Units Sold</th>
                      <th class="pb-3 text-sm font-semibold text-foreground text-right">COGS</th>
                      <th class="pb-3 text-sm font-semibold text-foreground text-right">Avg per Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in report.monthly_trend"
                      :key="item.month"
                      class="border-b border-border last:border-0"
                    >
                      <td class="py-3 text-sm text-foreground">{{ item.month }}</td>
                      <td class="py-3 text-sm text-foreground text-right">{{ formatNumber(item.units_sold) }}</td>
                      <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.cogs) }}</td>
                      <td class="py-3 text-sm text-muted-foreground text-right">
                        {{ item.units_sold > 0 ? formatCurrency(item.cogs / item.units_sold) : '-' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <!-- Product Info -->
          <Card class="p-6">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">Product Info</h3>
            <div class="space-y-2">
              <p class="font-mono text-sm text-muted-foreground">{{ report.product.sku }}</p>
              <p class="text-lg font-semibold text-foreground">{{ report.product.name }}</p>
              <div v-if="report.product.category" class="text-sm text-muted-foreground">
                <span class="text-xs">Category:</span> {{ report.product.category }}
              </div>
            </div>
          </Card>

          <!-- Summary Stats -->
          <Card class="p-6">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">Summary</h3>
            <div class="space-y-4">
              <div>
                <div class="text-xs text-muted-foreground">Total COGS</div>
                <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.summary.total_cogs) }}</div>
              </div>
              <div class="pt-3 border-t border-border">
                <div class="text-xs text-muted-foreground">Units Sold</div>
                <div class="text-2xl font-bold text-foreground">{{ formatNumber(report.summary.units_sold) }}</div>
              </div>
              <div class="pt-3 border-t border-border">
                <div class="text-xs text-muted-foreground">Average COGS per Unit</div>
                <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.summary.avg_cogs_per_unit) }}</div>
              </div>
            </div>
          </Card>

          <!-- Cost per Unit Metric -->
          <Card class="p-6">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">Unit Cost Analysis</h3>
            <div class="text-center">
              <div class="text-foreground">
                <div class="text-xs text-muted-foreground mb-1">Cost per Unit</div>
                <div class="text-3xl font-bold">{{ formatCurrency(report.summary.avg_cogs_per_unit) }}</div>
                <div class="text-xs text-muted-foreground mt-2">
                  Based on {{ formatNumber(report.summary.units_sold) }} units sold
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
