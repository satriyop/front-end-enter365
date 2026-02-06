<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMovementSummary } from '@/api/useInventory'
import { useWarehousesLookup } from '@/api/useWarehouses'
import { formatCurrency } from '@/utils/format'
import { Card, Select, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { TrendingUp, TrendingDown, BarChart3, RefreshCw } from 'lucide-vue-next'

// Filters
const warehouseId = ref<number | undefined>(undefined)
const startDate = ref(new Date(new Date().setDate(1)).toISOString().split('T')[0]) // First day of month
const endDate = ref(new Date().toISOString().split('T')[0]) // Today

const filters = computed(() => ({
  warehouse_id: warehouseId.value,
  start_date: startDate.value,
  end_date: endDate.value,
}))

// Fetch data
const { data: summary, isLoading, error } = useMovementSummary(filters)

// Warehouses for filter
const { data: warehouses } = useWarehousesLookup()
const warehouseOptions = computed(() => [
  { value: '', label: 'All Warehouses' },
  ...(warehouses.value?.map(w => ({ value: String(w.id), label: w.name })) ?? []),
])

// By Type table columns
const typeColumns: ResponsiveColumn[] = [
  { key: 'type', label: 'Movement Type', mobilePriority: 1 },
  { key: 'count', label: 'Count', align: 'right', mobilePriority: 2 },
  { key: 'qty_in', label: 'Qty In', align: 'right', showInMobile: false },
  { key: 'qty_out', label: 'Qty Out', align: 'right', showInMobile: false },
  { key: 'value_in', label: 'Value In', align: 'right', showInMobile: false },
  { key: 'value_out', label: 'Value Out', align: 'right', showInMobile: false },
]

// By Product table columns
const productColumns: ResponsiveColumn[] = [
  { key: 'product', label: 'Product', mobilePriority: 1 },
  { key: 'qty_in', label: 'Qty In', align: 'right', mobilePriority: 2 },
  { key: 'qty_out', label: 'Qty Out', align: 'right', mobilePriority: 3 },
  { key: 'net', label: 'Net', align: 'right', mobilePriority: 4 },
]

function handleWarehouseChange(value: string | number | null) {
  warehouseId.value = value ? Number(value) : undefined
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Movement Summary</h1>
      <p class="text-slate-500 dark:text-slate-400">Inventory movement analysis by type and product</p>
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
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
          <Input v-model="startDate" type="date" />
        </div>
        <div class="w-40">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
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
      <p class="text-red-500">Failed to load movement summary</p>
    </Card>

    <!-- Content -->
    <template v-else-if="summary">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card class="text-center border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <div class="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <TrendingUp class="w-4 h-4" />
            <span class="text-sm font-medium">Total In</span>
          </div>
          <div class="text-2xl font-bold text-green-700 dark:text-green-400">
            {{ summary.summary.total_in }}
          </div>
          <div class="text-xs text-green-600 dark:text-green-500 mt-1">
            {{ formatCurrency(summary.summary.total_value_in) }}
          </div>
        </Card>

        <Card class="text-center border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div class="flex items-center justify-center gap-2 text-red-600 dark:text-red-400 mb-1">
            <TrendingDown class="w-4 h-4" />
            <span class="text-sm font-medium">Total Out</span>
          </div>
          <div class="text-2xl font-bold text-red-700 dark:text-red-400">
            {{ summary.summary.total_out }}
          </div>
          <div class="text-xs text-red-600 dark:text-red-500 mt-1">
            {{ formatCurrency(summary.summary.total_value_out) }}
          </div>
        </Card>

        <Card class="text-center border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <div class="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <BarChart3 class="w-4 h-4" />
            <span class="text-sm font-medium">Net Movement</span>
          </div>
          <div
            class="text-2xl font-bold"
            :class="summary.summary.net_movement >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'"
          >
            {{ summary.summary.net_movement >= 0 ? '+' : '' }}{{ summary.summary.net_movement }}
          </div>
        </Card>

        <Card class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Period</div>
          <div class="text-sm font-medium text-slate-900 dark:text-slate-100">
            {{ summary.period.start_date }}
          </div>
          <div class="text-sm text-slate-500 dark:text-slate-400">to</div>
          <div class="text-sm font-medium text-slate-900 dark:text-slate-100">
            {{ summary.period.end_date }}
          </div>
        </Card>
      </div>

      <!-- By Type Table -->
      <Card :padding="false" class="mb-6">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">By Movement Type</h2>
        </div>

        <div v-if="summary.by_type.length === 0" class="text-center py-8">
          <p class="text-slate-500 dark:text-slate-400">No movements in this period</p>
        </div>

        <ResponsiveTable
          v-else
          :items="summary.by_type"
          :columns="typeColumns"
          title-field="type_label"
        >
          <template #cell-type="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.type_label }}</span>
          </template>

          <template #cell-count="{ item }">
            <span class="font-mono text-slate-900 dark:text-slate-100">{{ item.count }}</span>
          </template>

          <template #cell-qty_in="{ item }">
            <span class="font-mono text-green-600 dark:text-green-400">{{ item.quantity_in }}</span>
          </template>

          <template #cell-qty_out="{ item }">
            <span class="font-mono text-red-600 dark:text-red-400">{{ item.quantity_out }}</span>
          </template>

          <template #cell-value_in="{ item }">
            <span class="font-mono text-slate-600 dark:text-slate-400">{{ formatCurrency(item.value_in) }}</span>
          </template>

          <template #cell-value_out="{ item }">
            <span class="font-mono text-slate-600 dark:text-slate-400">{{ formatCurrency(item.value_out) }}</span>
          </template>

          <template #mobile-title="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.type_label }}</span>
          </template>
        </ResponsiveTable>
      </Card>

      <!-- By Product Table -->
      <Card :padding="false">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">By Product</h2>
        </div>

        <div v-if="summary.by_product.length === 0" class="text-center py-8">
          <p class="text-slate-500 dark:text-slate-400">No product movements in this period</p>
        </div>

        <ResponsiveTable
          v-else
          :items="summary.by_product"
          :columns="productColumns"
          title-field="name"
        >
          <template #cell-product="{ item }">
            <div>
              <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">{{ item.sku }}</div>
            </div>
          </template>

          <template #cell-qty_in="{ item }">
            <span class="font-mono text-green-600 dark:text-green-400">+{{ item.quantity_in }}</span>
          </template>

          <template #cell-qty_out="{ item }">
            <span class="font-mono text-red-600 dark:text-red-400">-{{ item.quantity_out }}</span>
          </template>

          <template #cell-net="{ item }">
            <span
              class="font-mono font-medium"
              :class="item.net_quantity >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
            >
              {{ item.net_quantity >= 0 ? '+' : '' }}{{ item.net_quantity }}
            </span>
          </template>

          <template #mobile-title="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</span>
          </template>
        </ResponsiveTable>
      </Card>
    </template>
  </div>
</template>
