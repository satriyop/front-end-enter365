<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBill, useCreateBill, useUpdateBill } from '@/api/useBills'
import { useContactsLookup } from '@/api/useContacts'
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

interface LineItem {
  id?: number
  description: string
  quantity: number
  unit: string
  unit_price: number
  discount_percent: number
  tax_rate: number
}

interface FormState {
  contact_id: number | null
  vendor_invoice_number: string
  bill_date: string
  due_date: string
  description: string
  items: LineItem[]
}

const today = new Date().toISOString().split('T')[0] as string
const form = ref<FormState>({
  contact_id: null,
  vendor_invoice_number: '',
  bill_date: today,
  due_date: today,
  description: '',
  items: [{ description: '', quantity: 1, unit: 'pcs', unit_price: 0, discount_percent: 0, tax_rate: 11 }],
})

watch(existingBill, (bill) => {
  if (bill) {
    form.value = {
      contact_id: bill.contact_id,
      vendor_invoice_number: bill.vendor_invoice_number || '',
      bill_date: bill.bill_date || today,
      due_date: bill.due_date || today,
      description: bill.description || '',
      items: bill.items?.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        tax_rate: item.tax_rate,
      })) ?? [],
    }
  }
}, { immediate: true })

function addItem() {
  form.value.items.push({ description: '', quantity: 1, unit: 'pcs', unit_price: 0, discount_percent: 0, tax_rate: 11 })
}

function removeItem(index: number) {
  if (form.value.items.length > 1) {
    form.value.items.splice(index, 1)
  }
}

const subtotal = computed(() =>
  form.value.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
)

const taxAmount = computed(() =>
  form.value.items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unit_price
    return sum + (lineTotal * item.tax_rate / 100)
  }, 0)
)

const total = computed(() => subtotal.value + taxAmount.value)

const createMutation = useCreateBill()
const updateMutation = useUpdateBill()
const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  if (!form.value.contact_id) {
    errors.value.contact_id = 'Vendor is required'
  }
  if (form.value.items.length === 0) {
    errors.value.items = 'At least one item is required'
  }

  if (Object.keys(errors.value).length > 0) return

  try {
    if (isEditing.value && billId.value) {
      await updateMutation.mutateAsync({ id: billId.value, data: form.value as any })
      toast.success('Bill updated')
      router.push(`/bills/${billId.value}`)
    } else {
      const result = await createMutation.mutateAsync(form.value as any)
      toast.success('Bill created')
      router.push(`/bills/${result.id}`)
    }
  } catch (err) {
    toast.error('Failed to save bill')
    console.error(err)
  }
}
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

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Bill Information</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Vendor" required :error="errors.contact_id">
            <Select v-model="form.contact_id" :options="contactOptions" placeholder="Select vendor" />
          </FormField>
          <FormField label="Vendor Invoice #">
            <Input v-model="form.vendor_invoice_number" placeholder="Vendor's invoice number" />
          </FormField>
          <FormField label="Bill Date" required>
            <Input v-model="form.bill_date" type="date" />
          </FormField>
          <FormField label="Due Date" required>
            <Input v-model="form.due_date" type="date" />
          </FormField>
          <FormField label="Description" class="md:col-span-2">
            <Textarea v-model="form.description" :rows="2" placeholder="Bill description" />
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
          <div v-for="(item, index) in form.items" :key="index" class="grid grid-cols-12 gap-2 items-end">
            <div class="col-span-4">
              <label v-if="index === 0" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
              <Input v-model="item.description" placeholder="Item description" />
            </div>
            <div class="col-span-2">
              <label v-if="index === 0" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Qty</label>
              <Input v-model.number="item.quantity" type="number" min="1" />
            </div>
            <div class="col-span-2">
              <label v-if="index === 0" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Unit Price</label>
              <Input v-model.number="item.unit_price" type="number" min="0" step="1000" />
            </div>
            <div class="col-span-2">
              <label v-if="index === 0" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tax %</label>
              <Input v-model.number="item.tax_rate" type="number" min="0" max="100" />
            </div>
            <div class="col-span-2 flex justify-end">
              <Button type="button" variant="ghost" size="sm" @click="removeItem(index)" :disabled="form.items.length === 1">
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
