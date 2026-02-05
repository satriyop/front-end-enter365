<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useProduct, useCreateProduct, useUpdateProduct, type CreateProductData } from '@/api/useProducts'
import { useProductCategoriesLookup } from '@/api/useProductCategories'
import { useAccountsLookup } from '@/api/useAccounts'
import { toNumber } from '@/utils/format'
import { productSchema, type ProductFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { useFormShortcuts } from '@/composables/useFormShortcuts'
import { Button, Input, FormField, Textarea, Select, Card, PageSkeleton, useToast } from '@/components/ui'

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

// Lookups
const { data: categories } = useProductCategoriesLookup()
const { data: assetAccounts } = useAccountsLookup('asset')
const { data: expenseAccounts } = useAccountsLookup('expense')
const { data: revenueAccounts } = useAccountsLookup('revenue')

const categoryOptions = computed(() => [
  { value: '', label: 'No Category' },
  ...(categories.value?.map(c => ({ value: c.id, label: c.name })) ?? []),
])

const assetAccountOptions = computed(() => [
  { value: '', label: 'Default' },
  ...(assetAccounts.value?.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` })) ?? []),
])

const expenseAccountOptions = computed(() => [
  { value: '', label: 'Default' },
  ...(expenseAccounts.value?.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` })) ?? []),
])

const revenueAccountOptions = computed(() => [
  { value: '', label: 'Default' },
  ...(revenueAccounts.value?.map(a => ({ value: a.id, label: `${a.code} - ${a.name}` })) ?? []),
])

