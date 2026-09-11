<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsLookup } from '@/api/useAccounts'
import { useCreateLoan, useLoan, useUpdateLoan } from '@/api/useLoans'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const loanId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!loanId.value)
const { data: existing } = useLoan(loanId)
const { data: liabilityAccounts } = useAccountsLookup('liability')
const { data: expenseAccounts } = useAccountsLookup('expense')
const { data: assetAccounts } = useAccountsLookup('asset')

const code = ref('')
const name = ref('')
const principal = ref('')
const annualInterestRate = ref('0')
const durationMonths = ref('12')
const startDate = ref(new Date().toISOString().slice(0, 10))
const liabilityAccountId = ref('')
const interestAccountId = ref('')
const bankAccountId = ref('')

watch(existing, (loan) => {
  if (!loan) return
  code.value = loan.code
  name.value = loan.name
  principal.value = String(loan.principal)
  annualInterestRate.value = String(loan.annual_interest_rate)
  durationMonths.value = String(loan.duration_months)
  startDate.value = loan.start_date
  liabilityAccountId.value = String(loan.liability_account_id)
  interestAccountId.value = String(loan.interest_account_id)
  bankAccountId.value = String(loan.bank_account_id)
}, { immediate: true })

function toAccountOptions(accounts: { id: number; code: string; name: string }[] | undefined) {
  return (accounts ?? []).map((account) => ({
    value: String(account.id),
    label: account.code + ' · ' + account.name,
  }))
}

const liabilityOptions = computed(() => toAccountOptions(liabilityAccounts.value))
const interestOptions = computed(() => toAccountOptions(expenseAccounts.value))
const bankOptions = computed(() => toAccountOptions(assetAccounts.value))

const createMutation = useCreateLoan()
const updateMutation = useUpdateLoan()

function goBack() {
  if (isEditing.value) {
    router.push('/accounting/loans/' + loanId.value)
    return
  }
  router.push('/accounting/loans')
}

async function handleSubmit() {
  if (!code.value.trim() || !name.value.trim() || !principal.value) {
    toast.error('Code, name, and principal are required')
    return
  }
  if (!liabilityAccountId.value || !interestAccountId.value || !bankAccountId.value) {
    toast.error('Liability, interest, and bank accounts are required')
    return
  }

  const payload = {
    code: code.value.trim(),
    name: name.value.trim(),
    principal: Number(principal.value),
    annual_interest_rate: Number(annualInterestRate.value) || 0,
    duration_months: Number(durationMonths.value),
    start_date: startDate.value,
    liability_account_id: Number(liabilityAccountId.value),
    interest_account_id: Number(interestAccountId.value),
    bank_account_id: Number(bankAccountId.value),
  }

  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: loanId.value, data: payload })
      toast.success('Loan updated')
      router.push('/accounting/loans/' + loanId.value)
    } else {
      const created = await createMutation.mutateAsync(payload)
      toast.success('Loan created')
      router.push('/accounting/loans/' + created.id)
    }
  } catch {
    toast.error('Failed to save loan')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goBack">
        <ArrowLeft class="w-4 h-4" />
        Loans
      </button>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Loan' : 'New Loan' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="code" data-testid="loan-code" placeholder="Code" />
        <Input v-model="name" data-testid="loan-name" placeholder="Name" />
        <Input v-model="principal" type="number" min="1" data-testid="loan-principal" placeholder="Principal" />
        <Input v-model="annualInterestRate" type="number" min="0" step="0.01" data-testid="loan-interest-rate" placeholder="Annual interest %" />
        <Input v-model="durationMonths" type="number" min="1" data-testid="loan-duration" placeholder="Duration (months)" />
        <Input v-model="startDate" type="date" data-testid="loan-start-date" />
        <Select
          :model-value="liabilityAccountId"
          :options="liabilityOptions"
          placeholder="Liability account"
          test-id="loan-liability-account"
          @update:model-value="(v) => { liabilityAccountId = v ? String(v) : '' }"
        />
        <Select
          :model-value="interestAccountId"
          :options="interestOptions"
          placeholder="Interest expense account"
          test-id="loan-interest-account"
          @update:model-value="(v) => { interestAccountId = v ? String(v) : '' }"
        />
        <Select
          :model-value="bankAccountId"
          :options="bankOptions"
          placeholder="Bank / cash account"
          test-id="loan-bank-account"
          @update:model-value="(v) => { bankAccountId = v ? String(v) : '' }"
        />
      </Card>
      <Button type="submit" data-testid="loan-save">Save</Button>
    </form>
  </div>
</template>
