<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useStockTransfer } from '@/api/useInventory'
import { useWarehousesLookup } from '@/api/useWarehouses'
import { Button, Input, FormField, Textarea, Select, Card, useToast } from '@/components/ui'

const router = useRouter()
const toast = useToast()

// Form state
const form = ref({
  product_id: null as number | null,
  from_warehouse_id: null as number | null,
  to_warehouse_id: null as number | null,
  quantity: 1,
  notes: '',
})

// Products lookup - only products that track inventory
const { data: productsData } = useQuery({
  queryKey: ['products', 'inventory-lookup'],
  queryFn: async () => {
    const response = await api.get<{
      data: Array<{
        id: number
        sku: string
        name: string
        track_inventory: boolean
        current_stock: number
      }>
    }>('/products?per_page=200&track_inventory=true')
    return response.data.data.filter((p) => p.track_inventory)
  },
})

const productOptions = computed(() =>
  (productsData.value ?? []).map((p) => ({
    value: p.id,
    label: `${p.sku} - ${p.name}`,
  }))
)

// Warehouses lookup
const { data: warehousesData } = useWarehousesLookup()

const fromWarehouseOptions = computed(() =>
  (warehousesData.value ?? []).map((w) => ({
    value: w.id,
    label: `${w.code} - ${w.name}`,
  }))
)

// Filter out the selected "from" warehouse from "to" options
const toWarehouseOptions = computed(() =>
  (warehousesData.value ?? [])
    .filter((w) => w.id !== form.value.from_warehouse_id)
    .map((w) => ({
      value: w.id,
      label: `${w.code} - ${w.name}`,
    }))
)

// Query stock at the source warehouse
const stockAtSource = ref<number | null>(null)

watch(
  () => [form.value.product_id, form.value.from_warehouse_id],
  async ([productId, warehouseId]) => {
    if (!productId || !warehouseId) {
      stockAtSource.value = null
      return
    }
    try {
      const response = await api.get<{
        data: Array<{ quantity: number }>
      }>(`/inventory/stock-levels?product_id=${productId}&warehouse_id=${warehouseId}`)
      stockAtSource.value = response.data.data?.[0]?.quantity ?? 0
    } catch {
      stockAtSource.value = 0
    }
  },
  { immediate: true }
)

// Reset "to" warehouse if it matches "from"
watch(
  () => form.value.from_warehouse_id,
  (newFrom) => {
    if (form.value.to_warehouse_id === newFrom) {
      form.value.to_warehouse_id = null
    }
  }
)

// Mutations
const transferMutation = useStockTransfer()

const isSubmitting = computed(() => transferMutation.isPending.value)

const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  // Validate
  if (!form.value.product_id) {
    errors.value.product_id = 'Product is required'
  }
  if (!form.value.from_warehouse_id) {
    errors.value.from_warehouse_id = 'Source warehouse is required'
  }
  if (!form.value.to_warehouse_id) {
    errors.value.to_warehouse_id = 'Destination warehouse is required'
  }
  if (form.value.quantity <= 0) {
    errors.value.quantity = 'Quantity must be greater than 0'
  }
  if (stockAtSource.value !== null && form.value.quantity > stockAtSource.value) {
    errors.value.quantity = `Cannot transfer more than available stock (${stockAtSource.value})`
  }

  if (Object.keys(errors.value).length > 0) return

  try {
    await transferMutation.mutateAsync({
      product_id: form.value.product_id!,
      from_warehouse_id: form.value.from_warehouse_id!,
      to_warehouse_id: form.value.to_warehouse_id!,
      quantity: form.value.quantity,
      notes: form.value.notes || undefined,
    })
    toast.success('Stock transferred successfully')
    router.push('/inventory/movements')
  } catch (err: any) {
    const message = err?.response?.data?.message || 'Failed to transfer stock'
    toast.error(message)
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Stock Transfer</h1>
        <p class="text-muted-foreground">Transfer inventory between warehouses</p>
      </div>
      <Button variant="ghost" @click="router.push('/inventory')">Cancel</Button>
    </div>

    <form novalidate @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Product Selection -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Product</h2>
        </template>
        <FormField label="Product" required :error="errors.product_id">
          <Select
            v-model="form.product_id"
            :options="productOptions"
            placeholder="Select product..."
            searchable
            testId="transfer-product"
          />
        </FormField>
      </Card>

      <!-- Warehouse Selection -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Warehouses</h2>
        </template>
        <div class="space-y-4">
          <FormField label="From Warehouse" required :error="errors.from_warehouse_id">
            <Select
              v-model="form.from_warehouse_id"
              :options="fromWarehouseOptions"
              placeholder="Select source warehouse..."
              testId="transfer-source"
            />
          </FormField>

          <FormField label="To Warehouse" required :error="errors.to_warehouse_id">
            <Select
              v-model="form.to_warehouse_id"
              :options="toWarehouseOptions"
              placeholder="Select destination warehouse..."
              :disabled="!form.from_warehouse_id"
              testId="transfer-target"
            />
          </FormField>

          <!-- Stock at Source -->
          <div
            v-if="stockAtSource !== null"
            class="p-4 bg-muted rounded-lg"
          >
            <div class="text-sm text-muted-foreground">Available at Source</div>
            <div class="text-2xl font-bold text-foreground">
              {{ stockAtSource }}
            </div>
          </div>
        </div>
      </Card>

      <!-- Transfer Details -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Transfer Details</h2>
        </template>
        <div class="space-y-4">
          <FormField label="Quantity" required :error="errors.quantity">
            <Input
              v-model.number="form.quantity"
              type="number"
              min="1"
              :max="stockAtSource ?? undefined"
              data-testid="transfer-quantity"
            />
          </FormField>

          <!-- Preview -->
          <div
            v-if="stockAtSource !== null && form.quantity > 0"
            class="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div class="text-sm text-blue-600 dark:text-blue-400">After Transfer</div>
            <div class="grid grid-cols-2 gap-4 mt-2">
              <div>
                <div class="text-xs text-muted-foreground">Source</div>
                <div class="text-lg font-bold text-foreground">
                  {{ stockAtSource - form.quantity }}
                </div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground">Destination</div>
                <div class="text-lg font-bold text-green-600 dark:text-green-400">
                  +{{ form.quantity }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Notes -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Notes</h2>
        </template>
        <FormField label="Transfer reason (optional)">
          <Textarea
            v-model="form.notes"
            :rows="3"
            placeholder="e.g., Replenishing branch stock, consolidating inventory, etc."
            data-testid="transfer-notes"
          />
        </FormField>
      </Card>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.push('/inventory')">
          Cancel
        </Button>
        <Button type="submit" :loading="isSubmitting" data-testid="transfer-submit">Transfer Stock</Button>
      </div>
    </form>
  </div>
</template>
