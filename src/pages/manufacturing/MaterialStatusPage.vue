<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMaterialStatus } from '@/api/useMaterialRequisitions'
import { useWorkOrdersLookup } from '@/api/useWorkOrders'
import { useWarehousesLookup } from '@/api/useWarehouses'
import { Card, Select, ResponsiveTable, Badge, type ResponsiveColumn } from '@/components/ui'
import { RefreshCw, Package, CheckCircle, Clock, AlertCircle } from 'lucide-vue-next'

// Filters
const workOrderId = ref<number | undefined>(undefined)
const warehouseId = ref<number | undefined>(undefined)

// Fetch data
const { data: report, isLoading, error } = useMaterialStatus(workOrderId, warehouseId)

// Lookups for filters
const { data: workOrders } = useWorkOrdersLookup()
const { data: warehouses } = useWarehousesLookup()

const workOrderOptions = computed(() => [
  { value: '', label: 'All Work Orders' },
  ...(workOrders.value?.map(wo => ({ value: String(wo.id), label: wo.wo_number || `WO-${wo.id}` })) ?? []),
])

const warehouseOptions = computed(() => [
  { value: '', label: 'All Warehouses' },
  ...(warehouses.value?.map(w => ({ value: String(w.id), label: w.name })) ?? []),
])

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'product', label: 'Product', mobilePriority: 1 },
  { key: 'work_order', label: 'Work Order', showInMobile: false },
  { key: 'required', label: 'Required', align: 'right', mobilePriority: 2 },
  { key: 'issued', label: 'Issued', align: 'right', mobilePriority: 3 },
  { key: 'pending', label: 'Pending', align: 'right', showInMobile: false },
  { key: 'status', label: 'Status', mobilePriority: 4 },
]

function handleWorkOrderChange(value: string | number | null) {
  workOrderId.value = value ? Number(value) : undefined
}

function handleWarehouseChange(value: string | number | null) {
  warehouseId.value = value ? Number(value) : undefined
}

function getStatusBadge(status: string): { label: string; variant: 'success' | 'secondary' | 'destructive'; icon: typeof CheckCircle } {
  const statuses: Record<string, { label: string; variant: 'success' | 'secondary' | 'destructive'; icon: typeof CheckCircle }> = {
    complete: { label: 'Complete', variant: 'success', icon: CheckCircle },
    partial: { label: 'Partial', variant: 'secondary', icon: Clock },
    pending: { label: 'Pending', variant: 'destructive', icon: AlertCircle },
  }
  const result = statuses[status]
  if (result) return result
  return { label: 'Pending', variant: 'destructive', icon: AlertCircle }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Material Status</h1>
      <p class="text-slate-500 dark:text-slate-400">Track material requisition and issue status</p>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="w-64">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Work Order</label>
          <Select
            :model-value="workOrderId ? String(workOrderId) : ''"
            :options="workOrderOptions"
            placeholder="All Work Orders"
            @update:model-value="handleWorkOrderChange"
          />
        </div>
        <div class="w-48">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Warehouse</label>
          <Select
            :model-value="warehouseId ? String(warehouseId) : ''"
            :options="warehouseOptions"
            placeholder="All Warehouses"
            @update:model-value="handleWarehouseChange"
          />
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
      <p class="text-red-500">Failed to load material status</p>
    </Card>

    <!-- Content -->
    <template v-else-if="report">
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Items</div>
          <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ report.summary.total_items }}
          </div>
        </Card>

        <Card class="text-center border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
          <div class="text-sm text-red-600 dark:text-red-400 mb-1">Pending</div>
          <div class="text-2xl font-bold text-red-700 dark:text-red-400">
            {{ report.summary.pending_items }}
          </div>
        </Card>

        <Card class="text-center border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
          <div class="text-sm text-amber-600 dark:text-amber-400 mb-1">Partial</div>
          <div class="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {{ report.summary.partial_items }}
          </div>
        </Card>

        <Card class="text-center border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
          <div class="text-sm text-green-600 dark:text-green-400 mb-1">Complete</div>
          <div class="text-2xl font-bold text-green-700 dark:text-green-400">
            {{ report.summary.complete_items }}
          </div>
        </Card>
      </div>

      <!-- Status Table -->
      <Card :padding="false">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Material Items</h2>
        </div>

        <div v-if="report.items.length === 0" class="text-center py-12">
          <Package class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p class="text-slate-500 dark:text-slate-400">No material requisitions found</p>
        </div>

        <ResponsiveTable
          v-else
          :items="report.items"
          :columns="columns"
          title-field="product_name"
        >
          <template #cell-product="{ item }">
            <div>
              <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.product_name }}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">{{ item.product_sku }}</div>
            </div>
          </template>

          <template #cell-work_order="{ item }">
            <RouterLink
              :to="`/work-orders/${item.work_order_id}`"
              class="text-primary-600 dark:text-primary-400 hover:underline"
            >
              {{ item.work_order_number }}
            </RouterLink>
          </template>

          <template #cell-required="{ item }">
            <span class="font-mono text-slate-900 dark:text-slate-100">{{ item.required_qty }}</span>
          </template>

          <template #cell-issued="{ item }">
            <span class="font-mono text-green-600 dark:text-green-400">{{ item.issued_qty }}</span>
          </template>

          <template #cell-pending="{ item }">
            <span
              class="font-mono"
              :class="item.pending_qty > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'"
            >
              {{ item.pending_qty }}
            </span>
          </template>

          <template #cell-status="{ item }">
            <Badge :variant="getStatusBadge(item.status).variant">
              {{ getStatusBadge(item.status).label }}
            </Badge>
          </template>

          <template #mobile-title="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.product_name }}</span>
          </template>

          <template #mobile-status="{ item }">
            <Badge :variant="getStatusBadge(item.status).variant">
              {{ getStatusBadge(item.status).label }}
            </Badge>
          </template>
        </ResponsiveTable>
      </Card>
    </template>
  </div>
</template>
