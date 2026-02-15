<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductCOGSDetail } from '@/api/useReports'
import { Button, Card } from '@/components/ui'
import { formatCurrency, formatNumber } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const productId = computed(() => Number(route.params.id))

const { data: report, isPending, isError, error } = useProductCOGSDetail(productId)

const avgCostPerUnit = computed(() => {
  if (!report.value || report.value.total_quantity === 0) return 0
  return Math.round(report.value.total_cogs / report.value.total_quantity)
})
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
          <!-- Movements Table -->
          <Card>
            <div class="p-6">
              <h3 class="text-lg font-semibold text-foreground mb-4">COGS Movements</h3>
              <div v-if="report.movements.length === 0" class="text-center py-8 text-muted-foreground">
                No movements in this period
              </div>
              <div v-else class="overflow-x-auto">
                <table class="w-full">
                  <thead class="border-b border-border">
                    <tr class="text-left">
                      <th class="pb-3 text-sm font-semibold text-foreground">Date</th>
                      <th class="pb-3 text-sm font-semibold text-foreground">Movement #</th>
                      <th class="pb-3 text-sm font-semibold text-foreground text-right">Quantity</th>
                      <th class="pb-3 text-sm font-semibold text-foreground text-right">Unit Cost</th>
                      <th class="pb-3 text-sm font-semibold text-foreground text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in report.movements"
                      :key="item.id"
                      class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td class="py-3 text-sm text-foreground">{{ item.date }}</td>
                      <td class="py-3 text-sm font-mono text-foreground">{{ item.movement_number }}</td>
                      <td class="py-3 text-sm text-foreground text-right">{{ formatNumber(item.quantity) }}</td>
                      <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.unit_cost) }}</td>
                      <td class="py-3 text-sm font-semibold text-foreground text-right">{{ formatCurrency(item.total_cost) }}</td>
                    </tr>
                  </tbody>
                  <tfoot class="border-t-2 border-border">
                    <tr class="font-semibold">
                      <td colspan="2" class="pt-3 text-sm text-foreground">Total</td>
                      <td class="pt-3 text-sm text-foreground text-right">{{ formatNumber(report.total_quantity) }}</td>
                      <td class="pt-3"></td>
                      <td class="pt-3 text-sm text-foreground text-right">{{ formatCurrency(report.total_cogs) }}</td>
                    </tr>
                  </tfoot>
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
            </div>
          </Card>

          <!-- Period -->
          <Card class="p-6">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">Period</h3>
            <p class="text-sm text-foreground">{{ report.period.start }} &mdash; {{ report.period.end }}</p>
          </Card>

          <!-- Summary Stats -->
          <Card class="p-6">
            <h3 class="text-sm font-semibold text-muted-foreground mb-3">Summary</h3>
            <div class="space-y-4">
              <div>
                <div class="text-xs text-muted-foreground">Total COGS</div>
                <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.total_cogs) }}</div>
              </div>
              <div class="pt-3 border-t border-border">
                <div class="text-xs text-muted-foreground">Units Sold</div>
                <div class="text-2xl font-bold text-foreground">{{ formatNumber(report.total_quantity) }}</div>
              </div>
              <div class="pt-3 border-t border-border">
                <div class="text-xs text-muted-foreground">Average COGS per Unit</div>
                <div class="text-2xl font-bold text-foreground">{{ formatCurrency(avgCostPerUnit) }}</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
