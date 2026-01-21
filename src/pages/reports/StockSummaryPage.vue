<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInventorySummary } from '@/api/useReports'
import { useWarehousesLookup } from '@/api/useInventory'
import { Button, Card, Select } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const router = useRouter()

const warehouseId = ref<number | undefined>(undefined)
const warehouseIdRef = computed(() => warehouseId.value)

const { data: warehouses } = useWarehousesLookup()
const { data: report, isLoading, error } = useInventorySummary(warehouseIdRef)

const warehouseOptions = computed(() => [
  { value: '', label: 'All Warehouses' },
  ...(warehouses.value?.map(w => ({
    value: String(w.id),
    label: `${w.code} - ${w.name}`
  })) ?? [])
])

function handleWarehouseChange(value: string | number | null) {
  warehouseId.value = value ? Number(value) : undefined
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Stock Summary</h1>
        <p class="text-slate-500 dark:text-slate-400">Ringkasan Stok - Current stock by warehouse</p>
      </div>
      <Button variant="ghost" @click="router.push('/reports')">Back to Reports</Button>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-64">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Warehouse</label>
          <Select
            :model-value="warehouseId ? String(warehouseId) : ''"
            :options="warehouseOptions"
            @update:model-value="handleWarehouseChange"
          />
        </div>
      </div>
    </Card>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading report...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-500">Failed to load report</div>
    </div>

    <!-- Report Content -->
    <div v-else-if="report" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400">Total Items</div>
          <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ report.summary.total_items.toLocaleString() }}
          </div>
        </Card>
        <Card class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400">Total Quantity</div>
          <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ Number(report.summary.total_quantity).toLocaleString() }}
          </div>
        </Card>
        <Card class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400">Total Value</div>
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ formatCurrency(Number(report.summary.total_value) || 0) }}
          </div>
        </Card>
        <Card class="text-center bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
          <div class="text-sm text-slate-500 dark:text-slate-400">Low Stock</div>
          <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {{ report.summary.low_stock_count }}
          </div>
        </Card>
        <Card class="text-center bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
          <div class="text-sm text-slate-500 dark:text-slate-400">Out of Stock</div>
          <div class="text-2xl font-bold text-red-600 dark:text-red-400">
            {{ report.summary.out_of_stock_count }}
          </div>
        </Card>
      </div>

      <!-- Summary Details -->
      <Card>
        <div class="text-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Inventory Summary
          </h2>
          <p class="text-slate-500 dark:text-slate-400">
            {{ report.warehouse ? `${report.warehouse.code} - ${report.warehouse.name}` : 'All Warehouses' }}
          </p>
        </div>

        <div class="space-y-4">
          <div class="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded">
            <div>
              <div class="font-medium text-slate-900 dark:text-slate-100">Total Products in Stock</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Number of unique products with stock > 0</div>
            </div>
            <div class="text-2xl font-mono font-semibold text-slate-900 dark:text-slate-100">
              {{ report.summary.total_items.toLocaleString() }}
            </div>
          </div>

          <div class="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800 rounded">
            <div>
              <div class="font-medium text-slate-900 dark:text-slate-100">Total Quantity</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Sum of all stock quantities</div>
            </div>
            <div class="text-2xl font-mono font-semibold text-slate-900 dark:text-slate-100">
              {{ Number(report.summary.total_quantity).toLocaleString() }}
            </div>
          </div>

          <div class="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-800">
            <div>
              <div class="font-medium text-slate-900 dark:text-slate-100">Total Inventory Value</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Based on average cost</div>
            </div>
            <div class="text-2xl font-mono font-bold text-green-700 dark:text-green-400">
              {{ formatCurrency(Number(report.summary.total_value) || 0) }}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="flex justify-between items-center p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
              <div>
                <div class="font-medium text-slate-900 dark:text-slate-100">Low Stock Items</div>
                <div class="text-sm text-slate-500 dark:text-slate-400">Below minimum threshold</div>
              </div>
              <div class="text-xl font-mono font-bold text-yellow-700 dark:text-yellow-400">
                {{ report.summary.low_stock_count }}
              </div>
            </div>

            <div class="flex justify-between items-center p-4 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800">
              <div>
                <div class="font-medium text-slate-900 dark:text-slate-100">Out of Stock Items</div>
                <div class="text-sm text-slate-500 dark:text-slate-400">Zero quantity available</div>
              </div>
              <div class="text-xl font-mono font-bold text-red-700 dark:text-red-400">
                {{ report.summary.out_of_stock_count }}
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div class="flex flex-wrap gap-2">
            <RouterLink to="/inventory">
              <Button variant="secondary" size="sm">View Inventory List</Button>
            </RouterLink>
            <RouterLink to="/reports/stock-valuation">
              <Button variant="secondary" size="sm">Stock Valuation Report</Button>
            </RouterLink>
            <RouterLink to="/reports/stock-movement">
              <Button variant="secondary" size="sm">Stock Movement Report</Button>
            </RouterLink>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
