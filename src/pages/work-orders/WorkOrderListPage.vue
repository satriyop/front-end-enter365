<script setup lang="ts">
import { ref, computed } from 'vue'
import { useWorkOrders, useDeleteWorkOrder, type WorkOrderFilters } from '@/api/useWorkOrders'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast } from '@/components/ui'
import { formatDate } from '@/utils/format'

const toast = useToast()

const filters = ref<WorkOrderFilters>({
  page: 1,
  per_page: 10,
  status: undefined,
  search: '',
})

const { data, isLoading, error } = useWorkOrders(filters)

const workOrders = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

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

function handlePageChange(page: number) {
  filters.value.page = page
}

function handleSearch(value: string | number) {
  filters.value.search = String(value)
  filters.value.page = 1
}

// Delete handling
const deleteMutation = useDeleteWorkOrder()
const showDeleteModal = ref(false)
const woToDelete = ref<string | null>(null)

function confirmDelete(id: string) {
  woToDelete.value = id
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!woToDelete.value) return
  try {
    await deleteMutation.mutateAsync(woToDelete.value)
    showDeleteModal.value = false
    woToDelete.value = null
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
            @update:model-value="handleSearch"
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

    <div v-else-if="workOrders.length === 0" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No work orders found"
        description="Create work orders to track manufacturing tasks"
        action-label="New Work Order"
        @action="$router.push('/work-orders/new')"
      />
    </div>

    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">WO #</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Schedule</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progress</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          <tr v-for="wo in workOrders" :key="wo.id" class="hover:bg-slate-50 dark:hover:bg-slate-800">
            <td class="px-6 py-4">
              <RouterLink :to="`/work-orders/${wo.id}`" class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
                {{ wo.wo_number }}
              </RouterLink>
            </td>
            <td class="px-6 py-4 text-slate-900 dark:text-slate-100">
              {{ wo.name }}
            </td>
            <td class="px-6 py-4">
              <Badge variant="info">{{ wo.type }}</Badge>
            </td>
            <td class="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
              {{ formatDate(wo.planned_start_date) }} - {{ formatDate(wo.planned_end_date) }}
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <div class="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-orange-500 rounded-full"
                    :style="{ width: wo.completion_percentage }"
                  />
                </div>
                <span class="text-sm text-slate-600 dark:text-slate-400">{{ wo.completion_percentage }}</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <Badge :variant="statusColors[wo.status] || 'default'">
                {{ wo.status.replace('_', ' ') }}
              </Badge>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <RouterLink :to="`/work-orders/${wo.id}/edit`">
                  <Button variant="ghost" size="xs">Edit</Button>
                </RouterLink>
                <Button
                  v-if="wo.status === 'draft'"
                  variant="ghost"
                  size="xs"
                  class="text-red-500 hover:text-red-600"
                  @click="confirmDelete(wo.id)"
                >
                  Delete
                </Button>
              </div>
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
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <Modal :open="showDeleteModal" title="Delete Work Order" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">Are you sure you want to delete this work order?</p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
