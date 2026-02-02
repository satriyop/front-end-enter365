<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useCreatePayment } from '@/api/usePayments'
import { useContactsLookup } from '@/api/useContacts'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { paymentSchema, type PaymentFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
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

// Contacts lookup
const { data: customers } = useContactsLookup('customer')
const { data: suppliers } = useContactsLookup('supplier')

const contacts = computed(() => form.type === 'receive' ? customers.value : suppliers.value)
const contactOptions = computed(() =>
  (contacts.value ?? []).map(c => ({ value: c.id, label: c.name }))
)

const typeOptions = [
  { value: 'receive', label: 'Receive Payment (from Customer)' },
  { value: 'pay', label: 'Make Payment (to Vendor)' },
]

const methodOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'giro', label: 'Giro' },
]

const today = new Date().toISOString().split('T')[0] as string

// Form with VeeValidate
const {
  values: form,
  errors,
  handleSubmit,
  setErrors,
  validateField,
  defineField,
} = useForm<PaymentFormData>({
  validationSchema: toTypedSchema(paymentSchema),
  initialValues: {
    type: initialType as 'receive' | 'pay',
    contact_id: undefined as unknown as number,
    payment_date: today,
    amount: 0,
    payment_method: 'transfer',
    cash_account_id: undefined as unknown as number,
    reference: '',
    notes: '',
    invoice_id: initialInvoiceId || null,
    bill_id: initialBillId || null,
  },
})

const [type] = defineField('type')
const [contactId] = defineField('contact_id')
const [paymentDate] = defineField('payment_date')
const [amount] = defineField('amount')
const [paymentMethod] = defineField('payment_method')
const [cashAccountId] = defineField('cash_account_id')
const [reference] = defineField('reference')
const [notes] = defineField('notes')

const createMutation = useCreatePayment()
const isSubmitting = computed(() => createMutation.isPending.value)

const onSubmit = handleSubmit(async (formValues) => {
  try {
    const result = await createMutation.mutateAsync(formValues as any)
    toast.success('Payment recorded successfully')
    router.push(`/payments/${result.id}`)
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to record payment')
  }
})
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

    <form @submit.prevent="onSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Payment Details</h2>
        </template>
        <div class="space-y-4">
          <FormField label="Payment Type" required :error="errors.type">
            <Select v-model="type" :options="typeOptions" @update:model-value="validateField('type')" />
          </FormField>

          <FormField label="Contact" required :error="errors.contact_id">
            <Select
              v-model="contactId"
              :options="contactOptions"
              :placeholder="form.type === 'receive' ? 'Select customer' : 'Select vendor'"
              @update:model-value="validateField('contact_id')"
            />
          </FormField>

          <div class="grid grid-cols-2 gap-4">
            <FormField label="Payment Date" required :error="errors.payment_date">
              <Input v-model="paymentDate" type="date" @blur="validateField('payment_date')" />
            </FormField>

            <FormField label="Amount" required :error="errors.amount">
              <Input v-model.number="amount" type="number" min="0" step="1000" @blur="validateField('amount')" />
            </FormField>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <FormField label="Payment Method" required>
              <Select v-model="paymentMethod" :options="methodOptions" />
            </FormField>

            <FormField label="Cash Account" required :error="errors.cash_account_id">
              <Select v-model="cashAccountId" :options="accountOptions" placeholder="Select account" @update:model-value="validateField('cash_account_id')" />
            </FormField>
          </div>

          <FormField label="Reference">
            <Input v-model="reference" placeholder="Check number, transfer reference, etc." />
          </FormField>

          <FormField label="Notes">
            <Textarea v-model="notes" :rows="2" placeholder="Additional notes" />
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
