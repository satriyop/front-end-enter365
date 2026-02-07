<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateStandaloneGRN, type StandaloneGRNItem } from '@/api/useGoodsReceiptNotes'
import { useWarehousesLookup } from '@/api/useWarehouses'
import { useContactsLookup } from '@/api/useContacts'
import { useProductsLookup, type Product } from '@/api/useProducts'
import { formatCurrency } from '@/utils/format'
import { ArrowLeft, Plus, X } from 'lucide-vue-next'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Select,
  Card,
  CurrencyInput,
  useToast,
} from '@/components/ui'

const router = useRouter()
const toast = useToast()

// Lookups
const { data: warehouses, isLoading: loadingWarehouses } = useWarehousesLookup()
const { data: suppliers, isLoading: loadingSuppliers } = useContactsLookup('supplier')
const { data: products } = useProductsLookup()

// Form state
const receiptDate = ref(new Date().toISOString().split('T')[0] || '')
const warehouseId = ref<number | null>(null)
const contactId = ref<number | null>(null)
const supplierDoNumber = ref('')
const supplierInvoiceNumber = ref('')
const vehicleNumber = ref('')
const driverName = ref('')
const notes = ref('')

// Line items
interface LineItem {
  product_id: number | null
  quantity_ordered: number
  unit_price: number
}

const items = reactive<LineItem[]>([
  { product_id: null, quantity_ordered: 1, unit_price: 0 },
])

function addItem() {
  items.push({ product_id: null, quantity_ordered: 1, unit_price: 0 })
}

function removeItem(index: number) {
  if (items.length > 1) {
    items.splice(index, 1)
  }
}

function onProductSelect(index: number, productId: number | null) {
  if (!productId || !products.value) return
  const item = items[index]
  const product = products.value.find((p: Product) => p.id === productId)
  if (product && item) {
    item.unit_price = product.purchase_price || 0
  }
}

// Computed options
const warehouseOptions = computed(() => {
  if (!warehouses.value) return []
  return warehouses.value.map(w => ({
    value: w.id,
    label: w.name || `Warehouse #${w.id}`,
  }))
})

const supplierOptions = computed(() => {
  const opts = [{ value: '' as string | number, label: 'No Supplier' }]
  if (suppliers.value) {
    opts.push(...suppliers.value.map(s => ({
      value: s.id,
      label: s.name || `Contact #${s.id}`,
    })))
  }
  return opts
})

// Line item total
function getItemTotal(item: LineItem): number {
  return item.quantity_ordered * item.unit_price
}

const grandTotal = computed(() => {
  return items.reduce((sum, item) => sum + getItemTotal(item), 0)
})

// Validation
const errors = ref<Record<string, string>>({})

function validateForm(): boolean {
  errors.value = {}

  if (!warehouseId.value) {
    errors.value.warehouse_id = 'Warehouse is required'
  }

  // Validate line items
  const validItems = items.filter(item => item.product_id)
  if (validItems.length === 0) {
    errors.value.items = 'At least one item with a product is required'
  }

  for (const [i, item] of items.entries()) {
    if (item.product_id && item.quantity_ordered < 1) {
      errors.value[`items.${i}.quantity_ordered`] = 'Quantity must be at least 1'
    }
  }

  return Object.keys(errors.value).length === 0
}

// Submission
const createMutation = useCreateStandaloneGRN()
const isSubmitting = computed(() => createMutation.isPending.value)

async function handleSubmit() {
  if (!validateForm()) {
    toast.error('Please fix validation errors')
    return
  }

  // Filter out empty items
  const validItems: StandaloneGRNItem[] = items
    .filter(item => item.product_id)
    .map(item => ({
      product_id: item.product_id!,
      quantity_ordered: item.quantity_ordered,
      unit_price: item.unit_price,
    }))

  try {
    const result = await createMutation.mutateAsync({
      warehouse_id: warehouseId.value!,
      contact_id: contactId.value || undefined,
      receipt_date: receiptDate.value || undefined,
      supplier_do_number: supplierDoNumber.value || undefined,
      supplier_invoice_number: supplierInvoiceNumber.value || undefined,
      vehicle_number: vehicleNumber.value || undefined,
      driver_name: driverName.value || undefined,
      notes: notes.value || undefined,
      items: validItems,
    })

    toast.success('GRN created successfully')
    router.push(`/purchasing/goods-receipt-notes/${result.id}`)
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data

    if (response?.errors) {
      Object.entries(response.errors).forEach(([key, messages]) => {
        errors.value[key] = messages[0] ?? 'Validation error'
      })
    }

    toast.error(response?.message || 'Failed to create GRN')
  }
}

