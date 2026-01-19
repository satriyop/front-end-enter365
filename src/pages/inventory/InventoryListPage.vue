<script setup lang="ts">
import { useStockLevels, type ProductStock, type InventoryFilters } from '@/api/useInventory'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Pagination, EmptyState, Badge, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

// Resource list with filters and pagination
const {
  items: stocks,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<ProductStock, InventoryFilters>({
  useListHook: useStockLevels,
  initialFilters: {
    page: 1,
    per_page: 10,
    search: '',
  },
})

function getStockLevel(quantity: number): 'success' | 'warning' | 'destructive' {
  if (quantity <= 0) return 'destructive'
  if (quantity < 10) return 'warning'
  return 'success'
}

// Table columns with mobile priorities
const columns: ResponsiveColumn[] = [
  { key: 'product.sku', label: 'SKU', mobilePriority: 3 },
  { key: 'product.name', label: 'Product', mobilePriority: 1 },
  { key: 'warehouse.name', label: 'Warehouse', showInMobile: false },
  { key: 'quantity', label: 'Quantity', align: 'right', mobilePriority: 2 },
  { key: 'average_cost', label: 'Avg Cost', align: 'right', showInMobile: false, format: (v) => formatCurrency(v as number) },
  { key: 'total_value', label: 'Value', align: 'right', mobilePriority: 4, format: (v) => formatCurrency(v as number) },
  { key: 'level', label: 'Level', showInMobile: false },
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Stock</h1>
        <p class="text-slate-500 dark:text-slate-400">View inventory levels across warehouses</p>
      </div>
      <div class="flex gap-2">
        <RouterLink to="/inventory/movements">
          <Button variant="secondary">Stock Movements</Button>
        </RouterLink>
        <RouterLink to="/inventory/adjust">
          <Button>Adjust Stock</Button>
        </RouterLink>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search by product name, SKU..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500 dark:text-red-400">Failed to load inventory</p>
    </div>

    <div v-else-if="isLoading" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <div v-else-if="isEmpty" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No stock data"
        description="Stock will appear here when products are added to inventory"
      />
    </div>

    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <ResponsiveTable
        :items="stocks"
        :columns="columns"
        :loading="isLoading"
        title-field="product.name"
        subtitle-field="product.sku"
        @row-click="(item) => $router.push(`/products/${item.product_id}`)"
      >
        <!-- Custom cell: SKU -->
        <template #cell-product\.sku="{ item }">
          <span class="font-mono text-sm text-slate-600 dark:text-slate-400">{{ item.product?.sku }}</span>
        </template>

        <!-- Custom cell: Product name -->
        <template #cell-product\.name="{ item }">
          <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">
            {{ item.product?.name }}
          </span>
        </template>

        <!-- Custom cell: Warehouse -->
        <template #cell-warehouse\.name="{ item }">
          {{ item.warehouse?.name ?? 'Default' }}
        </template>

        <!-- Custom cell: Quantity -->
        <template #cell-quantity="{ item }">
          {{ item.quantity }} {{ item.product?.unit }}
        </template>

        <!-- Custom cell: Level badge -->
        <template #cell-level="{ item }">
          <Badge :variant="getStockLevel(item.quantity)">
            {{ item.quantity <= 0 ? 'Out' : item.quantity < 10 ? 'Low' : 'OK' }}
          </Badge>
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ item.product?.name }}
          </span>
        </template>

        <!-- Mobile status slot -->
        <template #mobile-status="{ item }">
          <Badge :variant="getStockLevel(item.quantity)">
            {{ item.quantity <= 0 ? 'Out' : item.quantity < 10 ? 'Low' : 'OK' }}
          </Badge>
        </template>
      </ResponsiveTable>

      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :per-page="pagination.per_page"
          @page-change="goToPage"
        />
      </div>
    </div>
  </div>
</template>
