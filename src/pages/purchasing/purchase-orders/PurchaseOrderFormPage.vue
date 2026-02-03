<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm, useFieldArray } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  usePurchaseOrder,
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  type CreatePurchaseOrderItem,
} from '@/api/usePurchaseOrders'
import { useContactsLookup } from '@/api/useContacts'
import { useProductsLookup } from '@/api/useProducts'
import {
  purchaseOrderSchema,
  type PurchaseOrderFormData,
  type PurchaseOrderItemFormData,
} from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { formatCurrency } from '@/utils/format'
import { ArrowLeft, Plus, X } from 'lucide-vue-next'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Select,
  Card,
  Alert,
  useToast,
  CurrencyInput,
} from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if we're editing
const poId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => poId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Purchase Order' : 'New Purchase Order')

// Fetch existing PO if editing
const poIdRef = computed(() => poId.value ?? 0)
const { data: existingPO, isLoading: loadingPO } = usePurchaseOrder(poIdRef)

// Lookups - vendors/suppliers only
const { data: contacts, isLoading: loadingContacts } = useContactsLookup('supplier')
const { data: products } = useProductsLookup()

// Form with VeeValidate
const {
  values: form,
  errors,
  handleSubmit,
  setValues,
  setErrors,
  validateField,
  defineField,
} = useForm<PurchaseOrderFormData>({
  validationSchema: toTypedSchema(purchaseOrderSchema),
  initialValues: {
    contact_id: undefined as unknown as number,
    po_date: new Date().toISOString().split('T')[0]!,
    expected_date: '',
    reference: '',
    subject: '',
    currency: 'IDR',
    exchange_rate: 1,
    discount_type: 'percentage',
    discount_value: 0,
    tax_rate: 11,
    notes: '',
    terms_conditions: '',
    shipping_address: '',
    items: [createEmptyItem()],
  },
})

const [contactId] = defineField('contact_id')
const [poDate] = defineField('po_date')
const [expectedDate] = defineField('expected_date')
const [reference] = defineField('reference')
const [subject] = defineField('subject')
const [currency] = defineField('currency')
const [exchangeRate] = defineField('exchange_rate')
const [discountType] = defineField('discount_type')
const [discountValue] = defineField('discount_value')
const [taxRate] = defineField('tax_rate')
const [notes] = defineField('notes')
const [termsConditions] = defineField('terms_conditions')
const [shippingAddress] = defineField('shipping_address')

// Field array for line items
const { fields: itemFields, push: pushItem, remove: removeItem } = useFieldArray<PurchaseOrderItemFormData>('items')

function createEmptyItem(): PurchaseOrderItemFormData {
  return {
    product_id: null,
    description: '',
    quantity: 1,
    unit: 'pcs',
    unit_price: 0,
    discount_percent: 0,
    tax_rate: 11,
    notes: '',
  }
}

// Populate form when editing
watch(existingPO, (po) => {
  if (po && po.can_edit) {
    setValues({
      contact_id: Number(po.contact_id),
      po_date: po.po_date.split('T')[0]!,
      expected_date: po.expected_date?.split('T')[0] ?? '',
      reference: po.reference ?? '',
      subject: po.subject ?? '',
      currency: po.currency ?? 'IDR',
      exchange_rate: Number(po.exchange_rate) || 1,
      discount_type: (po.discount_type as 'percentage' | 'fixed') ?? 'percentage',
      discount_value: Number(po.discount_value) || 0,
      tax_rate: Number(po.tax_rate) || 11,
      notes: po.notes ?? '',
      terms_conditions: po.terms_conditions ?? '',
      shipping_address: po.shipping_address ?? '',
      items: po.items && po.items.length > 0
        ? po.items.map(item => ({
            product_id: item.product_id ? Number(item.product_id) : null,
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit,
            unit_price: Number(item.unit_price),
            discount_percent: Number(item.discount_percent) || 0,
            tax_rate: Number(item.tax_rate) || 11,
            notes: item.notes ?? '',
          }))
        : [createEmptyItem()],
    })
  }
}, { immediate: true })

// Calculations
function calculateItemTotal(item: PurchaseOrderItemFormData): number {
  const gross = (item.quantity || 0) * (item.unit_price || 0)
  const discountAmount = gross * ((item.discount_percent || 0) / 100)
  const afterDiscount = gross - discountAmount
  const taxAmount = afterDiscount * ((item.tax_rate || 0) / 100)
  return afterDiscount + taxAmount
}

const subtotal = computed(() => {
  return (form.items || []).reduce((sum, item) => {
    const gross = (item.quantity || 0) * (item.unit_price || 0)
    const discountAmount = gross * ((item.discount_percent || 0) / 100)
    return sum + (gross - discountAmount)
  }, 0)
})

