<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useStockAdjust, useStockIn, useStockOut } from '@/api/useInventory'
import { Button, Input, FormField, Textarea, Select, Card, useToast } from '@/components/ui'

const router = useRouter()
const toast = useToast()

// Adjustment type
const adjustmentType = ref<'adjust' | 'in' | 'out'>('adjust')

// Form state
const form = ref({
  product_id: null as number | null,
  warehouse_id: 0,
  quantity: 0,
  new_quantity: 0,
  unit_cost: 0,
  notes: '',
})

// Products lookup
const { data: productsData } = useQuery({
  queryKey: ['products', 'inventory-lookup'],
  queryFn: async () => {
    const response = await api.get<{ data: Array<{ id: number; sku: string; name: string; track_inventory: boolean; current_stock: number }> }>(
      '/products?per_page=200&track_inventory=true'
    )
    return response.data.data.filter(p => p.track_inventory)
  },
})

const productOptions = computed(() =>
  (productsData.value ?? []).map(p => ({
    value: p.id,
    label: `${p.sku} - ${p.name} (Stock: ${p.current_stock})`,
  }))
)

// Warehouses lookup
const { data: warehousesData } = useQuery({
  queryKey: ['warehouses', 'lookup'],
  queryFn: async () => {
    const response = await api.get<{ data: Array<{ id: number; code: string; name: string }> }>('/warehouses')
    return response.data.data
  },
})

const warehouseOptions = computed(() => [
  { value: 0, label: 'Default Warehouse' },
  ...(warehousesData.value ?? []).map(w => ({
    value: w.id,
    label: `${w.code} - ${w.name}`,
  })),
])

// Selected product info
const selectedProduct = computed(() =>
  productsData.value?.find(p => p.id === form.value.product_id)
)

// Watch product selection to set initial quantity
watch(() => form.value.product_id, (productId) => {
  if (productId) {
    const product = productsData.value?.find(p => p.id === productId)
    if (product) {
      form.value.new_quantity = product.current_stock
    }
  }
})

// Mutations
const adjustMutation = useStockAdjust()
const stockInMutation = useStockIn()
const stockOutMutation = useStockOut()

const isSubmitting = computed(() =>
  adjustMutation.isPending.value ||
  stockInMutation.isPending.value ||
  stockOutMutation.isPending.value
)

const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  if (!form.value.product_id) {
    errors.value.product_id = 'Product is required'
  }

  if (adjustmentType.value === 'adjust') {
    if (form.value.new_quantity < 0) {
      errors.value.new_quantity = 'Quantity cannot be negative'
    }
  } else {
    if (form.value.quantity <= 0) {
      errors.value.quantity = 'Quantity must be greater than 0'
    }
    if (adjustmentType.value === 'in' && form.value.unit_cost <= 0) {
      errors.value.unit_cost = 'Unit cost is required for stock in'
    }
  }

  if (Object.keys(errors.value).length > 0) return

  try {
    if (adjustmentType.value === 'adjust') {
      await adjustMutation.mutateAsync({
        product_id: form.value.product_id!,
        warehouse_id: form.value.warehouse_id || undefined,
        new_quantity: form.value.new_quantity,
        new_unit_cost: form.value.unit_cost || undefined,
        notes: form.value.notes || undefined,
      })
      toast.success('Stock adjusted successfully')
    } else if (adjustmentType.value === 'in') {
      await stockInMutation.mutateAsync({
        product_id: form.value.product_id!,
        warehouse_id: form.value.warehouse_id || undefined,
        quantity: form.value.quantity,
        unit_cost: form.value.unit_cost,
        notes: form.value.notes || undefined,
      })
      toast.success('Stock in recorded successfully')
    } else {
      await stockOutMutation.mutateAsync({
        product_id: form.value.product_id!,
        warehouse_id: form.value.warehouse_id || undefined,
        quantity: form.value.quantity,
        notes: form.value.notes || undefined,
      })
      toast.success('Stock out recorded successfully')
    }
    router.push('/inventory')
  } catch (err: any) {
    const message = err?.response?.data?.message || 'Failed to process adjustment'
    toast.error(message)
  }
}

