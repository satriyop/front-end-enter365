<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsLookup } from '@/api/useAccounts'
import {
  useCashRounding,
  useCreateCashRounding,
  useUpdateCashRounding,
  type CashRoundingStrategy,
} from '@/api/useCashRoundings'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const roundingId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!roundingId.value)
const { data: existing } = useCashRounding(roundingId)
const { data: accounts } = useAccountsLookup()

const name = ref('')
const rounding = ref('100')
const strategy = ref<CashRoundingStrategy>('half_up')
const profitAccountId = ref('')
const lossAccountId = ref('')
const isActive = ref(true)

watch(existing, (rule) => {
  if (!rule) return
  name.value = rule.name
  rounding.value = String(rule.rounding)
  strategy.value = rule.strategy
  profitAccountId.value = rule.profit_account_id ? String(rule.profit_account_id) : ''
  lossAccountId.value = rule.loss_account_id ? String(rule.loss_account_id) : ''
  isActive.value = rule.is_active
}, { immediate: true })

const accountOptions = computed(() =>
  (accounts.value ?? []).map((account) => ({
    value: String(account.id),
    label: account.code + ' · ' + account.name,
  })),
)

const strategyOptions = [
  { value: 'half_up', label: 'Half-up' },
  { value: 'up', label: 'Up' },
  { value: 'down', label: 'Down' },
]

const createMutation = useCreateCashRounding()
const updateMutation = useUpdateCashRounding()

function goBack() {
  router.push('/accounting/cash-roundings')
}

async function handleSubmit() {
  if (!name.value.trim() || !rounding.value) {
    toast.error('Name and rounding unit are required')
    return
  }
  const payload = {
    name: name.value.trim(),
    rounding: Number(rounding.value),
    strategy: strategy.value,
    profit_account_id: profitAccountId.value ? Number(profitAccountId.value) : null,
    loss_account_id: lossAccountId.value ? Number(lossAccountId.value) : null,
    is_active: isActive.value,
  }
  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: roundingId.value, data: payload })
      toast.success('Cash rounding updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Cash rounding created')
    }
    goBack()
  } catch {
    toast.error('Failed to save cash rounding')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goBack">
        <ArrowLeft class="w-4 h-4" />
        Cash Roundings
      </button>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Cash Rounding' : 'New Cash Rounding' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="name" data-testid="cash-rounding-name" placeholder="Name" />
        <Input v-model="rounding" type="number" min="1" data-testid="cash-rounding-unit" placeholder="Rounding unit (sen)" />
        <Select
          :model-value="strategy"
          :options="strategyOptions"
          placeholder="Strategy"
          test-id="cash-rounding-strategy"
          @update:model-value="(v) => { strategy = (v ? String(v) : 'half_up') as CashRoundingStrategy }"
        />
        <Select
          :model-value="profitAccountId"
          :options="accountOptions"
          placeholder="Profit account"
          @update:model-value="(v) => { profitAccountId = v ? String(v) : '' }"
        />
        <Select
          :model-value="lossAccountId"
          :options="accountOptions"
          placeholder="Loss account"
          @update:model-value="(v) => { lossAccountId = v ? String(v) : '' }"
        />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isActive" type="checkbox">
          Active
        </label>
      </Card>
      <Button type="submit" data-testid="cash-rounding-save">Save</Button>
    </form>
  </div>
</template>
