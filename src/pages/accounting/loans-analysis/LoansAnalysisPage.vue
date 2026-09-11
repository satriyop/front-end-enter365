<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLoansAnalysis, type LoanAnalysisUpcoming } from '@/api/useLoans'
import { formatCurrency, formatDate } from '@/utils/format'
import { Card, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'

const router = useRouter()
const { data, isLoading, error } = useLoansAnalysis()

function openLoan(row: LoanAnalysisUpcoming) {
  router.push('/accounting/loans/' + row.loan_id)
}

const statusColumns: ResponsiveColumn[] = [
  { key: 'status', label: 'Status', mobilePriority: 1 },
  { key: 'loan_count', label: 'Loans', mobilePriority: 2 },
  { key: 'total_principal', label: 'Principal', mobilePriority: 3 },
  { key: 'remaining_principal', label: 'Remaining', mobilePriority: 4 },
]

const upcomingColumns: ResponsiveColumn[] = [
  { key: 'due_date', label: 'Due', mobilePriority: 1 },
  { key: 'loan_code', label: 'Loan', mobilePriority: 2 },
  { key: 'payment_amount', label: 'Payment', mobilePriority: 3 },
  { key: 'principal_amount', label: 'Principal', showInMobile: false },
  { key: 'interest_amount', label: 'Interest', showInMobile: false },
  { key: 'status', label: 'Status', mobilePriority: 4 },
]
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Loans Analysis</h1>
      <p class="text-slate-500 dark:text-slate-400">
        Review remaining principal, posted interest, and upcoming installments.
      </p>
    </div>

    <div v-if="error" class="text-red-500">Failed to load loans analysis</div>
    <div v-else-if="isLoading || !data" class="text-slate-500">Loading…</div>
    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card class="p-4">
          <div class="text-sm text-slate-500">Loans</div>
          <div class="font-semibold">{{ data.loan_count }} ({{ data.running_count }} running)</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Principal</div>
          <div class="font-semibold">{{ formatCurrency(data.total_principal) }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Remaining</div>
          <div class="font-semibold">{{ formatCurrency(data.remaining_principal) }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Interest posted</div>
          <div class="font-semibold">{{ formatCurrency(data.interest_posted) }}</div>
        </Card>
      </div>

      <Card class="mb-6">
        <div class="p-4 font-semibold">By status</div>
        <div v-if="!data.by_status.length" class="py-8 text-center text-slate-500">
          No loans yet. Create a loan from the register.
        </div>
        <ResponsiveTable
          v-else
          :items="data.by_status"
          :columns="statusColumns"
          row-key="status"
        >
          <template #cell-total_principal="{ item }">{{ formatCurrency(item.total_principal) }}</template>
          <template #cell-remaining_principal="{ item }">{{ formatCurrency(item.remaining_principal) }}</template>
        </ResponsiveTable>
      </Card>

      <Card>
        <div class="p-4 font-semibold">Upcoming installments</div>
        <div v-if="!data.upcoming.length" class="py-8 text-center text-slate-500">
          No draft installments. Confirm a loan to generate its board.
        </div>
        <ResponsiveTable
          v-else
          :items="data.upcoming"
          :columns="upcomingColumns"
          row-key="id"
          @row-click="openLoan"
        >
          <template #cell-due_date="{ item }">{{ formatDate(item.due_date) }}</template>
          <template #cell-loan_code="{ item }">{{ item.loan_code }} · {{ item.loan_name }}</template>
          <template #cell-payment_amount="{ item }">{{ formatCurrency(item.payment_amount) }}</template>
          <template #cell-principal_amount="{ item }">{{ formatCurrency(item.principal_amount) }}</template>
          <template #cell-interest_amount="{ item }">{{ formatCurrency(item.interest_amount) }}</template>
        </ResponsiveTable>
      </Card>
    </template>
  </div>
</template>
