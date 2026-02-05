<script setup lang="ts">
import { 
  useStockOpnames, 
  useDeleteStockOpname,
  type StockOpname, 
  type StockOpnameFilters 
} from '@/api/useStockOpnames'
import { useResourceList } from '@/composables/useResourceList'
import { formatDate } from '@/utils/format'
import { 
  Badge, 
  Button, 
  Input, 
  Select, 
  Pagination, 
  EmptyState, 
  useToast, 
  ResponsiveTable, 
  type ResponsiveColumn 
} from '@/components/ui'
import { Plus, Search, Package } from 'lucide-vue-next'

const toast = useToast()

// Resource list with filters and pagination
const {
  items: opnames,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<StockOpname, StockOpnameFilters>({
  useListHook: useStockOpnames,
  initialFilters: {
    page: 1,
    per_page: 15,
    status: '',
    warehouse_id: undefined,
    search: '',
    include: ['warehouse', 'createdByUser'],
  },
})

const deleteMutation = useDeleteStockOpname()

// Status options
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'counting', label: 'Counting' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'opname_number', label: 'Number', mobilePriority: 1 },
  { key: 'opname_date', label: 'Date', mobilePriority: 3, format: (v) => formatDate(v as string) },
  { key: 'warehouse.name', label: 'Warehouse', mobilePriority: 2 },
  { key: 'status', label: 'Status', mobilePriority: 4 },
  { key: 'total_items', label: 'Items', align: 'right', showInMobile: false },
  { key: 'counting_progress', label: 'Progress', align: 'right', showInMobile: false },
]

async function handleDelete(id: number | string) {
  if (!confirm('Are you sure you want to delete this stock opname?')) return
  
  try {
    await deleteMutation.mutateAsync(id)
    toast.success('Stock opname deleted')
  } catch {
    toast.error('Failed to delete stock opname')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Stock Opname</h1>
        <p class="text-slate-500 dark:text-slate-400">Physical inventory counting and reconciliation</p>
      </div>
      <div class="flex gap-2">
        <RouterLink to="/inventory/opnames/new">
          <Button>
            <Plus class="w-4 h-4 mr-2" />
            New Opname
          </Button>
        </RouterLink>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div class="flex flex-wrap gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[240px] relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            :model-value="filters.search"
            placeholder="Search by number or name..."
            class="pl-10"
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>

        <!-- Status Filter -->
        <div class="w-48">
          <Select
            v-model="filters.status"
            :options="statusOptions"
            placeholder="Filter Status"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg text-red-700 dark:text-red-400">
      Failed to load stock opnames. Please try again.
    </div>

    <!-- Main Content -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading && !opnames.length" class="p-12 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-orange-600 mb-4"></div>
        <p class="text-slate-500">Loading stock opnames...</p>
      </div>

      <!-- Empty State -->
      <EmptyState
        v-else-if="isEmpty"
        title="No stock opnames found"
        description="Start a physical count to reconcile your inventory levels."
        :icon="Package"
      >
        <template #action>
          <RouterLink to="/inventory/opnames/new">
            <Button variant="secondary">Create Stock Opname</Button>
          </RouterLink>
        </template>
      </EmptyState>

      <!-- Table -->
      <template v-else>
        <ResponsiveTable
          :items="opnames"
          :columns="columns"
          @row-click="(item) => $router.push(`/inventory/opnames/${item.id}`)"
        >
          <!-- Custom cell: Number -->
          <template #cell-opname_number="{ item }">
            <span class="font-medium text-orange-600 dark:text-orange-400">
              {{ item.opname_number }}
            </span>
            <div v-if="item.name" class="text-xs text-slate-500 truncate max-w-[200px]">{{ item.name }}</div>
          </template>

          <!-- Custom cell: Warehouse -->
          <template #cell-warehouse\.name="{ item }">
            <div class="flex items-center gap-2">
              <span class="text-slate-900 dark:text-slate-100 font-medium">{{ item.warehouse?.name }}</span>
              <span class="text-xs text-slate-400 font-mono">{{ item.warehouse?.code }}</span>
            </div>
          </template>

          <!-- Custom cell: Status -->
          <template #cell-status="{ item }">
            <Badge :status="item.status.value as any">
              {{ item.status.label }}
            </Badge>
          </template>

          <!-- Custom cell: Progress -->
          <template #cell-counting_progress="{ item }">
            <div class="flex flex-col items-end gap-1">
              <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
                {{ item.total_counted }} / {{ item.total_items }}
              </span>
              <div class="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-orange-500 transition-all duration-500" 
                  :style="{ width: `${item.counting_progress}%` }"
                ></div>
              </div>
            </div>
          </template>

          <!-- Actions -->
          <template #actions="{ item }">
            <div class="flex justify-end gap-2">
              <RouterLink :to="`/inventory/opnames/${item.id}`">
                <Button variant="ghost" size="xs">View</Button>
              </RouterLink>
              <Button 
                v-if="item.can_delete"
                variant="ghost" 
                size="xs" 
                class="text-red-500 hover:text-red-600"
                @click.stop="handleDelete(item.id)"
              >
                Delete
              </Button>
            </div>
          </template>
        </ResponsiveTable>

        <!-- Pagination -->
        <div v-if="pagination" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
          <Pagination
            :current-page="pagination.current_page"
            :total-pages="pagination.last_page"
            :total="pagination.total"
            :per-page="pagination.per_page"
            @page-change="goToPage"
          />
        </div>
      </template>
    </div>
  </div>
</template>
