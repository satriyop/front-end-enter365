<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useQuotation,
  useCreateQuotation,
  useUpdateQuotation,
  type CreateQuotationItem
} from '@/api/useQuotations'
import { useContactsLookup } from '@/api/useContacts'
import { useProductsLookup } from '@/api/useProducts'
import { formatCurrency } from '@/utils/format'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Select,
  Card,
  Alert,
  useToast
} from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if we're editing
const quotationId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => quotationId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Quotation' : 'New Quotation')

// Fetch existing quotation if editing
const quotationIdRef = computed(() => quotationId.value ?? 0)
const { data: existingQuotation, isLoading: loadingQuotation } = useQuotation(quotationIdRef)

// Lookups
const { data: contacts, isLoading: loadingContacts } = useContactsLookup('customer')
const { data: products } = useProductsLookup()

// Form state
const form = ref({
  contact_id: null as number | null,
  quotation_date: new Date().toISOString().split('T')[0],
  valid_until: '',
  subject: '',
  reference: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: 0,
  tax_rate: 11, // Default PPN 11%
  notes: '',
  terms_conditions: '',
})

// Line items
interface LineItem {
  id: string // temp ID for tracking
  product_id: number | null
  description: string
  quantity: number
  unit: string
  unit_price: number
  discount_percent: number
  tax_rate: number
  notes: string
}

const items = ref<LineItem[]>([createEmptyItem()])

