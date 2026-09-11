<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useCreateStandaloneGRN, useCreateGRNFromPO, type StandaloneGRNItem } from '@/api/useGoodsReceiptNotes'
import { usePurchaseOrder, type PurchaseOrder } from '@/api/usePurchaseOrders'
import { useWarehousesLookup } from '@/api/useWarehouses'
import { useContactsLookup } from '@/api/useContacts'
import { useProductsLookup, type Product } from '@/api/useProducts'
import { formatCurrency } from '@/utils/format'
import { remainingGrnLinesFromPurchaseOrder } from './grnFromPurchaseOrder'
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

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Lookups
const { data: warehouses, isLoading: loadingWarehouses } = useWarehousesLookup()
const { data: suppliers, isLoading: loadingSuppliers } = useContactsLookup('supplier')
const { data: products } = useProductsLookup()
const { data: receivablePOs, isLoading: loadingPOs } = useQuery({
  queryKey: ['purchase-orders', 'receivable-for-grn'],
  queryFn: async () => {
    const response = await api.get<{ data: PurchaseOrder[] }>('/purchase-orders', {
      params: { active_only: true, outstanding_only: true, per_page: 100, include: 'contact' },
    })
    return response.data.data
  },
})

const queryPoId = Number(route.query.purchase_order_id)
const purchaseOrderId = ref<number | null>(Number.isFinite(queryPoId) && queryPoId > 0 ? queryPoId : null)
const selectedPoId = computed(() => purchaseOrderId.value ?? 0)
const { data: selectedPO } = usePurchaseOrder(selectedPoId)

// Form state
const receiptDate = ref(new Date().toISOString().split('T')[0] || '')
const warehouseId = ref<number | null>(null)
const contactId = ref<number | null>(null)
const supplierDoNumber = ref('')
const supplierInvoiceNumber = ref('')
const vehicleNumber = ref('')
const driverName = ref('')
const notes = ref('')
const fromPurchaseOrder = computed(() => purchaseOrderId.value != null && purchaseOrderId.value > 0)

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

function applyPurchaseOrderLines(po: PurchaseOrder) {
  const lines = remainingGrnLinesFromPurchaseOrder(po)
  items.splice(0, items.length)
  if (lines.length === 0) {
    items.push({ product_id: null, quantity_ordered: 1, unit_price: 0 })
    return
  }
  lines.forEach((line) => items.push(line))
  if (po.contact_id) {
    contactId.value = Number(po.contact_id)
  }
}

watch(selectedPO, (po) => {
  if (!po || !fromPurchaseOrder.value) {
    return
  }
  applyPurchaseOrderLines(po)
}, { immediate: true })

function onPurchaseOrderSelect(value: string | number | null) {
  const id = value ? Number(value) : null
  purchaseOrderId.value = id && id > 0 ? id : null
  if (!purchaseOrderId.value) {
    items.splice(0, items.length)
    items.push({ product_id: null, quantity_ordered: 1, unit_price: 0 })
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

const purchaseOrderOptions = computed(() => {
  const opts = [{ value: '' as string | number, label: 'Standalone (no PO)' }]
  const rows = receivablePOs.value ?? []
  opts.push(...rows.map((po) => ({
    value: po.id,
    label: `${po.po_number || `PO #${po.id}`} — ${po.contact?.name ?? 'Vendor'}`,
  })))
  if (selectedPO.value && !rows.some((po) => po.id === selectedPO.value?.id)) {
    opts.push({
      value: selectedPO.value.id,
      label: `${selectedPO.value.po_number || `PO #${selectedPO.value.id}`} — ${selectedPO.value.contact?.name ?? 'Vendor'}`,
    })
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

  if (fromPurchaseOrder.value) {
    const remaining = selectedPO.value
      ? remainingGrnLinesFromPurchaseOrder(selectedPO.value)
      : []
    if (selectedPO.value && remaining.length === 0) {
      errors.value.purchase_order_id = 'This purchase order has no remaining quantity to receive'
    }
  } else {
    const validItems = items.filter(item => item.product_id)
    if (validItems.length === 0) {
      errors.value.items = 'At least one item with a product is required'
    }
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
const createFromPoMutation = useCreateGRNFromPO()
const isSubmitting = computed(() =>
  createMutation.isPending.value || createFromPoMutation.isPending.value
)

async function handleSubmit() {
  if (!validateForm()) {
    toast.error(Object.values(errors.value)[0] || 'Please fix validation errors')
    return
  }

  const header = {
    warehouse_id: warehouseId.value!,
    receipt_date: receiptDate.value || undefined,
    supplier_do_number: supplierDoNumber.value || undefined,
    supplier_invoice_number: supplierInvoiceNumber.value || undefined,
    vehicle_number: vehicleNumber.value || undefined,
    driver_name: driverName.value || undefined,
    notes: notes.value || undefined,
  }

  try {
    const result = fromPurchaseOrder.value && purchaseOrderId.value
      ? await createFromPoMutation.mutateAsync({
          purchaseOrderId: purchaseOrderId.value,
          data: header,
        })
      : await createMutation.mutateAsync({
          ...header,
          contact_id: contactId.value || undefined,
          items: items
            .filter(item => item.product_id)
            .map((item): StandaloneGRNItem => ({
              product_id: item.product_id!,
              quantity_ordered: item.quantity_ordered,
              unit_price: item.unit_price,
            })),
        })

    if (!result?.id) {
      toast.error('GRN was not created')
      return
    }

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
          <span class="text-foreground">New GRN</span>
        </div>
        <h1 class="text-2xl font-semibold text-foreground">Create Goods Receipt</h1>
        <p class="text-muted-foreground">
          Receive against a purchase order, or record a standalone receipt
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
          <FormField label="Purchase Order" :error="errors.purchase_order_id" class="md:col-span-2">
            <Select
              :model-value="purchaseOrderId ?? ''"
              :options="purchaseOrderOptions"
              placeholder="Select purchase order…"
              :loading="loadingPOs"
              test-id="grn-purchase-order"
              @update:model-value="onPurchaseOrderSelect"
            />
            <template #hint>
              Approved / partially received POs prefill remaining quantity. Leave empty for a standalone receipt.
            </template>
          </FormField>

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
            <Button v-if="!fromPurchaseOrder" type="button" variant="ghost" size="sm" @click="addItem">
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
                    :disabled="fromPurchaseOrder"
                    @change="(e) => {
                      const val = (e.target as HTMLSelectElement).value
                      item.product_id = val ? Number(val) : null
                      onProductSelect(index, item.product_id)
                    }"
                    class="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60"
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
                    :disabled="fromPurchaseOrder || items.length === 1"
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
