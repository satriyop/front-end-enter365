<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useApproveEmployeeExpense,
  useCancelEmployeeExpense,
  useEmployeeExpense,
  usePostEmployeeExpense,
  useRefuseEmployeeExpense,
  useSubmitEmployeeExpense,
} from '@/api/useEmployeeExpenses'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const expenseId = computed(() => String(route.params.id ?? ''))
const { data: expense, isLoading, error } = useEmployeeExpense(expenseId)
const submitMutation = useSubmitEmployeeExpense()
const approveMutation = useApproveEmployeeExpense()
const refuseMutation = useRefuseEmployeeExpense()
const postMutation = usePostEmployeeExpense()
const cancelMutation = useCancelEmployeeExpense()

async function run(action: () => Promise<unknown>, success: string, failure: string) {
  try {
    await action()
    toast.success(success)
  } catch {
    toast.error(failure)
  }
}

function editExpense() {
  router.push('/accounting/employee-expenses/' + expenseId.value + '/edit')
}

function goList() {
  router.push('/accounting/employee-expenses')
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goList">
        <ArrowLeft class="w-4 h-4" />
        Employee Expenses
      </button>
    </div>

    <div v-if="error" class="text-red-500">Failed to load expense</div>
    <div v-else-if="isLoading || !expense" class="text-slate-500">Loading…</div>
    <template v-else>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold">{{ expense.expense_number }}</h1>
          <p class="text-slate-500">{{ expense.status }} · {{ formatDate(expense.expense_date) }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button v-if="expense.status === 'draft'" variant="secondary" @click="editExpense">Edit</Button>
          <Button
            v-if="expense.status === 'draft'"
            data-testid="employee-expense-submit"
            @click="run(() => submitMutation.mutateAsync({ id: expenseId }), 'Submitted', 'Failed to submit')"
          >
            Submit
          </Button>
          <Button
            v-if="expense.status === 'submitted'"
            data-testid="employee-expense-approve"
            @click="run(() => approveMutation.mutateAsync({ id: expenseId }), 'Approved', 'Failed to approve')"
          >
            Approve
          </Button>
          <Button
            v-if="expense.status === 'submitted'"
            variant="secondary"
            data-testid="employee-expense-refuse"
            @click="run(() => refuseMutation.mutateAsync({ id: expenseId }), 'Refused', 'Failed to refuse')"
          >
            Refuse
          </Button>
          <Button
            v-if="expense.status === 'approved'"
            data-testid="employee-expense-post"
            @click="run(() => postMutation.mutateAsync({ id: expenseId }), 'Posted', 'Failed to post')"
          >
            Post
          </Button>
          <Button
            v-if="expense.status === 'posted' || expense.status === 'approved' || expense.status === 'draft'"
            variant="secondary"
            data-testid="employee-expense-cancel"
            @click="run(() => cancelMutation.mutateAsync({ id: expenseId }), 'Cancelled', 'Failed to cancel')"
          >
            Cancel
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card class="p-4">
          <div class="text-sm text-slate-500">Employee</div>
          <div class="font-semibold">{{ expense.employee?.name ?? '—' }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Account</div>
          <div class="font-semibold">
            {{ expense.expense_account ? expense.expense_account.code + ' · ' + expense.expense_account.name : '—' }}
          </div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Total</div>
          <div class="font-semibold">{{ formatCurrency(expense.total_amount) }}</div>
        </Card>
      </div>

      <Card class="p-4 space-y-2">
        <div><span class="text-slate-500">Description:</span> {{ expense.description }}</div>
        <div><span class="text-slate-500">Amount:</span> {{ formatCurrency(expense.amount) }}</div>
        <div><span class="text-slate-500">Tax:</span> {{ formatCurrency(expense.tax_amount) }}</div>
        <div v-if="expense.notes"><span class="text-slate-500">Notes:</span> {{ expense.notes }}</div>
      </Card>
    </template>
  </div>
</template>
