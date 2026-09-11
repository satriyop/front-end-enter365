<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useConfirmLoan,
  useLoan,
  usePostLoanInstallment,
} from '@/api/useLoans'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, ResponsiveTable, useToast, type ResponsiveColumn } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const loanId = computed(() => String(route.params.id ?? ''))
const { data: loan, isLoading, error } = useLoan(loanId)
const confirmMutation = useConfirmLoan()
const postMutation = usePostLoanInstallment()

const columns: ResponsiveColumn[] = [
  { key: 'sequence', label: '#', mobilePriority: 1 },
  { key: 'due_date', label: 'Due', mobilePriority: 2 },
  { key: 'principal_amount', label: 'Principal', mobilePriority: 3 },
  { key: 'interest_amount', label: 'Interest', showInMobile: false },
  { key: 'payment_amount', label: 'Payment', mobilePriority: 4 },
  { key: 'remaining_principal', label: 'Remaining', showInMobile: false },
  { key: 'status', label: 'Status', showInMobile: false },
]

async function confirm() {
  try {
    await confirmMutation.mutateAsync(loanId.value)
    toast.success('Loan confirmed and schedule generated')
  } catch {
    toast.error('Failed to confirm loan')
  }
}

async function postNext() {
  try {
    await postMutation.mutateAsync(loanId.value)
    toast.success('Installment posted')
  } catch {
    toast.error('Failed to post installment')
  }
}

function editLoan() {
  router.push('/accounting/loans/' + loanId.value + '/edit')
}

function goList() {
  router.push('/accounting/loans')
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goList">
        <ArrowLeft class="w-4 h-4" />
        Loans
      </button>
    </div>

    <div v-if="error" class="text-red-500">Failed to load loan</div>
    <div v-else-if="isLoading || !loan" class="text-slate-500">Loading…</div>
    <template v-else>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold">{{ loan.code }} · {{ loan.name }}</h1>
          <p class="text-slate-500">{{ loan.status }} · remaining {{ formatCurrency(loan.remaining_principal) }}</p>
        </div>
        <div class="flex gap-2">
          <Button v-if="loan.status === 'draft'" variant="secondary" @click="editLoan">
            Edit
          </Button>
          <Button v-if="loan.status === 'draft'" data-testid="loan-confirm" @click="confirm">
            Confirm
          </Button>
          <Button v-if="loan.status === 'running'" data-testid="loan-post-installment" @click="postNext">
            Post next installment
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card class="p-4">
          <div class="text-sm text-slate-500">Principal</div>
          <div class="font-semibold">{{ formatCurrency(loan.principal) }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Interest rate</div>
          <div class="font-semibold">{{ loan.annual_interest_rate }}% / {{ loan.duration_months }} mo</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Start</div>
          <div class="font-semibold">{{ formatDate(loan.start_date) }}</div>
        </Card>
      </div>

      <Card>
        <div class="p-4 font-semibold">Amortization schedule</div>
        <div v-if="!loan.lines?.length" class="py-8 text-center text-slate-500">
          Confirm the loan to generate the schedule and post disbursement.
        </div>
        <ResponsiveTable
          v-else
          :items="loan.lines"
          :columns="columns"
          row-key="id"
        >
          <template #cell-due_date="{ item }">{{ formatDate(item.due_date) }}</template>
          <template #cell-principal_amount="{ item }">{{ formatCurrency(item.principal_amount) }}</template>
          <template #cell-interest_amount="{ item }">{{ formatCurrency(item.interest_amount) }}</template>
          <template #cell-payment_amount="{ item }">{{ formatCurrency(item.payment_amount) }}</template>
          <template #cell-remaining_principal="{ item }">{{ formatCurrency(item.remaining_principal) }}</template>
        </ResponsiveTable>
      </Card>
    </template>
  </div>
</template>
