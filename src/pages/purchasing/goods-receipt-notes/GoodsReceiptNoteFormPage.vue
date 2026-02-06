<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateGoodsReceiptNote } from '@/api/useGoodsReceiptNotes'
import { useWarehousesLookup } from '@/api/useWarehouses'
import { usePurchaseOrders } from '@/api/usePurchaseOrders'
import { ArrowLeft } from 'lucide-vue-next'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Select,
  Card,
  useToast,
} from '@/components/ui'

const router = useRouter()
const toast = useToast()

// Lookups
const { data: warehouses, isLoading: loadingWarehouses } = useWarehousesLookup()

// Fetch approved/pending POs only (status filter)
const poFilters = ref({ per_page: 500, status: 'approved' as const })
const { data: poResponse, isLoading: loadingPOs } = usePurchaseOrders(poFilters)
const purchaseOrders = computed(() => poResponse.value?.data || [])

// Form state
const receiptDate = ref(new Date().toISOString().split('T')[0] || '')
const warehouseId = ref<number | null>(null)
const purchaseOrderId = ref<number | null>(null)
const supplierDoNumber = ref('')
const supplierInvoiceNumber = ref('')
const vehicleNumber = ref('')
const driverName = ref('')
const notes = ref('')

// Warehouse options
const warehouseOptions = computed(() => {
  if (!warehouses.value) return []
  return warehouses.value.map(w => ({
    value: w.id,
    label: w.name || `Warehouse #${w.id}`,
  }))
})

// Purchase Order options
const poOptions = computed(() => {
  if (!purchaseOrders.value || purchaseOrders.value.length === 0) return []
  return purchaseOrders.value.map(po => ({
    value: po.id,
    label: `${po.po_number || `PO #${po.id}`} - ${po.contact?.name || 'No Supplier'}`,
  }))
})

// Form validation
const errors = ref<Record<string, string>>({})

function validateForm(): boolean {
  errors.value = {}

  if (!receiptDate.value) {
    errors.value.receipt_date = 'Receipt date is required'
  }

  if (!warehouseId.value) {
    errors.value.warehouse_id = 'Warehouse is required'
  }

  if (!purchaseOrderId.value) {
    errors.value.purchase_order_id = 'Purchase Order is required'
  }

  return Object.keys(errors.value).length === 0
}

// Form submission
const createMutation = useCreateGoodsReceiptNote()

const isSubmitting = computed(() => createMutation.isPending.value)

async function handleSubmit() {
  if (!validateForm()) {
    toast.error('Please fix validation errors')
    return
  }

  try {
    const result = await createMutation.mutateAsync({
      purchase_order_id: purchaseOrderId.value!,
      warehouse_id: warehouseId.value!,
      receipt_date: receiptDate.value,
      supplier_do_number: supplierDoNumber.value || undefined,
      supplier_invoice_number: supplierInvoiceNumber.value || undefined,
      vehicle_number: vehicleNumber.value || undefined,
      driver_name: driverName.value || undefined,
      notes: notes.value || undefined,
    })

    toast.success('GRN created successfully')
    router.push(`/purchasing/goods-receipt-notes/${result.id}`)
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data

    // Handle validation errors from backend
    if (response?.errors) {
      Object.entries(response.errors).forEach(([key, messages]) => {
        errors.value[key] = messages[0] ?? ''
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
  <div class="max-w-3xl mx-auto">
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
        <h1 class="text-2xl font-semibold text-foreground">Create Goods Receipt Note</h1>
        <p class="text-muted-foreground">
          Record goods received from suppliers
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
          <!-- Receipt Date -->
          <FormField label="Receipt Date" required :error="errors.receipt_date">
            <Input
              v-model="receiptDate"
              type="date"
              @blur="() => errors.receipt_date && validateForm()"
            />
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

          <!-- Purchase Order -->
          <FormField
            label="Purchase Order"
            required
            :error="errors.purchase_order_id"
            class="md:col-span-2"
          >
            <Select
              :model-value="purchaseOrderId"
              :options="poOptions"
              placeholder="Select approved purchase order..."
              :loading="loadingPOs"
              @update:model-value="(v) => {
                purchaseOrderId = v as number
                if (errors.purchase_order_id) validateForm()
              }"
            />
            <template #hint>
              Select the purchase order to receive goods for
            </template>
          </FormField>
        </div>
      </Card>

      <!-- Supplier Information Card -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Supplier Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Supplier DO Number -->
          <FormField label="Supplier DO Number" :error="errors.supplier_do_number">
            <Input
              v-model="supplierDoNumber"
              placeholder="Delivery order number from supplier"
            />
            <template #hint>
              Optional reference from supplier's delivery note
            </template>
          </FormField>

          <!-- Supplier Invoice Number -->
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
          <!-- Vehicle Number -->
          <FormField label="Vehicle Number" :error="errors.vehicle_number">
            <Input
              v-model="vehicleNumber"
              placeholder="e.g., B 1234 XYZ"
            />
          </FormField>

          <!-- Driver Name -->
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
