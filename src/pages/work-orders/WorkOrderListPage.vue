<script setup lang="ts">
import { useWorkOrders, useDeleteWorkOrder, type WorkOrderFilters, type WorkOrder } from '@/api/useWorkOrders'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatDate } from '@/utils/format'

const toast = useToast()

// Resource list with filters, pagination, and delete confirmation
const {
  items: workOrders,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
  deleteConfirmation,
} = useResourceList<WorkOrder, WorkOrderFilters>({
  useListHook: useWorkOrders,
  initialFilters: {
    page: 1,
    per_page: 10,
    status: undefined,
    search: '',
  },
})

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'destructive'> = {
  draft: 'default',
  confirmed: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'destructive',
}

// Table columns with mobile priorities
const columns: ResponsiveColumn[] = [
  { key: 'wo_number', label: 'WO #', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'type', label: 'Type', showInMobile: false },
  { key: 'schedule', label: 'Schedule', showInMobile: false },
  { key: 'completion_percentage', label: 'Progress', mobilePriority: 3 },
  { key: 'status', label: 'Status', showInMobile: false },
]

// Delete handling
const deleteMutation = useDeleteWorkOrder()

async function handleDelete() {
  const id = deleteConfirmation.executeDelete()
  if (!id) return

  try {
    await deleteMutation.mutateAsync(id as string)
    toast.success('Work order deleted')
  } catch {
    toast.error('Failed to delete work order')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Work Orders</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage manufacturing and assembly work orders</p>
      </div>
      <RouterLink to="/work-orders/new">
        <Button>
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Work Order
        </Button>
      </RouterLink>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search work orders..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
        <div class="w-40">
          <Select v-model="filters.status" :options="statusOptions" placeholder="All Status" />
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500 dark:text-red-400">Failed to load work orders</p>
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
        title="No work orders found"
        description="Create work orders to track manufacturing tasks"
        action-label="New Work Order"
        @action="$router.push('/work-orders/new')"
      />
    </div>

    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <ResponsiveTable
        :items="workOrders"
        :columns="columns"
        :loading="isLoading"
        title-field="wo_number"
        subtitle-field="name"
        status-field="status"
        @row-click="(item) => $router.push(`/work-orders/${item.id}`)"
      >
        <!-- Custom cell: WO number -->
        <template #cell-wo_number="{ item }">
          <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
            {{ item.wo_number }}
          </span>
        </template>

        <!-- Custom cell: Type badge -->
        <template #cell-type="{ item }">
          <Badge variant="info">{{ item.type }}</Badge>
        </template>

        <!-- Custom cell: Schedule -->
        <template #cell-schedule="{ item }">
          <span class="text-slate-600 dark:text-slate-400 text-sm">
            {{ formatDate(item.planned_start_date) }} - {{ formatDate(item.planned_end_date) }}
          </span>
        </template>

        <!-- Custom cell: Progress -->
        <template #cell-completion_percentage="{ item }">
          <div class="flex items-center gap-2">
            <div class="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-orange-500 rounded-full"
                :style="{ width: item.completion_percentage }"
              />
            </div>
            <span class="text-sm text-slate-600 dark:text-slate-400">{{ item.completion_percentage }}</span>
          </div>
        </template>

        <!-- Custom cell: Status -->
        <template #cell-status="{ item }">
          <Badge :variant="statusColors[item.status] || 'default'">
            {{ item.status.replace('_', ' ') }}
          </Badge>
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ item.wo_number }}
          </span>
        </template>

        <!-- Mobile status slot -->
        <template #mobile-status="{ item }">
          <Badge :variant="statusColors[item.status] || 'default'">
            {{ item.status.replace('_', ' ') }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-2">
            <RouterLink :to="`/work-orders/${item.id}/edit`">
              <Button variant="ghost" size="xs">Edit</Button>
            </RouterLink>
            <Button
              v-if="item.status === 'draft'"
              variant="ghost"
              size="xs"
              class="text-red-500 hover:text-red-600"
              @click.stop="deleteConfirmation.confirmDelete(item.id)"
            >
              Delete
            </Button>
          </div>
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

    <Modal :open="deleteConfirmation.showModal.value" title="Delete Work Order" size="sm" @update:open="deleteConfirmation.showModal.value = $event">
      <p class="text-slate-600 dark:text-slate-400">Are you sure you want to delete this work order?</p>
      <template #footer>
        <Button variant="ghost" @click="deleteConfirmation.cancelDelete()">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
