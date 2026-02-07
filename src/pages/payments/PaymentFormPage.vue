<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useCreatePayment } from '@/api/usePayments'
import { useInvoice } from '@/api/useInvoices'
import { useBill } from '@/api/useBills'
import { useContactsLookup } from '@/api/useContacts'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { paymentSchema, type PaymentFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { formatCurrency, toNumber } from '@/utils/format'
import { Button, Input, FormField, Textarea, Select, Card, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Get query params for pre-filling
const rawType = (route.query.type as string) || 'receive'
const initialType = rawType === 'pay' ? 'send' : rawType
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

// Fetch linked invoice/bill to detect currency
const invoiceIdRef = computed(() => initialInvoiceId)
const billIdRef = computed(() => initialBillId)
const { data: linkedInvoice } = useInvoice(invoiceIdRef)
const { data: linkedBill } = useBill(billIdRef)

const linkedCurrency = computed(() => {
  if (linkedInvoice.value) return linkedInvoice.value.currency as string
  if (linkedBill.value) return linkedBill.value.currency as string
  return 'IDR'
})

const isForeignCurrency = computed(() => linkedCurrency.value !== 'IDR')

const linkedExchangeRate = computed(() => {
  if (linkedInvoice.value) return toNumber(linkedInvoice.value.exchange_rate)
  if (linkedBill.value) return toNumber(linkedBill.value.exchange_rate)
  return 1
})

const typeOptions = [
  { value: 'receive', label: 'Receive Payment (from Customer)' },
  { value: 'send', label: 'Make Payment (to Vendor)' },
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
    type: initialType as 'receive' | 'send',
    contact_id: undefined as unknown as number,
    payment_date: today,
    amount: 0,
    payment_method: 'transfer',
    cash_account_id: undefined as unknown as number,
    reference: '',
    notes: '',
    exchange_rate: null as number | null,
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
const [exchangeRate] = defineField('exchange_rate')
const [reference] = defineField('reference')
const [notes] = defineField('notes')

// Pre-fill exchange rate from linked invoice/bill once loaded
watch(linkedExchangeRate, (rate) => {
  if (isForeignCurrency.value && rate > 0) {
    exchangeRate.value = rate
  }
})

// Computed base currency preview for foreign currency payments
const baseCurrencyPreview = computed(() => {
  if (!isForeignCurrency.value || !form.amount || !exchangeRate.value) return null
  return Math.round(form.amount * exchangeRate.value)
})

const fxDiffPreview = computed(() => {
  if (!isForeignCurrency.value || !form.amount || !exchangeRate.value) return null
  const invoiceBase = Math.round(form.amount * linkedExchangeRate.value)
  const paymentBase = Math.round(form.amount * exchangeRate.value)
  const diff = paymentBase - invoiceBase
  // For AR (receive): higher rate = gain. For AP (send): higher rate = loss (flip sign)
  return form.type === 'send' ? -diff : diff
})

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

    <form novalidate @submit.prevent="onSubmit" class="space-y-6">
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
              :test-id="form.type === 'receive' ? 'payment-customer' : 'payment-vendor'"
              @update:model-value="validateField('contact_id')"
            />
          </FormField>

          <div class="grid grid-cols-2 gap-4">
            <FormField label="Payment Date" required :error="errors.payment_date">
              <Input v-model="paymentDate" type="date" @blur="validateField('payment_date')" />
            </FormField>

            <FormField label="Amount" required :error="errors.amount">
              <Input v-model.number="amount" type="number" min="0" step="1000" data-testid="payment-amount" @blur="validateField('amount')" />
            </FormField>
          </div>

          <!-- Foreign Currency Exchange Rate -->
          <div v-if="isForeignCurrency" class="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4 space-y-3">
            <div class="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Foreign Currency: {{ linkedCurrency }}
            </div>
            <FormField label="Exchange Rate (IDR per 1 {{ linkedCurrency }})" required :error="errors.exchange_rate">
              <Input v-model.number="exchangeRate" type="number" min="0" step="0.0001" data-testid="payment-exchange-rate" @blur="validateField('exchange_rate')" />
            </FormField>
            <div v-if="baseCurrencyPreview !== null" class="text-sm text-slate-600 dark:text-slate-400">
              Base currency: <span class="font-medium">{{ formatCurrency(baseCurrencyPreview) }}</span>
              <span class="text-xs ml-1">({{ form.amount }} {{ linkedCurrency }} &times; {{ exchangeRate?.toLocaleString('id-ID') }})</span>
            </div>
            <div v-if="fxDiffPreview !== null && fxDiffPreview !== 0" class="text-sm" :class="fxDiffPreview > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ fxDiffPreview > 0 ? 'FX Gain' : 'FX Loss' }}: {{ formatCurrency(Math.abs(fxDiffPreview)) }}
              <span class="text-xs">(vs invoice rate {{ linkedExchangeRate.toLocaleString('id-ID') }})</span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <FormField label="Payment Method" required>
              <Select v-model="paymentMethod" :options="methodOptions" />
            </FormField>

            <FormField label="Cash Account" required :error="errors.cash_account_id">
              <Select v-model="cashAccountId" :options="accountOptions" placeholder="Select account" test-id="payment-account" @update:model-value="validateField('cash_account_id')" />
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
        <Button type="submit" :loading="isSubmitting" data-testid="payment-submit">
          Record Payment
        </Button>
      </div>
    </form>
  </div>
</template>
