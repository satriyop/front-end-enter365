<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsLookup } from '@/api/useAccounts'
import { useJournalsLookup } from '@/api/useJournals'
import {
  useAccountingTransfer,
  useCreateAccountingTransfer,
  useUpdateAccountingTransfer,
} from '@/api/useAccountingTransfers'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const transferId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!transferId.value)
const { data: existing } = useAccountingTransfer(transferId)
const { data: journals } = useJournalsLookup()
const { data: accounts } = useAccountsLookup()

const transferDate = ref(new Date().toISOString().slice(0, 10))
const fromJournalId = ref('')
const toJournalId = ref('')
const fromAccountId = ref('')
const toAccountId = ref('')
const amount = ref('')
const memo = ref('')

watch(existing, (transfer) => {
  if (!transfer) return
  transferDate.value = transfer.transfer_date
  fromJournalId.value = String(transfer.from_journal_id)
  toJournalId.value = String(transfer.to_journal_id)
  fromAccountId.value = String(transfer.from_account_id)
  toAccountId.value = String(transfer.to_account_id)
  amount.value = String(transfer.amount)
  memo.value = transfer.memo ?? ''
}, { immediate: true })

const journalOptions = computed(() =>
  (journals.value ?? []).map((journal) => ({
    value: String(journal.id),
    label: journal.name + ' (' + journal.type + ')',
  })),
)

const accountOptions = computed(() =>
  (accounts.value ?? []).map((account) => ({
    value: String(account.id),
    label: account.code + ' · ' + account.name,
  })),
)

watch(fromJournalId, (id) => {
  if (isEditing.value || !id) return
  const journal = (journals.value ?? []).find((row) => String(row.id) === id)
  if (journal?.default_account_id) {
    fromAccountId.value = String(journal.default_account_id)
  }
})

watch(toJournalId, (id) => {
  if (isEditing.value || !id) return
  const journal = (journals.value ?? []).find((row) => String(row.id) === id)
  if (journal?.default_account_id) {
    toAccountId.value = String(journal.default_account_id)
  }
})

const createMutation = useCreateAccountingTransfer()
const updateMutation = useUpdateAccountingTransfer()

function goBack() {
  if (isEditing.value) {
    router.push('/accounting/transfers/' + transferId.value)
    return
  }
  router.push('/accounting/transfers')
}

async function handleSubmit() {
  if (!fromJournalId.value || !toJournalId.value || !amount.value) {
    toast.error('Journals and amount are required')
    return
  }

  const payload = {
    transfer_date: transferDate.value,
    from_journal_id: Number(fromJournalId.value),
    to_journal_id: Number(toJournalId.value),
    from_account_id: fromAccountId.value ? Number(fromAccountId.value) : null,
    to_account_id: toAccountId.value ? Number(toAccountId.value) : null,
    amount: Number(amount.value),
    memo: memo.value.trim() || null,
  }

  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: transferId.value, data: payload })
      toast.success('Transfer updated')
      router.push('/accounting/transfers/' + transferId.value)
    } else {
      const created = await createMutation.mutateAsync(payload)
      toast.success('Transfer created')
      router.push('/accounting/transfers/' + created.id)
    }
  } catch {
    toast.error('Failed to save transfer')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goBack">
        <ArrowLeft class="w-4 h-4" />
        Transfers
      </button>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Transfer' : 'New Transfer' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="transferDate" type="date" data-testid="transfer-date" />
        <Select
          :model-value="fromJournalId"
          :options="journalOptions"
          placeholder="From journal"
          test-id="transfer-from-journal"
          @update:model-value="(v) => { fromJournalId = v ? String(v) : '' }"
        />
        <Select
          :model-value="toJournalId"
          :options="journalOptions"
          placeholder="To journal"
          test-id="transfer-to-journal"
          @update:model-value="(v) => { toJournalId = v ? String(v) : '' }"
        />
        <Select
          :model-value="fromAccountId"
          :options="accountOptions"
          placeholder="From account"
          test-id="transfer-from-account"
          @update:model-value="(v) => { fromAccountId = v ? String(v) : '' }"
        />
        <Select
          :model-value="toAccountId"
          :options="accountOptions"
          placeholder="To account"
          test-id="transfer-to-account"
          @update:model-value="(v) => { toAccountId = v ? String(v) : '' }"
        />
        <Input v-model="amount" type="number" min="1" data-testid="transfer-amount" placeholder="Amount" />
        <Input v-model="memo" data-testid="transfer-memo" placeholder="Memo" />
      </Card>
      <Button type="submit" data-testid="transfer-save">Save</Button>
    </form>
  </div>
</template>
