<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsLookup } from '@/api/useAccounts'
import {
  deferredBasePath,
  deferredLabel,
  useCreateDeferredEntry,
  useDeferredEntry,
  useUpdateDeferredEntry,
  type DeferredKind,
} from '@/api/useDeferredEntries'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const kind = computed<DeferredKind>(() => (route.meta.kind === 'revenue' ? 'revenue' : 'expense'))
const basePath = computed(() => deferredBasePath(kind.value))
const title = computed(() => deferredLabel(kind.value))
const entryId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!entryId.value)

const { data: existing } = useDeferredEntry(kind.value)(entryId)
const { data: assetAccounts } = useAccountsLookup('asset')
const { data: liabilityAccounts } = useAccountsLookup('liability')
const { data: expenseAccounts } = useAccountsLookup('expense')
const { data: revenueAccounts } = useAccountsLookup('revenue')

const code = ref('')
const name = ref('')
const amount = ref('')
const durationMonths = ref('12')
const startDate = ref(new Date().toISOString().slice(0, 10))
const deferredAccountId = ref('')
const recognitionAccountId = ref('')
const counterpartAccountId = ref('')

watch(existing, (entry) => {
  if (!entry) return
  code.value = entry.code
  name.value = entry.name
  amount.value = String(entry.amount)
  durationMonths.value = String(entry.duration_months)
  startDate.value = entry.start_date
  deferredAccountId.value = String(entry.deferred_account_id)
  recognitionAccountId.value = String(entry.recognition_account_id)
  counterpartAccountId.value = String(entry.counterpart_account_id)
}, { immediate: true })

function toAccountOptions(accounts: { id: number; code: string; name: string }[] | undefined) {
  return (accounts ?? []).map((account) => ({
    value: String(account.id),
    label: account.code + ' · ' + account.name,
  }))
}

const deferredOptions = computed(() =>
  toAccountOptions(kind.value === 'expense' ? assetAccounts.value : liabilityAccounts.value),
)
const recognitionOptions = computed(() =>
  toAccountOptions(kind.value === 'expense' ? expenseAccounts.value : revenueAccounts.value),
)
const counterpartOptions = computed(() => toAccountOptions(assetAccounts.value))

const createMutation = useCreateDeferredEntry(kind.value)
const updateMutation = useUpdateDeferredEntry(kind.value)

function goBack() {
  if (isEditing.value) {
    router.push(basePath.value + '/' + entryId.value)
    return
  }
  router.push(basePath.value)
}

async function handleSubmit() {
  if (!code.value.trim() || !name.value.trim() || !amount.value) {
    toast.error('Code, name, and amount are required')
    return
  }
  if (!deferredAccountId.value || !recognitionAccountId.value || !counterpartAccountId.value) {
    toast.error('Deferred, recognition, and bank accounts are required')
    return
  }

  const payload = {
    code: code.value.trim(),
    name: name.value.trim(),
    amount: Number(amount.value),
    duration_months: Number(durationMonths.value),
    start_date: startDate.value,
    deferred_account_id: Number(deferredAccountId.value),
    recognition_account_id: Number(recognitionAccountId.value),
    counterpart_account_id: Number(counterpartAccountId.value),
  }

  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: entryId.value, data: payload })
      toast.success(title.value.slice(0, -1) + ' updated')
      router.push(basePath.value + '/' + entryId.value)
    } else {
      const created = await createMutation.mutateAsync(payload)
      toast.success(title.value.slice(0, -1) + ' created')
      router.push(basePath.value + '/' + created.id)
    }
  } catch {
    toast.error('Failed to save entry')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goBack">
        <ArrowLeft class="w-4 h-4" />
        {{ title }}
      </button>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit' : 'New' }} {{ kind === 'expense' ? 'Deferred Expense' : 'Deferred Revenue' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="code" data-testid="deferred-code" placeholder="Code" />
        <Input v-model="name" data-testid="deferred-name" placeholder="Name" />
        <Input v-model="amount" type="number" min="1" data-testid="deferred-amount" placeholder="Amount" />
        <Input v-model="durationMonths" type="number" min="1" data-testid="deferred-duration" placeholder="Duration (months)" />
        <Input v-model="startDate" type="date" data-testid="deferred-start-date" />
        <Select
          :model-value="deferredAccountId"
          :options="deferredOptions"
          :placeholder="kind === 'expense' ? 'Prepaid / deferred asset' : 'Unearned / deferred liability'"
          test-id="deferred-account"
          @update:model-value="(v) => { deferredAccountId = v ? String(v) : '' }"
        />
        <Select
          :model-value="recognitionAccountId"
          :options="recognitionOptions"
          :placeholder="kind === 'expense' ? 'Expense account' : 'Revenue account'"
          test-id="deferred-recognition-account"
          @update:model-value="(v) => { recognitionAccountId = v ? String(v) : '' }"
        />
        <Select
          :model-value="counterpartAccountId"
          :options="counterpartOptions"
          placeholder="Bank / cash account"
          test-id="deferred-counterpart-account"
          @update:model-value="(v) => { counterpartAccountId = v ? String(v) : '' }"
        />
      </Card>
      <Button type="submit" data-testid="deferred-save">Save</Button>
    </form>
  </div>
</template>
