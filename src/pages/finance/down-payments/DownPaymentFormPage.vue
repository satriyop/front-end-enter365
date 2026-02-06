<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useDownPayment,
  useCreateDownPayment,
  useUpdateDownPayment,
  type CreateDownPaymentData,
  type UpdateDownPaymentData,
} from '@/api/useDownPayments'
import { useContactsLookup } from '@/api/useContacts'
import { useAccountsLookup } from '@/api/useAccounts'
import { getErrorMessage } from '@/api/client'
import { downPaymentSchema, type DownPaymentFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { useFormShortcuts } from '@/composables/useFormShortcuts'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Select,
  Card,
  PageSkeleton,
  useToast,
} from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if we're editing
const downPaymentId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isEditing = computed(() => downPaymentId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Down Payment' : 'New Down Payment')

// Fetch existing down payment if editing
const dpIdRef = computed(() => downPaymentId.value ?? 0)
const { data: existingDP, isLoading: loadingDP } = useDownPayment(dpIdRef)

// Redirect if trying to edit a non-editable DP
watch(existingDP, (dp) => {
  if (!dp) return
  const status = dp.status?.value
  const hasApplications = (dp.applications?.length ?? 0) > 0
  if (status !== 'active' || hasApplications) {
    toast.error('This down payment cannot be edited')
    router.replace(`/finance/down-payments/${dp.id}`)
  }
}, { immediate: true })

// ─────────────────────────────────────────────
// Lookups
// ─────────────────────────────────────────────

const { data: customers } = useContactsLookup('customer')
const { data: suppliers } = useContactsLookup('supplier')
const { data: cashAccounts } = useAccountsLookup('asset')

// ─────────────────────────────────────────────
// Form setup
// ─────────────────────────────────────────────

// Pre-fill type from query param (e.g., /finance/down-payments/new?type=payable)
const initialType = (route.query.type as string) || 'receivable'

const { values: form, errors, handleSubmit, setValues, setErrors, meta, validateField, defineField } = useForm<DownPaymentFormData>({
  validationSchema: toTypedSchema(downPaymentSchema),
  initialValues: {
    type: initialType as 'receivable' | 'payable',
    contact_id: undefined as unknown as number,
    dp_date: new Date().toISOString().split('T')[0],
    amount: 0,
    payment_method: 'bank_transfer',
    cash_account_id: undefined as unknown as number,
    reference: '',
    description: '',
    notes: '',
  },
})

const [type] = defineField('type')
const [contactId] = defineField('contact_id')
const [dpDate] = defineField('dp_date')
const [amount] = defineField('amount')
const [paymentMethod] = defineField('payment_method')
const [cashAccountId] = defineField('cash_account_id')
const [reference] = defineField('reference')
const [description] = defineField('description')
const [notes] = defineField('notes')

// Populate form when editing
watch(existingDP, (dp) => {
  if (dp) {
    setValues({
      type: dp.type as 'receivable' | 'payable',
      contact_id: dp.contact_id,
      dp_date: dp.dp_date?.split('T')[0] ?? '',
      amount: Number(dp.amount) || 0,
      payment_method: dp.payment_method as DownPaymentFormData['payment_method'],
      cash_account_id: dp.cash_account_id,
      reference: dp.reference || '',
      description: dp.description || '',
      notes: dp.notes || '',
    })
  }
}, { immediate: true })

// ─────────────────────────────────────────────
// Dynamic options
// ─────────────────────────────────────────────

const typeOptions = [
  { value: 'receivable', label: 'Customer Advance (Receivable)' },
  { value: 'payable', label: 'Vendor Advance (Payable)' },
]

const methodOptions = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'giro', label: 'Giro' },
  { value: 'credit_card', label: 'Credit Card' },
]

// Switch contacts based on type
const contacts = computed(() =>
  form.type === 'receivable' ? customers.value : suppliers.value
)

const contactOptions = computed(() =>
  (contacts.value ?? []).map(c => ({ value: c.id, label: c.name }))
)

const accountOptions = computed(() =>
  (cashAccounts.value ?? []).map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))
)

// Reset contact when type changes (only on create)
watch(() => form.type, (newType, oldType) => {
  if (!isEditing.value && oldType && newType !== oldType) {
    setValues({ ...form, contact_id: undefined as unknown as number })
  }
})

// ─────────────────────────────────────────────
// Submit
// ─────────────────────────────────────────────

