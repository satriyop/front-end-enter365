<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { Button, Input, Pagination, EmptyState, Badge } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

interface ProductStock {
  id: number
  product_id: number
  product?: {
    id: number
    sku: string
    name: string
    unit: string
  }
  warehouse_id: number
  warehouse?: {
    id: number
    name: string
  }
  quantity: number
  average_cost: number
  total_value: number
}

interface Filters {
  page: number
  per_page: number
  search: string
  warehouse_id?: number
}

const filters = ref<Filters>({
  page: 1,
  per_page: 10,
  search: '',
})

const { data, isLoading, error } = useQuery({
  queryKey: ['inventory', filters],
  queryFn: async () => {
    const params = new URLSearchParams()
    const f = filters.value
    if (f.page) params.set('page', String(f.page))
    if (f.per_page) params.set('per_page', String(f.per_page))
    if (f.search) params.set('search', f.search)
    if (f.warehouse_id) params.set('warehouse_id', String(f.warehouse_id))

    const response = await api.get<{
      data: ProductStock[]
      meta: { current_page: number; last_page: number; per_page: number; total: number }
    }>(`/inventory/stock-levels?${params}`)
    return response.data
  },
})

const stocks = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

function handlePageChange(page: number) {
  filters.value.page = page
}

function handleSearch(value: string | number) {
  filters.value.search = String(value)
  filters.value.page = 1
}

function getStockLevel(quantity: number): 'success' | 'warning' | 'error' {
  if (quantity <= 0) return 'error'
  if (quantity < 10) return 'warning'
  return 'success'
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Stock</h1>
        <p class="text-slate-500">View inventory levels across warehouses</p>
      </div>
      <div class="flex gap-2">
        <RouterLink to="/inventory/movements">
          <Button variant="secondary">Stock Movements</Button>
        </RouterLink>
        <RouterLink to="/inventory/adjust">
          <Button variant="primary">Adjust Stock</Button>
        </RouterLink>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search by product name, SKU..."
            @update:model-value="handleSearch"
          />
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <p class="text-red-500">Failed to load inventory</p>
    </div>

    <div v-else-if="isLoading" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <div v-else-if="stocks.length === 0" class="bg-white rounded-xl border border-slate-200">
      <EmptyState
        title="No stock data"
        description="Stock will appear here when products are added to inventory"
      />
    </div>

    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SKU</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Warehouse</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Quantity</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Cost</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Value</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Level</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="stock in stocks" :key="stock.id" class="hover:bg-slate-50">
            <td class="px-6 py-4">
              <span class="font-mono text-sm text-slate-600">{{ stock.product?.sku }}</span>
            </td>
            <td class="px-6 py-4 text-slate-900">
              <RouterLink :to="`/products/${stock.product_id}`" class="text-orange-600 hover:text-orange-700">
                {{ stock.product?.name }}
              </RouterLink>
            </td>
            <td class="px-6 py-4 text-slate-600">
              {{ stock.warehouse?.name ?? 'Default' }}
            </td>
            <td class="px-6 py-4 text-right font-medium">
              {{ stock.quantity }} {{ stock.product?.unit }}
            </td>
            <td class="px-6 py-4 text-right text-slate-600">
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

      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200">
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :per-page="pagination.per_page"
          @page-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>
