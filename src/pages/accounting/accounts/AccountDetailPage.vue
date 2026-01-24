<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useAccount,
  useAccountBalance,
  useAccountLedger,
  useDeleteAccount,
  getAccountTypeLabel,
  getAccountTypeColor,
  type LedgerFilters,
} from '@/api/useAccounts'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Modal, Input, Pagination, useToast } from '@/components/ui'
import { Pencil, Trash2, ArrowLeft, Calendar, FileText } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => String(route.params.id))

// Fetch account details
const { data: account, isLoading: accountLoading, error: accountError } = useAccount(accountId)

// Fetch account balance
const { data: balance, isLoading: balanceLoading } = useAccountBalance(accountId)

// Ledger filters
const ledgerFilters = ref<LedgerFilters>({
  start_date: undefined,
  end_date: undefined,
})

// Fetch ledger entries
const { data: ledgerData, isLoading: ledgerLoading } = useAccountLedger(accountId, ledgerFilters)

const ledgerEntries = computed(() => {
  console.log('AccountDetailPage ledgerData:', ledgerData.value)
  return ledgerData.value?.entries ?? []
})

// Delete handling
const deleteMutation = useDeleteAccount()
const showDeleteModal = ref(false)

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(accountId.value)
    showDeleteModal.value = false
    toast.success('Account deleted')
    router.push('/accounting/accounts')
  } catch {
    toast.error('Failed to delete account')
  }
}

// Navigate to journal entry
function viewJournalEntry(journalEntryId: number) {
  router.push(`/accounting/journal-entries/${journalEntryId}`)
}

