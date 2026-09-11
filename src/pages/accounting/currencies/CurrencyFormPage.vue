<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCreateCurrency, useCurrency, useUpdateCurrency } from '@/api/useCurrencies'
import { Button, Card, Input, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const currencyId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!currencyId.value)
const { data: existing } = useCurrency(currencyId)

const code = ref('')
const name = ref('')
const symbol = ref('')
const decimalPlaces = ref('0')
const isBase = ref(false)
const isActive = ref(true)

watch(existing, (currency) => {
  if (!currency) return
  code.value = currency.code
  name.value = currency.name
  symbol.value = currency.symbol
  decimalPlaces.value = String(currency.decimal_places)
  isBase.value = currency.is_base_currency
  isActive.value = currency.is_active
}, { immediate: true })

const createMutation = useCreateCurrency()
const updateMutation = useUpdateCurrency()

function goBack() {
  router.push('/accounting/currencies')
}

async function handleSubmit() {
  if (!code.value.trim() || !name.value.trim() || !symbol.value.trim()) {
    toast.error('Code, name, and symbol are required')
    return
  }
  const payload = {
    code: code.value.trim().toUpperCase(),
    name: name.value.trim(),
    symbol: symbol.value.trim(),
    decimal_places: Number(decimalPlaces.value) || 0,
    is_base_currency: isBase.value,
    is_active: isActive.value,
  }
  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: currencyId.value, data: payload })
      toast.success('Currency updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Currency created')
    }
    goBack()
  } catch {
    toast.error('Failed to save currency')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goBack">
        <ArrowLeft class="w-4 h-4" />
        Currencies
      </button>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Currency' : 'New Currency' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="code" data-testid="currency-code" placeholder="Code (ISO)" maxlength="3" />
        <Input v-model="name" data-testid="currency-name" placeholder="Name" />
        <Input v-model="symbol" data-testid="currency-symbol" placeholder="Symbol" />
        <Input v-model="decimalPlaces" type="number" min="0" max="6" data-testid="currency-decimals" placeholder="Decimal places" />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isBase" type="checkbox" data-testid="currency-base">
          Base currency
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isActive" type="checkbox">
          Active
        </label>
      </Card>
      <Button type="submit" data-testid="currency-save">Save</Button>
    </form>
  </div>
</template>
