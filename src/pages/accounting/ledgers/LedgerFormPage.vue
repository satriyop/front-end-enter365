<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useAccountingLedger,
  useCreateAccountingLedger,
  useUpdateAccountingLedger,
} from '@/api/useAccountingLedgers'
import { useCurrenciesLookup } from '@/api/useCurrencies'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const ledgerId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!ledgerId.value)
const { data: existing } = useAccountingLedger(ledgerId)
const { data: currencies } = useCurrenciesLookup()

const code = ref('')
const name = ref('')
const currencyCode = ref('IDR')
const isDefault = ref(false)
const isActive = ref(true)

watch(existing, (ledger) => {
  if (!ledger) return
  code.value = ledger.code
  name.value = ledger.name
  currencyCode.value = ledger.currency_code || 'IDR'
  isDefault.value = ledger.is_default
  isActive.value = ledger.is_active
}, { immediate: true })

const currencyOptions = computed(() =>
  (currencies.value ?? []).map((currency) => ({
    value: currency.code,
    label: currency.code + ' · ' + currency.name,
  })),
)

const createMutation = useCreateAccountingLedger()
const updateMutation = useUpdateAccountingLedger()

function goBack() {
  router.push('/accounting/ledgers')
}

async function handleSubmit() {
  if (!code.value.trim() || !name.value.trim()) {
    toast.error('Code and name are required')
    return
  }
  const payload = {
    code: code.value.trim().toUpperCase(),
    name: name.value.trim(),
    currency_code: currencyCode.value || null,
    is_default: isDefault.value,
    is_active: isActive.value,
  }
  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: ledgerId.value, data: payload })
      toast.success('Ledger updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Ledger created')
    }
    goBack()
  } catch {
    toast.error('Failed to save ledger')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goBack">
        <ArrowLeft class="w-4 h-4" />
        Multi Ledgers
      </button>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Ledger' : 'New Ledger' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="code" data-testid="ledger-code" placeholder="Code" />
        <Input v-model="name" data-testid="ledger-name" placeholder="Name" />
        <Select
          :model-value="currencyCode"
          :options="currencyOptions"
          placeholder="Currency"
          test-id="ledger-currency"
          @update:model-value="(v) => { currencyCode = v ? String(v) : '' }"
        />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isDefault" type="checkbox" data-testid="ledger-default">
          Default ledger
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isActive" type="checkbox">
          Active
        </label>
      </Card>
      <Button type="submit" data-testid="ledger-save">Save</Button>
    </form>
  </div>
</template>
