<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useMaterialRequisitions,
  getMaterialRequisitionStatus,
  formatMRNumber,
  type MaterialRequisition,
  type MaterialRequisitionFilters,
  type MaterialRequisitionStatus,
} from '@/api/useMaterialRequisitions'
import { useResourceList } from '@/composables/useResourceList'
import { formatDate } from '@/utils/format'
import { ClipboardList, Plus } from 'lucide-vue-next'

// UI Components
import { Button, Input, Select, Badge, Card, Pagination, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterGroup from '@/components/ui/FilterGroup.vue'

const router = useRouter()

// Resource list with filters and pagination
const {
  items: materialRequisitions,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<MaterialRequisition, MaterialRequisitionFilters>({
  useListHook: useMaterialRequisitions,
  initialFilters: {
    page: 1,
    per_page: 20,
    status: undefined,
    search: '',
  },
})

// Status options for filter
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'partial', label: 'Partial Issue' },
  { value: 'issued', label: 'Issued' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Handle status filter change
function handleStatusChange(value: string | number | null) {
  updateFilter('status', value === '' ? undefined : (value as MaterialRequisitionStatus))
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'requisition_number', label: 'MR #', mobilePriority: 1 },
  { key: 'work_order', label: 'Work Order', mobilePriority: 2 },
  { key: 'warehouse', label: 'Warehouse', showInMobile: false },
  { key: 'required_date', label: 'Required Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'total_items', label: 'Items', align: 'center', mobilePriority: 3 },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'actions', label: '', showInMobile: false },
]

// Navigate to detail
function viewMR(item: Record<string, unknown>) {
  router.push(`/manufacturing/material-requisitions/${item.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Material Requisitions</h1>
        <p class="text-slate-500 dark:text-slate-400">Request and track materials for work orders</p>
      </div>
      <RouterLink to="/manufacturing/material-requisitions/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Requisition
        </Button>
      </RouterLink>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input
          :model-value="filters.search"
          placeholder="Search requisition number, work order..."
          @update:model-value="(v) => updateFilter('search', String(v))"
        />
      </FilterGroup>

      <FilterGroup min-width="180px">
        <Select
          :model-value="filters.status || ''"
          :options="statusOptions"
          placeholder="Status"
          @update:model-value="handleStatusChange"
        />
      </FilterGroup>
    </FilterBar>

    <!-- Error State -->
    <Card v-if="error" class="text-center py-8">
      <p class="text-red-500">Failed to load material requisitions</p>
    </Card>

    <!-- Loading State -->
    <Card v-else-if="isLoading" class="text-center py-8">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </Card>

    <!-- Empty State -->
    <Card v-else-if="isEmpty" class="text-center py-12">
      <ClipboardList class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No material requisitions found</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Create a requisition to request materials for a work order
      </p>
      <RouterLink to="/manufacturing/material-requisitions/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Create Requisition
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="materialRequisitions"
        :columns="columns"
        :loading="isLoading"
        title-field="requisition_number"
        @row-click="viewMR"
      >
        <!-- MR Number -->
        <template #cell-requisition_number="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatMRNumber(item as MaterialRequisition) }}
          </span>
        </template>

        <!-- Work Order -->
        <template #cell-work_order="{ item }">
          <div v-if="(item as MaterialRequisition).work_order">
            <div class="font-medium text-slate-900 dark:text-slate-100">
              {{ (item as MaterialRequisition).work_order?.wo_number }}
            </div>
            <div class="text-sm text-slate-500 dark:text-slate-400">
              {{ (item as MaterialRequisition).work_order?.name }}
            </div>
          </div>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- Warehouse -->
        <template #cell-warehouse="{ item }">
          <span v-if="(item as MaterialRequisition).warehouse" class="text-slate-900 dark:text-slate-100">
            {{ (item as MaterialRequisition).warehouse?.name }}
          </span>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- Total Items -->
        <template #cell-total_items="{ item }">
          <span class="text-slate-900 dark:text-slate-100">
            {{ (item as MaterialRequisition).total_items }}
          </span>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <Badge :class="getMaterialRequisitionStatus(item as MaterialRequisition).color">
            {{ getMaterialRequisitionStatus(item as MaterialRequisition).label }}
          </Badge>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatMRNumber(item as MaterialRequisition) }}
          </span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <Badge :class="getMaterialRequisitionStatus(item as MaterialRequisition).color">
            {{ getMaterialRequisitionStatus(item as MaterialRequisition).label }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <Button variant="ghost" size="xs" @click.stop="viewMR(item as Record<string, unknown>)">
            View
          </Button>
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
    </Card>
  </div>
</template>
