<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  useBudgets,
  useDeleteBudget,
  useApproveBudget,
  useCloseBudget,
  type Budget,
  type BudgetFilters,
} from '@/api/useBudgets'
import { useFiscalPeriodsLookup } from '@/api/useFiscalPeriods'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency } from '@/utils/format'
import { Button, Card, Input, Modal, Select, Pagination, useToast, ResponsiveTable, Badge, type ResponsiveColumn } from '@/components/ui'
import { Plus, FileText, CheckCircle, Archive, Trash2 } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

// Fiscal periods for filter dropdown
const { data: fiscalPeriods } = useFiscalPeriodsLookup()

const fiscalPeriodOptions = computed(() => [
  { value: '', label: 'All Periods' },
  ...(fiscalPeriods.value?.map(p => ({
    value: String(p.id),
    label: p.name,
  })) ?? []),
])

// Resource list with filters and pagination
const {
  items: budgets,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<Budget, BudgetFilters>({
  useListHook: useBudgets,
  initialFilters: {
    page: 1,
    per_page: 20,
    search: '',
    status: undefined,
    fiscal_period_id: undefined,
  },
})

// Status options
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'closed', label: 'Closed' },
]

function handleStatusChange(value: string | number | null) {
  updateFilter('status', value ? String(value) as 'draft' | 'approved' | 'closed' : undefined)
}

function handleFiscalPeriodChange(value: string | number | null) {
  updateFilter('fiscal_period_id', value ? Number(value) : undefined)
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'name', label: 'Budget Name', mobilePriority: 1 },
  { key: 'fiscal_period', label: 'Fiscal Period', mobilePriority: 2 },
  { key: 'type', label: 'Type', showInMobile: false },
  { key: 'net_budget', label: 'Net Budget', align: 'right', mobilePriority: 3 },
  { key: 'status', label: 'Status', mobilePriority: 4 },
]

// Mutations
const deleteMutation = useDeleteBudget()
const approveMutation = useApproveBudget()
const closeMutation = useCloseBudget()

// Modal states
const showDeleteModal = ref(false)
const showApproveModal = ref(false)
const showCloseModal = ref(false)
const selectedBudget = ref<Budget | null>(null)

function openDeleteModal(budget: Budget) {
  selectedBudget.value = budget
  showDeleteModal.value = true
}

function openApproveModal(budget: Budget) {
  selectedBudget.value = budget
  showApproveModal.value = true
}

function openCloseModal(budget: Budget) {
  selectedBudget.value = budget
  showCloseModal.value = true
}

async function handleDelete() {
  if (!selectedBudget.value) return

  try {
    await deleteMutation.mutateAsync(selectedBudget.value.id)
    showDeleteModal.value = false
    selectedBudget.value = null
    toast.success('Budget deleted')
  } catch {
    toast.error('Failed to delete budget')
  }
}

async function handleApprove() {
  if (!selectedBudget.value) return

  try {
    await approveMutation.mutateAsync(selectedBudget.value.id)
    showApproveModal.value = false
    selectedBudget.value = null
    toast.success('Budget approved')
  } catch {
    toast.error('Failed to approve budget')
  }
}

async function handleClose() {
  if (!selectedBudget.value) return

  try {
    await closeMutation.mutateAsync(selectedBudget.value.id)
    showCloseModal.value = false
    selectedBudget.value = null
    toast.success('Budget closed')
  } catch {
    toast.error('Failed to close budget')
  }
}

// Navigate to detail
function viewBudget(budget: Budget) {
  router.push(`/accounting/budgets/${budget.id}`)
}

// Status badge helper
function getStatusVariant(status: string): 'default' | 'success' | 'secondary' {
  switch (status) {
    case 'draft': return 'secondary'
    case 'approved': return 'success'
    case 'closed': return 'default'
    default: return 'default'
  }
}

