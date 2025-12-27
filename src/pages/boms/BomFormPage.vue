<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBom, useCreateBom, useUpdateBom, type BomItemInput } from '@/api/useBoms'
import { useProducts } from '@/api/useProducts'
import { formatCurrency } from '@/utils/format'
import { Button, Input, Select, FormField, Card, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const bomId = computed(() => route.params.id ? Number(route.params.id) : null)
const isEditing = computed(() => !!bomId.value)

// Fetch BOM if editing
const { data: existingBom, isLoading: loadingBom } = useBom(
  computed(() => bomId.value ?? 0)
)

// Fetch products for dropdown
const productFilters = ref({ per_page: 100 })
const { data: productsData } = useProducts(productFilters)
const productOptions = computed(() => {
  return (productsData.value?.data ?? []).map(p => ({
    value: p.id,
    label: `${p.name}${p.sku ? ` (${p.sku})` : ''}`
  }))
})

// Mutations
const createMutation = useCreateBom()
const updateMutation = useUpdateBom()

// Form state
const form = ref({
  name: '',
  description: '',
  product_id: 0,
  output_quantity: 1,
  output_unit: 'unit',
  notes: '',
})

const items = ref<(BomItemInput & { _key: number })[]>([])
let itemKeyCounter = 0

const errors = ref<Record<string, string>>({})

// Unit options
const unitOptions = [
  { value: 'unit', label: 'Unit' },
  { value: 'pcs', label: 'Pcs' },
  { value: 'set', label: 'Set' },
  { value: 'kg', label: 'Kg' },
  { value: 'm', label: 'Meter' },
  { value: 'm2', label: 'M2' },
  { value: 'kWp', label: 'kWp' },
]

const typeOptions = [
  { value: 'material', label: 'Material' },
  { value: 'labor', label: 'Labor' },
  { value: 'overhead', label: 'Overhead' },
]

// Initialize form when editing
watch(existingBom, (bom) => {
  if (bom) {
    form.value = {
      name: bom.name,
      description: bom.description || '',
      product_id: bom.product_id,
      output_quantity: bom.output_quantity,
      output_unit: bom.output_unit,
      notes: bom.notes || '',
    }
    items.value = (bom.items || []).map(item => ({
      _key: itemKeyCounter++,
      type: item.type,
      product_id: item.product_id,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_cost: item.unit_cost,
      waste_percentage: item.waste_percentage,
      sort_order: item.sort_order,
      notes: item.notes || '',
    }))
  }
}, { immediate: true })

// Add empty item
function addItem() {
  items.value.push({
    _key: itemKeyCounter++,
    type: 'material',
    product_id: null,
    description: '',
    quantity: 1,
    unit: 'unit',
    unit_cost: 0,
    waste_percentage: 0,
    sort_order: items.value.length,
    notes: '',
  })
}

// Remove item
function removeItem(index: number) {
  items.value.splice(index, 1)
}

// Calculate totals
const totals = computed(() => {
  let material = 0
  let labor = 0
  let overhead = 0

  for (const item of items.value) {
    const itemTotal = item.quantity * item.unit_cost * (1 + (item.waste_percentage || 0) / 100)
    if (item.type === 'material') material += itemTotal
    else if (item.type === 'labor') labor += itemTotal
    else if (item.type === 'overhead') overhead += itemTotal
  }

  const total = material + labor + overhead
  const unitCost = form.value.output_quantity > 0 ? total / form.value.output_quantity : 0

  return { material, labor, overhead, total, unitCost }
})

// Form validation
function validate(): boolean {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
  }
  if (!form.value.product_id) {
    errors.value.product_id = 'Product is required'
  }
  if (form.value.output_quantity <= 0) {
    errors.value.output_quantity = 'Output quantity must be greater than 0'
  }
  if (items.value.length === 0) {
    errors.value.items = 'At least one item is required'
  }

  // Validate each item
  items.value.forEach((item, i) => {
    if (!item.description.trim()) {
      errors.value[`item_${i}_description`] = 'Description is required'
    }
    if (item.quantity <= 0) {
      errors.value[`item_${i}_quantity`] = 'Quantity must be greater than 0'
    }
    if (item.unit_cost < 0) {
      errors.value[`item_${i}_unit_cost`] = 'Unit cost cannot be negative'
    }
  })

  return Object.keys(errors.value).length === 0
}

// Submit form
async function handleSubmit() {
  if (!validate()) {
    toast.error('Please fix the errors before submitting')
    return
  }

  const data = {
    ...form.value,
    items: items.value.map(({ _key, ...item }) => item),
  }

  try {
    if (isEditing.value && bomId.value) {
      await updateMutation.mutateAsync({ id: bomId.value, data })
      toast.success('BOM updated successfully')
      router.push(`/boms/${bomId.value}`)
    } else {
      const newBom = await createMutation.mutateAsync(data)
      toast.success('BOM created successfully')
      router.push(`/boms/${newBom.id}`)
    }
  } catch (err: any) {
    const message = err?.response?.data?.message || 'Failed to save BOM'
    toast.error(message)
  }
}

