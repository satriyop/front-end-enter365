<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  useCreateJournalEntry,
  calculateLineTotals,
  validateJournalLines,
  createEmptyLine,
  formatTaxTagIds,
  parseTaxTagIds,
  type CreateJournalEntryData,
  type CreateJournalEntryLineData,
} from '@/api/useJournalEntries'
import { useAccountsLookup } from '@/api/useAccounts'
import {
  analyticDistributionFromAccountId,
  analyticDistributionPrimaryId,
  useAnalyticAccountsLookup,
} from '@/api/useAnalyticAccounts'
import { useContactsLookup } from '@/api/useContacts'
import { useJournalsLookup, journalTypeLabel } from '@/api/useJournals'
import { formatCurrency } from '@/utils/format'
import { Button, Card, Input, Select, useToast, CurrencyInput } from '@/components/ui'
import { ArrowLeft, Save, Loader2, Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

// Fetch accounts for dropdown
const { data: accounts, isLoading: accountsLoading } = useAccountsLookup()
const { data: journals, isLoading: journalsLoading } = useJournalsLookup()
const { data: contacts, isLoading: contactsLoading } = useContactsLookup()
const { data: analyticAccounts, isLoading: analyticAccountsLoading } = useAnalyticAccountsLookup()
const journalId = ref<string>('')


const journalOptions = computed(() => {
  if (!journals.value) return []
  return journals.value.map((j) => ({
    value: String(j.id),
    label: `${j.name} (${journalTypeLabel(j.type)})`,
  }))
})

// Account options for select
const accountOptions = computed(() => {
  if (!accounts.value) return []
  return accounts.value.map(acc => ({
    value: String(acc.id),
    label: `${acc.code} - ${acc.name}`,
  }))
})

const partnerOptions = computed(() => {
  if (!contacts.value) return []
  return contacts.value.map((c) => ({
    value: String(c.id),
    label: `${c.code} - ${c.name}`,
  }))
})

const analyticOptions = computed(() => {
  if (!analyticAccounts.value) return []
  return analyticAccounts.value.map((account) => ({
    value: String(account.id),
    label: `${account.code} - ${account.name}`,
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

/** Draft strings for optional tax grids (no tax-tag master yet). */
const taxTagDrafts = ref<string[]>(['', ''])

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
  taxTagDrafts.value.push('')
}

// Remove line
function removeLine(index: number) {
  if (lines.value.length > 2) {
    lines.value.splice(index, 1)
    taxTagDrafts.value.splice(index, 1)
  }
}

function onAnalyticSelect(index: number, value: string | number | null) {
  const line = lines.value[index]
  if (!line) return
  line.analytic_distribution = analyticDistributionFromAccountId(value)
}

function onTaxTagsInput(index: number, value: string) {
  taxTagDrafts.value[index] = value
  const line = lines.value[index]
  if (!line) return
  if (!value.trim()) {
    line.tax_tag_ids = null
    return
  }
  const parsed = parseTaxTagIds(value)
  if (parsed) line.tax_tag_ids = parsed
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
  if (!journalId.value) {
    toast.error('Journal is required')
    return
  }

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

  // Commit optional dimension drafts (reject half-typed values)
  for (let i = 0; i < lines.value.length; i++) {
    const line = lines.value[i]
    if (!line) continue
    const taxRaw = taxTagDrafts.value[i] ?? ''
    if (taxRaw.trim()) {
      const parsed = parseTaxTagIds(taxRaw)
      if (!parsed) {
        toast.error(`Line ${i + 1}: Tax Grids must be comma-separated positive ids (e.g. 101, 202)`)
        return
      }
      line.tax_tag_ids = parsed
    } else {
      line.tax_tag_ids = null
    }
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
    journal_id: parseInt(journalId.value, 10),
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
    <form novalidate @submit.prevent="handleSubmit">
      <!-- Header Info -->
      <Card class="mb-6">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Entry Information</h2>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Journal <span class="text-red-500">*</span>
            </label>
            <Select
              :model-value="journalId"
              :options="journalOptions"
              :loading="journalsLoading"
              placeholder="Select journal"
              :test-id="'je-journal'"
              @update:model-value="(v) => journalId = v ? String(v) : ''"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Entry Date <span class="text-red-500">*</span>
            </label>
            <Input v-model="entryDate" data-testid="je-date" type="date" />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description <span class="text-red-500">*</span>
            </label>
            <Input v-model="description" data-testid="je-description" placeholder="Describe this journal entry" />
          </div>

          <div class="sm:col-span-3">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reference
            </label>
            <Input v-model="reference" data-testid="je-reference" placeholder="Optional reference number or document" />
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
                <th class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 w-1/4">
                  Account <span class="text-red-500">*</span>
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 min-w-[9rem]">
                  Partner
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 min-w-[10rem]" title="Analytic account from master — stored as {id: 100}">
                  Analytic
                </th>
                <th class="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 min-w-[7rem]" title="Odoo Tax Grids / tax_tag_ids (no tax-tag master yet)">
                  Tax Grids
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
                    :test-id="`je-line-${index}-account`"
                    :model-value="line.account_id ? String(line.account_id) : ''"
                    :options="accountOptions"
                    :loading="accountsLoading"
                    placeholder="Select account"
                    @update:model-value="(v) => line.account_id = v ? parseInt(String(v), 10) : 0"
                  />
                </td>

                <!-- Partner -->
                <td class="px-4 py-2">
                  <Select
                    :test-id="`je-line-${index}-partner`"
                    :model-value="line.partner_id ? String(line.partner_id) : ''"
                    :options="partnerOptions"
                    :loading="contactsLoading"
                    placeholder="Optional"
                    @update:model-value="(v) => line.partner_id = v ? parseInt(String(v), 10) : null"
                  />
                </td>

                <!-- Analytic Distribution -->
                <td class="px-4 py-2">
                  <Select
                    :test-id="`je-line-${index}-analytic`"
                    :model-value="analyticDistributionPrimaryId(line.analytic_distribution)"
                    :options="analyticOptions"
                    :loading="analyticAccountsLoading"
                    placeholder="Optional"
                    @update:model-value="(v) => onAnalyticSelect(index, v)"
                  />
                </td>

                <!-- Tax Grids -->
                <td class="px-4 py-2">
                  <Input
                    :model-value="taxTagDrafts[index] ?? formatTaxTagIds(line.tax_tag_ids)"
                    :data-testid="`je-line-${index}-tax-grids`"
                    placeholder="101, 202"
                    class="text-sm font-mono"
                    @update:model-value="(v) => onTaxTagsInput(index, String(v))"
                  />
                </td>

                <!-- Description -->
                <td class="px-4 py-2">
                  <Input
                    :model-value="line.description ?? ''"
                    :data-testid="`je-line-${index}-description`"
                    placeholder="Line description"
                    class="text-sm"
                    @update:model-value="(v) => line.description = v as string"
                  />
                </td>

                <!-- Debit -->
                <td class="px-4 py-2">
                  <CurrencyInput
                    :model-value="line.debit"
                    :data-testid="`je-line-${index}-debit`"
                    size="sm"
                    @update:model-value="(v) => handleDebitChange(index, Number(v) || 0)"
                  />
                </td>

                <!-- Credit -->
                <td class="px-4 py-2">
                  <CurrencyInput
                    :model-value="line.credit"
                    :data-testid="`je-line-${index}-credit`"
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
                <td class="px-4 py-3 text-slate-900 dark:text-slate-100" colspan="5">Total</td>
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
        <Button type="submit" data-testid="je-submit" :disabled="isSubmitting || hasErrors">
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
        <li>• Partner (customer/vendor) is optional on each line for AR/AP reporting</li>
        <li>• Analytic: pick an analytic account; stored as Odoo analytic_distribution JSON ({id: 100})</li>
        <li>• Tax Grids: optional comma-separated tag ids — stored as tax_tag_ids; VAT reports remain document-level for now</li>
        <li>• Each line can only have a debit OR credit amount, not both</li>
        <li>• Total debits must equal total credits for a balanced entry</li>
        <li>• Use "Auto-Balance" to automatically fill the last line</li>
        <li>• After creating, you can post the entry to make it permanent</li>
        <li>• Posted entries cannot be edited, only reversed</li>
      </ul>
    </Card>
  </div>
</template>
