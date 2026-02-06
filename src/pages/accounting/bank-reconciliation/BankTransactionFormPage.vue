<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateBankTransaction, type CreateBankTransactionData } from '@/api/useBankTransactions'
import { useAccountsLookup } from '@/api/useAccounts'
import { Button, Card, Input, Select, Textarea, useToast, CurrencyInput } from '@/components/ui'
import { ArrowLeft, Save, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

// Fetch bank accounts
const { data: accounts, isLoading: accountsLoading } = useAccountsLookup('asset')
const bankAccounts = computed(() =>
  accounts.value?.filter(a => a.code.startsWith('1-1')) ?? [] // Cash & bank accounts
)

const bankAccountOptions = computed(() =>
  bankAccounts.value.map(a => ({
    value: String(a.id),
    label: `${a.code} - ${a.name}`,
  }))
)

// Form state
const accountId = ref<string>('')
const transactionDate = ref(new Date().toISOString().split('T')[0])
const description = ref('')
const reference = ref('')
const transactionType = ref<'debit' | 'credit'>('debit')
const amount = ref(0)
const balance = ref<number | undefined>(undefined)
const externalId = ref('')
const importBatch = ref('')

// Create mutation
const createMutation = useCreateBankTransaction()
const isSubmitting = computed(() => createMutation.isPending.value)

// Submit form
async function handleSubmit() {
  // Validation
  if (!accountId.value) {
    toast.error('Bank account is required')
    return
  }

  if (!transactionDate.value) {
    toast.error('Transaction date is required')
    return
  }

  if (!description.value.trim()) {
    toast.error('Description is required')
    return
  }

  if (amount.value <= 0) {
    toast.error('Amount must be greater than zero')
    return
  }

  const data: CreateBankTransactionData = {
    account_id: Number(accountId.value),
    transaction_date: transactionDate.value,
    description: description.value.trim(),
    reference: reference.value.trim() || undefined,
    debit: transactionType.value === 'debit' ? amount.value : 0,
    credit: transactionType.value === 'credit' ? amount.value : 0,
    balance: balance.value,
    external_id: externalId.value.trim() || undefined,
    import_batch: importBatch.value.trim() || undefined,
  }

  try {
    const newTransaction = await createMutation.mutateAsync(data)
    toast.success('Transaction created')
    router.push(`/accounting/bank-reconciliation/${newTransaction.id}`)
  } catch {
    toast.error('Failed to create transaction')
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="sm" @click="router.back()">
        <ArrowLeft class="w-4 h-4" />
      </Button>
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Add Bank Transaction</h1>
        <p class="text-slate-500 dark:text-slate-400">Manually add a bank transaction for reconciliation</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="accountsLoading" class="text-center py-12">
      <Loader2 class="w-8 h-8 mx-auto animate-spin text-slate-400" />
      <p class="mt-2 text-slate-500 dark:text-slate-400">Loading...</p>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit">
      <Card class="mb-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Transaction Details</h2>

        <div class="space-y-4">
          <!-- Bank Account -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Bank Account <span class="text-red-500">*</span>
            </label>
            <Select
              v-model="accountId"
              :options="bankAccountOptions"
              placeholder="Select bank account"
            />
          </div>

          <!-- Transaction Date -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Transaction Date <span class="text-red-500">*</span>
            </label>
            <Input v-model="transactionDate" type="date" required />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description <span class="text-red-500">*</span>
            </label>
            <Textarea
              v-model="description"
              placeholder="Transaction description"
              :rows="2"
              required
            />
          </div>

          <!-- Reference -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reference
            </label>
            <Input v-model="reference" placeholder="e.g., Check number, transfer ID" />
          </div>

          <!-- Transaction Type and Amount -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Type <span class="text-red-500">*</span>
              </label>
              <Select
                v-model="transactionType"
                :options="[
                  { value: 'debit', label: 'Debit (Money In)' },
                  { value: 'credit', label: 'Credit (Money Out)' },
                ]"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Amount <span class="text-red-500">*</span>
              </label>
              <CurrencyInput v-model="amount" />
            </div>
          </div>

          <!-- Balance -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Balance (Optional)
            </label>
            <CurrencyInput v-model="balance" />
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Running balance after this transaction
            </p>
          </div>
        </div>
      </Card>

      <!-- Advanced Options -->
      <Card class="mb-6">
        <details>
          <summary class="text-lg font-semibold text-slate-900 dark:text-slate-100 cursor-pointer">
            Advanced Options
          </summary>

          <div class="space-y-4 mt-4">
            <!-- External ID -->
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                External ID
              </label>
              <Input v-model="externalId" placeholder="ID from bank statement" />
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Used to prevent duplicate imports
              </p>
            </div>

            <!-- Import Batch -->
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Import Batch
              </label>
              <Input v-model="importBatch" placeholder="Batch identifier" />
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Group transactions from the same import
              </p>
            </div>
          </div>
        </details>
      </Card>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">
          Cancel
        </Button>
        <Button type="submit" :loading="isSubmitting">
          <Save class="w-4 h-4 mr-2" />
          Create Transaction
        </Button>
      </div>
    </form>
  </div>
</template>