</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="accountLoading" class="text-center py-12 text-slate-500 dark:text-slate-400">
      Loading...
    </div>

    <!-- Error -->
    <div v-else-if="accountError" class="text-center py-12 text-red-500 dark:text-red-400">
      Failed to load account
    </div>

    <!-- Content -->
    <template v-else-if="account">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/accounting/accounts" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft class="w-4 h-4" />
          Chart of Accounts
        </RouterLink>
        <span>/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ account.name }}</span>
      </div>

      <!-- Header Card -->
      <Card class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="font-mono text-lg text-slate-500 dark:text-slate-400">{{ account.code }}</span>
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ account.name }}
              </h1>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <span
                class="inline-flex px-2.5 py-0.5 rounded text-xs font-medium"
                :class="getAccountTypeColor(account.type)"
              >
                {{ getAccountTypeLabel(account.type) }}
              </span>
              <span v-if="account.subtype" class="text-sm text-slate-500 dark:text-slate-400">
                {{ account.subtype }}
              </span>
              <span
                class="px-2.5 py-0.5 rounded text-xs font-medium"
                :class="account.is_active
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'"
              >
                {{ account.is_active ? 'Active' : 'Inactive' }}
              </span>
              <span v-if="account.is_system" class="px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                System Account
              </span>
            </div>
            <p v-if="account.description" class="mt-2 text-slate-600 dark:text-slate-400">
              {{ account.description }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <RouterLink :to="`/accounting/accounts/${accountId}/edit`">
              <Button variant="secondary" size="sm">
                <Pencil class="w-4 h-4 mr-2" />
                Edit
              </Button>
            </RouterLink>
            <Button
              v-if="!account.is_system"
              variant="ghost"
              size="sm"
              class="text-red-500 hover:text-red-600"
              @click="showDeleteModal = true"
            >
              <Trash2 class="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </Card>

      <!-- Balance & Info Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <!-- Current Balance -->
        <Card>
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Current Balance</h2>
          </template>
          <div v-if="balanceLoading" class="animate-pulse h-8 bg-slate-200 dark:bg-slate-700 rounded" />
          <template v-else-if="balance">
            <div class="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(balance.balance) }}
            </div>
            <div class="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-slate-500 dark:text-slate-400">Total Debit</span>
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(balance.debit_total) }}
                </div>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">Total Credit</span>
                <div class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(balance.credit_total) }}
                </div>
              </div>
            </div>
            <div class="mt-3 text-xs text-slate-400 dark:text-slate-500">
              As of {{ formatDate(balance.as_of_date) }}
            </div>
          </template>
        </Card>

        <!-- Account Details -->
        <Card>
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Account Details</h2>
          </template>
          <dl class="space-y-3 text-sm">
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Opening Balance</dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ formatCurrency(account.opening_balance) }}
              </dd>
            </div>
            <div v-if="account.parent" class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Parent Account</dt>
              <dd>
                <RouterLink
                  :to="`/accounting/accounts/${account.parent.id}`"
                  class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
                >
                  {{ account.parent.code }} - {{ account.parent.name }}
                </RouterLink>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Created</dt>
              <dd class="font-medium text-slate-900 dark:text-slate-100">
                {{ formatDate(account.created_at) }}
              </dd>
            </div>
          </dl>
        </Card>

        <!-- Sub-Accounts -->
        <Card v-if="account.children?.length">
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">
              Sub-Accounts ({{ account.children.length }})
            </h2>
          </template>
          <ul class="space-y-2">
            <li v-for="child in account.children" :key="child.id">
              <RouterLink
                :to="`/accounting/accounts/${child.id}`"
                class="flex items-center gap-2 text-sm hover:text-orange-600 dark:hover:text-orange-400"
              >
                <span class="font-mono text-slate-500 dark:text-slate-400">{{ child.code }}</span>
                <span class="text-slate-900 dark:text-slate-100">{{ child.name }}</span>
              </RouterLink>
            </li>
          </ul>
        </Card>
      </div>

      <!-- Ledger Section -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Ledger Entries</h2>
            <div class="flex items-center gap-3">
              <!-- Date Range Filters -->
              <div class="flex items-center gap-2">
                <Calendar class="w-4 h-4 text-slate-400" />
                <Input
                  v-model="ledgerFilters.start_date"
                  type="date"
                  placeholder="Start Date"
                  class="w-36"
                />
                <span class="text-slate-400">to</span>
                <Input
                  v-model="ledgerFilters.end_date"
                  type="date"
                  placeholder="End Date"
                  class="w-36"
                />
              </div>
            </div>
          </div>
        </template>

        <!-- Ledger Table -->
        <div v-if="ledgerLoading" class="text-center py-8 text-slate-500 dark:text-slate-400">
          Loading ledger...
        </div>

        <div v-else-if="ledgerEntries.length === 0" class="text-center py-8">
          <FileText class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p class="text-slate-500 dark:text-slate-400">No ledger entries found</p>
        </div>

        <div v-else class="overflow-x-auto -mx-6 -mb-6">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Date</th>
                <th class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Entry #</th>
                <th class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Description</th>
                <th class="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Debit</th>
                <th class="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Credit</th>
                <th class="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Balance</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr
                v-for="entry in ledgerEntries"
                :key="entry.id"
                class="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                @click="viewJournalEntry(entry.journal_entry_id)"
              >
                <td class="px-4 py-3 text-slate-900 dark:text-slate-100">
                  {{ formatDate(entry.date) }}
                </td>
                <td class="px-4 py-3">
                  <span class="font-mono text-orange-600 dark:text-orange-400">
                    {{ entry.entry_number }}
                  </span>
                </td>
                <td class="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                  {{ entry.description || '-' }}
                  <span v-if="entry.reference" class="text-slate-400 dark:text-slate-500 ml-2">
                    ({{ entry.reference }})
                  </span>
                </td>
                <td class="px-4 py-3 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ entry.debit > 0 ? formatCurrency(entry.debit) : '-' }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ entry.credit > 0 ? formatCurrency(entry.credit) : '-' }}
                </td>
                <td class="px-4 py-3 text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(entry.running_balance) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </template>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Account" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete <strong>{{ account?.name }}</strong>?
        This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="deleteMutation.isPending.value"
          @click="handleDelete"
        >
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
