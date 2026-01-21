<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStockValuation, useWarehousesLookup } from '@/api/useInventory'
import { Button, Card, Select } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const router = useRouter()

const warehouseId = ref<number | undefined>(undefined)
const warehouseIdRef = computed(() => warehouseId.value)

const { data: warehouses } = useWarehousesLookup()
const { data: report, isLoading, error } = useStockValuation(warehouseIdRef)

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

// Calculate average cost
function getAverageCost(item: { quantity: number; total_value: number }): number {
  if (!item.quantity || item.quantity === 0) return 0
  return item.total_value / item.quantity
}
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Stock Valuation</h1>
        <p class="text-slate-500 dark:text-slate-400">Penilaian Stok - Inventory value by product</p>
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
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400">Total Products</div>
          <div class="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {{ report.summary.total_items.toLocaleString() }}
          </div>
          <div class="text-xs text-slate-400 dark:text-slate-500 mt-1">Items with stock</div>
        </Card>
        <Card class="text-center bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
          <div class="text-sm text-slate-500 dark:text-slate-400">Total Inventory Value</div>
          <div class="text-3xl font-bold text-green-700 dark:text-green-400">
            {{ formatCurrency(report.summary.total_value || 0) }}
          </div>
          <div class="text-xs text-slate-400 dark:text-slate-500 mt-1">Based on average cost</div>
        </Card>
      </div>

      <!-- Detail Table -->
      <Card>
        <div class="text-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Valuation Details</h2>
          <p class="text-slate-500 dark:text-slate-400">
            {{ report.warehouse ? `${report.warehouse.code} - ${report.warehouse.name}` : 'All Warehouses' }}
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">SKU</th>
                <th class="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Product Name</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Quantity</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Avg Cost</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Total Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr
                v-for="item in report.items"
                :key="item.product_id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <td class="px-4 py-3">
                  <RouterLink
                    :to="`/products/${item.product_id}`"
                    class="font-mono text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {{ item.sku }}
                  </RouterLink>
                </td>
                <td class="px-4 py-3 text-slate-900 dark:text-slate-100">
                  {{ item.name }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-slate-900 dark:text-slate-100">
                  {{ item.quantity.toLocaleString() }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(item.average_cost || getAverageCost(item)) }}
                </td>
                <td class="text-right px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(item.total_value || 0) }}
                </td>
              </tr>
              <tr v-if="!report.items?.length">
                <td colspan="5" class="text-center py-8 text-slate-500 dark:text-slate-400">
                  No stock data available
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-100 dark:bg-slate-800 font-semibold">
              <tr>
                <td colspan="2" class="px-4 py-3 text-slate-900 dark:text-slate-100">TOTAL</td>
                <td class="text-right px-4 py-3 font-mono text-slate-900 dark:text-slate-100">
                  {{ report.items?.reduce((sum, item) => sum + item.quantity, 0).toLocaleString() }}
                </td>
                <td class="text-right px-4 py-3 text-slate-500 dark:text-slate-400">-</td>
                <td class="text-right px-4 py-3 font-mono text-green-700 dark:text-green-400">
                  {{ formatCurrency(report.summary.total_value || 0) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  </div>
</template>
