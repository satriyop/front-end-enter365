<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useBudget,
  useBudgetComparison,
  useBudgetMonthlyBreakdown,
  useBudgetOverBudget,
  useApproveBudget,
  useReopenBudget,
  useCloseBudget,
  useDeleteBudget,
  useCopyBudget,
  useCreateBudgetLine,
  useUpdateBudgetLine,
  useDeleteBudgetLine,
  type CreateBudgetLineData,
  type UpdateBudgetLineData,
  type BudgetLine,
} from '@/api/useBudgets'
import { useAccountsLookup } from '@/api/useAccounts'
import { useFiscalPeriodsLookup } from '@/api/useFiscalPeriods'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Badge, Modal, Select, FormField, Input, Textarea, useToast } from '@/components/ui'
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Archive,
  RotateCcw,
  Copy,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  BarChart3,
  Plus,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const budgetId = computed(() => route.params.id as string)

// Fetch budget data
const { data: budget, isLoading, error } = useBudget(budgetId)
const { data: comparison } = useBudgetComparison(budgetId)
const { data: monthlyBreakdown } = useBudgetMonthlyBreakdown(budgetId)
const { data: overBudgetAccounts } = useBudgetOverBudget(budgetId)

// Mutations
const approveMutation = useApproveBudget()
const reopenMutation = useReopenBudget()
const closeMutation = useCloseBudget()
const deleteMutation = useDeleteBudget()
const copyMutation = useCopyBudget()

// Budget line mutations
const createLineMutation = useCreateBudgetLine()
const updateLineMutation = useUpdateBudgetLine()
const deleteLineMutation = useDeleteBudgetLine()

// Fiscal periods for copy modal
const { data: fiscalPeriods } = useFiscalPeriodsLookup()
const fiscalPeriodOptions = computed(() =>
  fiscalPeriods.value?.map(p => ({
    value: String(p.id),
    label: p.name,
  })) ?? []
)

// Accounts lookup for line management
const { data: accounts } = useAccountsLookup()
const accountOptions = computed(() =>
  accounts.value?.map(a => ({
    value: String(a.id),
    label: `${a.code} - ${a.name}`,
  })) ?? []
)

// Active tab
const activeTab = ref<'comparison' | 'monthly'>('comparison')

// Modal states
const showApproveModal = ref(false)
const showReopenModal = ref(false)
const showCloseModal = ref(false)
const showDeleteModal = ref(false)
const showCopyModal = ref(false)
const copyTargetPeriodId = ref<string>('')

// Budget line modal states
const showAddLineModal = ref(false)
const showEditLineModal = ref(false)
const showDeleteLineModal = ref(false)
const editingLine = ref<BudgetLine | null>(null)

// Budget line form data
const lineFormData = ref({
  account_id: '',
  annual_amount: '',
  distribute_evenly: false,
  notes: '',
})

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

// Month names
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Actions
async function handleApprove() {
  try {
    await approveMutation.mutateAsync(budgetId.value)
    showApproveModal.value = false
    toast.success('Budget approved')
  } catch {
    toast.error('Failed to approve budget')
  }
}

async function handleReopen() {
  try {
    await reopenMutation.mutateAsync(budgetId.value)
    showReopenModal.value = false
    toast.success('Budget reopened')
  } catch {
    toast.error('Failed to reopen budget')
  }
}

async function handleClose() {
  try {
    await closeMutation.mutateAsync(budgetId.value)
    showCloseModal.value = false
    toast.success('Budget closed')
  } catch {
    toast.error('Failed to close budget')
  }
}

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(budgetId.value)
    showDeleteModal.value = false
    toast.success('Budget deleted')
    router.push('/accounting/budgets')
  } catch {
    toast.error('Failed to delete budget')
  }
}

async function handleCopy() {
  if (!copyTargetPeriodId.value) return

  try {
    const newBudget = await copyMutation.mutateAsync({
      id: budgetId.value,
      fiscalPeriodId: Number(copyTargetPeriodId.value),
    })
    showCopyModal.value = false
    toast.success('Budget copied successfully')
    router.push(`/accounting/budgets/${newBudget.id}`)
  } catch {
    toast.error('Failed to copy budget')
  }
}

// Budget line actions
function openAddLineModal() {
  lineFormData.value = {
    account_id: '',
    annual_amount: '',
    distribute_evenly: false,
    notes: '',
  }
  editingLine.value = null
  showAddLineModal.value = true
}

