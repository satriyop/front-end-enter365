<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProduct, useCreateProduct, useUpdateProduct } from '@/api/useProducts'
import { Button, Input, FormField, Textarea, Select, Card, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const productId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => productId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Product' : 'New Product')

// Fetch existing product if editing
const productIdRef = computed(() => productId.value ?? 0)
const { data: existingProduct, isLoading: loadingProduct } = useProduct(productIdRef)

interface FormState {
  sku: string
  name: string
  description: string
  type: 'product' | 'service'
  unit: string
  purchase_price: number
  selling_price: number
  tax_rate: number
  is_taxable: boolean
  is_active: boolean
  track_inventory: boolean
  min_stock: number
}

const form = ref<FormState>({
  sku: '',
  name: '',
  description: '',
  type: 'product',
  unit: 'pcs',
  purchase_price: 0,
  selling_price: 0,
  tax_rate: 11,
  is_taxable: true,
  is_active: true,
  track_inventory: true,
  min_stock: 0,
})

const typeOptions = [
  { value: 'product', label: 'Product' },
  { value: 'service', label: 'Service' },
]

const unitOptions = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'unit', label: 'Unit' },
  { value: 'set', label: 'Set' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'm', label: 'Meter (m)' },
  { value: 'wp', label: 'Watt Peak (Wp)' },
]

// Populate form when editing
watch(existingProduct, (product) => {
  if (product) {
    form.value = {
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      type: product.type as 'product' | 'service',
      unit: product.unit,
      purchase_price: product.purchase_price,
      selling_price: product.selling_price,
      tax_rate: product.tax_rate,
      is_taxable: product.is_taxable,
      is_active: product.is_active,
      track_inventory: product.track_inventory ?? true,
      min_stock: product.min_stock ?? 0,
    }
  }
}, { immediate: true })

// Form submission
const createMutation = useCreateProduct()
const updateMutation = useUpdateProduct()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  if (!form.value.sku.trim()) {
    errors.value.sku = 'SKU is required'
  }
  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
  }

  if (Object.keys(errors.value).length > 0) return

  try {
    if (isEditing.value && productId.value) {
      await updateMutation.mutateAsync({ id: productId.value, data: form.value })
      toast.success('Product updated successfully')
      router.push(`/products/${productId.value}`)
    } else {
      const result = await createMutation.mutateAsync(form.value)
      toast.success('Product created successfully')
      router.push(`/products/${result.id}`)
    }
  } catch (err) {
    toast.error('Failed to save product')
    console.error(err)
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
        <p class="text-slate-500 dark:text-slate-400">
          {{ isEditing ? 'Update product information' : 'Add a new product or service' }}
        </p>
      </div>
      <Button variant="ghost" @click="router.back()">Cancel</Button>
    </div>

    <div v-if="isEditing && loadingProduct" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading product...</div>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Basic Information</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="SKU" required :error="errors.sku">
            <Input v-model="form.sku" placeholder="e.g., SOLAR-PANEL-450W" :disabled="isEditing" />
          </FormField>
          <FormField label="Type" required>
            <Select v-model="form.type" :options="typeOptions" />
          </FormField>
          <FormField label="Name" required :error="errors.name" class="md:col-span-2">
            <Input v-model="form.name" placeholder="Product name" />
          </FormField>
          <FormField label="Unit" required>
            <Select v-model="form.unit" :options="unitOptions" />
          </FormField>
          <FormField label="Description" class="md:col-span-2">
            <Textarea v-model="form.description" :rows="3" placeholder="Product description" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Pricing</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Purchase Price">
            <Input v-model.number="form.purchase_price" type="number" min="0" step="1000" />
          </FormField>
          <FormField label="Selling Price">
            <Input v-model.number="form.selling_price" type="number" min="0" step="1000" />
          </FormField>
          <FormField label="Tax Rate (%)">
            <Input v-model.number="form.tax_rate" type="number" min="0" max="100" step="0.5" />
          </FormField>
          <div class="flex items-center gap-4 pt-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.is_taxable" type="checkbox" class="rounded border-slate-300 dark:border-slate-600" />
              <span class="text-sm text-slate-700 dark:text-slate-300">Taxable</span>
            </label>
          </div>
        </div>
      </Card>

      <Card v-if="form.type === 'product'">
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Inventory</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="form.track_inventory" type="checkbox" class="rounded border-slate-300 dark:border-slate-600" />
              <span class="text-sm text-slate-700 dark:text-slate-300">Track Inventory</span>
            </label>
          </div>
          <FormField label="Minimum Stock">
            <Input v-model.number="form.min_stock" type="number" min="0" :disabled="!form.track_inventory" />
          </FormField>
        </div>
      </Card>

      <Card>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-slate-900 dark:text-slate-100">Active Status</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">Inactive products won't appear in lookups</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.is_active" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-300 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>
      </Card>

      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">Cancel</Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Product' : 'Create Product' }}
        </Button>
      </div>
    </form>
  </div>
</template>