const createMutation = useCreateDownPayment()
const updateMutation = useUpdateDownPayment()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const onSubmit = handleSubmit(async (formValues) => {
  try {
    if (isEditing.value && downPaymentId.value) {
      const payload: UpdateDownPaymentData = {
        dp_date: formValues.dp_date,
        amount: formValues.amount,
        payment_method: formValues.payment_method,
        cash_account_id: formValues.cash_account_id,
        reference: formValues.reference || null,
        description: formValues.description || null,
        notes: formValues.notes || null,
      }
      await updateMutation.mutateAsync({ id: downPaymentId.value, data: payload })
      toast.success('Down payment updated successfully')
      router.push(`/finance/down-payments/${downPaymentId.value}`)
    } else {
      const payload: CreateDownPaymentData = {
        type: formValues.type,
        contact_id: formValues.contact_id,
        dp_date: formValues.dp_date,
        amount: formValues.amount,
        payment_method: formValues.payment_method,
        cash_account_id: formValues.cash_account_id,
        reference: formValues.reference || null,
        description: formValues.description || null,
        notes: formValues.notes || null,
      }
      const result = await createMutation.mutateAsync(payload)
      toast.success('Down payment created successfully')
      router.push(`/finance/down-payments/${result.id}`)
    }
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    if (error.response?.data?.errors) {
      setServerErrors({ setErrors } as any, error.response.data.errors)
    }
    toast.error(getErrorMessage(err, 'Failed to save down payment'))
  }
})

// Keyboard shortcut: Ctrl+S to save
useFormShortcuts({
  onSave: async () => { await onSubmit() },
  onCancel: () => router.back(),
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">{{ pageTitle }}</h1>
        <p class="text-muted-foreground">
          {{ isEditing ? 'Update down payment details' : 'Record a new advance payment' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <kbd class="hidden sm:inline-flex px-2 py-1 text-xs text-muted-foreground bg-muted rounded border border-border">
          Ctrl+S to save
        </kbd>
        <Button variant="ghost" @click="router.back()">
          Cancel
        </Button>
      </div>
    </div>

    <!-- Loading state for edit mode -->
    <PageSkeleton v-if="isEditing && loadingDP" type="form" />

    <!-- Form -->
    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <!-- Type & Contact -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Payment Details</h2>
        </template>

        <div class="space-y-4">
          <FormField label="Type" required :error="errors.type">
            <Select
              :model-value="type"
              :options="typeOptions"
              :disabled="isEditing"
              @update:model-value="(v) => type = v as DownPaymentFormData['type']"
            />
            <p v-if="isEditing" class="text-xs text-muted-foreground mt-1">
              Type cannot be changed after creation
            </p>
          </FormField>

          <FormField label="Contact" required :error="errors.contact_id">
            <Select
              :model-value="contactId ?? ''"
              :options="[{ value: '', label: form.type === 'receivable' ? 'Select customer...' : 'Select vendor...' }, ...contactOptions]"
              :disabled="isEditing"
              @update:model-value="(v) => contactId = v ? Number(v) : (undefined as unknown as number)"
            />
            <p v-if="isEditing" class="text-xs text-muted-foreground mt-1">
              Contact cannot be changed after creation
            </p>
          </FormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Date" required :error="errors.dp_date">
              <Input
                v-model="dpDate"
                type="date"
                @blur="validateField('dp_date')"
              />
            </FormField>

            <FormField label="Amount" required :error="errors.amount">
              <Input
                v-model.number="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                @blur="validateField('amount')"
              />
            </FormField>
          </div>
        </div>
      </Card>

      <!-- Payment Info -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Payment Information</h2>
        </template>

        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Payment Method" required :error="errors.payment_method">
              <Select
                :model-value="paymentMethod"
                :options="methodOptions"
                @update:model-value="(v) => paymentMethod = v as DownPaymentFormData['payment_method']"
              />
            </FormField>

            <FormField label="Cash/Bank Account" required :error="errors.cash_account_id">
              <Select
                :model-value="cashAccountId ?? ''"
                :options="[{ value: '', label: 'Select account...' }, ...accountOptions]"
                @update:model-value="(v) => cashAccountId = v ? Number(v) : (undefined as unknown as number)"
              />
            </FormField>
          </div>

          <FormField label="Reference" :error="errors.reference">
            <Input
              v-model="reference"
              placeholder="e.g., transfer receipt number"
            />
          </FormField>
        </div>
      </Card>

      <!-- Notes -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Additional Information</h2>
        </template>

        <div class="space-y-4">
          <FormField label="Description" :error="errors.description">
            <Textarea
              v-model="description"
              :rows="2"
              placeholder="Brief description of the down payment"
            />
          </FormField>

          <FormField label="Notes" :error="errors.notes">
            <Textarea
              v-model="notes"
              :rows="2"
              placeholder="Internal notes"
            />
          </FormField>
        </div>
      </Card>

      <!-- Form Status Indicator -->
      <div v-if="meta.dirty" class="text-sm text-amber-600 dark:text-amber-500">
        You have unsaved changes
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">
          Cancel
        </Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Down Payment' : 'Create Down Payment' }}
        </Button>
      </div>
    </form>
  </div>
</template>
