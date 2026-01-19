<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInventoryMovements, type MovementFilters } from '@/api/useInventory'
import { Button, Input, Select, Pagination, EmptyState, Badge, Card, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
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

function getTypeVariant(type: string): 'success' | 'destructive' | 'warning' | 'info' {
  switch (type) {
    case 'in':
    case 'transfer_in':
      return 'success'
    case 'out':
    case 'transfer_out':
      return 'destructive'
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

// Table columns with mobile priorities
const columns: ResponsiveColumn[] = [
  { key: 'movement_date', label: 'Date', mobilePriority: 3, format: (v) => formatDate(v as string) },
  { key: 'product.name', label: 'Product', mobilePriority: 1 },
  { key: 'warehouse.name', label: 'Warehouse', showInMobile: false },
  { key: 'type', label: 'Type', mobilePriority: 4 },
  { key: 'quantity', label: 'Qty', align: 'right', mobilePriority: 2 },
  { key: 'unit_cost', label: 'Unit Cost', align: 'right', showInMobile: false, format: (v) => formatCurrency(v as number) },
  { key: 'balance_after', label: 'Balance', align: 'right', showInMobile: false },
  { key: 'notes', label: 'Notes', showInMobile: false },
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Stock Movements</h1>
        <p class="text-slate-500 dark:text-slate-400">History of all inventory movements</p>
      </div>
      <div class="flex gap-2">
        <Button variant="ghost" @click="router.push('/inventory')">Back to Stock</Button>
        <RouterLink to="/inventory/adjust">
          <Button>New Adjustment</Button>
        </RouterLink>
      </div>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-40">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
          <Select v-model="filters.type" :options="typeOptions" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
          <Input v-model="filters.start_date" type="date" class="w-40" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
          <Input v-model="filters.end_date" type="date" class="w-40" />
        </div>
        <Button variant="secondary" size="sm" @click="clearFilters">Clear</Button>
      </div>
    </Card>

    <!-- Loading -->
    <div v-if="isLoading" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500 dark:text-red-400">Failed to load movements</p>
    </div>

    <!-- Empty -->
    <div v-else-if="movements.length === 0" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No movements found"
        description="Stock movements will appear here when inventory changes"
      />
    </div>

    <!-- Movements Table -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <ResponsiveTable
        :items="movements"
        :columns="columns"
        :loading="isLoading"
        title-field="product.name"
        subtitle-field="product.sku"
        @row-click="(item) => $router.push(`/products/${item.product_id}`)"
      >
        <!-- Custom cell: Product -->
        <template #cell-product\.name="{ item }">
          <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
            {{ item.product?.name }}
          </span>
          <div class="text-xs text-slate-400 dark:text-slate-500 font-mono">{{ item.product?.sku }}</div>
        </template>

        <!-- Custom cell: Warehouse -->
        <template #cell-warehouse\.name="{ item }">
          {{ item.warehouse?.name ?? 'Default' }}
        </template>

        <!-- Custom cell: Type -->
        <template #cell-type="{ item }">
          <Badge :variant="getTypeVariant(item.type)">
            {{ getTypeLabel(item.type) }}
          </Badge>
        </template>

        <!-- Custom cell: Quantity -->
        <template #cell-quantity="{ item }">
          <span :class="item.type.includes('out') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'" class="font-mono">
            {{ item.type.includes('out') ? '-' : '+' }}{{ item.quantity }}
          </span>
          <span class="text-slate-400 dark:text-slate-500 text-xs"> {{ item.product?.unit }}</span>
        </template>

        <!-- Custom cell: Balance -->
        <template #cell-balance_after="{ item }">
          {{ item.balance_after }} {{ item.product?.unit }}
        </template>

        <!-- Custom cell: Notes -->
        <template #cell-notes="{ item }">
          <span class="max-w-xs truncate">{{ item.notes || '-' }}</span>
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ item.product?.name }}
          </span>
        </template>

        <!-- Mobile status slot -->
        <template #mobile-status="{ item }">
          <Badge :variant="getTypeVariant(item.type)">
            {{ getTypeLabel(item.type) }}
          </Badge>
        </template>
      </ResponsiveTable>

      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
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