function openEditLineModal(line: BudgetLine) {
  editingLine.value = line
  lineFormData.value = {
    account_id: String(line.account?.id ?? ''),
    annual_amount: String(line.annual_amount ?? ''),
    distribute_evenly: false,
    notes: line.notes ?? '',
  }
  showEditLineModal.value = true
}

function openDeleteLineModal(line: BudgetLine) {
  editingLine.value = line
  showDeleteLineModal.value = true
}

async function handleCreateLine() {
  if (!lineFormData.value.account_id) return

  try {
    const data: CreateBudgetLineData = {
      account_id: Number(lineFormData.value.account_id),
      annual_amount: lineFormData.value.annual_amount ? Number(lineFormData.value.annual_amount) : undefined,
      notes: lineFormData.value.notes || null,
    }

    await createLineMutation.mutateAsync({ budgetId: budgetId.value, data })
    showAddLineModal.value = false
    toast.success('Budget line added')
  } catch {
    toast.error('Failed to add budget line')
  }
}

async function handleUpdateLine() {
  if (!editingLine.value) return

  try {
    const data: UpdateBudgetLineData = {
      annual_amount: lineFormData.value.annual_amount ? Number(lineFormData.value.annual_amount) : null,
      distribute_evenly: lineFormData.value.distribute_evenly || null,
      notes: lineFormData.value.notes || null,
    }

    await updateLineMutation.mutateAsync({
      budgetId: budgetId.value,
      lineId: editingLine.value.id,
      data,
    })
    showEditLineModal.value = false
    toast.success('Budget line updated')
  } catch {
    toast.error('Failed to update budget line')
  }
}

async function handleDeleteLine() {
  if (!editingLine.value) return

  try {
    await deleteLineMutation.mutateAsync({
      budgetId: budgetId.value,
      lineId: editingLine.value.id,
    })
    showDeleteLineModal.value = false
    toast.success('Budget line deleted')
  } catch {
    toast.error('Failed to delete budget line')
  }
}
</script>