const discountAmount = computed(() => {
  if (discountType.value === 'percentage') {
    return subtotal.value * ((discountValue.value || 0) / 100)
  }
  return discountValue.value || 0
})

const afterDiscount = computed(() => subtotal.value - discountAmount.value)

const taxAmount = computed(() => {
  return (form.items || []).reduce((sum, item) => {
    const gross = (item.quantity || 0) * (item.unit_price || 0)
    const itemDiscount = gross * ((item.discount_percent || 0) / 100)
    const afterItemDiscount = gross - itemDiscount
    return sum + (afterItemDiscount * ((item.tax_rate || 0) / 100))
  }, 0)
})

const grandTotal = computed(() => afterDiscount.value + taxAmount.value)

// Item management
function addItem() {
  pushItem(createEmptyItem())
}

function handleRemoveItem(index: number) {
  if (itemFields.value.length > 1) {
    removeItem(index)
  }
}

function onProductSelect(index: number, productId: number | null) {
  if (productId && products.value) {
    const product = products.value.find(p => Number(p.id) === productId)
    if (product && form.items?.[index]) {
      form.items[index].description = product.name
      form.items[index].unit = product.unit
      form.items[index].unit_price = Number(product.purchase_price) || Number(product.selling_price) || 0
      form.items[index].tax_rate = Number(product.tax_rate) || 0
    }
  }
}

