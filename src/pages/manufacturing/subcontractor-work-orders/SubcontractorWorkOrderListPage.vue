<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useSubcontractorWorkOrders,
  useSubcontractorWorkOrderStatistics,
  getSubcontractorWorkOrderStatus,
  formatSCWONumber,
  type SubcontractorWorkOrder,
  type SubcontractorWorkOrderFilters,
  type SubcontractorWorkOrderStatus,
} from '@/api/useSubcontractorWorkOrders'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency } from '@/utils/format'
import { HardHat, Plus, CheckCircle, Clock, DollarSign } from 'lucide-vue-next'

// UI Components
import { Button, Input, Select, Badge, Card, Pagination, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterGroup from '@/components/ui/FilterGroup.vue'

const router = useRouter()

// Statistics
const { data: stats } = useSubcontractorWorkOrderStatistics()

// Resource list with filters and pagination
const {
  items: workOrders,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<SubcontractorWorkOrder, SubcontractorWorkOrderFilters>({
  useListHook: useSubcontractorWorkOrders,
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
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Handle status filter change
function handleStatusChange(value: string | number | null) {
  updateFilter('status', value === '' ? undefined : (value as SubcontractorWorkOrderStatus))
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'sc_wo_number', label: 'SCWO #', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'subcontractor', label: 'Subcontractor', showInMobile: false },
  { key: 'agreed_amount', label: 'Amount', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(Number(v) || 0) },
  { key: 'completion', label: 'Progress', showInMobile: false },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'actions', label: '', showInMobile: false },
]

// Navigate to detail
function viewSCWO(item: Record<string, unknown>) {
  router.push(`/manufacturing/subcontractor-work-orders/${item.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Subcontractor Work Orders</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage work assigned to subcontractors</p>
      </div>
      <RouterLink to="/manufacturing/subcontractor-work-orders/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Work Order
        </Button>
      </RouterLink>
    </div>

    <!-- Statistics Cards -->
    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <HardHat class="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Active</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ stats.active_count ?? 0 }}
            </p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <CheckCircle class="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Completed</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ stats.completed_this_month ?? 0 }}
            </p>
            <p class="text-xs text-slate-400">This month</p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <DollarSign class="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Total Value</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(stats.total_agreed_amount ?? 0) }}
            </p>
          </div>
        </div>
      </Card>

      <Card class="p-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Clock class="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p class="text-sm text-slate-500 dark:text-slate-400">Invoiced</p>
            <p class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(stats.total_invoiced_amount ?? 0) }}
            </p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input
          :model-value="filters.search"
          placeholder="Search SCWO number, name, subcontractor..."
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
      <p class="text-red-500">Failed to load subcontractor work orders</p>
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
      <HardHat class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No subcontractor work orders found</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Create a work order to assign work to a subcontractor
      </p>
      <RouterLink to="/manufacturing/subcontractor-work-orders/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Create Work Order
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="workOrders"
        :columns="columns"
        :loading="isLoading"
        title-field="sc_wo_number"
        subtitle-field="name"
        @row-click="viewSCWO"
      >
        <!-- SCWO Number -->
        <template #cell-sc_wo_number="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatSCWONumber(item as SubcontractorWorkOrder) }}
          </span>
        </template>

        <!-- Name -->
        <template #cell-name="{ item }">
          <span class="font-medium text-slate-900 dark:text-slate-100">
            {{ (item as SubcontractorWorkOrder).name }}
          </span>
        </template>

        <!-- Subcontractor -->
        <template #cell-subcontractor="{ item }">
          <span v-if="(item as SubcontractorWorkOrder).subcontractor" class="text-slate-900 dark:text-slate-100">
            {{ (item as SubcontractorWorkOrder).subcontractor?.name }}
          </span>
          <span v-else class="text-slate-400 italic">Not assigned</span>
        </template>

        <!-- Completion Progress -->
        <template #cell-completion="{ item }">
          <div class="flex items-center gap-2">
            <div class="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden max-w-[80px]">
              <div
                class="h-full bg-primary-500 rounded-full transition-all"
                :style="{ width: `${Number((item as SubcontractorWorkOrder).completion_percentage) || 0}%` }"
              />
            </div>
            <span class="text-sm text-slate-600 dark:text-slate-400">
              {{ Number((item as SubcontractorWorkOrder).completion_percentage) || 0 }}%
            </span>
          </div>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <Badge :class="getSubcontractorWorkOrderStatus(item as SubcontractorWorkOrder).color">
            {{ getSubcontractorWorkOrderStatus(item as SubcontractorWorkOrder).label }}
          </Badge>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="text-primary-600 dark:text-primary-400 font-medium">
            {{ formatSCWONumber(item as SubcontractorWorkOrder) }}
          </span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <Badge :class="getSubcontractorWorkOrderStatus(item as SubcontractorWorkOrder).color">
            {{ getSubcontractorWorkOrderStatus(item as SubcontractorWorkOrder).label }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <Button variant="ghost" size="xs" @click.stop="viewSCWO(item as Record<string, unknown>)">
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
