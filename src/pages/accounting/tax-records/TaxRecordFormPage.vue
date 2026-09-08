<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsLookup } from '@/api/useAccounts'
import { useCreateTaxRecord, useTaxRecord, useUpdateTaxRecord } from '@/api/useTaxRecords'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const taxId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!taxId.value)
const { data: existing } = useTaxRecord(taxId)
const { data: accounts } = useAccountsLookup()

const code = ref('')
const name = ref('')
const rate = ref('11')
const applicability = ref<'sales' | 'purchase' | 'both'>('sales')
const invoiceAccountId = ref('')
const isActive = ref(true)

watch(existing, (tax) => {
  if (!tax) return
  code.value = tax.code
  name.value = tax.name
  rate.value = String(tax.rate)
  applicability.value = tax.applicability
  invoiceAccountId.value = tax.invoice_account_id ? String(tax.invoice_account_id) : ''
  isActive.value = tax.is_active
}, { immediate: true })

const accountOptions = computed(() =>
  (accounts.value ?? []).map((account) => ({
    value: String(account.id),
    label: `${account.code} · ${account.name}`,
  })),
)

const createMutation = useCreateTaxRecord()
const updateMutation = useUpdateTaxRecord()

async function handleSubmit() {
  const payload = {
    code: code.value.trim(),
    name: name.value.trim(),
    rate: Number(rate.value),
    applicability: applicability.value,
    computation: 'percentage',
    is_active: isActive.value,
    invoice_account_id: invoiceAccountId.value ? Number(invoiceAccountId.value) : null,
  }
  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: taxId.value, data: payload })
      toast.success('Tax updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Tax created')
    }
    router.push('/accounting/tax-records')
  } catch {
    toast.error('Failed to save tax')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <RouterLink to="/accounting/tax-records" class="hover:text-slate-700 flex items-center gap-1">
        <ArrowLeft class="w-4 h-4" />
        Taxes
      </RouterLink>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Tax' : 'New Tax' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="code" data-testid="tax-record-code" placeholder="Code" />
        <Input v-model="name" data-testid="tax-record-name" placeholder="Tax Name" />
        <Input v-model="rate" type="number" step="0.01" data-testid="tax-record-rate" placeholder="Amount %" />
        <Select
          v-model="applicability"
          :options="[
            { value: 'sales', label: 'Sales' },
            { value: 'purchase', label: 'Purchase' },
            { value: 'both', label: 'Sales & Purchase' },
          ]"
        />
        <Select
          :model-value="invoiceAccountId"
          :options="accountOptions"
          placeholder="Distribution account (invoices)"
          @update:model-value="(v) => { invoiceAccountId = v ? String(v) : '' }"
        />
      </Card>
      <Button type="submit" data-testid="tax-record-save">Save</Button>
    </form>
  </div>
</template>