</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Stock Adjustment</h1>
        <p class="text-slate-500 dark:text-slate-400">Adjust inventory levels manually</p>
      </div>
      <Button variant="ghost" @click="router.push('/inventory')">Cancel</Button>
    </div>

    <form novalidate @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Adjustment Type -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Adjustment Type</h2>
        </template>
        <div class="flex gap-2">
          <Button
            type="button"
            data-testid="adjust-type-set"
            :variant="adjustmentType === 'adjust' ? 'default' : 'secondary'"
            @click="adjustmentType = 'adjust'"
          >
            Set Quantity
          </Button>
          <Button
            type="button"
            data-testid="adjust-type-in"
            :variant="adjustmentType === 'in' ? 'default' : 'secondary'"
            @click="adjustmentType = 'in'"
          >
            Stock In (+)
          </Button>
          <Button
            type="button"
            data-testid="adjust-type-out"
            :variant="adjustmentType === 'out' ? 'default' : 'secondary'"
            @click="adjustmentType = 'out'"
          >
            Stock Out (-)
          </Button>
        </div>
      </Card>

      <!-- Product Selection -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Product Information</h2>
        </template>
        <div class="space-y-4">
          <FormField label="Product" required :error="errors.product_id">
            <Select
              v-model="form.product_id"
              :options="productOptions"
              placeholder="Select product..."
              testId="adjust-product"
            />
          </FormField>

          <FormField label="Warehouse">
            <Select
              v-model="form.warehouse_id"
              :options="warehouseOptions"
              placeholder="Select warehouse..."
              testId="adjust-warehouse"
            />
          </FormField>

          <div v-if="selectedProduct" class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div class="text-sm text-slate-500 dark:text-slate-400">Current Stock</div>
            <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ selectedProduct.current_stock }}
            </div>
          </div>
        </div>
      </Card>

      <!-- Quantity Input -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">
            {{ adjustmentType === 'adjust' ? 'New Quantity' : adjustmentType === 'in' ? 'Stock In Amount' : 'Stock Out Amount' }}
          </h2>
        </template>
        <div class="space-y-4">
          <template v-if="adjustmentType === 'adjust'">
            <FormField label="New Quantity" required :error="errors.new_quantity">
              <Input v-model.number="form.new_quantity" type="number" min="0" data-testid="adjust-new-quantity" />
            </FormField>
            <FormField label="New Unit Cost (optional)">
              <Input v-model.number="form.unit_cost" type="number" min="0" step="1000" />
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Leave blank to keep current average cost</p>
            </FormField>
          </template>

          <template v-else>
            <FormField label="Quantity" required :error="errors.quantity">
              <Input v-model.number="form.quantity" type="number" min="1" data-testid="adjust-quantity" />
            </FormField>
            <FormField v-if="adjustmentType === 'in'" label="Unit Cost" required :error="errors.unit_cost">
              <Input v-model.number="form.unit_cost" type="number" min="0" step="1000" data-testid="adjust-unit-cost" />
            </FormField>
          </template>

          <!-- Preview -->
          <div v-if="selectedProduct && adjustmentType !== 'adjust'" class="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <div class="text-sm text-blue-600 dark:text-blue-400">After this adjustment</div>
            <div class="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {{ adjustmentType === 'in'
                ? selectedProduct.current_stock + (form.quantity || 0)
                : selectedProduct.current_stock - (form.quantity || 0)
              }}
            </div>
          </div>
        </div>
      </Card>

      <!-- Notes -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Notes</h2>
        </template>
        <FormField label="Reason for adjustment">
          <Textarea
            v-model="form.notes"
            :rows="3"
            placeholder="e.g., Physical count discrepancy, damaged goods, etc."
            data-testid="adjust-notes"
          />
        </FormField>
      </Card>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.push('/inventory')">Cancel</Button>
        <Button type="submit" :loading="isSubmitting" data-testid="adjust-submit">
          {{ adjustmentType === 'adjust' ? 'Adjust Stock' : adjustmentType === 'in' ? 'Record Stock In' : 'Record Stock Out' }}
        </Button>
      </div>
    </form>
  </div>
</template>
