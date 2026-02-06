<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useVarianceReport } from '@/api/useInventory'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Badge, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { ArrowLeft, AlertTriangle, CheckCircle, Package, RefreshCw } from 'lucide-vue-next'

const route = useRoute()
const opnameId = computed(() => route.params.id as string)

// Fetch data
const { data: report, isLoading, error } = useVarianceReport(opnameId)

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'product', label: 'Product', mobilePriority: 1 },
  { key: 'system', label: 'System Qty', align: 'right', showInMobile: false },
  { key: 'counted', label: 'Counted Qty', align: 'right', mobilePriority: 3 },
  { key: 'variance', label: 'Variance', align: 'right', mobilePriority: 2 },
  { key: 'unit_cost', label: 'Unit Cost', align: 'right', showInMobile: false },
  { key: 'variance_value', label: 'Variance Value', align: 'right', mobilePriority: 4 },
]
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <RouterLink to="/inventory/opnames">
        <Button variant="ghost" size="sm">
          <ArrowLeft class="w-4 h-4" />
        </Button>
      </RouterLink>
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Variance Report</h1>
        <p class="text-slate-500 dark:text-slate-400">Stock opname variance analysis</p>
      </div>
    </div>

    <!-- Loading -->
    <Card v-if="isLoading" class="text-center py-12">
      <RefreshCw class="w-8 h-8 mx-auto animate-spin text-slate-400" />
      <p class="mt-2 text-slate-500 dark:text-slate-400">Loading...</p>
    </Card>

    <!-- Error -->
    <Card v-else-if="error" class="text-center py-12">
      <p class="text-red-500">Failed to load variance report</p>
    </Card>

    <!-- Content -->
    <template v-else-if="report">
      <!-- Opname Info -->
      <Card class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Reference</div>
            <div class="font-medium text-slate-900 dark:text-slate-100">{{ report.opname.reference }}</div>
          </div>
          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Date</div>
            <div class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(report.opname.opname_date) }}</div>
          </div>
          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Warehouse</div>
            <div class="font-medium text-slate-900 dark:text-slate-100">{{ report.warehouse.name }}</div>
          </div>
          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Status</div>
            <Badge :status="report.opname.status">
              {{ report.opname.status.label }}
            </Badge>
          </div>
        </div>
      </Card>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card class="text-center">
          <div class="flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
            <Package class="w-4 h-4" />
            <span class="text-sm font-medium">Total Items</span>
          </div>
          <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ report.summary.total_items }}
          </div>
        </Card>

        <Card
          class="text-center"
          :class="report.summary.items_with_variance > 0
            ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
            : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'"
        >
          <div
            class="flex items-center justify-center gap-2 mb-1"
            :class="report.summary.items_with_variance > 0
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-green-600 dark:text-green-400'"
          >
            <component :is="report.summary.items_with_variance > 0 ? AlertTriangle : CheckCircle" class="w-4 h-4" />
            <span class="text-sm font-medium">Items with Variance</span>
          </div>
          <div
            class="text-2xl font-bold"
            :class="report.summary.items_with_variance > 0
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-green-700 dark:text-green-400'"
          >
            {{ report.summary.items_with_variance }}
          </div>
        </Card>

        <Card
          class="text-center"
          :class="report.summary.total_variance_value !== 0
            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
            : ''"
        >
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Variance Value</div>
          <div
            class="text-2xl font-bold font-mono"
            :class="report.summary.total_variance_value < 0
              ? 'text-red-700 dark:text-red-400'
              : report.summary.total_variance_value > 0
                ? 'text-green-700 dark:text-green-400'
                : 'text-slate-900 dark:text-slate-100'"
          >
            {{ formatCurrency(report.summary.total_variance_value) }}
          </div>
        </Card>
      </div>

      <!-- Variance Table -->
      <Card :padding="false">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Variance Details</h2>
        </div>

        <div v-if="report.items.length === 0" class="text-center py-12">
          <CheckCircle class="w-12 h-12 mx-auto text-green-400 mb-3" />
          <p class="text-slate-500 dark:text-slate-400">No variances found - all counts match!</p>
        </div>

        <ResponsiveTable
          v-else
          :items="report.items"
          :columns="columns"
          title-field="name"
        >
          <template #cell-product="{ item }">
            <div>
              <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">{{ item.sku }}</div>
            </div>
          </template>

          <template #cell-system="{ item }">
            <span class="font-mono text-slate-600 dark:text-slate-400">{{ item.system_quantity }}</span>
          </template>

          <template #cell-counted="{ item }">
            <span class="font-mono text-slate-900 dark:text-slate-100">{{ item.counted_quantity }}</span>
          </template>

          <template #cell-variance="{ item }">
            <span
              class="font-mono font-medium"
              :class="item.variance < 0
                ? 'text-red-600 dark:text-red-400'
                : item.variance > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-500'"
            >
              {{ item.variance > 0 ? '+' : '' }}{{ item.variance }}
            </span>
          </template>

          <template #cell-unit_cost="{ item }">
            <span class="font-mono text-slate-600 dark:text-slate-400">{{ formatCurrency(item.unit_cost) }}</span>
          </template>

          <template #cell-variance_value="{ item }">
            <span
              class="font-mono font-medium"
              :class="item.variance_value < 0
                ? 'text-red-600 dark:text-red-400'
                : item.variance_value > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-500'"
            >
              {{ formatCurrency(item.variance_value) }}
            </span>
          </template>

          <template #mobile-title="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</span>
          </template>

          <template #mobile-status="{ item }">
            <span
              class="font-mono font-medium"
              :class="item.variance < 0
                ? 'text-red-600 dark:text-red-400'
                : item.variance > 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-slate-500'"
            >
              {{ item.variance > 0 ? '+' : '' }}{{ item.variance }}
            </span>
          </template>
        </ResponsiveTable>
      </Card>
    </template>
  </div>
</template>
