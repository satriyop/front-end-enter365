<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useAddProjectRevenue,
  useUpdateProjectRevenue,
  useDeleteProjectRevenue,
  type ProjectRevenue,
  type CreateProjectRevenueData,
} from '@/api/useProjects'
import { Button, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'
import { Plus, Edit, Trash2, FileText, Wallet } from 'lucide-vue-next'
import ProjectRevenueModal from './ProjectRevenueModal.vue'
import type { ProjectRevenueFormData } from '@/utils/validation'

interface Props {
  projectId: number | string
  revenues: ProjectRevenue[]
}

const props = defineProps<Props>()

const toast = useToast()

// Mutations
const addMutation = useAddProjectRevenue()
const updateMutation = useUpdateProjectRevenue()
const deleteMutation = useDeleteProjectRevenue()

// Modal state
const showModal = ref(false)
const editingRevenue = ref<ProjectRevenue | null>(null)

// Revenue type labels
const revenueTypeLabels: Record<string, string> = {
  invoice: 'Invoice',
  down_payment: 'Down Payment',
  milestone: 'Milestone',
  other: 'Other',
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'revenue_type', label: 'Type', mobilePriority: 2 },
  { key: 'description', label: 'Description', mobilePriority: 1 },
  { key: 'amount', label: 'Amount', align: 'right', mobilePriority: 2 },
  { key: 'revenue_date', label: 'Date', showInMobile: false },
  { key: 'link', label: 'Link', showInMobile: false },
  { key: 'actions', label: '', align: 'right', mobilePriority: 3 },
]

// Computed total
const totalRevenues = computed(() => {
  return props.revenues.reduce((sum, rev) => sum + (rev.amount || 0), 0)
})

const isLoading = computed(() =>
  addMutation.isPending.value ||
  updateMutation.isPending.value
)

function openAddModal() {
  editingRevenue.value = null
  showModal.value = true
}

function openEditModal(revenue: ProjectRevenue) {
  editingRevenue.value = revenue
  showModal.value = true
}

async function handleSubmit(data: ProjectRevenueFormData) {
  try {
    const payload: CreateProjectRevenueData = {
      type: data.type,
      description: data.description,
      amount: data.amount,
      date: data.date || undefined,
      notes: data.notes || undefined,
    }

    if (editingRevenue.value) {
      await updateMutation.mutateAsync({
        projectId: props.projectId,
        revenueId: editingRevenue.value.id,
        data: payload,
      })
      toast.success('Revenue updated')
    } else {
      await addMutation.mutateAsync({
        projectId: props.projectId,
        data: payload,
      })
      toast.success('Revenue added')
    }
    showModal.value = false
    editingRevenue.value = null
  } catch {
    toast.error(editingRevenue.value ? 'Failed to update revenue' : 'Failed to add revenue')
  }
}

async function handleDelete(revenue: ProjectRevenue) {
  if (!confirm(`Delete "${revenue.description}"?`)) return

  try {
    await deleteMutation.mutateAsync({
      projectId: props.projectId,
      revenueId: revenue.id,
    })
    toast.success('Revenue deleted')
  } catch {
    toast.error('Failed to delete revenue')
  }
}
</script>

<template>
  <div>
    <!-- Header with Add button -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <span class="text-sm text-muted-foreground">{{ revenues.length }} revenue{{ revenues.length !== 1 ? 's' : '' }}</span>
        <span v-if="revenues.length > 0" class="text-sm text-muted-foreground ml-2">
          · Total: <span class="font-medium text-green-600 dark:text-green-400">{{ formatCurrency(totalRevenues) }}</span>
        </span>
      </div>
      <Button size="sm" @click="openAddModal">
        <Plus class="w-4 h-4 mr-2" />
        Add Revenue
      </Button>
    </div>

    <!-- Empty state -->
    <div v-if="revenues.length === 0" class="text-center py-8 text-muted-foreground">
      <p>No revenues recorded yet.</p>
      <p class="text-sm mt-1">Add revenues to track project income.</p>
    </div>

    <!-- Revenues table -->
    <ResponsiveTable
      v-else
      :items="revenues"
      :columns="columns"
      title-field="description"
    >
      <template #cell-revenue_type="{ item }">
        <span class="text-sm font-medium text-slate-900 dark:text-slate-100">
          {{ revenueTypeLabels[item.revenue_type] || item.revenue_type }}
        </span>
      </template>

      <template #cell-description="{ item }">
        <div class="text-sm text-slate-900 dark:text-slate-100">{{ item.description }}</div>
        <div v-if="item.notes" class="text-xs text-muted-foreground truncate max-w-[200px]">{{ item.notes }}</div>
      </template>

      <template #cell-amount="{ item }">
        <span class="text-sm font-medium text-green-600 dark:text-green-400">{{ formatCurrency(item.amount) }}</span>
      </template>

      <template #cell-revenue_date="{ item }">
        <span class="text-sm text-slate-500 dark:text-slate-400">{{ formatDate(item.revenue_date) }}</span>
      </template>

      <template #cell-link="{ item }">
        <div class="flex items-center gap-2">
          <RouterLink
            v-if="item.invoice"
            :to="`/invoices/${item.invoice.id}`"
            class="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <FileText class="w-3 h-3" />
            {{ item.invoice.invoice_number }}
          </RouterLink>
          <RouterLink
            v-else-if="item.down_payment"
            :to="`/finance/down-payments/${item.down_payment.id}`"
            class="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Wallet class="w-3 h-3" />
            {{ item.down_payment.dp_number }}
          </RouterLink>
          <span v-else class="text-sm text-slate-400">-</span>
        </div>
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

    <!-- Revenue Modal -->
    <ProjectRevenueModal
      :open="showModal"
      :revenue="editingRevenue"
      :is-loading="isLoading"
      @update:open="showModal = $event"
      @submit="handleSubmit"
    />
  </div>
</template>
