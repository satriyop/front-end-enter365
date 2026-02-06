<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMrpShortageReport } from '@/api/useMrp'
import { useWarehousesLookup } from '@/api/useWarehouses'
import { formatCurrency } from '@/utils/format'
import { Card, Select, Input, ResponsiveTable, Badge, type ResponsiveColumn } from '@/components/ui'
import { Package, RefreshCw, TrendingDown } from 'lucide-vue-next'

// Filters
const warehouseId = ref<number | undefined>(undefined)
const startDate = ref(new Date().toISOString().split('T')[0])
const endDate = ref(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0])

// Fetch data
const { data: report, isLoading, error } = useMrpShortageReport(startDate, endDate, warehouseId)

// Warehouses for filter
const { data: warehouses } = useWarehousesLookup()
const warehouseOptions = computed(() => [
  { value: '', label: 'All Warehouses' },
  ...(warehouses.value?.map(w => ({ value: String(w.id), label: w.name })) ?? []),
])

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'product', label: 'Product', mobilePriority: 1 },
  { key: 'required', label: 'Required', align: 'right', mobilePriority: 2 },
  { key: 'available', label: 'Available', align: 'right', mobilePriority: 3 },
  { key: 'shortage', label: 'Shortage', align: 'right', mobilePriority: 4 },
  { key: 'action', label: 'Suggested Action', showInMobile: false },
]

function handleWarehouseChange(value: string | number | null) {
  warehouseId.value = value ? Number(value) : undefined
}

function getActionBadge(action: string): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
  const actions: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    purchase: { label: 'Purchase', variant: 'default' },
    manufacture: { label: 'Manufacture', variant: 'secondary' },
    subcontract: { label: 'Subcontract', variant: 'secondary' },
    expedite: { label: 'Expedite', variant: 'destructive' },
  }
  return actions[action] || { label: action, variant: 'secondary' }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Shortage Report</h1>
      <p class="text-slate-500 dark:text-slate-400">Material shortages based on planned demand</p>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-48">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Warehouse</label>
          <Select
            :model-value="warehouseId ? String(warehouseId) : ''"
            :options="warehouseOptions"
            placeholder="All Warehouses"
            @update:model-value="handleWarehouseChange"
          />
        </div>
        <div class="w-40">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">From Date</label>
          <Input v-model="startDate" type="date" />
        </div>
        <div class="w-40">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To Date</label>
          <Input v-model="endDate" type="date" />
        </div>
      </div>
    </Card>

    <!-- Loading -->
    <Card v-if="isLoading" class="text-center py-12">
      <RefreshCw class="w-8 h-8 mx-auto animate-spin text-slate-400" />
      <p class="mt-2 text-slate-500 dark:text-slate-400">Loading...</p>
    </Card>

    <!-- Error -->
    <Card v-else-if="error" class="text-center py-12">
      <p class="text-red-500">Failed to load shortage report</p>
    </Card>

    <!-- Content -->
    <template v-else-if="report">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card
          class="text-center"
          :class="report.summary.total_shortages > 0
            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
            : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'"
        >
          <div
            class="flex items-center justify-center gap-2 mb-1"
            :class="report.summary.total_shortages > 0
              ? 'text-red-600 dark:text-red-400'
              : 'text-green-600 dark:text-green-400'"
          >
            <TrendingDown class="w-4 h-4" />
            <span class="text-sm font-medium">Total Shortages</span>
          </div>
          <div
            class="text-2xl font-bold"
            :class="report.summary.total_shortages > 0
              ? 'text-red-700 dark:text-red-400'
              : 'text-green-700 dark:text-green-400'"
          >
            {{ report.summary.total_shortages }} items
          </div>
        </Card>

        <Card
          class="text-center"
          :class="report.summary.total_shortage_value > 0
            ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
            : ''"
        >
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Shortage Value</div>
          <div
            class="text-2xl font-bold font-mono"
            :class="report.summary.total_shortage_value > 0
              ? 'text-amber-700 dark:text-amber-400'
              : 'text-slate-900 dark:text-slate-100'"
          >
            {{ formatCurrency(report.summary.total_shortage_value) }}
          </div>
        </Card>
      </div>

      <!-- Shortage Table -->
      <Card :padding="false">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Shortage Details</h2>
        </div>

        <div v-if="report.items.length === 0" class="text-center py-12">
          <Package class="w-12 h-12 mx-auto text-green-400 mb-3" />
          <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No shortages</h3>
          <p class="text-slate-500 dark:text-slate-400">
            All materials are available for the planned period
          </p>
        </div>

        <ResponsiveTable
          v-else
          :items="report.items"
          :columns="columns"
          title-field="product_name"
        >
          <template #cell-product="{ item }">
            <div>
              <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.product_name }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">{{ item.product_sku }}</div>
            </div>
          </template>

          <template #cell-required="{ item }">
            <span class="font-mono text-slate-900 dark:text-slate-100">{{ item.required_qty }}</span>
          </template>

          <template #cell-available="{ item }">
            <span class="font-mono text-slate-600 dark:text-slate-400">{{ item.available_qty }}</span>
          </template>

          <template #cell-shortage="{ item }">
            <span class="font-mono font-medium text-red-600 dark:text-red-400">
              -{{ item.shortage_qty }}
            </span>
          </template>

          <template #cell-action="{ item }">
            <Badge :variant="getActionBadge(item.suggested_action).variant">
              {{ getActionBadge(item.suggested_action).label }}
            </Badge>
          </template>

          <template #mobile-title="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.product_name }}</span>
          </template>

          <template #mobile-status="{ item }">
            <span class="font-mono font-medium text-red-600 dark:text-red-400">
              -{{ item.shortage_qty }}
            </span>
          </template>
        </ResponsiveTable>
      </Card>
    </template>
  </div>
</template>