// Form submission
const createMutation = useCreatePurchaseOrder()
const updateMutation = useUpdatePurchaseOrder()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const onSubmit = handleSubmit(async (formValues) => {
  const itemsPayload: CreatePurchaseOrderItem[] = (formValues.items || [])
    .filter(item => item.description)
    .map(item => ({
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent,
      tax_rate: item.tax_rate,
      notes: item.notes || undefined,
    }))

  const payload: Parameters<typeof createMutation.mutateAsync>[0] = {
    contact_id: formValues.contact_id!,
    po_date: formValues.po_date || new Date().toISOString().split('T')[0]!,
    expected_date: formValues.expected_date || undefined,
    reference: formValues.reference || undefined,
    subject: formValues.subject || undefined,
    currency: formValues.currency || 'IDR',
    exchange_rate: formValues.exchange_rate || 1,
    discount_type: formValues.discount_type,
    discount_value: formValues.discount_value || undefined,
    tax_rate: formValues.tax_rate,
    notes: formValues.notes || undefined,
    terms_conditions: formValues.terms_conditions || undefined,
    shipping_address: formValues.shipping_address || undefined,
    items: itemsPayload,
  }

  try {
    if (isEditing.value && poId.value) {
      await updateMutation.mutateAsync({ id: poId.value, data: payload })
      toast.success('Purchase order updated successfully')
      router.push(`/purchasing/purchase-orders/${poId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload)
      toast.success('Purchase order created successfully')
      router.push(`/purchasing/purchase-orders/${result.id}`)
    }
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to save purchase order')
  }
})

// Set default expected date to 7 days from po_date
onMounted(() => {
  if (!isEditing.value) {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    setValues({ expected_date: date.toISOString().split('T')[0] ?? '' })
  }
})

// Vendor options for select
const contactOptions = computed(() => {
  if (!contacts.value) return []
  return contacts.value.map(c => ({
    value: c.id,
    label: c.name || `Contact #${c.id}`,
  }))
})
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2">
          <RouterLink to="/purchasing/purchase-orders" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
            <ArrowLeft class="w-4 h-4" />
            Purchase Orders
          </RouterLink>
          <span>/</span>
          <span class="text-slate-900 dark:text-slate-100">{{ isEditing ? 'Edit' : 'New' }}</span>
        </div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
        <p class="text-slate-500 dark:text-slate-400">
          {{ isEditing ? 'Update purchase order details' : 'Create a new purchase order for vendors' }}
        </p>
      </div>
      <Button variant="ghost" @click="router.back()">
        Cancel
      </Button>
    </div>

    <!-- Loading state for edit mode -->
    <div v-if="isEditing && loadingPO" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading purchase order...</div>
    </div>

    <!-- Not editable warning -->
    <Alert v-else-if="existingPO && !existingPO.can_edit" variant="warning" class="mb-6">
      This purchase order cannot be edited because it is no longer in draft status.
    </Alert>

    <!-- Form -->
    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <!-- Header Info Card -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Order Details</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Vendor -->
          <FormField label="Vendor" required :error="errors.contact_id">
            <Select
              v-model="contactId"
              :options="contactOptions"
              placeholder="Select vendor..."
              :loading="loadingContacts"
              @update:model-value="validateField('contact_id')"
            />
          </FormField>

          <!-- Reference -->
          <FormField label="Reference">
            <Input v-model="reference" placeholder="Vendor quote number, etc." />
          </FormField>

          <!-- Subject -->
          <FormField label="Subject" class="md:col-span-2">
            <Input v-model="subject" placeholder="Order description or title" />
          </FormField>

          <!-- PO Date -->
          <FormField label="PO Date" required :error="errors.po_date">
            <Input v-model="poDate" type="date" @blur="validateField('po_date')" />
          </FormField>

          <!-- Expected Date -->
          <FormField label="Expected Delivery Date">
            <Input v-model="expectedDate" type="date" />
          </FormField>

          <!-- Shipping Address -->
          <FormField label="Shipping Address" class="md:col-span-2">
            <Textarea
              v-model="shippingAddress"
              :rows="2"
              placeholder="Delivery address for this order"
            />
          </FormField>
        </div>
      </Card>

      <!-- Line Items Card -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-slate-900 dark:text-slate-100">Line Items</h2>
            <Button type="button" variant="ghost" size="sm" @click="addItem">
              <Plus class="w-4 h-4 mr-1" />
              Add Item
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
                <th class="px-3 py-2 text-left w-48">Product</th>
                <th class="px-3 py-2 text-left">Description</th>
                <th class="px-3 py-2 text-right w-20">Qty</th>
                <th class="px-3 py-2 text-left w-20">Unit</th>
                <th class="px-3 py-2 text-right w-32">Price</th>
                <th class="px-3 py-2 text-right w-20">Disc %</th>
                <th class="px-3 py-2 text-right w-20">Tax %</th>
                <th class="px-3 py-2 text-right w-32">Total</th>
                <th class="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              <tr v-for="(field, index) in itemFields" :key="field.key" class="align-top">
                <td class="px-3 py-2">
                  <select
                    :value="field.value.product_id ?? ''"
                    @change="(e) => {
                      const val = (e.target as HTMLSelectElement).value
                      field.value.product_id = val ? Number(val) : null
                      onProductSelect(index, field.value.product_id)
                    }"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Custom</option>
                    <option
                      v-for="opt in products"
                      :key="opt.id"
                      :value="opt.id"
                    >
                      {{ opt.sku }} - {{ opt.name }}
                    </option>
                  </select>
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model="field.value.description"
                    type="text"
                    placeholder="Item description"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model.number="field.value.quantity"
                    type="number"
                    min="0.0001"
                    step="any"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-right focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model="field.value.unit"
                    type="text"
                    placeholder="pcs"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <CurrencyInput
                    v-model="field.value.unit_price"
                    size="sm"
                    :min="0"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model.number="field.value.discount_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-right focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model.number="field.value.tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-right focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    <X class="w-4 h-4" />
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

              <!-- Discount -->
              <div class="flex items-center gap-2">
                <span class="text-slate-600 dark:text-slate-400 text-sm w-20">Discount</span>
                <select
                  v-model="discountType"
                  class="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">Rp</option>
                </select>
                <CurrencyInput
                  v-if="discountType === 'fixed'"
                  v-model="discountValue"
                  size="sm"
                  class="w-32"
                  :min="0"
                />
                <input
                  v-else
                  v-model.number="discountValue"
                  type="number"
                  min="0"
                  max="100"
                  class="w-24 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-right"
                />
                <span class="text-slate-500 dark:text-slate-400 text-sm ml-auto">
                  -{{ formatCurrency(discountAmount) }}
                </span>
              </div>

              <div class="flex justify-between text-sm">
                <span class="text-slate-600 dark:text-slate-400">Tax (from items)</span>
                <span class="text-slate-900 dark:text-slate-100">{{ formatCurrency(taxAmount) }}</span>
              </div>

              <div class="flex justify-between text-lg font-semibold border-t border-slate-200 dark:border-slate-700 pt-2">
                <span class="text-slate-900 dark:text-slate-100">Grand Total</span>
                <span class="text-primary-600 dark:text-primary-500">{{ formatCurrency(grandTotal) }}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Notes & Terms Card -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Notes & Terms</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Notes">
            <Textarea
              v-model="notes"
              :rows="4"
              placeholder="Internal notes or vendor remarks"
            />
          </FormField>

          <FormField label="Terms & Conditions">
            <Textarea
              v-model="termsConditions"
              :rows="4"
              placeholder="Payment terms, delivery terms, etc."
            />
          </FormField>
        </div>
      </Card>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">
          Cancel
        </Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Purchase Order' : 'Create Purchase Order' }}
        </Button>
      </div>
    </form>
  </div>
</template>
