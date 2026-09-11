<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsLookup } from '@/api/useAccounts'
import {
  useCreateEmployeeExpense,
  useEmployeeExpense,
  useUpdateEmployeeExpense,
} from '@/api/useEmployeeExpenses'
import { useUsers } from '@/api/useUsers'
import { toLocalISODate } from '@/utils/format'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const expenseId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!expenseId.value)
const { data: existing } = useEmployeeExpense(expenseId)
const { data: accounts } = useAccountsLookup('expense')
const userFilters = ref({ page: 1, per_page: 100, is_active: true })
const { data: usersPage } = useUsers(userFilters)

const employeeId = ref('')
const expenseDate = ref(toLocalISODate())
const description = ref('')
const amount = ref('')
const taxAmount = ref('0')
const expenseAccountId = ref('')
const notes = ref('')

watch(existing, (expense) => {
  if (!expense) return
  employeeId.value = String(expense.employee_id)
  expenseDate.value = expense.expense_date
  description.value = expense.description
  amount.value = String(expense.amount)
  taxAmount.value = String(expense.tax_amount)
  expenseAccountId.value = String(expense.expense_account_id)
  notes.value = expense.notes ?? ''
}, { immediate: true })

const employeeOptions = computed(() =>
  (usersPage.value?.data ?? []).map((user) => ({
    value: String(user.id),
    label: user.name,
  })),
)

const accountOptions = computed(() =>
  (accounts.value ?? []).map((account) => ({
    value: String(account.id),
    label: account.code + ' · ' + account.name,
  })),
)

const createMutation = useCreateEmployeeExpense()
const updateMutation = useUpdateEmployeeExpense()

function goBack() {
  if (isEditing.value) {
    router.push('/accounting/employee-expenses/' + expenseId.value)
    return
  }
  router.push('/accounting/employee-expenses')
}

async function handleSubmit() {
  if (!employeeId.value || !description.value.trim() || !amount.value || !expenseAccountId.value) {
    toast.error('Employee, description, amount, and expense account are required')
    return
  }
  const payload = {
    employee_id: Number(employeeId.value),
    expense_date: expenseDate.value,
    description: description.value.trim(),
    amount: Number(amount.value),
    tax_amount: Number(taxAmount.value) || 0,
    expense_account_id: Number(expenseAccountId.value),
    notes: notes.value.trim() || null,
  }
  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: expenseId.value, data: payload })
      toast.success('Expense updated')
      router.push('/accounting/employee-expenses/' + expenseId.value)
    } else {
      const created = await createMutation.mutateAsync(payload)
      toast.success('Expense created')
      router.push('/accounting/employee-expenses/' + created.id)
    }
  } catch {
    toast.error('Failed to save expense')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goBack">
        <ArrowLeft class="w-4 h-4" />
        Employee Expenses
      </button>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Employee Expense' : 'New Employee Expense' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Select
          :model-value="employeeId"
          :options="employeeOptions"
          placeholder="Employee"
          test-id="employee-expense-employee"
          @update:model-value="(v) => { employeeId = v ? String(v) : '' }"
        />
        <Input v-model="expenseDate" type="date" data-testid="employee-expense-date" />
        <Input v-model="description" data-testid="employee-expense-description" placeholder="Description" />
        <Input v-model="amount" type="number" min="1" data-testid="employee-expense-amount" placeholder="Amount (sen)" />
        <Input v-model="taxAmount" type="number" min="0" placeholder="Tax (sen)" />
        <Select
          :model-value="expenseAccountId"
          :options="accountOptions"
          placeholder="Expense account"
          test-id="employee-expense-account"
          @update:model-value="(v) => { expenseAccountId = v ? String(v) : '' }"
        />
        <Input v-model="notes" placeholder="Notes" />
      </Card>
      <Button type="submit" data-testid="employee-expense-save">Save</Button>
    </form>
  </div>
</template>
