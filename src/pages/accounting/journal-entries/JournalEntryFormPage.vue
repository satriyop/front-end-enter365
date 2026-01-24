<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  useCreateJournalEntry,
  calculateLineTotals,
  validateJournalLines,
  createEmptyLine,
  type CreateJournalEntryData,
  type CreateJournalEntryLineData,
} from '@/api/useJournalEntries'
import { useAccountsLookup } from '@/api/useAccounts'
import { formatCurrency } from '@/utils/format'
import { Button, Card, Input, Select, useToast, CurrencyInput } from '@/components/ui'
import { ArrowLeft, Save, Loader2, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

// Fetch accounts for dropdown
const { data: accounts, isLoading: accountsLoading } = useAccountsLookup()

// Account options for select
const accountOptions = computed(() => {
  if (!accounts.value) return []
  return accounts.value.map(acc => ({
    value: String(acc.id),
    label: `${acc.code} - ${acc.name}`,
  }))
})

// Form state
const entryDate = ref(new Date().toISOString().split('T')[0])
const description = ref('')
const reference = ref('')
const lines = ref<CreateJournalEntryLineData[]>([
  createEmptyLine(),
  createEmptyLine(),
])

// Calculate totals
const totals = computed(() => calculateLineTotals(lines.value))

// Filter out empty lines for validation
const linesToValidate = computed(() => lines.value.filter(
  line => line.account_id > 0 && ((line.debit || 0) > 0 || (line.credit || 0) > 0)
))

// Validation errors
const validationErrors = computed(() => validateJournalLines(linesToValidate.value))
const hasErrors = computed(() => validationErrors.value.length > 0)

// Add new line
function addLine() {
  lines.value.push(createEmptyLine())
}

// Remove line
function removeLine(index: number) {
  if (lines.value.length > 2) {
    lines.value.splice(index, 1)
  }
}

// Handle debit change - clear credit if debit is entered
function handleDebitChange(index: number, value: number) {
  const line = lines.value[index]
  if (!line) return
  line.debit = value || 0
  if (value > 0) {
    line.credit = 0
  }
}

// Handle credit change - clear debit if credit is entered
function handleCreditChange(index: number, value: number) {
  const line = lines.value[index]
  if (!line) return
  line.credit = value || 0
  if (value > 0) {
    line.debit = 0
  }
}

// Auto-balance helper: set credit/debit on last line to balance
function autoBalance() {
  if (lines.value.length < 2) return

  const lastLineIndex = lines.value.length - 1
  const lastLine = lines.value[lastLineIndex]
  if (!lastLine) return

  // Calculate totals excluding last line
  const otherLines = lines.value.slice(0, -1)
  const otherTotals = calculateLineTotals(otherLines)

  const diff = otherTotals.totalDebit - otherTotals.totalCredit

  if (diff > 0) {
    // Need credit to balance
    lastLine.debit = 0
    lastLine.credit = Math.abs(diff)
  } else if (diff < 0) {
    // Need debit to balance
    lastLine.debit = Math.abs(diff)
    lastLine.credit = 0
  }
}

// Create mutation
const createMutation = useCreateJournalEntry()

const isSubmitting = computed(() => createMutation.isPending.value)

// Submit form
async function handleSubmit() {
  // Validate
  if (!entryDate.value) {
    toast.error('Entry date is required')
    return
  }

  if (!description.value) {
    toast.error('Description is required')
    return
  }

  if (hasErrors.value) {
    toast.error('Please fix the errors before submitting')
    return
  }

  // Filter out empty lines
  const validLines = lines.value.filter(
    line => line.account_id > 0 && ((line.debit || 0) > 0 || (line.credit || 0) > 0)
  )

  if (validLines.length < 2) {
    toast.error('Journal entry must have at least 2 valid lines')
    return
  }

  const data: CreateJournalEntryData = {
    entry_date: entryDate.value,
    description: description.value,
    reference: reference.value || undefined,
    lines: validLines,
  }

  try {
    const result = await createMutation.mutateAsync(data)
    toast.success('Journal entry created')
    router.push(`/accounting/journal-entries/${result.id}`)
  } catch {
    toast.error('Failed to create journal entry')
  }
}
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
      <RouterLink to="/accounting/journal-entries" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
        <ArrowLeft class="w-4 h-4" />
        Journal Entries
      </RouterLink>
      <span>/</span>
      <span class="text-slate-900 dark:text-slate-100">New Entry</span>
    </div>

    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">New Journal Entry</h1>
      <p class="text-slate-500 dark:text-slate-400">Create a manual journal entry</p>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit">
      <!-- Header Info -->
      <Card class="mb-6">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Entry Information</h2>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Entry Date <span class="text-red-500">*</span>
            </label>
            <Input v-model="entryDate" type="date" />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description <span class="text-red-500">*</span>
            </label>
            <Input v-model="description" placeholder="Describe this journal entry" />
          </div>

          <div class="sm:col-span-3">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reference
            </label>
            <Input v-model="reference" placeholder="Optional reference number or document" />
          </div>
        </div>
      </Card>

      <!-- Entry Lines -->
      <Card class="mb-6">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Entry Lines</h2>
            <div class="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" @click="autoBalance">
                Auto-Balance
              </Button>
              <Button type="button" variant="secondary" size="sm" @click="addLine">
                <Plus class="w-4 h-4 mr-1" />
                Add Line
              </Button>
            </div>
          </div>
        </template>

        <!-- Lines Table -->
        <div class="overflow-x-auto -mx-6">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 w-2/5">
                  Account <span class="text-red-500">*</span>
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 w-1/5">
                  Description
                </th>
                <th class="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400 w-1/6">
                  Debit
                </th>
                <th class="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400 w-1/6">
                  Credit
                </th>
                <th class="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="(line, index) in lines" :key="index">
                <!-- Account -->
                <td class="px-4 py-2">
                  <Select
                    :model-value="line.account_id ? String(line.account_id) : ''"
                    :options="accountOptions"
                    :loading="accountsLoading"
                    placeholder="Select account"
                    @update:model-value="(v) => line.account_id = v ? parseInt(String(v), 10) : 0"
                  />
                </td>

                <!-- Description -->
                <td class="px-4 py-2">
                  <Input
                    :model-value="line.description ?? ''"
                    placeholder="Line description"
                    class="text-sm"
                    @update:model-value="(v) => line.description = v as string"
                  />
                </td>

                <!-- Debit -->
                <td class="px-4 py-2">
                  <CurrencyInput
                    :model-value="line.debit"
                    size="sm"
                    @update:model-value="(v) => handleDebitChange(index, Number(v) || 0)"
                  />
                </td>

                <!-- Credit -->
                <td class="px-4 py-2">
                  <CurrencyInput
                    :model-value="line.credit"
                    size="sm"
                    @update:model-value="(v) => handleCreditChange(index, Number(v) || 0)"
                  />
                </td>

                <!-- Remove -->
                <td class="px-4 py-2 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    :disabled="lines.length <= 2"
                    class="text-red-500 hover:text-red-600 disabled:opacity-30"
                    @click="removeLine(index)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-50 dark:bg-slate-800/50 font-medium">
              <tr>
                <td class="px-4 py-3 text-slate-900 dark:text-slate-100" colspan="2">Total</td>
                <td class="px-4 py-3 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(totals.totalDebit) }}
                </td>
                <td class="px-4 py-3 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(totals.totalCredit) }}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <!-- Balance Indicator -->
        <div class="mt-4 -mx-6 -mb-6 px-6 py-3 border-t border-slate-200 dark:border-slate-700">
          <div
            v-if="totals.isBalanced"
            class="flex items-center gap-2 text-green-600 dark:text-green-400"
          >
            <CheckCircle class="w-5 h-5" />
            <span class="font-medium">Entry is balanced</span>
          </div>
          <div
            v-else
            class="flex items-center gap-2 text-amber-600 dark:text-amber-400"
          >
            <AlertTriangle class="w-5 h-5" />
            <span class="font-medium">
              Entry is not balanced. Difference: {{ formatCurrency(totals.difference) }}
            </span>
          </div>
        </div>
      </Card>

      <!-- Validation Errors -->
      <Card v-if="hasErrors" class="mb-6 border-red-200 dark:border-red-800">
        <div class="flex items-start gap-3">
          <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 class="font-medium text-red-700 dark:text-red-400 mb-2">Please fix the following errors:</h3>
            <ul class="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1">
              <li v-for="(error, index) in validationErrors" :key="index">{{ error }}</li>
            </ul>
          </div>
        </div>
      </Card>

      <!-- Actions -->
      <div class="flex items-center gap-3">
        <Button type="submit" :disabled="isSubmitting || hasErrors">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          <Save v-else class="w-4 h-4 mr-2" />
          Create Entry
        </Button>
        <Button type="button" variant="ghost" @click="router.push('/accounting/journal-entries')">
          Cancel
        </Button>
      </div>
    </form>

    <!-- Help Card -->
    <Card class="mt-6">
      <template #header>
        <h2 class="font-semibold text-slate-900 dark:text-slate-100">Tips</h2>
      </template>
      <ul class="text-sm text-slate-600 dark:text-slate-400 space-y-2">
        <li>• Each line can only have a debit OR credit amount, not both</li>
        <li>• Total debits must equal total credits for a balanced entry</li>
        <li>• Use "Auto-Balance" to automatically fill the last line</li>
        <li>• After creating, you can post the entry to make it permanent</li>
        <li>• Posted entries cannot be edited, only reversed</li>
      </ul>
    </Card>
  </div>
</template>