// Budget type label
function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    annual: 'Annual',
    quarterly: 'Quarterly',
    monthly: 'Monthly',
  }
  return labels[type] || type
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Budgets</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage budgets and track performance</p>
      </div>
      <RouterLink to="/accounting/budgets/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Budget
        </Button>
      </RouterLink>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search budgets..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>

        <!-- Status Filter -->
        <div class="w-40">
          <Select
            :model-value="filters.status ?? ''"
            :options="statusOptions"
            placeholder="All Status"
            @update:model-value="handleStatusChange"
          />
        </div>

        <!-- Fiscal Period Filter -->
        <div class="w-48">
          <Select
            :model-value="filters.fiscal_period_id ? String(filters.fiscal_period_id) : ''"
            :options="fiscalPeriodOptions"
            placeholder="All Periods"
            @update:model-value="handleFiscalPeriodChange"
          />
        </div>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-if="error" class="text-center py-8">
      <p class="text-red-500">Failed to load budgets</p>
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
      <FileText class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No budgets found</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Create your first budget to start tracking expenses
      </p>
      <RouterLink to="/accounting/budgets/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Create Budget
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="budgets"
        :columns="columns"
        :loading="isLoading"
        title-field="name"
        @row-click="viewBudget"
      >
        <!-- Budget Name -->
        <template #cell-name="{ item }">
          <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</div>
          <div v-if="item.description" class="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
            {{ item.description }}
          </div>
        </template>

        <!-- Fiscal Period -->
        <template #cell-fiscal_period="{ item }">
          <span class="text-slate-600 dark:text-slate-400">
            {{ item.fiscal_period?.name ?? '-' }}
          </span>
        </template>

        <!-- Type -->
        <template #cell-type="{ item }">
          <span class="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {{ getTypeLabel(item.type) }}
          </span>
        </template>

        <!-- Net Budget -->
        <template #cell-net_budget="{ item }">
          <span
            class="font-mono"
            :class="item.net_budget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ formatCurrency(item.net_budget) }}
          </span>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <Badge :variant="getStatusVariant(item.status.value)">
            {{ item.status.label }}
          </Badge>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <Badge :variant="getStatusVariant(item.status.value)">
            {{ item.status.label }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-2">
            <!-- Approve Button (for draft) -->
            <Button
              v-if="item.status.value === 'draft'"
              variant="ghost"
              size="xs"
              @click.stop="openApproveModal(item)"
            >
              <CheckCircle class="w-3.5 h-3.5 mr-1" />
              Approve
            </Button>

            <!-- Close Button (for approved) -->
            <Button
              v-if="item.status.value === 'approved'"
              variant="ghost"
              size="xs"
              @click.stop="openCloseModal(item)"
            >
              <Archive class="w-3.5 h-3.5 mr-1" />
              Close
            </Button>

            <!-- Delete Button (only for draft) -->
            <Button
              v-if="item.status.value === 'draft'"
              variant="ghost"
              size="xs"
              @click.stop="openDeleteModal(item)"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </Button>

            <!-- View Button -->
            <Button variant="ghost" size="xs" @click.stop="viewBudget(item)">
              View
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
    </Card>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Budget" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete <strong>{{ selectedBudget?.name }}</strong>?
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

    <!-- Approve Modal -->
    <Modal :open="showApproveModal" title="Approve Budget" size="sm" @update:open="showApproveModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to approve <strong>{{ selectedBudget?.name }}</strong>?
        Once approved, the budget can no longer be edited.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showApproveModal = false">Cancel</Button>
        <Button
          :loading="approveMutation.isPending.value"
          @click="handleApprove"
        >
          <CheckCircle class="w-4 h-4 mr-2" />
          Approve
        </Button>
      </template>
    </Modal>

    <!-- Close Modal -->
    <Modal :open="showCloseModal" title="Close Budget" size="sm" @update:open="showCloseModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to close <strong>{{ selectedBudget?.name }}</strong>?
        This is a final action and cannot be reversed.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showCloseModal = false">Cancel</Button>
        <Button
          :loading="closeMutation.isPending.value"
          @click="handleClose"
        >
          <Archive class="w-4 h-4 mr-2" />
          Close Budget
        </Button>
      </template>
    </Modal>
  </div>
</template>
