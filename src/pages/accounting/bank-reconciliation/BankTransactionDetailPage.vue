<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useBankTransaction,
  useMatchSuggestions,
  useMatchPayment,
  useUnmatchTransaction,
  useReconcileTransaction,
  useDeleteBankTransaction,
  getStatusColor,
  type BankTransactionStatus,
} from '@/api/useBankTransactions'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Modal, useToast } from '@/components/ui'
import {
  ArrowLeft,
  CheckCircle,
  Link2,
  Link2Off,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CreditCard,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const transactionId = computed(() => route.params.id as string)

// Fetch transaction data
const { data: transaction, isLoading, error, refetch } = useBankTransaction(transactionId)
const { data: suggestions, isLoading: suggestionsLoading } = useMatchSuggestions(transactionId)

// Mutations
const matchMutation = useMatchPayment()
const unmatchMutation = useUnmatchTransaction()
const reconcileMutation = useReconcileTransaction()
const deleteMutation = useDeleteBankTransaction()

// Modal states
const showDeleteModal = ref(false)
const showReconcileModal = ref(false)

// Match a payment
async function handleMatch(paymentId: number) {
  try {
    await matchMutation.mutateAsync({
      transactionId: transactionId.value,
      paymentId,
    })
    toast.success('Transaction matched to payment')
    refetch()
  } catch {
    toast.error('Failed to match transaction')
  }
}

// Unmatch transaction
async function handleUnmatch() {
  try {
    await unmatchMutation.mutateAsync(transactionId.value)
    toast.success('Transaction unmatched')
    refetch()
  } catch {
    toast.error('Failed to unmatch transaction')
  }
}

// Reconcile transaction
async function handleReconcile() {
  try {
    await reconcileMutation.mutateAsync(transactionId.value)
    showReconcileModal.value = false
    toast.success('Transaction reconciled')
    refetch()
  } catch {
    toast.error('Failed to reconcile transaction')
  }
}

// Delete transaction
async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(transactionId.value)
    showDeleteModal.value = false
    toast.success('Transaction deleted')
    router.push('/accounting/bank-reconciliation')
  } catch {
    toast.error('Failed to delete transaction')
  }
}

// Format amount display
function getAmountDisplay(debit: number, credit: number): { text: string; isPositive: boolean } {
  if (debit > 0) {
    return { text: `+${formatCurrency(debit)}`, isPositive: true }
  }
  return { text: `-${formatCurrency(credit)}`, isPositive: false }
}