function createEmptyItem(): LineItem {
  return {
    id: crypto.randomUUID(),
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
watch(existingQuotation, (quotation) => {
  if (quotation) {
    form.value = {
      contact_id: quotation.contact_id,
      quotation_date: quotation.quotation_date.split('T')[0],
      valid_until: quotation.valid_until?.split('T')[0] ?? '',
      subject: quotation.subject ?? '',
      reference: quotation.reference ?? '',
      discount_type: (quotation.discount_type as 'percentage' | 'fixed') ?? 'percentage',
      discount_value: quotation.discount_value ?? 0,
      tax_rate: quotation.tax_rate ?? 11,
      notes: quotation.notes ?? '',
      terms_conditions: quotation.terms_conditions ?? '',
    }

    if (quotation.items && quotation.items.length > 0) {
      items.value = quotation.items.map(item => ({
        id: crypto.randomUUID(),
        product_id: item.product_id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        tax_rate: item.tax_rate,
        notes: item.notes ?? '',
      }))
    }
  }
}, { immediate: true })

// Calculations
function calculateItemTotal(item: LineItem): number {
  const gross = item.quantity * item.unit_price
  const discountAmount = gross * (item.discount_percent / 100)
  const afterDiscount = gross - discountAmount
  const taxAmount = afterDiscount * (item.tax_rate / 100)
  return afterDiscount + taxAmount
}

const subtotal = computed(() => {
  return items.value.reduce((sum, item) => {
    const gross = item.quantity * item.unit_price
    const discountAmount = gross * (item.discount_percent / 100)
    return sum + (gross - discountAmount)
  }, 0)
})

const discountAmount = computed(() => {
  if (form.value.discount_type === 'percentage') {
    return subtotal.value * (form.value.discount_value / 100)
  }
  return form.value.discount_value
})

const afterDiscount = computed(() => subtotal.value - discountAmount.value)

const taxAmount = computed(() => {
  return items.value.reduce((sum, item) => {
    const gross = item.quantity * item.unit_price
    const itemDiscount = gross * (item.discount_percent / 100)
    const afterItemDiscount = gross - itemDiscount
    return sum + (afterItemDiscount * (item.tax_rate / 100))
  }, 0)
})

const grandTotal = computed(() => afterDiscount.value + taxAmount.value)

// Item management
function addItem() {
  items.value.push(createEmptyItem())
}

function removeItem(index: number) {
  if (items.value.length > 1) {
    items.value.splice(index, 1)
  }
}

function onProductSelect(item: LineItem, productId: number | null) {
  if (productId && products.value) {
    const product = products.value.find(p => p.id === productId)
    if (product) {
      item.description = product.name
      item.unit = product.unit
      item.unit_price = product.selling_price
      item.tax_rate = product.tax_rate
    }
  }
}

// Form submission
const createMutation = useCreateQuotation()
const updateMutation = useUpdateQuotation()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  // Basic validation
  if (!form.value.contact_id) {
    errors.value.contact_id = 'Customer is required'
  }
  if (!form.value.quotation_date) {
    errors.value.quotation_date = 'Date is required'
  }
  if (items.value.length === 0 || !items.value.some(i => i.description)) {
    errors.value.items = 'At least one item is required'
  }

  if (Object.keys(errors.value).length > 0) {
    return
  }

  const itemsPayload: CreateQuotationItem[] = items.value
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
    contact_id: form.value.contact_id!,
    quotation_date: form.value.quotation_date || new Date().toISOString().split('T')[0]!,
    valid_until: form.value.valid_until || new Date().toISOString().split('T')[0]!,
    subject: form.value.subject || undefined,
    reference: form.value.reference || undefined,
    discount_type: form.value.discount_type,
    discount_value: form.value.discount_value || undefined,
    tax_rate: form.value.tax_rate,
    notes: form.value.notes || undefined,
    terms_conditions: form.value.terms_conditions || undefined,
    items: itemsPayload,
  }

  try {
    if (isEditing.value && quotationId.value) {
      await updateMutation.mutateAsync({ id: quotationId.value, data: payload })
      toast.success('Quotation updated successfully')
      router.push(`/quotations/${quotationId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload)
      toast.success('Quotation created successfully')
      router.push(`/quotations/${result.id}`)
    }
  } catch (err) {
    toast.error('Failed to save quotation')
    console.error(err)
  }
}

// Set default valid_until to 30 days from quotation_date
onMounted(() => {
  if (!isEditing.value) {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    form.value.valid_until = date.toISOString().split('T')[0] ?? ''
  }
})

// Contact options for select
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
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
        <p class="text-slate-500 dark:text-slate-400">
          {{ isEditing ? 'Update quotation details' : 'Create a new sales quotation' }}
        </p>
      </div>
      <Button variant="ghost" @click="router.back()">
        Cancel
      </Button>
    </div>

    <!-- Loading state for edit mode -->
    <div v-if="isEditing && loadingQuotation" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading quotation...</div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Header Info Card -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Quotation Details</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Customer -->
          <FormField label="Customer" required :error="errors.contact_id">
            <Select
              v-model="form.contact_id"
              :options="contactOptions"
              placeholder="Select customer..."
              :loading="loadingContacts"
            />
          </FormField>

          <!-- Reference -->
          <FormField label="Reference">
            <Input v-model="form.reference" placeholder="PO number, etc." />
          </FormField>

          <!-- Subject -->
          <FormField label="Subject" class="md:col-span-2">
            <Input v-model="form.subject" placeholder="Quotation subject or title" />
          </FormField>

          <!-- Quotation Date -->
          <FormField label="Quotation Date" required :error="errors.quotation_date">
            <Input v-model="form.quotation_date" type="date" />
          </FormField>

          <!-- Valid Until -->
          <FormField label="Valid Until">
            <Input v-model="form.valid_until" type="date" />
          </FormField>
        </div>
      </Card>

      <!-- Line Items Card -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-slate-900 dark:text-slate-100">Line Items</h2>
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
              <tr v-for="(item, index) in items" :key="item.id" class="align-top">
                <td class="px-3 py-2">
                  <select
                    :value="item.product_id ?? ''"
                    @change="(e) => {
                      const val = (e.target as HTMLSelectElement).value
                      item.product_id = val ? Number(val) : null
                      onProductSelect(item, item.product_id)
                    }"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    v-model="item.description"
                    type="text"
                    placeholder="Item description"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="1"
                    step="1"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-right focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model="item.unit"
                    type="text"
                    placeholder="pcs"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model.number="item.unit_price"
                    type="number"
                    min="0"
                    step="1000"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-right focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model.number="item.discount_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-right focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model.number="item.tax_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-right focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2 text-right font-medium text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(calculateItemTotal(item)) }}
                </td>
                <td class="px-3 py-2">
                  <button
                    type="button"
                    @click="removeItem(index)"
                    :disabled="items.length === 1"
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

              <!-- Discount -->
              <div class="flex items-center gap-2">
                <span class="text-slate-600 dark:text-slate-400 text-sm w-20">Discount</span>
                <select
                  v-model="form.discount_type"
                  class="px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">Rp</option>
                </select>
                <input
                  v-model.number="form.discount_value"
                  type="number"
                  min="0"
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
                <span class="text-orange-600 dark:text-orange-500">{{ formatCurrency(grandTotal) }}</span>
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
              v-model="form.notes"
              :rows="4"
              placeholder="Internal notes or customer remarks"
            />
          </FormField>

          <FormField label="Terms & Conditions">
            <Textarea
              v-model="form.terms_conditions"
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
          {{ isEditing ? 'Update Quotation' : 'Create Quotation' }}
        </Button>
      </div>
    </form>
  </div>
</template>
