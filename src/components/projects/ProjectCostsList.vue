<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useAddProjectCost,
  useUpdateProjectCost,
  useDeleteProjectCost,
  type ProjectCost,
  type CreateProjectCostData,
} from '@/api/useProjects'
import { Button, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'
import { Plus, Edit, Trash2 } from 'lucide-vue-next'
import ProjectCostModal from './ProjectCostModal.vue'
import type { ProjectCostFormData } from '@/utils/validation'

interface Props {
  projectId: number | string
  costs: ProjectCost[]
}

const props = defineProps<Props>()

const toast = useToast()

// Mutations
const addMutation = useAddProjectCost()
const updateMutation = useUpdateProjectCost()
const deleteMutation = useDeleteProjectCost()

// Modal state
const showModal = ref(false)
const editingCost = ref<ProjectCost | null>(null)

// Cost type labels
const costTypeLabels: Record<string, string> = {
  material: 'Material',
  labor: 'Labor',
  subcontractor: 'Subcontractor',
  equipment: 'Equipment',
  overhead: 'Overhead',
  other: 'Other',
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'cost_type', label: 'Type', mobilePriority: 2 },
  { key: 'description', label: 'Description', mobilePriority: 1 },
  { key: 'quantity', label: 'Qty', align: 'right', showInMobile: false },
  { key: 'unit_cost', label: 'Unit Cost', align: 'right', showInMobile: false },
  { key: 'total_cost', label: 'Total', align: 'right', mobilePriority: 2 },
  { key: 'cost_date', label: 'Date', showInMobile: false },
  { key: 'actions', label: '', align: 'right', mobilePriority: 3 },
]

// Computed total
const totalCosts = computed(() => {
  return props.costs.reduce((sum, cost) => sum + (cost.total_cost || 0), 0)
})

const isLoading = computed(() =>
  addMutation.isPending.value ||
  updateMutation.isPending.value
)

function openAddModal() {
  editingCost.value = null
  showModal.value = true
}

function openEditModal(cost: ProjectCost) {
  editingCost.value = cost
  showModal.value = true
}

async function handleSubmit(data: ProjectCostFormData) {
  try {
    const payload: CreateProjectCostData = {
      type: data.type,
      description: data.description,
      quantity: data.quantity ?? undefined,
      unit: data.unit || undefined,
      unit_cost: data.unit_cost,
      date: data.date || undefined,
      notes: data.notes || undefined,
    }

    if (editingCost.value) {
      await updateMutation.mutateAsync({
        projectId: props.projectId,
        costId: editingCost.value.id,
        data: payload,
      })
      toast.success('Cost updated')
    } else {
      await addMutation.mutateAsync({
        projectId: props.projectId,
        data: payload,
      })
      toast.success('Cost added')
    }
    showModal.value = false
    editingCost.value = null
  } catch {
    toast.error(editingCost.value ? 'Failed to update cost' : 'Failed to add cost')
  }
}

async function handleDelete(cost: ProjectCost) {
  if (!confirm(`Delete "${cost.description}"?`)) return

  try {
    await deleteMutation.mutateAsync({
      projectId: props.projectId,
      costId: cost.id,
    })
    toast.success('Cost deleted')
  } catch {
    toast.error('Failed to delete cost')
  }
}
</script>

<template>
  <div>
    <!-- Header with Add button -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <span class="text-sm text-muted-foreground">{{ costs.length }} cost{{ costs.length !== 1 ? 's' : '' }}</span>
        <span v-if="costs.length > 0" class="text-sm text-muted-foreground ml-2">
          · Total: <span class="font-medium text-foreground">{{ formatCurrency(totalCosts) }}</span>
        </span>
      </div>
      <Button size="sm" @click="openAddModal">
        <Plus class="w-4 h-4 mr-2" />
        Add Cost
      </Button>
    </div>

    <!-- Empty state -->
    <div v-if="costs.length === 0" class="text-center py-8 text-muted-foreground">
      <p>No costs recorded yet.</p>
      <p class="text-sm mt-1">Add costs to track project expenses.</p>
    </div>

    <!-- Costs table -->
    <ResponsiveTable
      v-else
      :items="costs"
      :columns="columns"
      title-field="description"
    >
      <template #cell-cost_type="{ item }">
        <span class="text-sm font-medium text-slate-900 dark:text-slate-100">
          {{ costTypeLabels[item.cost_type] || item.cost_type }}
        </span>
      </template>

      <template #cell-description="{ item }">
        <div class="text-sm text-slate-900 dark:text-slate-100">{{ item.description }}</div>
        <div v-if="item.notes" class="text-xs text-muted-foreground truncate max-w-[200px]">{{ item.notes }}</div>
      </template>

      <template #cell-quantity="{ item }">
        <span class="text-sm text-slate-900 dark:text-slate-100">{{ item.quantity }} {{ item.unit }}</span>
      </template>

      <template #cell-unit_cost="{ item }">
        <span class="text-sm text-slate-900 dark:text-slate-100">{{ formatCurrency(item.unit_cost) }}</span>
      </template>

      <template #cell-total_cost="{ item }">
        <span class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(item.total_cost) }}</span>
      </template>

      <template #cell-cost_date="{ item }">
        <span class="text-sm text-slate-500 dark:text-slate-400">{{ formatDate(item.cost_date) }}</span>
      </template>

      <template #cell-actions="{ item }">
        <div class="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" @click="openEditModal(item)">
            <Edit class="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="text-red-500 hover:text-red-600"
            :loading="deleteMutation.isPending.value"
            @click="handleDelete(item)"
          >
            <Trash2 class="w-4 h-4" />
          </Button>
        </div>
      </template>

      <template #mobile-title="{ item }">
        <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.description }}</span>
      </template>
    </ResponsiveTable>

    <!-- Cost Modal -->
    <ProjectCostModal
      :open="showModal"
      :cost="editingCost"
      :is-loading="isLoading"
      @update:open="showModal = $event"
      @submit="handleSubmit"
    />
  </div>
</template>