function handleCancel() {
  router.push('/purchasing/goods-receipt-notes')
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <RouterLink
            to="/purchasing/goods-receipt-notes"
            class="hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft class="w-4 h-4" />
            Goods Receipt Notes
          </RouterLink>
          <span>/</span>
          <span class="text-foreground">New Standalone GRN</span>
        </div>
        <h1 class="text-2xl font-semibold text-foreground">Create Standalone GRN</h1>
        <p class="text-muted-foreground">
          Record goods received without a purchase order
        </p>
      </div>
      <Button variant="ghost" @click="handleCancel">
        Cancel
      </Button>
    </div>

    <!-- Form -->
    <form novalidate @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Receipt Details Card -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Receipt Details</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Warehouse -->
          <FormField label="Warehouse" required :error="errors.warehouse_id">
            <Select
              :model-value="warehouseId"
              :options="warehouseOptions"
              placeholder="Select warehouse..."
              :loading="loadingWarehouses"
              @update:model-value="(v) => {
                warehouseId = v as number
                if (errors.warehouse_id) validateForm()
              }"
            />
          </FormField>

          <!-- Receipt Date -->
          <FormField label="Receipt Date" :error="errors.receipt_date">
            <Input
              v-model="receiptDate"
              type="date"
            />
          </FormField>

          <!-- Supplier -->
          <FormField label="Supplier" :error="errors.contact_id" class="md:col-span-2">
            <Select
              :model-value="contactId ?? ''"
              :options="supplierOptions"
              placeholder="Select supplier (optional)..."
              :loading="loadingSuppliers"
              @update:model-value="(v) => contactId = v ? Number(v) : null"
            />
            <template #hint>
              Optional — select the supplier for this receipt
            </template>
          </FormField>
        </div>
      </Card>

      <!-- Line Items Card -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-foreground">Line Items</h2>
            <Button type="button" variant="ghost" size="sm" @click="addItem">
              <Plus class="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>
        </template>

        <p v-if="errors.items" class="text-sm text-destructive mb-4">
          {{ errors.items }}
        </p>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted text-muted-foreground">
              <tr>
                <th class="px-3 py-2 text-left w-64">Product</th>
                <th class="px-3 py-2 text-right w-24">Qty</th>
                <th class="px-3 py-2 text-right w-40">Unit Price</th>
                <th class="px-3 py-2 text-right w-36">Total</th>
                <th class="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="(item, index) in items" :key="index" class="align-top">
                <td class="px-3 py-2">
                  <select
                    :value="item.product_id ?? ''"
                    @change="(e) => {
                      const val = (e.target as HTMLSelectElement).value
                      item.product_id = val ? Number(val) : null
                      onProductSelect(index, item.product_id)
                    }"
                    class="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select product...</option>
                    <option
                      v-for="p in products"
                      :key="p.id"
                      :value="p.id"
                    >
                      {{ p.sku }} - {{ p.name }}
                    </option>
                  </select>
                  <p v-if="errors[`items.${index}.product_id`]" class="text-xs text-destructive mt-1">
                    {{ errors[`items.${index}.product_id`] }}
                  </p>
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model.number="item.quantity_ordered"
                    type="number"
                    min="1"
                    class="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-sm text-right focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <p v-if="errors[`items.${index}.quantity_ordered`]" class="text-xs text-destructive mt-1">
                    {{ errors[`items.${index}.quantity_ordered`] }}
                  </p>
                </td>
                <td class="px-3 py-2">
                  <CurrencyInput
                    v-model="item.unit_price"
                    size="sm"
                    :min="0"
                  />
                </td>
                <td class="px-3 py-2 text-right font-medium text-foreground whitespace-nowrap pt-3">
                  {{ formatCurrency(getItemTotal(item)) }}
                </td>
                <td class="px-3 py-2">
                  <button
                    type="button"
                    @click="removeItem(index)"
                    :disabled="items.length === 1"
                    class="text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <X class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Total -->
        <div class="mt-4 border-t border-border pt-4">
          <div class="flex justify-end">
            <div class="w-60">
              <div class="flex justify-between text-lg font-semibold">
                <span class="text-foreground">Total</span>
                <span class="text-primary">{{ formatCurrency(grandTotal) }}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Supplier Information Card -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Supplier Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Supplier DO Number" :error="errors.supplier_do_number">
            <Input
              v-model="supplierDoNumber"
              placeholder="Delivery order number from supplier"
            />
          </FormField>

          <FormField label="Supplier Invoice Number" :error="errors.supplier_invoice_number">
            <Input
              v-model="supplierInvoiceNumber"
              placeholder="Invoice number from supplier"
            />
          </FormField>
        </div>
      </Card>

      <!-- Delivery Information Card -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Delivery Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Vehicle Number" :error="errors.vehicle_number">
            <Input
              v-model="vehicleNumber"
              placeholder="e.g., B 1234 XYZ"
            />
          </FormField>

          <FormField label="Driver Name" :error="errors.driver_name">
            <Input
              v-model="driverName"
              placeholder="Name of the delivery driver"
            />
          </FormField>
        </div>
      </Card>

      <!-- Notes Card -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Additional Notes</h2>
        </template>

        <FormField label="Notes" :error="errors.notes">
          <Textarea
            v-model="notes"
            :rows="4"
            placeholder="Any additional notes about this receipt..."
          />
        </FormField>
      </Card>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="handleCancel">
          Cancel
        </Button>
        <Button type="submit" :loading="isSubmitting">
          Create GRN
        </Button>
      </div>
    </form>
  </div>
</template>
