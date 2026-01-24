<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm, useFieldArray } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useBom, useCreateBom, useUpdateBom } from '@/api/useBoms'
import { useProducts } from '@/api/useProducts'
import { bomSchema, type BomFormData, type BomItemFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
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

function createEmptyItem(): BomItemFormData {
  return {
    type: 'material',
    product_id: null,
    description: '',
    quantity: 1,
    unit: 'unit',
    unit_cost: 0,
    waste_percentage: 0,
    sort_order: 0,
    notes: '',
  }
}

// Form with VeeValidate
const {
  values: form,
  errors,
  handleSubmit,
  setValues,
  setErrors,
  validateField,
  defineField,
} = useForm<BomFormData>({
  validationSchema: toTypedSchema(bomSchema),
  initialValues: {
    name: '',
    description: '',
    product_id: undefined as unknown as number,
    output_quantity: 1,
    output_unit: 'unit',
    notes: '',
    items: [createEmptyItem()],
  },
})

const [name] = defineField('name')
const [productId] = defineField('product_id')
const [outputQuantity] = defineField('output_quantity')
const [outputUnit] = defineField('output_unit')
const [description] = defineField('description')
const [notes] = defineField('notes')

// Field array for items
const { fields: itemFields, push: pushItem, remove: removeItemField } = useFieldArray<BomItemFormData>('items')

// Initialize form when editing
watch(existingBom, (bom) => {
  if (bom) {
    setValues({
      name: bom.name,
      description: bom.description || '',
      product_id: bom.product_id,
      output_quantity: bom.output_quantity,
      output_unit: bom.output_unit,
      notes: bom.notes || '',
      items: bom.items && bom.items.length > 0
        ? bom.items.map((item, index) => ({
            type: item.type as 'material' | 'labor' | 'overhead',
            product_id: item.product_id ?? null,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unit_cost: item.unit_cost,
            waste_percentage: item.waste_percentage ?? 0,
            sort_order: item.sort_order ?? index,
            notes: item.notes || '',
          }))
        : [createEmptyItem()],
    })
  }
}, { immediate: true })

// Item management
function addItem() {
  const newItem = createEmptyItem()
  newItem.sort_order = (form.items?.length ?? 0)
  pushItem(newItem)
}

function removeItem(index: number) {
  if (itemFields.value.length > 1) {
    removeItemField(index)
  }
}

// Calculate totals
const totals = computed(() => {
  let material = 0
  let labor = 0
  let overhead = 0

  for (const item of (form.items || [])) {
    const itemTotal = (item.quantity || 0) * (item.unit_cost || 0) * (1 + (item.waste_percentage || 0) / 100)
    if (item.type === 'material') material += itemTotal
    else if (item.type === 'labor') labor += itemTotal
    else if (item.type === 'overhead') overhead += itemTotal
  }

  const total = material + labor + overhead
  const unitCost = (form.output_quantity || 1) > 0 ? total / (form.output_quantity || 1) : 0

  return { material, labor, overhead, total, unitCost }
})

// Mutations
const createMutation = useCreateBom()
const updateMutation = useUpdateBom()
const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

// Submit form
const onSubmit = handleSubmit(async (formValues) => {
  const itemsPayload = (formValues.items || [])
    .filter(item => item.description)
    .map((item, index) => ({
      type: item.type,
      product_id: item.product_id || null,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unit_cost: item.unit_cost,
      waste_percentage: item.waste_percentage,
      sort_order: item.sort_order ?? index,
      notes: item.notes || undefined,
    }))

  const payload = {
    name: formValues.name,
    description: formValues.description || undefined,
    product_id: formValues.product_id,
    output_quantity: formValues.output_quantity,
    output_unit: formValues.output_unit,
    notes: formValues.notes || undefined,
    items: itemsPayload,
  }

  try {
    if (isEditing.value && bomId.value) {
      await updateMutation.mutateAsync({ id: bomId.value, data: payload })
      toast.success('BOM updated successfully')
      router.push(`/boms/${bomId.value}`)
    } else {
      const newBom = await createMutation.mutateAsync(payload)
      toast.success('BOM created successfully')
      router.push(`/boms/${newBom.id}`)
    }
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to save BOM')
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading -->
    <div v-if="isEditing && loadingBom" class="text-center py-12 text-slate-500 dark:text-slate-400">
      Loading...
    </div>

    <template v-else>
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/boms" class="hover:text-slate-700 dark:hover:text-slate-300">Bill of Materials</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ isEditing ? 'Edit BOM' : 'New BOM' }}</span>
      </div>

      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {{ isEditing ? 'Edit BOM' : 'Create New BOM' }}
        </h1>
        <p class="text-slate-500 dark:text-slate-400">Define materials, labor, and overhead costs for production</p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-6">
        <!-- Basic Info -->
        <Card>
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Basic Information</h2>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="BOM Name" required :error="errors.name" class="md:col-span-2">
              <Input v-model="name" placeholder="e.g., Solar Panel Assembly 450W" @blur="validateField('name')" />
            </FormField>

            <FormField label="Output Product" required :error="errors.product_id">
              <Select
                v-model="productId"
                :options="productOptions"
                placeholder="Select product"
                @update:model-value="validateField('product_id')"
              />
            </FormField>

            <div class="grid grid-cols-2 gap-4">
              <FormField label="Output Quantity" required :error="errors.output_quantity">
                <Input v-model.number="outputQuantity" type="number" min="0.0001" step="0.0001" @blur="validateField('output_quantity')" />
              </FormField>
              <FormField label="Unit">
                <Select v-model="outputUnit" :options="unitOptions" />
              </FormField>
            </div>

            <FormField label="Description" class="md:col-span-2">
              <Input v-model="description" placeholder="Optional description" />
            </FormField>
          </div>
        </Card>

        <!-- BOM Items -->
        <Card>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">BOM Items</h2>
              <Button type="button" variant="secondary" size="sm" @click="addItem">
                Add Item
              </Button>
            </div>
          </template>

          <div v-if="errors.items" class="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {{ errors.items }}
          </div>

          <div v-if="itemFields.length === 0" class="py-8 text-center text-slate-500 dark:text-slate-400">
            No items added yet. Click "Add Item" to start.
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="(field, index) in itemFields"
              :key="field.key"
              class="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <div class="flex items-start gap-4">
                <div class="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                  <FormField label="Type" class="md:col-span-1">
                    <Select v-model="field.value.type" :options="typeOptions" />
                  </FormField>

                  <FormField
                    label="Description"
                    class="md:col-span-2"
                  >
                    <Input v-model="field.value.description" placeholder="Item description" />
                  </FormField>

                  <FormField
                    label="Quantity"
                    class="md:col-span-1"
                  >
                    <Input v-model.number="field.value.quantity" type="number" min="0" step="0.0001" />
                  </FormField>

                  <FormField label="Unit" class="md:col-span-1">
                    <Select v-model="field.value.unit" :options="unitOptions" />
                  </FormField>

                  <FormField
                    label="Unit Cost"
                    class="md:col-span-1"
                  >
                    <Input v-model.number="field.value.unit_cost" type="number" min="0" step="1" />
                  </FormField>
                </div>

                <button
                  type="button"
                  class="mt-6 p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  :disabled="itemFields.length === 1"
                  :class="{ 'opacity-30 cursor-not-allowed': itemFields.length === 1 }"
                  @click="removeItem(index)"
                >
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <!-- Item total -->
              <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between text-sm">
                <span class="text-slate-500 dark:text-slate-400">
                  {{ field.value.quantity }} x {{ formatCurrency(field.value.unit_cost) }}
                </span>
                <span class="font-medium text-slate-900 dark:text-slate-100">
                  = {{ formatCurrency((field.value.quantity || 0) * (field.value.unit_cost || 0)) }}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <!-- Cost Summary -->
        <Card>
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Cost Summary</h2>
          </template>

          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Materials</dt>
              <dd class="font-medium text-blue-600 dark:text-blue-400">{{ formatCurrency(totals.material) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Labor</dt>
              <dd class="font-medium text-purple-600 dark:text-purple-400">{{ formatCurrency(totals.labor) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-slate-500 dark:text-slate-400">Overhead</dt>
              <dd class="font-medium text-orange-600 dark:text-orange-400">{{ formatCurrency(totals.overhead) }}</dd>
            </div>
            <hr class="border-slate-200 dark:border-slate-700" />
            <div class="flex justify-between">
              <dt class="font-semibold text-slate-900 dark:text-slate-100">Total Cost</dt>
              <dd class="font-bold text-lg text-slate-900 dark:text-slate-100">{{ formatCurrency(totals.total) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="font-semibold text-slate-900 dark:text-slate-100">
                Unit Cost (per {{ form.output_quantity }} {{ form.output_unit }})
              </dt>
              <dd class="font-bold text-lg text-orange-600 dark:text-orange-400">{{ formatCurrency(totals.unitCost) }}</dd>
            </div>
          </dl>
        </Card>

        <!-- Notes -->
        <Card>
          <template #header>
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
          </template>
          <textarea
            v-model="notes"
            rows="3"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Additional notes..."
          />
        </Card>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <Button type="button" variant="ghost" @click="router.back()">
            Cancel
          </Button>
          <Button type="submit" :loading="isSaving">
            {{ isEditing ? 'Update BOM' : 'Create BOM' }}
          </Button>
        </div>
      </form>
    </template>
  </div>
</template>
