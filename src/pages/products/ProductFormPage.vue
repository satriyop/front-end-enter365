<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useProduct, useCreateProduct, useUpdateProduct } from '@/api/useProducts'
import { toNumber } from '@/utils/format'
import { productSchema, type ProductFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
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

// Form with VeeValidate
const {
  values: form,
  errors,
  handleSubmit,
  setValues,
  setErrors,
  validateField,
  defineField,
} = useForm<ProductFormData>({
  validationSchema: toTypedSchema(productSchema),
  initialValues: {
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
  },
})

const [sku] = defineField('sku')
const [name] = defineField('name')
const [description] = defineField('description')
const [type] = defineField('type')
const [unit] = defineField('unit')
const [purchasePrice] = defineField('purchase_price')
const [sellingPrice] = defineField('selling_price')
const [taxRate] = defineField('tax_rate')
const [isTaxable] = defineField('is_taxable')
const [isActive] = defineField('is_active')
const [trackInventory] = defineField('track_inventory')
const [minStock] = defineField('min_stock')

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
    setValues({
      sku: product.sku,
      name: product.name,
      type: product.type as 'product' | 'service',
      description: product.description || '',
      unit: product.unit,
      purchase_price: toNumber(product.purchase_price),
      selling_price: toNumber(product.selling_price),
      tax_rate: toNumber(product.tax_rate),
      is_taxable: !!product.is_taxable,
      is_active: !!product.is_active,
      track_inventory: !!product.track_inventory,
      min_stock: toNumber(product.min_stock),
      category_id: product.category_id,
    })
  }
}, { immediate: true })

// Form submission
const createMutation = useCreateProduct()
const updateMutation = useUpdateProduct()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const onSubmit = handleSubmit(async (formValues) => {
  try {
    // Cast to unknown first since form uses numbers but API expects string serialization
    const payload = formValues as unknown as Parameters<typeof createMutation.mutateAsync>[0]
    if (isEditing.value && productId.value) {
      await updateMutation.mutateAsync({ id: productId.value, data: payload })
      toast.success('Product updated successfully')
      router.push(`/products/${productId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload)
      toast.success('Product created successfully')
      router.push(`/products/${result.id}`)
    }
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to save product')
  }
})
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

    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Basic Information</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="SKU" required :error="errors.sku">
            <Input v-model="sku" placeholder="e.g., SOLAR-PANEL-450W" :disabled="isEditing" @blur="validateField('sku')" />
          </FormField>
          <FormField label="Type" required :error="errors.type">
            <Select v-model="type" :options="typeOptions" @update:model-value="validateField('type')" />
          </FormField>
          <FormField label="Name" required :error="errors.name" class="md:col-span-2">
            <Input v-model="name" placeholder="Product name" @blur="validateField('name')" />
          </FormField>
          <FormField label="Unit" required :error="errors.unit">
            <Select v-model="unit" :options="unitOptions" @update:model-value="validateField('unit')" />
          </FormField>
          <FormField label="Description" class="md:col-span-2">
            <Textarea v-model="description" :rows="3" placeholder="Product description" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Pricing</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Purchase Price">
            <Input v-model.number="purchasePrice" type="number" min="0" step="1000" />
          </FormField>
          <FormField label="Selling Price">
            <Input v-model.number="sellingPrice" type="number" min="0" step="1000" />
          </FormField>
          <FormField label="Tax Rate (%)">
            <Input v-model.number="taxRate" type="number" min="0" max="100" step="0.5" />
          </FormField>
          <div class="flex items-center gap-4 pt-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="isTaxable" type="checkbox" class="rounded border-slate-300 dark:border-slate-600" />
              <span class="text-sm text-slate-700 dark:text-slate-300">Taxable</span>
            </label>
          </div>
        </div>
      </Card>

      <Card v-if="type === 'product'">
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Inventory</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input v-model="trackInventory" type="checkbox" class="rounded border-slate-300 dark:border-slate-600" />
              <span class="text-sm text-slate-700 dark:text-slate-300">Track Inventory</span>
            </label>
          </div>
          <FormField label="Minimum Stock">
            <Input v-model.number="minStock" type="number" min="0" :disabled="!trackInventory" />
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
            <input v-model="isActive" type="checkbox" class="sr-only peer" />
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
