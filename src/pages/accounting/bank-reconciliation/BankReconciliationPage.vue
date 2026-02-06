<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  useBankTransactions,
  useBankTransactionSummary,
  useReconcileTransaction,
  useUnmatchTransaction,
  useBulkReconcile,
  useDeleteBankTransaction,
  getStatusColor,
  type BankTransaction,
  type BankTransactionFilters,
  type BankTransactionStatus,
} from '@/api/useBankTransactions'
import { useAccountsLookup } from '@/api/useAccounts'
import { useResourceList } from '@/composables/useResourceList'
import { useBulkSelection } from '@/composables/useBulkSelection'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  Button,
  Card,
  Input,
  Select,
  Modal,
  Pagination,
  useToast,
  ResponsiveTable,
  type ResponsiveColumn,
} from '@/components/ui'
import BulkActionsBar from '@/components/BulkActionsBar.vue'
import {
  Plus,
  RefreshCw,
  CheckCircle,
  Link2,
  Link2Off,
  Trash2,
  AlertCircle,
  Building2,
} from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

// Bank accounts for filter dropdown
const { data: accounts } = useAccountsLookup('asset')
const bankAccounts = computed(() =>
  accounts.value?.filter(a => a.code.startsWith('1-1')) ?? [] // Cash & bank accounts
)

const bankAccountOptions = computed(() => [
  { value: '', label: 'All Accounts' },
  ...bankAccounts.value.map(a => ({
    value: String(a.id),
    label: `${a.code} - ${a.name}`,
  })),
])

// Status options
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'unmatched', label: 'Unmatched' },
  { value: 'matched', label: 'Matched' },
  { value: 'reconciled', label: 'Reconciled' },
]

// Resource list with filters and pagination
const {
  items: transactions,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<BankTransaction, BankTransactionFilters>({
  useListHook: useBankTransactions,
  initialFilters: {
    page: 1,
    per_page: 50,
    account_id: undefined,
    status: undefined,
    start_date: '',
    end_date: '',
  },
})

// Summary data
const accountIdRef = computed(() => filters.value.account_id ? Number(filters.value.account_id) : undefined)
const { data: summary } = useBankTransactionSummary(ref(accountIdRef.value))

// Bulk selection
const {
  selectedCount,
  toggleItem,
  clearSelection,
  getSelectedIds,
} = useBulkSelection({
  items: transactions,
  getItemId: (t) => t.id,
})

// Clear selection when page/filters change
watch([() => filters.value.page, () => filters.value.status, () => filters.value.account_id], () => {
  clearSelection()
})

// Handle filter changes
function handleAccountChange(value: string | number | null) {
  updateFilter('account_id', value ? Number(value) : undefined)
}

function handleStatusChange(value: string | number | null) {
  updateFilter('status', value ? (value as BankTransactionStatus) : undefined)
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'transaction_date', label: 'Date', mobilePriority: 1 },
  { key: 'description', label: 'Description', mobilePriority: 2 },
  { key: 'account', label: 'Account', showInMobile: false },
  { key: 'debit', label: 'Debit', align: 'right', showInMobile: false },
  { key: 'credit', label: 'Credit', align: 'right', showInMobile: false },
  { key: 'amount', label: 'Amount', align: 'right', mobilePriority: 3 },
  { key: 'status', label: 'Status', mobilePriority: 4 },
]

// Mutations
const reconcileMutation = useReconcileTransaction()
const unmatchMutation = useUnmatchTransaction()
const bulkReconcileMutation = useBulkReconcile()
const deleteMutation = useDeleteBankTransaction()

// Modal states
const showDeleteModal = ref(false)
const showMatchModal = ref(false)
const selectedTransaction = ref<BankTransaction | null>(null)

function openDeleteModal(transaction: BankTransaction) {
  selectedTransaction.value = transaction
  showDeleteModal.value = true
}

function openMatchModal(transaction: BankTransaction) {
  selectedTransaction.value = transaction
  showMatchModal.value = true
}

async function handleReconcile(transaction: BankTransaction) {
  try {
    await reconcileMutation.mutateAsync(transaction.id)
    toast.success('Transaction reconciled')
  } catch {
    toast.error('Failed to reconcile transaction')
  }
}

async function handleUnmatch(transaction: BankTransaction) {
  try {
    await unmatchMutation.mutateAsync(transaction.id)
    toast.success('Transaction unmatched')
  } catch {
    toast.error('Failed to unmatch transaction')
  }
}

