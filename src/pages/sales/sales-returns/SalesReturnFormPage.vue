<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm, useFieldArray } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useSalesReturn,
  useCreateSalesReturn,
  useUpdateSalesReturn,
  type CreateSalesReturnItem,
} from '@/api/useSalesReturns'
import { useContactsLookup } from '@/api/useContacts'
import { useWarehousesLookup } from '@/api/useInventory'
import { salesReturnSchema, type SalesReturnFormData, type SalesReturnItemFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { formatCurrency, toNumber } from '@/utils/format'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Select,
  Card,
  Alert,
  CurrencyInput,
  useToast,
} from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if we're editing
const salesReturnId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => salesReturnId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Sales Return' : 'New Sales Return')

// Fetch existing sales return if editing
const srIdRef = computed(() => salesReturnId.value ?? 0)
const { data: existingSR, isLoading: loadingSR } = useSalesReturn(srIdRef)

// Lookups
const { data: contacts, isLoading: loadingContacts } = useContactsLookup('customer')
const { data: warehouses, isLoading: loadingWarehouses } = useWarehousesLookup()

const reasonOptions = [
  { value: '', label: 'Select reason...' },
  { value: 'damaged', label: 'Barang Rusak' },
  { value: 'wrong_item', label: 'Barang Salah' },
  { value: 'quality_issue', label: 'Masalah Kualitas' },
  { value: 'customer_request', label: 'Permintaan Pelanggan' },
  { value: 'other', label: 'Lainnya' },
]

function createEmptyItem(): SalesReturnItemFormData {
  return {
    description: '',
    quantity: 1,
    unit: 'pcs',
    unit_price: 0,
    notes: '',
  }
}

// Form with VeeValidate
const {
  errors,
  handleSubmit,
  setValues,
  setFieldValue,
  setErrors,
  validateField,
  defineField,
} = useForm<SalesReturnFormData>({
  validationSchema: toTypedSchema(salesReturnSchema),
  initialValues: {
    contact_id: undefined as unknown as number,
    warehouse_id: undefined,
    return_date: new Date().toISOString().split('T')[0]!,
    reason: '',
    tax_rate: 11,
    notes: '',
    items: [createEmptyItem()],
  },
})

const [contactId] = defineField('contact_id')
const [warehouseId] = defineField('warehouse_id')
const [returnDate] = defineField('return_date')
const [reason] = defineField('reason')
const [taxRate] = defineField('tax_rate')
const [notes] = defineField('notes')

// Field array for line items
const { fields: itemFields, push: pushItem, remove: removeItem } = useFieldArray<SalesReturnItemFormData>('items')

// Populate form when editing
watch(existingSR, (sr) => {
  if (sr) {
    setValues({
      contact_id: Number(sr.contact_id),
      warehouse_id: sr.warehouse_id ? Number(sr.warehouse_id) : undefined,
      return_date: sr.return_date?.split('T')[0] || new Date().toISOString().split('T')[0]!,
      reason: sr.reason ?? '',
      tax_rate: sr.tax_rate ?? 11,
      notes: sr.notes ?? '',
      items: sr.items && sr.items.length > 0
        ? sr.items.map(item => ({
            product_id: item.product_id || undefined,
            description: item.description || '',
            quantity: item.quantity,
            unit: item.unit || 'pcs',
            unit_price: toNumber(item.unit_price),
            condition: (item.condition as 'good' | 'damaged' | 'defective') || undefined,
            notes: item.notes || '',
          }))
        : [createEmptyItem()],
    })
  }
}, { immediate: true })

// Calculations
function calculateItemTotal(item: SalesReturnItemFormData): number {
  return (item.quantity || 0) * (item.unit_price || 0)
}

const subtotal = computed(() => {
  return (itemFields.value || []).reduce((sum, field) => sum + calculateItemTotal(field.value), 0)
})

const taxAmount = computed(() => subtotal.value * ((taxRate.value || 0) / 100))

const grandTotal = computed(() => subtotal.value + taxAmount.value)

// Item management
function addItem() {
  pushItem(createEmptyItem())
}

function handleRemoveItem(index: number) {
  if (itemFields.value.length > 1) {
    removeItem(index)
  }
}

// Form submission
const createMutation = useCreateSalesReturn()
const updateMutation = useUpdateSalesReturn()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const onSubmit = handleSubmit(async (formValues) => {
  const itemsPayload: CreateSalesReturnItem[] = (formValues.items || [])
    .filter(item => item.description)
    .map(item => ({
      product_id: item.product_id || undefined,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      unit_price: item.unit_price,
    }))

  const payload = {
    contact_id: formValues.contact_id!,
    warehouse_id: formValues.warehouse_id || undefined,
    return_date: formValues.return_date || new Date().toISOString().split('T')[0]!,
    reason: formValues.reason || undefined,
    tax_rate: formValues.tax_rate,
    notes: formValues.notes || undefined,
    items: itemsPayload,
  }

  try {
    if (isEditing.value && salesReturnId.value) {
      await updateMutation.mutateAsync({ id: salesReturnId.value, data: payload })
      toast.success('Sales return updated successfully')
      router.push(`/sales/sales-returns/${salesReturnId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload)
      toast.success('Sales return created successfully')
      router.push(`/sales/sales-returns/${result.id}`)
    }
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to save sales return')
  }
})

// Select options
const contactOptions = computed(() => {
  if (!contacts.value) return []
  return contacts.value.map(c => ({
    value: c.id,
    label: c.name || `Contact #${c.id}`,
  }))
})

