<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useBudget,
  useCreateBudget,
  useUpdateBudget,
  type CreateBudgetData,
  type UpdateBudgetData,
  type CreateBudgetLineData,
} from '@/api/useBudgets'
import { useFiscalPeriodsLookup } from '@/api/useFiscalPeriods'
import { useAccountsLookup } from '@/api/useAccounts'
import { formatCurrency } from '@/utils/format'
import { Button, Card, Input, Select, Textarea, useToast, CurrencyInput } from '@/components/ui'
import { ArrowLeft, Save, Loader2, Plus, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Check if editing
const budgetId = computed(() => route.params.id as string | undefined)
const isEditing = computed(() => !!budgetId.value)

// Fetch existing budget if editing
const { data: existingBudget, isLoading: budgetLoading } = useBudget(
  computed(() => budgetId.value)
)

// Fetch lookups
const { data: fiscalPeriods, isLoading: periodsLoading } = useFiscalPeriodsLookup()
const { data: accounts, isLoading: accountsLoading } = useAccountsLookup()

// Options for selects
const fiscalPeriodOptions = computed(() =>
  fiscalPeriods.value?.map(p => ({
    value: String(p.id),
    label: p.name,
  })) ?? []
)

const accountOptions = computed(() =>
  accounts.value?.map(acc => ({
    value: String(acc.id),
    label: `${acc.code} - ${acc.name}`,
  })) ?? []
)

const typeOptions = [
  { value: 'annual', label: 'Annual' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'monthly', label: 'Monthly' },
]

// Form state
const name = ref('')
const description = ref('')
const fiscalPeriodId = ref<string>('')
const budgetType = ref<'annual' | 'quarterly' | 'monthly'>('annual')
const notes = ref('')

interface BudgetLineForm {
  id?: number
  account_id: number
  annual_amount: number
  jan_amount: number
  feb_amount: number
  mar_amount: number
  apr_amount: number
  may_amount: number
  jun_amount: number
  jul_amount: number
  aug_amount: number
  sep_amount: number
  oct_amount: number
  nov_amount: number
  dec_amount: number
  notes: string
}

const lines = ref<BudgetLineForm[]>([createEmptyLine()])

function createEmptyLine(): BudgetLineForm {
  return {
    account_id: 0,
    annual_amount: 0,
    jan_amount: 0,
    feb_amount: 0,
    mar_amount: 0,
    apr_amount: 0,
    may_amount: 0,
    jun_amount: 0,
    jul_amount: 0,
    aug_amount: 0,
    sep_amount: 0,
    oct_amount: 0,
    nov_amount: 0,
    dec_amount: 0,
    notes: '',
  }
}

// Populate form when editing
watch(existingBudget, (budget) => {
  if (budget && isEditing.value) {
    name.value = budget.name
    description.value = budget.description ?? ''
    fiscalPeriodId.value = String(budget.fiscal_period_id)
    budgetType.value = budget.type as 'annual' | 'quarterly' | 'monthly'
    notes.value = budget.notes ?? ''

    if (budget.lines && budget.lines.length > 0) {
      lines.value = budget.lines.map(line => ({
        id: line.id,
        account_id: line.account_id,
        annual_amount: line.annual_amount,
        jan_amount: line.jan_amount ?? 0,
        feb_amount: line.feb_amount ?? 0,
        mar_amount: line.mar_amount ?? 0,
        apr_amount: line.apr_amount ?? 0,
        may_amount: line.may_amount ?? 0,
        jun_amount: line.jun_amount ?? 0,
        jul_amount: line.jul_amount ?? 0,
        aug_amount: line.aug_amount ?? 0,
        sep_amount: line.sep_amount ?? 0,
        oct_amount: line.oct_amount ?? 0,
        nov_amount: line.nov_amount ?? 0,
        dec_amount: line.dec_amount ?? 0,
        notes: line.notes ?? '',
      }))
    }
  }
}, { immediate: true })

// Calculate totals
const totals = computed(() => {
  let totalRevenue = 0
  let totalExpense = 0

  for (const line of lines.value) {
    if (line.account_id > 0 && line.annual_amount > 0) {
      // Find account to check type
      const account = accounts.value?.find(a => a.id === line.account_id)
      if (account) {
        if (account.type === 'revenue') {
          totalRevenue += line.annual_amount
        } else if (account.type === 'expense') {
          totalExpense += line.annual_amount
        }
      }
    }
  }

  return {
    totalRevenue,
    totalExpense,
    netBudget: totalRevenue - totalExpense,
  }
})

// Add new line
function addLine() {
  lines.value.push(createEmptyLine())
}

// Remove line
function removeLine(index: number) {
  if (lines.value.length > 1) {
    lines.value.splice(index, 1)
  }
}

// Distribute annual amount evenly across months
function distributeEvenly(index: number) {
  const line = lines.value[index]
  if (!line || line.annual_amount <= 0) return

  const monthlyAmount = Math.round(line.annual_amount / 12)
  const remainder = line.annual_amount - (monthlyAmount * 12)

  line.jan_amount = monthlyAmount
  line.feb_amount = monthlyAmount
  line.mar_amount = monthlyAmount
  line.apr_amount = monthlyAmount
  line.may_amount = monthlyAmount
  line.jun_amount = monthlyAmount
  line.jul_amount = monthlyAmount
  line.aug_amount = monthlyAmount
  line.sep_amount = monthlyAmount
  line.oct_amount = monthlyAmount
  line.nov_amount = monthlyAmount
  line.dec_amount = monthlyAmount + remainder // Add remainder to December
}

// Recalculate annual from monthly
function recalculateAnnual(index: number) {
  const line = lines.value[index]
  if (!line) return

  line.annual_amount =
    line.jan_amount +
    line.feb_amount +
    line.mar_amount +
    line.apr_amount +
    line.may_amount +
    line.jun_amount +
    line.jul_amount +
    line.aug_amount +
    line.sep_amount +
    line.oct_amount +
    line.nov_amount +
    line.dec_amount
}

// Mutations
const createMutation = useCreateBudget()
const updateMutation = useUpdateBudget()

const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

// Submit form
async function handleSubmit() {
  // Validation
  if (!name.value.trim()) {
    toast.error('Budget name is required')
    return
  }

  if (!fiscalPeriodId.value) {
    toast.error('Fiscal period is required')
    return
  }

  // Filter out empty lines
  const validLines = lines.value.filter(line => line.account_id > 0)

  if (validLines.length === 0) {
    toast.error('At least one budget line is required')
    return
  }

  const budgetLines: CreateBudgetLineData[] = validLines.map(line => ({
    account_id: line.account_id,
    annual_amount: line.annual_amount,
    jan_amount: line.jan_amount || undefined,
    feb_amount: line.feb_amount || undefined,
    mar_amount: line.mar_amount || undefined,
    apr_amount: line.apr_amount || undefined,
    may_amount: line.may_amount || undefined,
    jun_amount: line.jun_amount || undefined,
    jul_amount: line.jul_amount || undefined,
    aug_amount: line.aug_amount || undefined,
    sep_amount: line.sep_amount || undefined,
    oct_amount: line.oct_amount || undefined,
    nov_amount: line.nov_amount || undefined,
    dec_amount: line.dec_amount || undefined,
    notes: line.notes || undefined,
  }))

  try {
    if (isEditing.value) {
      const data: UpdateBudgetData = {
        name: name.value,
        description: description.value || undefined,
        type: budgetType.value,
        notes: notes.value || undefined,
      }

      await updateMutation.mutateAsync({ id: budgetId.value!, data })
      toast.success('Budget updated')
      router.push(`/accounting/budgets/${budgetId.value}`)
    } else {
      const data: CreateBudgetData = {
        name: name.value,
        description: description.value || undefined,
        fiscal_period_id: Number(fiscalPeriodId.value),
        type: budgetType.value,
        notes: notes.value || undefined,
        lines: budgetLines,
      }

      const newBudget = await createMutation.mutateAsync(data)
      toast.success('Budget created')
      router.push(`/accounting/budgets/${newBudget.id}`)
    }
  } catch (error) {
    toast.error(isEditing.value ? 'Failed to update budget' : 'Failed to create budget')
  }
}

// Check if budget is draft (editable)
const canEdit = computed(() => {
  if (!isEditing.value) return true
  return existingBudget.value?.status.value === 'draft'
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button variant="ghost" size="sm" @click="router.back()">
        <ArrowLeft class="w-4 h-4" />
      </Button>
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {{ isEditing ? 'Edit Budget' : 'New Budget' }}
        </h1>
        <p class="text-slate-500 dark:text-slate-400">
          {{ isEditing ? 'Update budget details' : 'Create a new budget for tracking expenses' }}
        </p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="budgetLoading || periodsLoading || accountsLoading" class="text-center py-12">
      <Loader2 class="w-8 h-8 mx-auto animate-spin text-slate-400" />
      <p class="mt-2 text-slate-500 dark:text-slate-400">Loading...</p>
    </div>

    <!-- Not Editable Warning -->
    <Card v-else-if="isEditing && !canEdit" class="text-center py-12">
      <p class="text-slate-500 dark:text-slate-400">
        This budget is {{ existingBudget?.status.label }} and cannot be edited.
      </p>
      <Button variant="ghost" class="mt-4" @click="router.back()">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Go Back
      </Button>
    </Card>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit">
      <!-- Basic Info -->
      <Card class="mb-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Budget Information</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Name -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Budget Name <span class="text-red-500">*</span>
            </label>
            <Input v-model="name" placeholder="e.g., Operating Budget 2024" required />
          </div>

          <!-- Fiscal Period -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Fiscal Period <span class="text-red-500">*</span>
            </label>
            <Select
              v-model="fiscalPeriodId"
              :options="fiscalPeriodOptions"
              placeholder="Select fiscal period"
              :disabled="isEditing"
            />
          </div>

          <!-- Type -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Budget Type
            </label>
            <Select v-model="budgetType" :options="typeOptions" />
          </div>

          <!-- Description -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <Input v-model="description" placeholder="Brief description of this budget" />
          </div>

          <!-- Notes -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Notes
            </label>
            <Textarea v-model="notes" placeholder="Additional notes..." :rows="3" />
          </div>
        </div>
      </Card>

      <!-- Budget Lines -->
      <Card class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Budget Lines</h2>
          <Button type="button" variant="secondary" size="sm" @click="addLine">
            <Plus class="w-4 h-4 mr-1" />
            Add Line
          </Button>
        </div>

        <div class="space-y-4">
          <div
            v-for="(line, index) in lines"
            :key="index"
            class="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
          >
            <div class="flex items-start gap-4">
              <!-- Account Selection -->
              <div class="flex-1">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Account
                </label>
                <Select
                  :model-value="line.account_id ? String(line.account_id) : ''"
                  :options="accountOptions"
                  placeholder="Select account"
                  @update:model-value="(v) => line.account_id = v ? Number(v) : 0"
                />
              </div>

              <!-- Annual Amount -->
              <div class="w-40">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Annual Amount
                </label>
                <CurrencyInput v-model="line.annual_amount" />
              </div>

              <!-- Actions -->
              <div class="flex items-end gap-2 pb-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  title="Distribute evenly"
                  @click="distributeEvenly(index)"
                >
                  Distribute
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  :disabled="lines.length <= 1"
                  @click="removeLine(index)"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>

            <!-- Monthly Breakdown (collapsed by default, expandable) -->
            <details class="mt-3">
              <summary class="text-sm text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300">
                Monthly breakdown
              </summary>
              <div class="mt-3 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Jan</label>
                  <CurrencyInput v-model="line.jan_amount" size="sm" @blur="recalculateAnnual(index)" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Feb</label>
                  <CurrencyInput v-model="line.feb_amount" size="sm" @blur="recalculateAnnual(index)" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Mar</label>
                  <CurrencyInput v-model="line.mar_amount" size="sm" @blur="recalculateAnnual(index)" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Apr</label>
                  <CurrencyInput v-model="line.apr_amount" size="sm" @blur="recalculateAnnual(index)" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">May</label>
                  <CurrencyInput v-model="line.may_amount" size="sm" @blur="recalculateAnnual(index)" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Jun</label>
                  <CurrencyInput v-model="line.jun_amount" size="sm" @blur="recalculateAnnual(index)" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Jul</label>
                  <CurrencyInput v-model="line.jul_amount" size="sm" @blur="recalculateAnnual(index)" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Aug</label>
                  <CurrencyInput v-model="line.aug_amount" size="sm" @blur="recalculateAnnual(index)" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Sep</label>
                  <CurrencyInput v-model="line.sep_amount" size="sm" @blur="recalculateAnnual(index)" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Oct</label>
                  <CurrencyInput v-model="line.oct_amount" size="sm" @blur="recalculateAnnual(index)" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Nov</label>
                  <CurrencyInput v-model="line.nov_amount" size="sm" @blur="recalculateAnnual(index)" />
                </div>
                <div>
                  <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Dec</label>
                  <CurrencyInput v-model="line.dec_amount" size="sm" @blur="recalculateAnnual(index)" />
                </div>
              </div>
              <div class="mt-2">
                <label class="block text-xs text-slate-500 dark:text-slate-400 mb-0.5">Line Notes</label>
                <Input v-model="line.notes" size="sm" placeholder="Notes for this line" />
              </div>
            </details>
          </div>
        </div>
      </Card>

      <!-- Summary -->
      <Card class="mb-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Budget Summary</h2>
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Total Revenue</div>
            <div class="text-xl font-bold text-green-600 dark:text-green-400">
              {{ formatCurrency(totals.totalRevenue) }}
            </div>
          </div>
          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Total Expense</div>
            <div class="text-xl font-bold text-red-600 dark:text-red-400">
              {{ formatCurrency(totals.totalExpense) }}
            </div>
          </div>
          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Net Budget</div>
            <div
              class="text-xl font-bold"
              :class="totals.netBudget >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
            >
              {{ formatCurrency(totals.netBudget) }}
            </div>
          </div>
        </div>
      </Card>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">
          Cancel
        </Button>
        <Button type="submit" :loading="isSubmitting">
          <Save class="w-4 h-4 mr-2" />
          {{ isEditing ? 'Update Budget' : 'Create Budget' }}
        </Button>
      </div>
    </form>
  </div>
</template>
