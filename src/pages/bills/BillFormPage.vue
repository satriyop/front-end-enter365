<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm, useFieldArray } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useBill, useCreateBill, useUpdateBill } from '@/api/useBills'
import { toNumber } from '@/utils/format'
import { useContactsLookup } from '@/api/useContacts'
import { billSchema, type BillFormData, type BillItemFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { Button, Input, FormField, Textarea, Select, Card, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const billId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => billId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Bill' : 'New Bill')

const billIdRef = computed(() => billId.value ?? 0)
const { data: existingBill, isLoading: loadingBill } = useBill(billIdRef)

// Contacts lookup
const { data: contacts } = useContactsLookup('supplier')
const contactOptions = computed(() =>
  (contacts.value ?? []).map(c => ({ value: c.id, label: c.name }))
)

function createEmptyItem(): BillItemFormData {
  return {
    description: '',
    quantity: 1,
    unit: 'pcs',
    unit_price: 0,
    discount_percent: 0,
    tax_rate: 11,
  }
}

const today = new Date().toISOString().split('T')[0]!

// Form with VeeValidate
const {
  values: form,
  errors,
  handleSubmit,
  setValues,
  setErrors,
  validateField,
} = useForm<BillFormData>({
  validationSchema: toTypedSchema(billSchema),
  initialValues: {
    contact_id: undefined as unknown as number,
    vendor_invoice_number: '',
    bill_date: today,
    due_date: today,
    description: '',
    items: [createEmptyItem()],
  },
})

// Field array for line items
const { fields: itemFields, push: pushItem, remove: removeItem } = useFieldArray<BillItemFormData>('items')

// Populate form when editing
watch(existingBill, (bill) => {
  if (bill) {
    setValues({
      contact_id: Number(bill.contact_id),
      vendor_invoice_number: bill.vendor_invoice_number || '',
      bill_date: bill.bill_date?.split('T')[0] || today,
      due_date: bill.due_date?.split('T')[0] || today,
      description: bill.description || '',
      items: bill.items && bill.items.length > 0
        ? bill.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: toNumber(item.unit_price),
            discount_percent: item.discount_percent ?? 0,
            tax_rate: item.tax_rate ?? 11,
          }))
        : [createEmptyItem()],
    })
  }
}, { immediate: true })

// Item management
function addItem() {
  pushItem(createEmptyItem())
}

function handleRemoveItem(index: number) {
  if (itemFields.value.length > 1) {
    removeItem(index)
  }
}

// Calculations
const subtotal = computed(() =>
  (form.items || []).reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0)
)

const taxAmount = computed(() =>
  (form.items || []).reduce((sum, item) => {
    const lineTotal = (item.quantity || 0) * (item.unit_price || 0)
    return sum + (lineTotal * (item.tax_rate || 0) / 100)
  }, 0)
)

const total = computed(() => subtotal.value + taxAmount.value)

// Mutations
const createMutation = useCreateBill()
const updateMutation = useUpdateBill()
const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const onSubmit = handleSubmit(async (formValues) => {
  const itemsPayload = (formValues.items || [])
    .filter(item => item.description)
    .map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      tax_rate: item.tax_rate,
    }))

  const payload = {
    contact_id: formValues.contact_id!,
    vendor_invoice_number: formValues.vendor_invoice_number || undefined,
    bill_date: formValues.bill_date,
    due_date: formValues.due_date,
    description: formValues.description || undefined,
    items: itemsPayload,
  }

  try {
    if (isEditing.value && billId.value) {
      await updateMutation.mutateAsync({ id: billId.value, data: payload as any })
      toast.success('Bill updated')
      router.push(`/bills/${billId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload as any)
      toast.success('Bill created')
      router.push(`/bills/${result.id}`)
    }
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to save bill')
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
        <p class="text-slate-500 dark:text-slate-400">{{ isEditing ? 'Update bill details' : 'Record a new supplier bill' }}</p>
      </div>
      <Button variant="ghost" @click="router.back()">Cancel</Button>
    </div>

    <div v-if="isEditing && loadingBill" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading bill...</div>
    </div>

    <form v-else @submit.prevent="onSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Bill Information</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Vendor" required :error="errors.contact_id">
            <Select
              v-model="form.contact_id"
              :options="contactOptions"
              placeholder="Select vendor"
              @update:model-value="validateField('contact_id')"
            />
          </FormField>
          <FormField label="Vendor Invoice #">
            <Input :model-value="form.vendor_invoice_number ?? ''" @update:model-value="(v) => form.vendor_invoice_number = String(v)" placeholder="Vendor's invoice number" />
          </FormField>
          <FormField label="Bill Date" required :error="errors.bill_date">
            <Input v-model="form.bill_date" type="date" @blur="validateField('bill_date')" />
          </FormField>
          <FormField label="Due Date" required :error="errors.due_date">
            <Input v-model="form.due_date" type="date" @blur="validateField('due_date')" />
          </FormField>
          <FormField label="Description" class="md:col-span-2">
            <Textarea :model-value="form.description ?? ''" @update:model-value="(v: string) => form.description = v" :rows="2" placeholder="Bill description" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-slate-900 dark:text-slate-100">Line Items</h2>
            <Button type="button" variant="secondary" size="sm" @click="addItem">Add Item</Button>
          </div>
        </template>

        <div class="space-y-4">
          <div v-for="(field, index) in itemFields" :key="field.key" class="grid grid-cols-12 gap-2 items-end">
            <div class="col-span-4">
              <label v-if="index === 0" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
              <Input v-model="field.value.description" placeholder="Item description" />
            </div>
            <div class="col-span-2">
              <label v-if="index === 0" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Qty</label>
              <Input v-model.number="field.value.quantity" type="number" min="1" />
            </div>
            <div class="col-span-2">
              <label v-if="index === 0" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Unit Price</label>
              <Input v-model.number="field.value.unit_price" type="number" min="0" step="1000" />
            </div>
            <div class="col-span-2">
              <label v-if="index === 0" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tax %</label>
              <Input v-model.number="field.value.tax_rate" type="number" min="0" max="100" />
            </div>
            <div class="col-span-2 flex justify-end">
              <Button type="button" variant="ghost" size="sm" @click="handleRemoveItem(index)" :disabled="itemFields.length === 1">
                Remove
              </Button>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div class="flex justify-end">
            <dl class="w-64 space-y-2">
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Subtotal</dt>
                <dd class="text-slate-900 dark:text-slate-100">Rp {{ subtotal.toLocaleString('id-ID') }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Tax</dt>
                <dd class="text-slate-900 dark:text-slate-100">Rp {{ taxAmount.toLocaleString('id-ID') }}</dd>
              </div>
              <div class="flex justify-between text-lg font-medium border-t border-slate-200 dark:border-slate-700 pt-2">
                <dt class="text-slate-900 dark:text-slate-100">Total</dt>
                <dd class="text-slate-900 dark:text-slate-100">Rp {{ total.toLocaleString('id-ID') }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">Cancel</Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Bill' : 'Create Bill' }}
        </Button>
      </div>
    </form>
  </div>
</template>
