<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useWorkOrder,
  useSubWorkOrders,
  useCreateSubWorkOrder,
  useUpdateSubWorkOrder,
  useDeleteSubWorkOrder,
  type SubWorkOrder,
} from '@/api/useWorkOrders'
import { formatDate } from '@/utils/format'
import { Button, Card, Badge, Modal, Input, Textarea, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { ArrowLeft, Plus, Edit, Trash2, RefreshCw, AlertTriangle, Clock } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const workOrderId = computed(() => route.params.id as string)

// Fetch data
const { data: workOrder, isLoading: woLoading } = useWorkOrder(workOrderId)
const { data: subWorkOrders, isLoading, error, refetch } = useSubWorkOrders(workOrderId)

// Mutations
const createMutation = useCreateSubWorkOrder()
const updateMutation = useUpdateSubWorkOrder()
const deleteMutation = useDeleteSubWorkOrder()

// Modal states
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const editingItem = ref<SubWorkOrder | null>(null)
const deletingItem = ref<SubWorkOrder | null>(null)

// Form state
const formData = ref({
  description: '',
  planned_start: '',
  planned_end: '',
  assigned_to: '',
  notes: '',
})

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'sub_wo', label: 'Sub WO', mobilePriority: 1 },
  { key: 'description', label: 'Description', mobilePriority: 2 },
  { key: 'assigned_to', label: 'Assigned To', showInMobile: false },
  { key: 'progress', label: 'Progress', align: 'right', mobilePriority: 3 },
  { key: 'status', label: 'Status', mobilePriority: 4 },
]

function openCreateModal() {
  editingItem.value = null
  formData.value = {
    description: '',
    planned_start: new Date().toISOString().split('T')[0] ?? '',
    planned_end: '',
    assigned_to: '',
    notes: '',
  }
  showFormModal.value = true
}

function openEditModal(item: SubWorkOrder) {
  editingItem.value = item
  formData.value = {
    description: item.description,
    planned_start: item.planned_start,
    planned_end: item.planned_end,
    assigned_to: item.assigned_to || '',
    notes: item.notes || '',
  }
  showFormModal.value = true
}

function openDeleteModal(item: SubWorkOrder) {
  deletingItem.value = item
  showDeleteModal.value = true
}

async function handleSubmit() {
  if (!formData.value.description) {
    toast.error('Description is required')
    return
  }

  try {
    if (editingItem.value) {
      await updateMutation.mutateAsync({
        id: editingItem.value.id,
        data: formData.value,
      })
      toast.success('Sub work order updated')
    } else {
      await createMutation.mutateAsync({
        parentId: workOrderId.value,
        data: formData.value,
      })
      toast.success('Sub work order created')
    }
    showFormModal.value = false
    refetch()
  } catch {
    toast.error('Failed to save sub work order')
  }
}

async function handleDelete() {
  if (!deletingItem.value) return

  try {
    await deleteMutation.mutateAsync(deletingItem.value.id)
    showDeleteModal.value = false
    deletingItem.value = null
    toast.success('Sub work order deleted')
    refetch()
  } catch {
    toast.error('Failed to delete sub work order')
  }
}

