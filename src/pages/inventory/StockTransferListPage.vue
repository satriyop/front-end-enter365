<script setup lang="ts">
import { useStockTransfers, transferStatusLabel, type StockTransfer, type StockTransferFilters } from '@/api/useStockTransfers'
import { useResourceList } from '@/composables/useResourceList'
import { Badge, Button, Input, Select, Pagination, EmptyState, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatDate } from '@/utils/format'
import { Plus } from 'lucide-vue-next'

const {
  items: transfers,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<StockTransfer, StockTransferFilters>({
  useListHook: useStockTransfers,
  initialFilters: {
    page: 1,
    per_page: 15,
    status: '',
    operation_type: '',
    search: '',
  },
})

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'completed', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

const operationOptions = [
  { value: '', label: 'All operations' },
  { value: 'internal', label: 'Internal' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'delivery', label: 'Delivery' },
]

const columns: ResponsiveColumn[] = [
  { key: 'transfer_number', label: 'Reference', mobilePriority: 1 },
  { key: 'operation_type', label: 'Operation', mobilePriority: 3 },
  { key: 'scheduled_date', label: 'Scheduled', mobilePriority: 4, format: (v) => formatDate(v as string) },
  { key: 'status', label: 'Status', mobilePriority: 2 },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Stock Transfers</h1>
        <p class="text-muted-foreground">Pindah Stok as documents — list, status, multi-line</p>
      </div>
      <RouterLink to="/inventory/transfer/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Transfer
        </Button>
      </RouterLink>
    </div>

    <div class="bg-card rounded-xl border border-border p-4 flex flex-wrap gap-4">
      <div class="flex-1 min-w-[200px]">
        <Input
          :model-value="filters.search"
          placeholder="Search number or source document..."
          @update:model-value="(v) => updateFilter('search', String(v))"
        />
      </div>
      <div class="w-40">
        <Select
          :model-value="filters.status ?? ''"
          :options="statusOptions"
          @update:model-value="(v) => updateFilter('status', String(v))"
        />
      </div>
      <div class="w-44">
        <Select
          :model-value="filters.operation_type ?? ''"
          :options="operationOptions"
          @update:model-value="(v) => updateFilter('operation_type', String(v))"
        />
      </div>
    </div>

    <div v-if="error" class="text-center py-12 text-destructive">Failed to load transfers</div>
    <div v-else-if="isLoading" class="text-center py-12 text-muted-foreground">Loading...</div>
    <EmptyState
      v-else-if="isEmpty"
      title="No transfers yet"
      description="Create a draft transfer with product lines, then mark it Done."
      action-label="New Transfer"
      @action="$router.push('/inventory/transfer/new')"
    />
    <div v-else class="bg-card rounded-xl border border-border overflow-hidden">
      <ResponsiveTable
        :items="transfers"
        :columns="columns"
        @row-click="(item) => $router.push(`/inventory/transfer/${item.id}`)"
      >
        <template #cell-operation_type="{ item }">
          {{ item.operation_type }}
        </template>
        <template #cell-status="{ item }">
          <Badge :status="item.status.value as any">
            {{ transferStatusLabel(item.status.value, item.status.label) }}
          </Badge>
        </template>
      </ResponsiveTable>
      <div v-if="pagination" class="p-4 border-t border-border">
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
