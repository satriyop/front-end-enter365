<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCreatePayment } from '@/api/usePayments'
import { useContactsLookup } from '@/api/useContacts'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { Button, Input, FormField, Textarea, Select, Card, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Get query params for pre-filling
const initialType = (route.query.type as string) || 'receive'
const initialInvoiceId = route.query.invoice_id ? Number(route.query.invoice_id) : null
const initialBillId = route.query.bill_id ? Number(route.query.bill_id) : null

// Fetch accounts for cash account selection
const { data: accounts } = useQuery({
  queryKey: ['accounts', 'cash'],
  queryFn: async () => {
    const response = await api.get<{ data: Array<{ id: number; code: string; name: string }> }>('/accounts', {
      params: { type: 'asset', per_page: 100 }
    })
    return response.data.data
  },
})

const accountOptions = computed(() =>
  (accounts.value ?? []).map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))
)

// Contacts lookup based on payment type
const contactType = computed(() => form.value.type === 'receive' ? 'customer' : 'supplier')
const { data: contacts } = useContactsLookup(contactType.value as any)
const contactOptions = computed(() =>
  (contacts.value ?? []).map(c => ({ value: c.id, label: c.name }))
)

const typeOptions = [
  { value: 'receive', label: 'Receive Payment (from Customer)' },
  { value: 'pay', label: 'Make Payment (to Vendor)' },
]

const methodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
]

interface FormState {
  type: 'receive' | 'pay'
  contact_id: number | null
  payment_date: string
  amount: number
  payment_method: string
  cash_account_id: number | null
  reference: string
  notes: string
  payable_type: string | null
  payable_id: number | null
}

const today = new Date().toISOString().split('T')[0]
const form = ref<FormState>({
  type: initialType as 'receive' | 'pay',
  contact_id: null,
  payment_date: today as string,
  amount: 0,
  payment_method: 'bank_transfer',
  cash_account_id: null,
  reference: '',
  notes: '',
  payable_type: initialInvoiceId ? 'invoice' : (initialBillId ? 'bill' : null),
  payable_id: initialInvoiceId || initialBillId || null,
})

const createMutation = useCreatePayment()
const isSubmitting = computed(() => createMutation.isPending.value)

const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  if (!form.value.contact_id) {
    errors.value.contact_id = 'Contact is required'
  }
  if (form.value.amount <= 0) {
    errors.value.amount = 'Amount must be greater than 0'
  }
  if (!form.value.cash_account_id) {
    errors.value.cash_account_id = 'Cash account is required'
  }

  if (Object.keys(errors.value).length > 0) return

  try {
    const result = await createMutation.mutateAsync(form.value as any)
    toast.success('Payment recorded successfully')
    router.push(`/payments/${result.id}`)
  } catch (err) {
    toast.error('Failed to record payment')
    console.error(err)
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Record Payment</h1>
        <p class="text-slate-500 dark:text-slate-400">Record a payment received or made</p>
      </div>
      <Button variant="ghost" @click="router.back()">Cancel</Button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Payment Details</h2>
        </template>
        <div class="space-y-4">
          <FormField label="Payment Type" required>
            <Select v-model="form.type" :options="typeOptions" />
          </FormField>

          <FormField label="Contact" required :error="errors.contact_id">
            <Select
              v-model="form.contact_id"
              :options="contactOptions"
              :placeholder="form.type === 'receive' ? 'Select customer' : 'Select vendor'"
            />
          </FormField>

          <div class="grid grid-cols-2 gap-4">
            <FormField label="Payment Date" required>
              <Input v-model="form.payment_date" type="date" />
            </FormField>

            <FormField label="Amount" required :error="errors.amount">
              <Input v-model.number="form.amount" type="number" min="0" step="1000" />
            </FormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <FormField label="Payment Method" required>
              <Select v-model="form.payment_method" :options="methodOptions" />
            </FormField>

            <FormField label="Cash Account" required :error="errors.cash_account_id">
              <Select v-model="form.cash_account_id" :options="accountOptions" placeholder="Select account" />
            </FormField>
          </div>

          <FormField label="Reference">
            <Input v-model="form.reference" placeholder="Check number, transfer reference, etc." />
          </FormField>

          <FormField label="Notes">
            <Textarea v-model="form.notes" :rows="2" placeholder="Additional notes" />
          </FormField>
        </div>
      </Card>

      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">Cancel</Button>
        <Button type="submit" :loading="isSubmitting">
          Record Payment
        </Button>
      </div>
    </form>
  </div>
</template>
