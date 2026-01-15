<script setup lang="ts">
import { useStockLevels, type ProductStock, type InventoryFilters } from '@/api/useInventory'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Pagination, EmptyState, Badge } from '@/components/ui'
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
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">SKU</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Warehouse</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg Cost</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Level</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          <tr v-for="stock in stocks" :key="stock.id" class="hover:bg-slate-50 dark:hover:bg-slate-800">
            <td class="px-6 py-4">
              <span class="font-mono text-sm text-slate-600 dark:text-slate-400">{{ stock.product?.sku }}</span>
            </td>
            <td class="px-6 py-4 text-slate-900 dark:text-slate-100">
              <RouterLink :to="`/products/${stock.product_id}`" class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300">
                {{ stock.product?.name }}
              </RouterLink>
            </td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400">
              {{ stock.warehouse?.name ?? 'Default' }}
            </td>
            <td class="px-6 py-4 text-right font-medium">
              {{ stock.quantity }} {{ stock.product?.unit }}
            </td>
            <td class="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
              {{ formatCurrency(stock.average_cost) }}
            </td>
            <td class="px-6 py-4 text-right font-medium">
              {{ formatCurrency(stock.total_value) }}
            </td>
            <td class="px-6 py-4">
              <Badge :variant="getStockLevel(stock.quantity)">
                {{ stock.quantity <= 0 ? 'Out' : stock.quantity < 10 ? 'Low' : 'OK' }}
              </Badge>
            </td>
          </tr>
        </tbody>
      </table>

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