// Confidence badge color
function getConfidenceColor(confidence: number): string {
  if (confidence >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  if (confidence >= 70) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
  if (confidence >= 50) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-12">
      <RefreshCw class="w-8 h-8 mx-auto animate-spin text-slate-400" />
      <p class="mt-2 text-slate-500 dark:text-slate-400">Loading...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-12">
      <AlertTriangle class="w-12 h-12 mx-auto text-red-400 mb-3" />
      <p class="text-red-500">Failed to load transaction</p>
      <Button variant="ghost" class="mt-4" @click="router.push('/accounting/bank-reconciliation')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to List
      </Button>
    </div>

    <!-- Content -->
    <div v-else-if="transaction">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="sm" @click="router.push('/accounting/bank-reconciliation')">
            <ArrowLeft class="w-4 h-4" />
          </Button>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Bank Transaction</h1>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium"
                :class="getStatusColor(transaction.status.value as BankTransactionStatus)"
              >
                {{ transaction.status.label }}
              </span>
            </div>
            <p class="text-slate-500 dark:text-slate-400">
              {{ formatDate(transaction.transaction_date) }}
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <!-- Unmatch Button (matched only) -->
          <Button
            v-if="transaction.status.value === 'matched'"
            variant="secondary"
            @click="handleUnmatch"
            :loading="unmatchMutation.isPending.value"
          >
            <Link2Off class="w-4 h-4 mr-2" />
            Unmatch
          </Button>

          <!-- Reconcile Button (matched only) -->
          <Button
            v-if="transaction.status.value === 'matched'"
            @click="showReconcileModal = true"
          >
            <CheckCircle class="w-4 h-4 mr-2" />
            Reconcile
          </Button>

          <!-- Delete Button (not reconciled) -->
          <Button
            v-if="transaction.status.value !== 'reconciled'"
            variant="destructive"
            @click="showDeleteModal = true"
          >
            <Trash2 class="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <!-- Transaction Details -->
      <Card class="mb-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Transaction Details</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Description</div>
            <div class="font-medium text-slate-900 dark:text-slate-100">{{ transaction.description }}</div>
          </div>

          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Bank Account</div>
            <div class="font-medium text-slate-900 dark:text-slate-100">
              {{ transaction.account?.name ?? '-' }}
            </div>
          </div>

          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Reference</div>
            <div class="font-medium text-slate-900 dark:text-slate-100">
              {{ transaction.reference || '-' }}
            </div>
          </div>

          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Amount</div>
            <div
              class="text-xl font-bold font-mono"
              :class="transaction.debit > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
            >
              {{ getAmountDisplay(transaction.debit, transaction.credit).text }}
            </div>
          </div>

          <div v-if="transaction.balance !== undefined && transaction.balance !== null">
            <div class="text-sm text-slate-500 dark:text-slate-400">Balance</div>
            <div class="font-mono text-slate-900 dark:text-slate-100">
              {{ formatCurrency(transaction.balance) }}
            </div>
          </div>

          <div v-if="transaction.import_batch">
            <div class="text-sm text-slate-500 dark:text-slate-400">Import Batch</div>
            <div class="font-mono text-slate-900 dark:text-slate-100">
              {{ transaction.import_batch }}
            </div>
          </div>
        </div>

        <!-- Matched Payment Info -->
        <div
          v-if="transaction.matched_payment"
          class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div class="flex items-start gap-3">
            <Link2 class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="font-medium text-blue-800 dark:text-blue-200">Matched Payment</h3>
              <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Payment #{{ transaction.matched_payment.payment_number }} •
                {{ formatCurrency(transaction.matched_payment.amount) }} •
                {{ formatDate(transaction.matched_payment.payment_date) }}
              </p>
              <RouterLink
                :to="`/payments/${transaction.matched_payment.id}`"
                class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                View Payment →
              </RouterLink>
            </div>
          </div>
        </div>

        <!-- Reconciled Info -->
        <div
          v-if="transaction.status.value === 'reconciled' && transaction.reconciled_at"
          class="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
        >
          <div class="flex items-start gap-3">
            <CheckCircle class="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 class="font-medium text-green-800 dark:text-green-200">Reconciled</h3>
              <p class="text-sm text-green-700 dark:text-green-300 mt-1">
                Reconciled on {{ formatDate(transaction.reconciled_at) }}
                <span v-if="transaction.reconciled_by">
                  by {{ transaction.reconciled_by }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      <!-- Match Suggestions (for unmatched transactions) -->
      <Card v-if="transaction.status.value === 'unmatched'" class="mb-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Suggested Matches
        </h2>

        <div v-if="suggestionsLoading" class="text-center py-8">
          <RefreshCw class="w-6 h-6 mx-auto animate-spin text-slate-400" />
          <p class="mt-2 text-slate-500 dark:text-slate-400">Finding matches...</p>
        </div>

        <div v-else-if="suggestions && suggestions.length > 0" class="space-y-3">
          <div
            v-for="suggestion in suggestions"
            :key="suggestion.payment_id"
            class="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <div class="flex items-center gap-4">
              <CreditCard class="w-8 h-8 text-slate-400" />
              <div>
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  Payment #{{ suggestion.payment_number }}
                </div>
                <div class="text-sm text-slate-500 dark:text-slate-400">
                  {{ suggestion.contact_name }} • {{ formatDate(suggestion.payment_date) }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-4">
              <div class="text-right">
                <div class="font-mono font-medium text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(suggestion.amount) }}
                </div>
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="getConfidenceColor(suggestion.confidence)"
                >
                  {{ suggestion.confidence }}% match
                </span>
              </div>
              <Button
                size="sm"
                :loading="matchMutation.isPending.value"
                @click="handleMatch(suggestion.payment_id)"
              >
                <Link2 class="w-4 h-4 mr-1" />
                Match
              </Button>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-slate-500 dark:text-slate-400">
          <CreditCard class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p>No matching payments found</p>
          <p class="text-sm mt-1">Try adjusting the payment dates or amounts</p>
        </div>
      </Card>
    </div>

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

    <!-- Reconcile Modal -->
    <Modal :open="showReconcileModal" title="Reconcile Transaction" size="sm" @update:open="showReconcileModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to mark this transaction as reconciled?
        Once reconciled, it cannot be modified or deleted.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showReconcileModal = false">Cancel</Button>
        <Button
          :loading="reconcileMutation.isPending.value"
          @click="handleReconcile"
        >
          <CheckCircle class="w-4 h-4 mr-2" />
          Reconcile
        </Button>
      </template>
    </Modal>
  </div>
</template>
