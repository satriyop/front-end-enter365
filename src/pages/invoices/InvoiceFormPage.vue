<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useInvoice,
  useCreateInvoice,
  useUpdateInvoice,
  type CreateInvoiceItem
} from '@/api/useInvoices'
import { useContactsLookup } from '@/api/useContacts'
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
const invoiceId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => invoiceId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Invoice' : 'New Invoice')

// Fetch existing invoice if editing
const invoiceIdRef = computed(() => invoiceId.value ?? 0)
const { data: existingInvoice, isLoading: loadingInvoice } = useInvoice(invoiceIdRef)

// Lookups
const { data: contacts, isLoading: loadingContacts } = useContactsLookup('customer')

// Form state
const form = ref({
  contact_id: null as number | null,
  invoice_date: new Date().toISOString().split('T')[0],
  due_date: '',
  description: '',
  reference: '',
  tax_rate: 11,
  discount_amount: 0,
})

// Line items
interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unit_price: number
}

const items = ref<LineItem[]>([createEmptyItem()])

function createEmptyItem(): LineItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    quantity: 1,
    unit: 'pcs',
    unit_price: 0,
  }
}

// Populate form when editing
watch(existingInvoice, (invoice) => {
  if (invoice) {
    form.value = {
      contact_id: invoice.contact_id,
      invoice_date: invoice.invoice_date.split('T')[0] ?? '',
      due_date: invoice.due_date.split('T')[0] ?? '',
      description: invoice.description ?? '',
      reference: invoice.reference ?? '',
      tax_rate: invoice.tax_rate ?? 11,
      discount_amount: invoice.discount_amount ?? 0,
    }

    if (invoice.items && invoice.items.length > 0) {
      items.value = invoice.items.map(item => ({
        id: crypto.randomUUID(),
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
      }))
    }
  }
}, { immediate: true })

// Calculations
function calculateItemTotal(item: LineItem): number {
  return item.quantity * item.unit_price
}

const subtotal = computed(() => {
  return items.value.reduce((sum, item) => sum + calculateItemTotal(item), 0)
})

const afterDiscount = computed(() => subtotal.value - form.value.discount_amount)

const taxAmount = computed(() => afterDiscount.value * (form.value.tax_rate / 100))

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

// Form submission
const createMutation = useCreateInvoice()
const updateMutation = useUpdateInvoice()

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
  if (!form.value.invoice_date) {
    errors.value.invoice_date = 'Invoice date is required'
  }
  if (!form.value.due_date) {
    errors.value.due_date = 'Due date is required'
  }
  if (items.value.length === 0 || !items.value.some(i => i.description)) {
    errors.value.items = 'At least one item is required'
  }

  if (Object.keys(errors.value).length > 0) {
    return
  }

  const itemsPayload: CreateInvoiceItem[] = items.value
    .filter(item => item.description)
    .map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price,
    }))

  const payload = {
    contact_id: form.value.contact_id!,
    invoice_date: form.value.invoice_date || new Date().toISOString().split('T')[0]!,
    due_date: form.value.due_date || new Date().toISOString().split('T')[0]!,
    description: form.value.description || undefined,
    reference: form.value.reference || undefined,
    tax_rate: form.value.tax_rate,
    discount_amount: form.value.discount_amount || undefined,
    items: itemsPayload,
  }

  try {
    if (isEditing.value && invoiceId.value) {
      await updateMutation.mutateAsync({ id: invoiceId.value, data: payload })
      toast.success('Invoice updated successfully')
      router.push(`/invoices/${invoiceId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload)
      toast.success('Invoice created successfully')
      router.push(`/invoices/${result.id}`)
    }
  } catch (err) {
    toast.error('Failed to save invoice')
    console.error(err)
  }
}

// Set default due_date to 30 days from invoice_date
onMounted(() => {
  if (!isEditing.value) {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    form.value.due_date = date.toISOString().split('T')[0] ?? ''
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
          {{ isEditing ? 'Update invoice details' : 'Create a new sales invoice' }}
        </p>
      </div>
      <Button variant="ghost" @click="router.back()">
        Cancel
      </Button>
    </div>

    <!-- Loading state for edit mode -->
    <div v-if="isEditing && loadingInvoice" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading invoice...</div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Header Info Card -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Invoice Details</h2>
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

          <!-- Invoice Date -->
          <FormField label="Invoice Date" required :error="errors.invoice_date">
            <Input v-model="form.invoice_date" type="date" />
          </FormField>

          <!-- Due Date -->
          <FormField label="Due Date" required :error="errors.due_date">
            <Input v-model="form.due_date" type="date" />
          </FormField>

          <!-- Description -->
          <FormField label="Description" class="md:col-span-2">
            <Textarea
              v-model="form.description"
              :rows="2"
              placeholder="Invoice description"
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
                <th class="px-3 py-2 text-right w-32">Price</th>
                <th class="px-3 py-2 text-right w-32">Total</th>
                <th class="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              <tr v-for="(item, index) in items" :key="item.id" class="align-top">
                <td class="px-3 py-2">
                  <input
                    v-model="item.description"
                    type="text"
                    placeholder="Item description"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                <input
                  v-model.number="form.discount_amount"
                  type="number"
                  min="0"
                  class="w-32 px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-right"
                />
                <span class="text-slate-500 dark:text-slate-400 text-sm ml-auto">
                  -{{ formatCurrency(form.discount_amount) }}
                </span>
              </div>

              <!-- Tax Rate -->
              <div class="flex items-center gap-2">
                <span class="text-slate-600 dark:text-slate-400 text-sm w-20">Tax (%)</span>
                <input
                  v-model.number="form.tax_rate"
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
          {{ isEditing ? 'Update Invoice' : 'Create Invoice' }}
        </Button>
      </div>
    </form>
  </div>
</template>