function getStatusBadge(status: { value: string; label: string }): 'default' | 'success' | 'secondary' | 'destructive' {
  const statusMap: Record<string, 'default' | 'success' | 'secondary' | 'destructive'> = {
    pending: 'secondary',
    in_progress: 'default',
    completed: 'success',
    cancelled: 'destructive',
  }
  return statusMap[status.value] || 'secondary'
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading || woLoading" class="text-center py-12">
      <RefreshCw class="w-8 h-8 mx-auto animate-spin text-slate-400" />
      <p class="mt-2 text-slate-500 dark:text-slate-400">Loading...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <AlertTriangle class="w-12 h-12 mx-auto text-red-400 mb-3" />
      <p class="text-red-500">Failed to load sub work orders</p>
      <Button variant="ghost" class="mt-4" @click="router.back()">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Go Back
      </Button>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="sm" @click="router.push(`/work-orders/${workOrderId}`)">
            <ArrowLeft class="w-4 h-4" />
          </Button>
          <div>
            <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Sub Work Orders</h1>
            <p class="text-slate-500 dark:text-slate-400">
              {{ workOrder?.wo_number || `WO-${workOrderId}` }}
            </p>
          </div>
        </div>

        <Button @click="openCreateModal">
          <Plus class="w-4 h-4 mr-2" />
          Add Sub Work Order
        </Button>
      </div>

      <!-- Sub Work Orders Table -->
      <Card :padding="false">
        <div v-if="!subWorkOrders || subWorkOrders.length === 0" class="text-center py-12">
          <Clock class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No sub work orders</h3>
          <p class="text-slate-500 dark:text-slate-400 mb-4">
            Break down this work order into smaller tasks
          </p>
          <Button @click="openCreateModal">
            <Plus class="w-4 h-4 mr-2" />
            Add Sub Work Order
          </Button>
        </div>

        <ResponsiveTable
          v-else
          :items="subWorkOrders"
          :columns="columns"
          title-field="sub_wo_number"
        >
          <template #cell-sub_wo="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.sub_wo_number }}</span>
          </template>

          <template #cell-description="{ item }">
            <div class="max-w-xs">
              <div class="text-slate-900 dark:text-slate-100 truncate">{{ item.description }}</div>
              <div v-if="item.planned_start" class="text-xs text-slate-500 dark:text-slate-400">
                {{ formatDate(item.planned_start) }} - {{ formatDate(item.planned_end) }}
              </div>
            </div>
          </template>

          <template #cell-assigned_to="{ item }">
            <span class="text-slate-600 dark:text-slate-400">{{ item.assigned_to || '-' }}</span>
          </template>

          <template #cell-progress="{ item }">
            <div class="flex items-center gap-2">
              <div class="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary-500 rounded-full"
                  :style="{ width: `${item.progress_percent}%` }"
                />
              </div>
              <span class="text-xs text-slate-600 dark:text-slate-400">{{ item.progress_percent }}%</span>
            </div>
          </template>

          <template #cell-status="{ item }">
            <Badge :variant="getStatusBadge(item.status)">
              {{ item.status.label }}
            </Badge>
          </template>

          <template #actions="{ item }">
            <div class="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="xs"
                title="Edit"
                @click.stop="openEditModal(item)"
              >
                <Edit class="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="xs"
                title="Delete"
                @click.stop="openDeleteModal(item)"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </Button>
            </div>
          </template>

          <template #mobile-title="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.sub_wo_number }}</span>
          </template>

          <template #mobile-status="{ item }">
            <Badge :variant="getStatusBadge(item.status)">
              {{ item.status.label }}
            </Badge>
          </template>
        </ResponsiveTable>
      </Card>
    </template>

    <!-- Form Modal -->
    <Modal
      :open="showFormModal"
      :title="editingItem ? 'Edit Sub Work Order' : 'Add Sub Work Order'"
      @update:open="showFormModal = $event"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Description <span class="text-red-500">*</span>
          </label>
          <Textarea v-model="formData.description" placeholder="What needs to be done?" :rows="3" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Planned Start
            </label>
            <Input v-model="formData.planned_start" type="date" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Planned End
            </label>
            <Input v-model="formData.planned_end" type="date" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Assigned To
          </label>
          <Input v-model="formData.assigned_to" placeholder="Person or team responsible" />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes
          </label>
          <Textarea v-model="formData.notes" placeholder="Additional notes..." :rows="2" />
        </div>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showFormModal = false">Cancel</Button>
        <Button
          :loading="createMutation.isPending.value || updateMutation.isPending.value"
          @click="handleSubmit"
        >
          {{ editingItem ? 'Update' : 'Create' }}
        </Button>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Sub Work Order" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete <strong>{{ deletingItem?.sub_wo_number }}</strong>?
        This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="deleteMutation.isPending.value"
          @click="handleDelete"
        >
          <Trash2 class="w-4 h-4 mr-2" />
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