<template>
  <div>
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-red-500">Failed to load budget</p>
      <Button variant="ghost" class="mt-4" @click="router.push('/accounting/budgets')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Budgets
      </Button>
    </div>

    <!-- Content -->
    <div v-else-if="budget">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="sm" @click="router.push('/accounting/budgets')">
            <ArrowLeft class="w-4 h-4" />
          </Button>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ budget.name }}</h1>
              <Badge :variant="getStatusVariant(budget.status.value)">
                {{ budget.status.label }}
              </Badge>
            </div>
            <p class="text-slate-500 dark:text-slate-400">
              {{ budget.fiscal_period?.name }} • {{ getTypeLabel(budget.type) }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <!-- Edit (draft only) -->
          <RouterLink v-if="budget.status.value === 'draft'" :to="`/accounting/budgets/${budget.id}/edit`">
            <Button variant="secondary">
              <Edit class="w-4 h-4 mr-2" />
              Edit
            </Button>
          </RouterLink>

          <!-- Approve (draft only) -->
          <Button v-if="budget.status.value === 'draft'" @click="showApproveModal = true">
            <CheckCircle class="w-4 h-4 mr-2" />
            Approve
          </Button>

          <!-- Reopen (approved only) -->
          <Button v-if="budget.status.value === 'approved'" variant="secondary" @click="showReopenModal = true">
            <RotateCcw class="w-4 h-4 mr-2" />
            Reopen
          </Button>

          <!-- Close (approved only) -->
          <Button v-if="budget.status.value === 'approved'" @click="showCloseModal = true">
            <Archive class="w-4 h-4 mr-2" />
            Close
          </Button>

          <!-- Copy -->
          <Button variant="secondary" @click="showCopyModal = true">
            <Copy class="w-4 h-4 mr-2" />
            Copy
          </Button>

          <!-- Delete (draft only) -->
          <Button v-if="budget.status.value === 'draft'" variant="destructive" @click="showDeleteModal = true">
            <Trash2 class="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card class="text-center">
          <TrendingUp class="w-8 h-8 mx-auto text-green-500 mb-2" />
          <div class="text-sm text-slate-500 dark:text-slate-400">Total Revenue</div>
          <div class="text-xl font-bold text-green-600 dark:text-green-400">
            {{ formatCurrency(budget.total_revenue) }}
          </div>
        </Card>

        <Card class="text-center">
          <TrendingDown class="w-8 h-8 mx-auto text-red-500 mb-2" />
          <div class="text-sm text-slate-500 dark:text-slate-400">Total Expense</div>
          <div class="text-xl font-bold text-red-600 dark:text-red-400">
            {{ formatCurrency(budget.total_expense) }}
          </div>
        </Card>

        <Card class="text-center">
          <BarChart3 class="w-8 h-8 mx-auto text-blue-500 mb-2" />
          <div class="text-sm text-slate-500 dark:text-slate-400">Net Budget</div>
          <div
            class="text-xl font-bold"
            :class="budget.net_budget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ formatCurrency(budget.net_budget) }}
          </div>
        </Card>

        <Card class="text-center">
          <Calendar class="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <div class="text-sm text-slate-500 dark:text-slate-400">Budget Lines</div>
          <div class="text-xl font-bold text-slate-900 dark:text-slate-100">
            {{ budget.lines_count ?? budget.lines?.length ?? 0 }}
          </div>
        </Card>
      </div>

      <!-- Over Budget Alert -->
      <Card
        v-if="overBudgetAccounts && overBudgetAccounts.length > 0"
        class="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
      >
        <div class="flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 class="font-medium text-amber-800 dark:text-amber-200">Over Budget Warning</h3>
            <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
              {{ overBudgetAccounts.length }} account(s) have exceeded their budgeted amounts.
            </p>
            <div class="mt-3 space-y-1">
              <div
                v-for="account in overBudgetAccounts.slice(0, 5)"
                :key="account.account_id"
                class="text-sm text-amber-700 dark:text-amber-300 flex justify-between"
              >
                <span>{{ account.account_code }} - {{ account.account_name }}</span>
                <span class="font-medium">+{{ formatCurrency(account.over_by) }} ({{ account.over_percentage.toFixed(1) }}%)</span>
              </div>
              <p v-if="overBudgetAccounts.length > 5" class="text-sm text-amber-600 dark:text-amber-400">
                ...and {{ overBudgetAccounts.length - 5 }} more
              </p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Tabs -->
      <div class="flex gap-2 border-b border-slate-200 dark:border-slate-700 mb-6">
        <button
          class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'comparison'
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'"
          @click="activeTab = 'comparison'"
        >
          Budget vs Actual
        </button>
        <button
          class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === 'monthly'
            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'"
          @click="activeTab = 'monthly'"
        >
          Monthly Breakdown
        </button>
      </div>

      <!-- Comparison Tab -->
      <Card v-if="activeTab === 'comparison'" :padding="false">
        <div v-if="comparison" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Account</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Budgeted</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Actual</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">Variance</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700 dark:text-slate-300">%</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr
                v-for="row in comparison.comparison"
                :key="row.account_id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800"
                :class="row.is_over_budget ? 'bg-red-50 dark:bg-red-900/10' : ''"
              >
                <td class="px-4 py-3">
                  <span class="font-mono text-slate-500 dark:text-slate-400">{{ row.account_code }}</span>
                  <span class="ml-2 text-slate-900 dark:text-slate-100">{{ row.account_name }}</span>
                </td>
                <td class="text-right px-4 py-3 font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(row.budgeted) }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(row.actual) }}
                </td>
                <td
                  class="text-right px-4 py-3 font-mono"
                  :class="row.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                >
                  {{ row.variance >= 0 ? '+' : '' }}{{ formatCurrency(row.variance) }}
                </td>
                <td
                  class="text-right px-4 py-3 font-mono"
                  :class="row.variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                >
                  {{ row.variance >= 0 ? '+' : '' }}{{ row.variance_percentage.toFixed(1) }}%
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-100 dark:bg-slate-800 font-semibold">
              <tr>
                <td class="px-4 py-3 text-slate-900 dark:text-slate-100">TOTAL</td>
                <td class="text-right px-4 py-3 font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(comparison.totals.total_budgeted) }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(comparison.totals.total_actual) }}
                </td>
                <td
                  class="text-right px-4 py-3 font-mono"
                  :class="comparison.totals.total_variance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                >
                  {{ comparison.totals.total_variance >= 0 ? '+' : '' }}{{ formatCurrency(comparison.totals.total_variance) }}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div v-else class="text-center py-8 text-slate-500 dark:text-slate-400">
          Loading comparison data...
        </div>
      </Card>

      <!-- Monthly Breakdown Tab -->
      <Card v-if="activeTab === 'monthly'" :padding="false">
        <div v-if="monthlyBreakdown" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-slate-700 dark:text-slate-300 sticky left-0 bg-slate-50 dark:bg-slate-800">Account</th>
                <th class="text-right px-3 py-3 font-medium text-slate-700 dark:text-slate-300">Annual</th>
                <th
                  v-for="month in months"
                  :key="month"
                  class="text-right px-3 py-3 font-medium text-slate-700 dark:text-slate-300"
                >
                  {{ month }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr
                v-for="row in monthlyBreakdown.breakdown"
                :key="row.account_id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <td class="px-4 py-3 sticky left-0 bg-white dark:bg-slate-900">
                  <span class="font-mono text-slate-500 dark:text-slate-400">{{ row.account_code }}</span>
                  <span class="ml-2 text-slate-900 dark:text-slate-100">{{ row.account_name }}</span>
                </td>
                <td class="text-right px-3 py-3 font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(row.annual_amount) }}
                </td>
                <td class="text-right px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatCurrency(row.jan) }}
                </td>
                <td class="text-right px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatCurrency(row.feb) }}
                </td>
                <td class="text-right px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatCurrency(row.mar) }}
                </td>
                <td class="text-right px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatCurrency(row.apr) }}
                </td>
                <td class="text-right px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatCurrency(row.may) }}
                </td>
                <td class="text-right px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatCurrency(row.jun) }}
                </td>
                <td class="text-right px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatCurrency(row.jul) }}
                </td>
                <td class="text-right px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatCurrency(row.aug) }}
                </td>
                <td class="text-right px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatCurrency(row.sep) }}
                </td>
                <td class="text-right px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatCurrency(row.oct) }}
                </td>
                <td class="text-right px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatCurrency(row.nov) }}
                </td>
                <td class="text-right px-3 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {{ formatCurrency(row.dec) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-8 text-slate-500 dark:text-slate-400">
          Loading monthly breakdown...
        </div>
      </Card>

      <!-- Budget Lines Section -->
      <Card class="mt-6" :padding="false">
        <div class="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground">Budget Lines</h2>
          <Button v-if="budget.status.value === 'draft'" size="sm" @click="openAddLineModal">
            <Plus class="w-4 h-4 mr-2" />
            Add Line
          </Button>
        </div>
        <div v-if="budget.lines && budget.lines.length > 0" class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-muted-foreground">Account</th>
                <th class="text-right px-4 py-3 font-medium text-muted-foreground">Annual Amount</th>
                <th class="text-left px-4 py-3 font-medium text-muted-foreground">Notes</th>
                <th v-if="budget.status.value === 'draft'" class="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="line in budget.lines"
                :key="line.id"
                class="hover:bg-muted"
              >
                <td class="px-4 py-3">
                  <span class="font-mono text-muted-foreground">{{ line.account?.code }}</span>
                  <span class="ml-2 text-foreground">{{ line.account?.name }}</span>
                </td>
                <td class="text-right px-4 py-3 font-mono text-foreground">
                  {{ formatCurrency(line.annual_amount) }}
                </td>
                <td class="px-4 py-3 text-muted-foreground">
                  {{ line.notes || '-' }}
                </td>
                <td v-if="budget.status.value === 'draft'" class="text-right px-4 py-3">
                  <div class="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="xs" @click="openEditLineModal(line)">
                      <Edit class="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="xs" @click="openDeleteLineModal(line)">
                      <Trash2 class="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-8 text-muted-foreground">
          No budget lines defined
        </div>
      </Card>

      <!-- Notes Section -->
      <Card v-if="budget.notes" class="mt-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Notes</h2>
        <p class="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{{ budget.notes }}</p>
      </Card>

      <!-- Approval Info -->
      <Card v-if="budget.approved_at" class="mt-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Approval Information</h2>
        <div class="text-sm text-slate-600 dark:text-slate-400">
          <p>Approved on {{ formatDate(budget.approved_at) }}</p>
          <p v-if="budget.approved_by">Approved by: {{ budget.approved_by }}</p>
        </div>
      </Card>
    </div>

    <!-- Approve Modal -->
    <Modal :open="showApproveModal" title="Approve Budget" size="sm" @update:open="showApproveModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to approve this budget? Once approved, it can no longer be edited.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showApproveModal = false">Cancel</Button>
        <Button :loading="approveMutation.isPending.value" @click="handleApprove">
          <CheckCircle class="w-4 h-4 mr-2" />
          Approve
        </Button>
      </template>
    </Modal>

    <!-- Reopen Modal -->
    <Modal :open="showReopenModal" title="Reopen Budget" size="sm" @update:open="showReopenModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to reopen this budget? This will change the status back to Draft and allow editing.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showReopenModal = false">Cancel</Button>
        <Button :loading="reopenMutation.isPending.value" @click="handleReopen">
          <RotateCcw class="w-4 h-4 mr-2" />
          Reopen
        </Button>
      </template>
    </Modal>

    <!-- Close Modal -->
    <Modal :open="showCloseModal" title="Close Budget" size="sm" @update:open="showCloseModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to close this budget? This action is final and cannot be reversed.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showCloseModal = false">Cancel</Button>
        <Button :loading="closeMutation.isPending.value" @click="handleClose">
          <Archive class="w-4 h-4 mr-2" />
          Close Budget
        </Button>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Budget" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this budget? This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">
          <Trash2 class="w-4 h-4 mr-2" />
          Delete
        </Button>
      </template>
    </Modal>

    <!-- Copy Modal -->
    <Modal :open="showCopyModal" title="Copy Budget" size="sm" @update:open="showCopyModal = $event">
      <div class="space-y-4">
        <p class="text-slate-600 dark:text-slate-400">
          Create a copy of this budget for a different fiscal period.
        </p>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Target Fiscal Period
          </label>
          <Select
            v-model="copyTargetPeriodId"
            :options="fiscalPeriodOptions"
            placeholder="Select a period"
          />
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showCopyModal = false">Cancel</Button>
        <Button
          :disabled="!copyTargetPeriodId"
          :loading="copyMutation.isPending.value"
          @click="handleCopy"
        >
          <Copy class="w-4 h-4 mr-2" />
          Copy Budget
        </Button>
      </template>
    </Modal>

    <!-- Add Budget Line Modal -->
    <Modal :open="showAddLineModal" title="Add Budget Line" size="md" @update:open="showAddLineModal = $event">
      <div class="space-y-4">
        <FormField label="Account" required>
          <Select
            v-model="lineFormData.account_id"
            :options="accountOptions"
            placeholder="Select an account"
          />
        </FormField>

        <FormField label="Annual Amount">
          <Input
            v-model="lineFormData.annual_amount"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </FormField>

        <FormField label="Notes">
          <Textarea
            v-model="lineFormData.notes"
            :rows="3"
            placeholder="Optional notes..."
          />
        </FormField>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showAddLineModal = false">Cancel</Button>
        <Button
          :disabled="!lineFormData.account_id"
          :loading="createLineMutation.isPending.value"
          @click="handleCreateLine"
        >
          <Plus class="w-4 h-4 mr-2" />
          Add Line
        </Button>
      </template>
    </Modal>

    <!-- Edit Budget Line Modal -->
    <Modal :open="showEditLineModal" title="Edit Budget Line" size="md" @update:open="showEditLineModal = $event">
      <div v-if="editingLine" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Account</label>
          <div class="text-sm text-muted-foreground">
            <span class="font-mono">{{ editingLine.account?.code }}</span> - {{ editingLine.account?.name }}
          </div>
        </div>

        <FormField label="Annual Amount">
          <Input
            v-model="lineFormData.annual_amount"
            type="number"
            step="0.01"
            placeholder="0.00"
          />
        </FormField>

        <FormField>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="lineFormData.distribute_evenly"
              type="checkbox"
              class="rounded border-border"
            />
            <span class="text-sm text-foreground">Distribute evenly across months</span>
          </label>
        </FormField>

        <FormField label="Notes">
          <Textarea
            v-model="lineFormData.notes"
            :rows="3"
            placeholder="Optional notes..."
          />
        </FormField>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showEditLineModal = false">Cancel</Button>
        <Button
          :loading="updateLineMutation.isPending.value"
          @click="handleUpdateLine"
        >
          <Edit class="w-4 h-4 mr-2" />
          Update Line
        </Button>
      </template>
    </Modal>

    <!-- Delete Budget Line Modal -->
    <Modal :open="showDeleteLineModal" title="Delete Budget Line" size="sm" @update:open="showDeleteLineModal = $event">
      <p class="text-muted-foreground">
        Are you sure you want to delete this budget line? This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteLineModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="deleteLineMutation.isPending.value"
          @click="handleDeleteLine"
        >
          <Trash2 class="w-4 h-4 mr-2" />
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
