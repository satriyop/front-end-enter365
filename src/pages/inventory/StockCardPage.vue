<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useStockCard } from '@/api/useInventory'
import { useWarehousesLookup } from '@/api/useWarehouses'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Select, Input, ResponsiveTable, Badge, type ResponsiveColumn } from '@/components/ui'
import { ArrowLeft, Package, TrendingUp, TrendingDown, RefreshCw } from 'lucide-vue-next'

const route = useRoute()
const productId = computed(() => route.params.id as string)

// Filters
const warehouseId = ref<number | undefined>(undefined)
const startDate = ref('')
const endDate = ref('')

// Fetch data
const { data: stockCard, isLoading, error, refetch } = useStockCard(
  productId,
  warehouseId,
  ref(startDate.value || undefined),
  ref(endDate.value || undefined)
)

// Warehouses for filter
const { data: warehouses } = useWarehousesLookup()
const warehouseOptions = computed(() => [
  { value: '', label: 'All Warehouses' },
  ...(warehouses.value?.map(w => ({ value: String(w.id), label: w.name })) ?? []),
])

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'date', label: 'Date', mobilePriority: 1 },
  { key: 'type', label: 'Type', mobilePriority: 2 },
  { key: 'reference', label: 'Reference', showInMobile: false },
  { key: 'in', label: 'In', align: 'right', mobilePriority: 3 },
  { key: 'out', label: 'Out', align: 'right', mobilePriority: 4 },
  { key: 'balance', label: 'Balance', align: 'right', showInMobile: false },
  { key: 'unit_cost', label: 'Unit Cost', align: 'right', showInMobile: false },
]

// Movement type badge
function getTypeVariant(type: string): 'default' | 'success' | 'destructive' | 'secondary' {
  const inTypes = ['stock_in', 'grn', 'purchase_return', 'adjustment_in', 'transfer_in']
  const outTypes = ['stock_out', 'delivery', 'sales_return', 'adjustment_out', 'transfer_out']

  if (inTypes.includes(type)) return 'success'
  if (outTypes.includes(type)) return 'destructive'
  return 'secondary'
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    stock_in: 'Stock In',
    stock_out: 'Stock Out',
    grn: 'Goods Receipt',
    delivery: 'Delivery',
    adjustment_in: 'Adjustment (+)',
    adjustment_out: 'Adjustment (-)',
    transfer_in: 'Transfer In',
    transfer_out: 'Transfer Out',
    purchase_return: 'Purchase Return',
    sales_return: 'Sales Return',
  }
  return labels[type] || type
}

function handleWarehouseChange(value: string | number | null) {
  warehouseId.value = value ? Number(value) : undefined
  refetch()
}

function handleDateChange() {
  refetch()
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <RouterLink to="/inventory">
        <Button variant="ghost" size="sm">
          <ArrowLeft class="w-4 h-4" />
        </Button>
      </RouterLink>
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Stock Card</h1>
        <p class="text-slate-500 dark:text-slate-400">View movement history for a product</p>
      </div>
    </div>

    <!-- Loading -->
    <Card v-if="isLoading" class="text-center py-12">
      <RefreshCw class="w-8 h-8 mx-auto animate-spin text-slate-400" />
      <p class="mt-2 text-slate-500 dark:text-slate-400">Loading...</p>
    </Card>

    <!-- Error -->
    <Card v-else-if="error" class="text-center py-12">
      <p class="text-red-500">Failed to load stock card</p>
    </Card>

    <!-- Content -->
    <template v-else-if="stockCard">
      <!-- Product Info -->
      <Card class="mb-6">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Package class="w-6 h-6 text-slate-400" />
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {{ stockCard.product.name }}
            </h2>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              SKU: {{ stockCard.product.sku }} • Unit: {{ stockCard.product.unit }}
            </p>
          </div>
          <div class="text-right">
            <div class="text-sm text-slate-500 dark:text-slate-400">Current Stock</div>
            <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ stockCard.product.current_stock }} {{ stockCard.product.unit }}
            </div>
          </div>
        </div>
      </Card>

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
            <Input
              v-model="startDate"
              type="date"
              @change="handleDateChange"
            />
          </div>
          <div class="w-40">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
            <Input
              v-model="endDate"
              type="date"
              @change="handleDateChange"
            />
          </div>
        </div>
      </Card>

      <!-- Movements Table -->
      <Card :padding="false">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Movement History</h2>
        </div>

        <div v-if="stockCard.movements.length === 0" class="text-center py-12">
          <Package class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p class="text-slate-500 dark:text-slate-400">No movements found</p>
        </div>

        <ResponsiveTable
          v-else
          :items="stockCard.movements"
          :columns="columns"
          title-field="reference"
        >
          <template #cell-date="{ item }">
            <span class="text-slate-900 dark:text-slate-100">{{ formatDate(item.movement_date) }}</span>
          </template>

          <template #cell-type="{ item }">
            <Badge :variant="getTypeVariant(item.type)">
              {{ item.type_label || getTypeLabel(item.type) }}
            </Badge>
          </template>

          <template #cell-reference="{ item }">
            <span class="text-slate-600 dark:text-slate-400">{{ item.movement_number || '-' }}</span>
          </template>

          <template #cell-in="{ item }">
            <span v-if="item.quantity > 0" class="font-mono text-green-600 dark:text-green-400 flex items-center justify-end gap-1">
              <TrendingUp class="w-3.5 h-3.5" />
              {{ item.quantity }}
            </span>
            <span v-else class="text-slate-400">-</span>
          </template>

          <template #cell-out="{ item }">
            <span v-if="item.quantity < 0" class="font-mono text-red-600 dark:text-red-400 flex items-center justify-end gap-1">
              <TrendingDown class="w-3.5 h-3.5" />
              {{ Math.abs(item.quantity) }}
            </span>
            <span v-else class="text-slate-400">-</span>
          </template>

          <template #cell-balance="{ item }">
            <span class="font-mono text-slate-900 dark:text-slate-100">{{ item.quantity_after }}</span>
          </template>

          <template #cell-unit_cost="{ item }">
            <span class="font-mono text-slate-600 dark:text-slate-400">{{ formatCurrency(item.unit_cost) }}</span>
          </template>

          <template #mobile-title="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.movement_number || item.type_label }}</span>
          </template>

          <template #mobile-status="{ item }">
            <Badge :variant="getTypeVariant(item.type)">
              {{ item.type_label || getTypeLabel(item.type) }}
            </Badge>
          </template>
        </ResponsiveTable>
      </Card>
    </template>
  </div>
</template>
