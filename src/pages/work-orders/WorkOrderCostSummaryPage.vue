<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkOrderCostSummary } from '@/api/useWorkOrders'
import { formatCurrency } from '@/utils/format'
import { Button, Card, Badge, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { ArrowLeft, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const workOrderId = computed(() => route.params.id as string)

// Fetch data
const { data: costSummary, isLoading, error } = useWorkOrderCostSummary(workOrderId)

// Material items columns
const materialColumns: ResponsiveColumn[] = [
  { key: 'product', label: 'Product', mobilePriority: 1 },
  { key: 'planned_qty', label: 'Planned Qty', align: 'right', showInMobile: false },
  { key: 'actual_qty', label: 'Actual Qty', align: 'right', mobilePriority: 3 },
  { key: 'planned_cost', label: 'Planned Cost', align: 'right', showInMobile: false },
  { key: 'actual_cost', label: 'Actual Cost', align: 'right', mobilePriority: 2 },
]

function getVarianceClass(variance: number): string {
  if (variance < 0) return 'text-red-600 dark:text-red-400'
  if (variance > 0) return 'text-green-600 dark:text-green-400'
  return 'text-slate-500'
}

function getVarianceIcon(variance: number) {
  if (variance < 0) return TrendingDown
  if (variance > 0) return TrendingUp
  return null
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <RefreshCw class="w-8 h-8 mx-auto animate-spin text-slate-400" />
      <p class="mt-2 text-slate-500 dark:text-slate-400">Loading...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <AlertTriangle class="w-12 h-12 mx-auto text-red-400 mb-3" />
      <p class="text-red-500">Failed to load cost summary</p>
      <Button variant="ghost" class="mt-4" @click="router.back()">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Go Back
      </Button>
    </div>

    <!-- Content -->
    <template v-else-if="costSummary">
      <!-- Header -->
      <div class="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" @click="router.push(`/work-orders/${workOrderId}`)">
          <ArrowLeft class="w-4 h-4" />
        </Button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Cost Summary</h1>
            <Badge :status="costSummary.work_order.status">
              {{ costSummary.work_order.status.label }}
            </Badge>
          </div>
          <p class="text-slate-500 dark:text-slate-400">{{ costSummary.work_order.wo_number }}</p>
        </div>
      </div>

      <!-- Total Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Planned Cost</div>
          <div class="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {{ formatCurrency(costSummary.totals.planned_cost) }}
          </div>
        </Card>

        <Card class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Actual Cost</div>
          <div class="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
            {{ formatCurrency(costSummary.totals.actual_cost) }}
          </div>
        </Card>

        <Card
          class="text-center"
          :class="costSummary.totals.variance < 0
            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
            : costSummary.totals.variance > 0
              ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
              : ''"
        >
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Variance</div>
          <div
            class="text-xl font-bold font-mono flex items-center justify-center gap-1"
            :class="getVarianceClass(costSummary.totals.variance)"
          >
            <component :is="getVarianceIcon(costSummary.totals.variance)" v-if="getVarianceIcon(costSummary.totals.variance)" class="w-4 h-4" />
            {{ formatCurrency(Math.abs(costSummary.totals.variance)) }}
          </div>
        </Card>

        <Card class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Variance %</div>
          <div
            class="text-xl font-bold font-mono"
            :class="getVarianceClass(costSummary.totals.variance_percent)"
          >
            {{ costSummary.totals.variance_percent >= 0 ? '+' : '' }}{{ costSummary.totals.variance_percent.toFixed(1) }}%
          </div>
        </Card>
      </div>

      <!-- Cost Breakdown -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <!-- Materials -->
        <Card>
          <div class="flex items-center gap-2 mb-4">
            <DollarSign class="w-5 h-5 text-slate-400" />
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Materials</h2>
          </div>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Planned</dt>
              <dd class="font-mono text-slate-900 dark:text-slate-100">{{ formatCurrency(costSummary.materials.planned_cost) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Actual</dt>
              <dd class="font-mono text-slate-900 dark:text-slate-100">{{ formatCurrency(costSummary.materials.actual_cost) }}</dd>
            </div>
            <div class="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
              <dt class="font-medium text-slate-900 dark:text-slate-100">Variance</dt>
              <dd class="font-mono font-medium" :class="getVarianceClass(costSummary.materials.variance)">
                {{ formatCurrency(costSummary.materials.variance) }}
              </dd>
            </div>
          </dl>
        </Card>

        <!-- Labor -->
        <Card>
          <div class="flex items-center gap-2 mb-4">
            <DollarSign class="w-5 h-5 text-slate-400" />
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Labor</h2>
          </div>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Planned</dt>
              <dd class="font-mono text-slate-900 dark:text-slate-100">{{ formatCurrency(costSummary.labor.planned_cost) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Actual</dt>
              <dd class="font-mono text-slate-900 dark:text-slate-100">{{ formatCurrency(costSummary.labor.actual_cost) }}</dd>
            </div>
            <div class="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
              <dt class="font-medium text-slate-900 dark:text-slate-100">Variance</dt>
              <dd class="font-mono font-medium" :class="getVarianceClass(costSummary.labor.variance)">
                {{ formatCurrency(costSummary.labor.variance) }}
              </dd>
            </div>
          </dl>
        </Card>

        <!-- Overhead -->
        <Card>
          <div class="flex items-center gap-2 mb-4">
            <DollarSign class="w-5 h-5 text-slate-400" />
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Overhead</h2>
          </div>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Planned</dt>
              <dd class="font-mono text-slate-900 dark:text-slate-100">{{ formatCurrency(costSummary.overhead.planned_cost) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Actual</dt>
              <dd class="font-mono text-slate-900 dark:text-slate-100">{{ formatCurrency(costSummary.overhead.actual_cost) }}</dd>
            </div>
            <div class="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
              <dt class="font-medium text-slate-900 dark:text-slate-100">Variance</dt>
              <dd class="font-mono font-medium" :class="getVarianceClass(costSummary.overhead.variance)">
                {{ formatCurrency(costSummary.overhead.variance) }}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <!-- Material Items Detail -->
      <Card :padding="false">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Material Items</h2>
        </div>

        <ResponsiveTable
          :items="costSummary.materials.items"
          :columns="materialColumns"
          title-field="product_name"
        >
          <template #cell-product="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.product_name }}</span>
          </template>

          <template #cell-planned_qty="{ item }">
            <span class="font-mono text-slate-600 dark:text-slate-400">{{ item.planned_qty }}</span>
          </template>

          <template #cell-actual_qty="{ item }">
            <span class="font-mono text-slate-900 dark:text-slate-100">{{ item.actual_qty }}</span>
          </template>

          <template #cell-planned_cost="{ item }">
            <span class="font-mono text-slate-600 dark:text-slate-400">{{ formatCurrency(item.planned_cost) }}</span>
          </template>

          <template #cell-actual_cost="{ item }">
            <span class="font-mono text-slate-900 dark:text-slate-100">{{ formatCurrency(item.actual_cost) }}</span>
          </template>

          <template #mobile-title="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.product_name }}</span>
          </template>
        </ResponsiveTable>
      </Card>
    </template>
  </div>
</template>