async function handleDelete() {
  if (!selectedTransaction.value) return

  try {
    await deleteMutation.mutateAsync(selectedTransaction.value.id)
    showDeleteModal.value = false
    selectedTransaction.value = null
    toast.success('Transaction deleted')
  } catch {
    toast.error('Failed to delete transaction')
  }
}

async function handleBulkReconcile() {
  const ids = getSelectedIds()
  if (ids.length === 0) return

  try {
    const result = await bulkReconcileMutation.mutateAsync(ids)
    clearSelection()
    toast.success(`${result.reconciled_count} transactions reconciled`)
  } catch {
    toast.error('Failed to reconcile transactions')
  }
}

// Bulk actions
const bulkActions = computed(() => [
  {
    label: 'Reconcile Selected',
    variant: 'default' as const,
    loading: bulkReconcileMutation.isPending.value,
    action: async () => {
      if (confirm(`Reconcile ${selectedCount.value} transaction(s)?`)) {
        await handleBulkReconcile()
      }
    },
  },
])

// Navigate to detail
function viewTransaction(transaction: BankTransaction) {
  router.push(`/accounting/bank-reconciliation/${transaction.id}`)
}

// Get amount for display (debit - credit)
function getAmount(transaction: BankTransaction): { value: number; isDebit: boolean } {
  const debit = transaction.debit ?? 0
  const credit = transaction.credit ?? 0
  return {
    value: debit > 0 ? debit : credit,
    isDebit: debit > 0,
  }
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Bank Reconciliation</h1>
        <p class="text-slate-500 dark:text-slate-400">Match and reconcile bank transactions</p>
      </div>
      <div class="flex gap-2">
        <RouterLink to="/accounting/bank-reconciliation/new">
          <Button>
            <Plus class="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </RouterLink>
      </div>
    </div>

    <!-- Summary Cards -->
    <div v-if="summary" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card class="text-center">
        <div class="text-sm text-slate-500 dark:text-slate-400">Total Transactions</div>
        <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {{ summary.total_transactions }}
        </div>
      </Card>

      <Card class="text-center border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
        <div class="text-sm text-amber-600 dark:text-amber-400">Unmatched</div>
        <div class="text-2xl font-bold text-amber-700 dark:text-amber-400">
          {{ summary.unmatched_count }}
        </div>
        <div class="text-xs text-amber-600 dark:text-amber-500 mt-1">
          {{ formatCurrency(summary.unmatched_debit - summary.unmatched_credit) }}
        </div>
      </Card>

      <Card class="text-center border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
        <div class="text-sm text-blue-600 dark:text-blue-400">Matched</div>
        <div class="text-2xl font-bold text-blue-700 dark:text-blue-400">
          {{ summary.matched_count }}
        </div>
      </Card>

      <Card class="text-center border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
        <div class="text-sm text-green-600 dark:text-green-400">Reconciled</div>
        <div class="text-2xl font-bold text-green-700 dark:text-green-400">
          {{ summary.reconciled_count }}
        </div>
      </Card>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <!-- Bank Account Filter -->
        <div class="w-64">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bank Account</label>
          <Select
            :model-value="filters.account_id ? String(filters.account_id) : ''"
            :options="bankAccountOptions"
            placeholder="All Accounts"
            @update:model-value="handleAccountChange"
          />
        </div>

        <!-- Status Filter -->
        <div class="w-40">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
          <Select
            :model-value="filters.status ?? ''"
            :options="statusOptions"
            placeholder="All Status"
            @update:model-value="handleStatusChange"
          />
        </div>

        <!-- Date Range -->
        <div class="w-40">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
          <Input
            :model-value="filters.start_date"
            type="date"
            @update:model-value="(v) => updateFilter('start_date', String(v))"
          />
        </div>

        <div class="w-40">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
          <Input
            :model-value="filters.end_date"
            type="date"
            @update:model-value="(v) => updateFilter('end_date', String(v))"
          />
        </div>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-if="error" class="text-center py-8">
      <AlertCircle class="w-12 h-12 mx-auto text-red-400 mb-3" />
      <p class="text-red-500">Failed to load transactions</p>
    </Card>

    <!-- Loading State -->
    <Card v-else-if="isLoading" class="text-center py-8">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <RefreshCw class="w-5 h-5 animate-spin" />
        <span>Loading...</span>
      </div>
    </Card>

    <!-- Empty State -->
    <Card v-else-if="isEmpty" class="text-center py-12">
      <Building2 class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No transactions found</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Import bank statements or add transactions manually
      </p>
      <RouterLink to="/accounting/bank-reconciliation/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="transactions"
        :columns="columns"
        :loading="isLoading"
        :selectable="true"
        :selected-keys="new Set(getSelectedIds())"
        title-field="description"
        @row-click="viewTransaction"
        @select="(keys) => {
          clearSelection()
          keys.forEach((k) => {
            const t = transactions.find((item) => item.id === k)
            if (t) toggleItem(t)
          })
        }"
      >
        <!-- Date -->
        <template #cell-transaction_date="{ item }">
          <span class="text-slate-900 dark:text-slate-100">{{ formatDate(item.transaction_date) }}</span>
        </template>

        <!-- Description -->
        <template #cell-description="{ item }">
          <div class="max-w-xs">
            <div class="font-medium text-slate-900 dark:text-slate-100 truncate">{{ item.description }}</div>
            <div v-if="item.reference" class="text-xs text-slate-500 dark:text-slate-400 truncate">
              Ref: {{ item.reference }}
            </div>
          </div>
        </template>

        <!-- Account -->
        <template #cell-account="{ item }">
          <span class="text-slate-600 dark:text-slate-400 text-sm">
            {{ item.account?.name ?? '-' }}
          </span>
        </template>

        <!-- Debit -->
        <template #cell-debit="{ item }">
          <span v-if="item.debit > 0" class="font-mono text-green-600 dark:text-green-400">
            {{ formatCurrency(item.debit) }}
          </span>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- Credit -->
        <template #cell-credit="{ item }">
          <span v-if="item.credit > 0" class="font-mono text-red-600 dark:text-red-400">
            {{ formatCurrency(item.credit) }}
          </span>
          <span v-else class="text-slate-400">-</span>
        </template>

        <!-- Amount (mobile) -->
        <template #cell-amount="{ item }">
          <span
            class="font-mono"
            :class="getAmount(item).isDebit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
          >
            {{ getAmount(item).isDebit ? '+' : '-' }}{{ formatCurrency(getAmount(item).value) }}
          </span>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            :class="getStatusColor(item.status.value as BankTransactionStatus)"
          >
            {{ item.status.label }}
          </span>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.description }}</span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            :class="getStatusColor(item.status.value as BankTransactionStatus)"
          >
            {{ item.status.label }}
          </span>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <!-- Match Button (unmatched only) -->
            <Button
              v-if="item.status.value === 'unmatched'"
              variant="ghost"
              size="xs"
              title="Find matches"
              @click.stop="openMatchModal(item)"
            >
              <Link2 class="w-3.5 h-3.5" />
            </Button>

            <!-- Unmatch Button (matched only) -->
            <Button
              v-if="item.status.value === 'matched'"
              variant="ghost"
              size="xs"
              title="Unmatch"
              @click.stop="handleUnmatch(item)"
            >
              <Link2Off class="w-3.5 h-3.5" />
            </Button>

            <!-- Reconcile Button (matched only) -->
            <Button
              v-if="item.status.value === 'matched'"
              variant="ghost"
              size="xs"
              title="Reconcile"
              @click.stop="handleReconcile(item)"
            >
              <CheckCircle class="w-3.5 h-3.5" />
            </Button>

            <!-- Delete Button (not reconciled) -->
            <Button
              v-if="item.status.value !== 'reconciled'"
              variant="ghost"
              size="xs"
              title="Delete"
              @click.stop="openDeleteModal(item)"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </Button>

            <!-- View Button -->
            <Button variant="ghost" size="xs" @click.stop="viewTransaction(item)">
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

    <!-- Bulk Actions Bar -->
    <BulkActionsBar
      :selected-count="selectedCount"
      :actions="bulkActions"
      @clear="clearSelection"
    />

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Transaction" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this bank transaction?
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

    <!-- Match Modal -->
    <Modal :open="showMatchModal" title="Find Matching Payments" size="md" @update:open="showMatchModal = $event">
      <div v-if="selectedTransaction" class="space-y-4">
        <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div class="font-medium text-slate-900 dark:text-slate-100">{{ selectedTransaction.description }}</div>
          <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {{ formatDate(selectedTransaction.transaction_date) }} •
            <span :class="selectedTransaction.debit > 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatCurrency(selectedTransaction.debit > 0 ? selectedTransaction.debit : selectedTransaction.credit) }}
            </span>
          </div>
        </div>

        <p class="text-sm text-slate-500 dark:text-slate-400">
          Navigate to the transaction detail page to view and select matching payments.
        </p>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showMatchModal = false">Cancel</Button>
        <Button @click="() => { showMatchModal = false; viewTransaction(selectedTransaction!) }">
          View & Match
        </Button>
      </template>
    </Modal>
  </div>
</template>
