<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMovementSummary } from '@/api/useReports'
import { useWarehousesLookup } from '@/api/useInventory'
import { Button, Card, Input, Select } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const router = useRouter()

// Default to current month
const now = new Date()
const startDate = ref(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(now.toISOString().split('T')[0])
const warehouseId = ref<number | undefined>(undefined)

const startDateRef = computed(() => startDate.value)
const endDateRef = computed(() => endDate.value)
const warehouseIdRef = computed(() => warehouseId.value)

const { data: warehouses } = useWarehousesLookup()
const { data: report, isLoading, error } = useMovementSummary(startDateRef, endDateRef, warehouseIdRef)

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

function setThisMonth() {
  const today = new Date()
  startDate.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  endDate.value = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
}

function setLastMonth() {
  const today = new Date()
  startDate.value = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]
  endDate.value = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
}

function formatQuantity(qty: number): string {
  if (qty === 0) return '-'
  return qty > 0 ? `+${qty.toLocaleString()}` : qty.toLocaleString()
}

function getQuantityClass(qty: number): string {
  if (qty > 0) return 'text-green-600 dark:text-green-400'
  if (qty < 0) return 'text-red-600 dark:text-red-400'
  return 'text-slate-400 dark:text-slate-500'
}
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Stock Movement</h1>
        <p class="text-slate-500 dark:text-slate-400">Pergerakan Stok - Inventory transactions summary</p>
      </div>
      <Button variant="ghost" @click="router.push('/reports')">Back to Reports</Button>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
          <Input v-model="startDate" type="date" class="w-40" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
          <Input v-model="endDate" type="date" class="w-40" />
        </div>
        <div class="w-64">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Warehouse</label>
          <Select
            :model-value="warehouseId ? String(warehouseId) : ''"
            :options="warehouseOptions"
            @update:model-value="handleWarehouseChange"
          />
        </div>
        <div class="flex gap-2">
          <Button variant="secondary" size="sm" @click="setThisMonth">This Month</Button>
          <Button variant="secondary" size="sm" @click="setLastMonth">Last Month</Button>
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
          <div class="text-sm text-slate-500 dark:text-slate-400">Opening Value</div>
          <div class="text-xl font-bold text-slate-900 dark:text-slate-100">
            {{ formatCurrency(report.summary.total_opening_value || 0) }}
          </div>
        </Card>
        <Card class="text-center bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
          <div class="text-sm text-slate-500 dark:text-slate-400">Stock In</div>
          <div class="text-xl font-bold text-green-600 dark:text-green-400">
            +{{ (report.summary.total_in || 0).toLocaleString() }}
          </div>
        </Card>
        <Card class="text-center bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800">
          <div class="text-sm text-slate-500 dark:text-slate-400">Stock Out</div>
          <div class="text-xl font-bold text-red-600 dark:text-red-400">
            -{{ Math.abs(report.summary.total_out || 0).toLocaleString() }}
          </div>
        </Card>
        <Card class="text-center bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
          <div class="text-sm text-slate-500 dark:text-slate-400">Adjustments</div>
          <div class="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {{ formatQuantity(report.summary.total_adjustment || 0) }}
          </div>
        </Card>
        <Card class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400">Closing Value</div>
          <div class="text-xl font-bold text-slate-900 dark:text-slate-100">
            {{ formatCurrency(report.summary.total_closing_value || 0) }}
          </div>
        </Card>
      </div>

      <!-- Detail Table -->
      <Card>
        <div class="text-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Movement Details</h2>
          <p class="text-slate-500 dark:text-slate-400">
            {{ report.warehouse ? `${report.warehouse.code} - ${report.warehouse.name}` : 'All Warehouses' }}
            &bull; {{ report.period?.start }} to {{ report.period?.end }}
          </p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Product</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Opening</th>
                <th class="text-right px-4 py-3 font-medium text-green-600 dark:text-green-400">In</th>
                <th class="text-right px-4 py-3 font-medium text-red-600 dark:text-red-400">Out</th>
                <th class="text-right px-4 py-3 font-medium text-yellow-600 dark:text-yellow-400">Adj</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Closing</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Value</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr
                v-for="item in report.summary.items"
                :key="item.product_id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <td class="px-4 py-3">
                  <RouterLink
                    :to="`/products/${item.product_id}`"
                    class="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                  >
                    {{ item.name }}
                  </RouterLink>
                  <div class="text-xs text-slate-400 dark:text-slate-500">{{ item.sku }} &bull; {{ item.unit }}</div>
                </td>
                <td class="text-right px-4 py-3 font-mono text-slate-900 dark:text-slate-100">
                  {{ item.opening_qty.toLocaleString() }}
                </td>
                <td class="text-right px-4 py-3 font-mono" :class="getQuantityClass(item.in_qty)">
                  {{ item.in_qty > 0 ? `+${item.in_qty.toLocaleString()}` : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono" :class="getQuantityClass(-item.out_qty)">
                  {{ item.out_qty > 0 ? `-${item.out_qty.toLocaleString()}` : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono" :class="getQuantityClass(item.adjustment_qty)">
                  {{ item.adjustment_qty !== 0 ? formatQuantity(item.adjustment_qty) : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {{ item.closing_qty.toLocaleString() }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(item.closing_value || 0) }}
                </td>
              </tr>
              <tr v-if="!report.summary.items?.length">
                <td colspan="7" class="text-center py-8 text-slate-500 dark:text-slate-400">
                  No movement data for selected period
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-100 dark:bg-slate-800 font-semibold">
              <tr>
                <td class="px-4 py-3 text-slate-900 dark:text-slate-100">TOTAL</td>
                <td class="text-right px-4 py-3 font-mono text-slate-900 dark:text-slate-100">-</td>
                <td class="text-right px-4 py-3 font-mono text-green-700 dark:text-green-400">
                  +{{ (report.summary.total_in || 0).toLocaleString() }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-red-700 dark:text-red-400">
                  -{{ Math.abs(report.summary.total_out || 0).toLocaleString() }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-yellow-700 dark:text-yellow-400">
                  {{ formatQuantity(report.summary.total_adjustment || 0) }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-slate-900 dark:text-slate-100">-</td>
                <td class="text-right px-4 py-3 font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(report.summary.total_closing_value || 0) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  </div>
</template>