// Form with VeeValidate
const {
  errors,
  handleSubmit,
  setValues,
  setErrors,
  meta,
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
    category_id: null,
    barcode: '',
    brand: '',
    is_sellable: true,
    is_purchasable: true,
    inventory_account_id: null,
    cogs_account_id: null,
    sales_account_id: null,
    purchase_account_id: null,
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
const [categoryId] = defineField('category_id')
const [barcode] = defineField('barcode')
const [brand] = defineField('brand')
const [isSellable] = defineField('is_sellable')
const [isPurchasable] = defineField('is_purchasable')
const [inventoryAccountId] = defineField('inventory_account_id')
const [cogsAccountId] = defineField('cogs_account_id')
const [salesAccountId] = defineField('sales_account_id')
const [purchaseAccountId] = defineField('purchase_account_id')

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
      barcode: product.barcode || '',
      brand: product.brand || '',
      is_sellable: product.is_sellable ?? true,
      is_purchasable: product.is_purchasable ?? true,
      inventory_account_id: product.inventory_account_id,
      cogs_account_id: product.cogs_account_id,
      sales_account_id: product.sales_account_id,
      purchase_account_id: product.purchase_account_id,
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
    // Build payload - convert empty strings to null for nullable fields
    const payload: CreateProductData = {
      sku: formValues.sku || null,
      name: formValues.name,
      type: formValues.type,
      description: formValues.description || null,
      unit: formValues.unit,
      purchase_price: formValues.purchase_price,
      selling_price: formValues.selling_price,
      tax_rate: formValues.tax_rate,
      is_taxable: formValues.is_taxable,
      is_active: formValues.is_active,
      track_inventory: formValues.track_inventory,
      min_stock: formValues.min_stock,
      category_id: formValues.category_id || null,
      barcode: formValues.barcode || null,
      brand: formValues.brand || null,
      is_sellable: formValues.is_sellable,
      is_purchasable: formValues.is_purchasable,
      inventory_account_id: formValues.inventory_account_id || null,
      cogs_account_id: formValues.cogs_account_id || null,
      sales_account_id: formValues.sales_account_id || null,
      purchase_account_id: formValues.purchase_account_id || null,
    }

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

// Keyboard shortcut: Ctrl+S to save
useFormShortcuts({
  onSave: async () => { await onSubmit() },
  onCancel: () => router.back(),
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">{{ pageTitle }}</h1>
        <p class="text-muted-foreground">
          {{ isEditing ? 'Update product information' : 'Add a new product or service' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <kbd class="hidden sm:inline-flex px-2 py-1 text-xs text-muted-foreground bg-muted rounded border border-border">
          Ctrl+S to save
        </kbd>
        <Button variant="ghost" @click="router.back()">Cancel</Button>
      </div>
    </div>

    <!-- Loading state -->
    <PageSkeleton v-if="isEditing && loadingProduct" type="form" />

    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <!-- Basic Information -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Basic Information</h2>
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
          <FormField label="Category" :error="errors.category_id">
            <Select
              :model-value="categoryId ?? ''"
              :options="categoryOptions"
              @update:model-value="(v) => categoryId = v ? Number(v) : null"
            />
          </FormField>
          <FormField label="Barcode" :error="errors.barcode">
            <Input v-model="barcode" placeholder="e.g., 1234567890123" />
          </FormField>
          <FormField label="Brand" :error="errors.brand">
            <Input v-model="brand" placeholder="e.g., Jinko Solar" />
          </FormField>
          <FormField label="Description" class="md:col-span-2">
            <Textarea v-model="description" :rows="3" placeholder="Product description" />
          </FormField>
        </div>
      </Card>

      <!-- Pricing -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Pricing</h2>
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
              <input v-model="isTaxable" type="checkbox" class="rounded border-border" />
              <span class="text-sm text-foreground">Taxable</span>
            </label>
          </div>
        </div>
      </Card>

      <!-- Inventory & Sales Options -->
      <Card v-if="type === 'product'">
        <template #header>
          <h2 class="font-medium text-foreground">Inventory & Sales Options</h2>
        </template>
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="trackInventory" type="checkbox" class="rounded border-border" />
                <span class="text-sm text-foreground">Track Inventory</span>
              </label>
            </div>
            <FormField label="Minimum Stock">
              <Input v-model.number="minStock" type="number" min="0" :disabled="!trackInventory" />
            </FormField>
          </div>
          <div class="border-t border-border pt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <span class="text-sm font-medium text-foreground">Sellable</span>
                  <p class="text-xs text-muted-foreground">Product can be sold to customers</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input v-model="isSellable" type="checkbox" class="sr-only peer" />
                  <div class="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div class="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <span class="text-sm font-medium text-foreground">Purchasable</span>
                  <p class="text-xs text-muted-foreground">Product can be purchased from vendors</p>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input v-model="isPurchasable" type="checkbox" class="sr-only peer" />
                  <div class="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Accounting (only for products with inventory tracking) -->
      <Card v-if="type === 'product'">
        <template #header>
          <h2 class="font-medium text-foreground">Accounting</h2>
        </template>
        <p class="text-sm text-muted-foreground mb-4">
          Map this product to specific accounts for accurate financial tracking. Leave as default to use system-configured accounts.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Inventory Account" hint="Asset account for inventory valuation">
            <Select
              :model-value="inventoryAccountId ?? ''"
              :options="assetAccountOptions"
              @update:model-value="(v) => inventoryAccountId = v ? Number(v) : null"
            />
          </FormField>
          <FormField label="COGS Account" hint="Expense account for cost of goods sold">
            <Select
              :model-value="cogsAccountId ?? ''"
              :options="expenseAccountOptions"
              @update:model-value="(v) => cogsAccountId = v ? Number(v) : null"
            />
          </FormField>
          <FormField label="Sales Account" hint="Revenue account for sales">
            <Select
              :model-value="salesAccountId ?? ''"
              :options="revenueAccountOptions"
              @update:model-value="(v) => salesAccountId = v ? Number(v) : null"
            />
          </FormField>
          <FormField label="Purchase Account" hint="Expense account for purchases">
            <Select
              :model-value="purchaseAccountId ?? ''"
              :options="expenseAccountOptions"
              @update:model-value="(v) => purchaseAccountId = v ? Number(v) : null"
            />
          </FormField>
        </div>
      </Card>

      <!-- Status -->
      <Card>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-foreground">Active Status</h3>
            <p class="text-sm text-muted-foreground">Inactive products won't appear in lookups</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="isActive" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </Card>

      <!-- Form Status Indicator -->
      <div v-if="meta.dirty" class="text-sm text-amber-600 dark:text-amber-500">
        You have unsaved changes
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">Cancel</Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Product' : 'Create Product' }}
        </Button>
      </div>
    </form>
  </div>
</template>
