<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryMovements, type MovementFilters } from '@/api/useInventory'
import { Button, Input, Select, Pagination, EmptyState, Badge, Card } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'

const router = useRouter()

const filters = ref<MovementFilters>({
  page: 1,
  per_page: 25,
  type: '',
  start_date: '',
  end_date: '',
})

const filtersRef = computed(() => filters.value)
const { data, isLoading, error } = useInventoryMovements(filtersRef)

const movements = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'in', label: 'Stock In' },
  { value: 'out', label: 'Stock Out' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
]

function handlePageChange(page: number) {
  filters.value.page = page
}

function getTypeVariant(type: string): 'success' | 'error' | 'warning' | 'info' {
  switch (type) {
    case 'in':
    case 'transfer_in':
      return 'success'
    case 'out':
    case 'transfer_out':
      return 'error'
    case 'adjustment':
      return 'warning'
    default:
      return 'info'
  }
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    in: 'Stock In',
    out: 'Stock Out',
    adjustment: 'Adjustment',
    transfer_in: 'Transfer In',
    transfer_out: 'Transfer Out',
  }
  return labels[type] || type
}

function clearFilters() {
  filters.value = {
    page: 1,
    per_page: 25,
    type: '',
    start_date: '',
    end_date: '',
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Stock Movements</h1>
        <p class="text-slate-500">History of all inventory movements</p>
      </div>
      <div class="flex gap-2">
        <Button variant="ghost" @click="router.push('/inventory')">Back to Stock</Button>
        <RouterLink to="/inventory/adjust">
          <Button variant="primary">New Adjustment</Button>
        </RouterLink>
      </div>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-40">
          <label class="block text-sm font-medium text-slate-700 mb-1">Type</label>
          <Select v-model="filters.type" :options="typeOptions" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
          <Input v-model="filters.start_date" type="date" class="w-40" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">End Date</label>
          <Input v-model="filters.end_date" type="date" class="w-40" />
        </div>
        <Button variant="secondary" size="sm" @click="clearFilters">Clear</Button>
      </div>
    </Card>

    <!-- Loading -->
    <div v-if="isLoading" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <p class="text-red-500">Failed to load movements</p>
    </div>

    <!-- Empty -->
    <div v-else-if="movements.length === 0" class="bg-white rounded-xl border border-slate-200">
      <EmptyState
        title="No movements found"
        description="Stock movements will appear here when inventory changes"
      />
    </div>

    <!-- Movements Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Warehouse</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Qty</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Unit Cost</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Balance</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Notes</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="movement in movements" :key="movement.id" class="hover:bg-slate-50">
            <td class="px-6 py-4 text-sm text-slate-600">
              {{ formatDate(movement.movement_date) }}
            </td>
            <td class="px-6 py-4">
              <RouterLink
                :to="`/products/${movement.product_id}`"
                class="text-orange-600 hover:text-orange-700 font-medium"
              >
                {{ movement.product?.name }}
              </RouterLink>
              <div class="text-xs text-slate-400 font-mono">{{ movement.product?.sku }}</div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">
              {{ movement.warehouse?.name ?? 'Default' }}
            </td>
            <td class="px-6 py-4">
              <Badge :variant="getTypeVariant(movement.type)">
                {{ getTypeLabel(movement.type) }}
              </Badge>
            </td>
            <td class="px-6 py-4 text-right font-mono">
              <span :class="movement.type.includes('out') ? 'text-red-600' : 'text-green-600'">
                {{ movement.type.includes('out') ? '-' : '+' }}{{ movement.quantity }}
              </span>
              <span class="text-slate-400 text-xs"> {{ movement.product?.unit }}</span>
            </td>
            <td class="px-6 py-4 text-right text-sm text-slate-600">
              {{ formatCurrency(movement.unit_cost) }}
            </td>
            <td class="px-6 py-4 text-right font-medium">
              {{ movement.balance_after }} {{ movement.product?.unit }}
            </td>
            <td class="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
              {{ movement.notes || '-' }}
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