const warehouseOptions = computed(() => {
  if (!warehouses.value) return []
  return [
    { value: '', label: 'No warehouse' },
    ...warehouses.value.map(w => ({
      value: w.id,
      label: w.name || `Warehouse #${w.id}`,
    })),
  ]
})
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
        <p class="text-slate-500 dark:text-slate-400">
          {{ isEditing ? 'Update sales return details' : 'Create a new sales return' }}
        </p>
      </div>
      <Button variant="ghost" @click="router.back()">
        Cancel
      </Button>
    </div>

    <!-- Loading state for edit mode -->
    <div v-if="isEditing && loadingSR" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading sales return...</div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="onSubmit" class="space-y-6">
      <!-- Header Info Card -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Return Details</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Customer -->
          <FormField label="Customer" required :error="errors.contact_id">
            <Select
              :model-value="contactId"
              :options="contactOptions"
              placeholder="Select customer..."
              :loading="loadingContacts"
              @update:model-value="(v) => { setFieldValue('contact_id', Number(v)); validateField('contact_id'); }"
            />
          </FormField>

          <!-- Warehouse -->
          <FormField label="Warehouse" :error="errors.warehouse_id">
            <Select
              :model-value="warehouseId"
              :options="warehouseOptions"
              placeholder="Select warehouse..."
              :loading="loadingWarehouses"
              @update:model-value="(v) => { setFieldValue('warehouse_id', v ? Number(v) : undefined); }"
            />
          </FormField>

          <!-- Return Date -->
          <FormField label="Return Date" required :error="errors.return_date">
            <Input v-model="returnDate" type="date" @blur="validateField('return_date')" />
          </FormField>

          <!-- Reason -->
          <FormField label="Reason">
            <Select
              :model-value="reason"
              :options="reasonOptions"
              placeholder="Select reason..."
              @update:model-value="(v) => { setFieldValue('reason', String(v)); }"
            />
          </FormField>

          <!-- Notes -->
          <FormField label="Notes" class="md:col-span-2">
            <Textarea
              v-model="notes"
              :rows="2"
              placeholder="Additional notes"
            />
          </FormField>
        </div>
      </Card>

      <!-- Line Items Card -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-slate-900 dark:text-slate-100">Return Items</h2>
            <Button type="button" variant="ghost" size="sm" @click="addItem">
              + Add Item
            </Button>
          </div>
        </template>

        <Alert v-if="errors.items" variant="destructive" class="mb-4">
          {{ errors.items }}
        </Alert>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <tr>
                <th class="px-3 py-2 text-left">Description</th>
                <th class="px-3 py-2 text-right w-24">Qty</th>
                <th class="px-3 py-2 text-left w-20">Unit</th>
                <th class="px-3 py-2 text-right w-32">Unit Price</th>
                <th class="px-3 py-2 text-right w-32">Total</th>
                <th class="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              <tr v-for="(field, index) in itemFields" :key="field.key" class="align-top">
                <td class="px-3 py-2">
                  <input
                    v-model="field.value.description"
                    type="text"
                    placeholder="Item description"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model.number="field.value.quantity"
                    type="number"
                    min="0.0001"
                    step="any"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-right focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model="field.value.unit"
                    type="text"
                    placeholder="pcs"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <CurrencyInput
                    v-model="field.value.unit_price"
                    size="sm"
                    :min="0"
                  />
                </td>
                <td class="px-3 py-2 text-right font-medium text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(calculateItemTotal(field.value)) }}
                </td>
                <td class="px-3 py-2">
                  <button
                    type="button"
                    @click="handleRemoveItem(index)"
                    :disabled="itemFields.length === 1"
                    class="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div class="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div class="flex justify-end">
            <div class="w-80 space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-slate-600 dark:text-slate-400">Subtotal</span>
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(subtotal) }}</span>
              </div>

              <!-- Tax Rate -->
              <div class="flex items-center gap-2">
                <span class="text-slate-600 dark:text-slate-400 text-sm w-20">Tax (%)</span>
                <input
                  v-model.number="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  class="w-20 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-right"
                />
                <span class="text-slate-500 dark:text-slate-400 text-sm ml-auto">
                  {{ formatCurrency(taxAmount) }}
                </span>
              </div>

              <div class="flex justify-between text-lg font-semibold border-t border-slate-200 dark:border-slate-700 pt-2">
                <span class="text-slate-900 dark:text-slate-100">Total</span>
                <span class="text-orange-600 dark:text-orange-500">{{ formatCurrency(grandTotal) }}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">
          Cancel
        </Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Sales Return' : 'Create Sales Return' }}
        </Button>
      </div>
    </form>
  </div>
</template>