const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading -->
    <div v-if="isEditing && loadingBom" class="text-center py-12 text-slate-500">
      Loading...
    </div>

    <template v-else>
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 mb-4">
        <RouterLink to="/boms" class="hover:text-slate-700">Bill of Materials</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-slate-900">{{ isEditing ? 'Edit BOM' : 'New BOM' }}</span>
      </div>

      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-slate-900">
          {{ isEditing ? 'Edit BOM' : 'Create New BOM' }}
        </h1>
        <p class="text-slate-500">Define materials, labor, and overhead costs for production</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Info -->
        <Card>
          <template #header>
            <h2 class="font-semibold text-slate-900">Basic Information</h2>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="BOM Name" required :error="errors.name" class="md:col-span-2">
              <Input v-model="form.name" placeholder="e.g., Solar Panel Assembly 450W" />
            </FormField>

            <FormField label="Output Product" required :error="errors.product_id">
              <Select
                v-model="form.product_id"
                :options="productOptions"
                placeholder="Select product"
              />
            </FormField>

            <div class="grid grid-cols-2 gap-4">
              <FormField label="Output Quantity" required :error="errors.output_quantity">
                <Input v-model.number="form.output_quantity" type="number" min="0.0001" step="0.0001" />
              </FormField>
              <FormField label="Unit">
                <Select v-model="form.output_unit" :options="unitOptions" />
              </FormField>
            </div>

            <FormField label="Description" class="md:col-span-2">
              <Input v-model="form.description" placeholder="Optional description" />
            </FormField>
          </div>
        </Card>

        <!-- BOM Items -->
        <Card>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-slate-900">BOM Items</h2>
              <Button type="button" variant="secondary" size="sm" @click="addItem">
                Add Item
              </Button>
            </div>
          </template>

          <div v-if="errors.items" class="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {{ errors.items }}
          </div>

          <div v-if="items.length === 0" class="py-8 text-center text-slate-500">
            No items added yet. Click "Add Item" to start.
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(item, index) in items"
              :key="item._key"
              class="p-4 border border-slate-200 rounded-lg"
            >
              <div class="flex items-start gap-4">
                <div class="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                  <FormField label="Type" class="md:col-span-1">
                    <Select v-model="item.type" :options="typeOptions" />
                  </FormField>

                  <FormField
                    label="Description"
                    :error="errors[`item_${index}_description`]"
                    class="md:col-span-2"
                  >
                    <Input v-model="item.description" placeholder="Item description" />
                  </FormField>

                  <FormField
                    label="Quantity"
                    :error="errors[`item_${index}_quantity`]"
                    class="md:col-span-1"
                  >
                    <Input v-model.number="item.quantity" type="number" min="0" step="0.0001" />
                  </FormField>

                  <FormField label="Unit" class="md:col-span-1">
                    <Select v-model="item.unit" :options="unitOptions" />
                  </FormField>

                  <FormField
                    label="Unit Cost"
                    :error="errors[`item_${index}_unit_cost`]"
                    class="md:col-span-1"
                  >
                    <Input v-model.number="item.unit_cost" type="number" min="0" step="1" />
                  </FormField>
                </div>

                <button
                  type="button"
                  class="mt-6 p-2 text-slate-400 hover:text-red-500 transition-colors"
                  @click="removeItem(index)"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <!-- Item total -->
              <div class="mt-3 pt-3 border-t border-slate-100 flex justify-between text-sm">
                <span class="text-slate-500">
                  {{ item.quantity }} x {{ formatCurrency(item.unit_cost) }}
                </span>
                <span class="font-medium text-slate-900">
                  = {{ formatCurrency(item.quantity * item.unit_cost) }}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <!-- Cost Summary -->
        <Card>
          <template #header>
            <h2 class="font-semibold text-slate-900">Cost Summary</h2>
          </template>

          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-slate-500">Materials</dt>
              <dd class="font-medium text-blue-600">{{ formatCurrency(totals.material) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500">Labor</dt>
              <dd class="font-medium text-purple-600">{{ formatCurrency(totals.labor) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500">Overhead</dt>
              <dd class="font-medium text-orange-600">{{ formatCurrency(totals.overhead) }}</dd>
            </div>
            <hr class="border-slate-200" />
            <div class="flex justify-between">
              <dt class="font-semibold text-slate-900">Total Cost</dt>
              <dd class="font-bold text-lg text-slate-900">{{ formatCurrency(totals.total) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="font-semibold text-slate-900">
                Unit Cost (per {{ form.output_quantity }} {{ form.output_unit }})
              </dt>
              <dd class="font-bold text-lg text-orange-600">{{ formatCurrency(totals.unitCost) }}</dd>
            </div>
          </dl>
        </Card>

        <!-- Notes -->
        <Card>
          <template #header>
            <h2 class="font-semibold text-slate-900">Notes</h2>
          </template>
          <textarea
            v-model="form.notes"
            rows="3"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Additional notes..."
          />
        </Card>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <Button type="button" variant="ghost" @click="router.back()">
            Cancel
          </Button>
          <Button type="submit" variant="primary" :loading="isSaving">
            {{ isEditing ? 'Update BOM' : 'Create BOM' }}
          </Button>
        </div>
      </form>
    </template>
  </div>
</template>
