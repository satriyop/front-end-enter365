<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useComponentStandard,
  useCreateComponentStandard,
  useUpdateComponentStandard
} from '@/api/useComponentStandards'
import { Button, Input, FormField, Select, Card, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const standardId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => standardId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Component Standard' : 'New Component Standard')

// Fetch existing standard if editing
const standardIdRef = computed(() => standardId.value ?? 0)
const { data: existingStandard, isLoading: loadingStandard } = useComponentStandard(standardIdRef)

interface SpecificationField {
  key: string
  value: string
  type: 'number' | 'text'
}

interface FormState {
  code: string
  name: string
  category: string
  subcategory: string
  standard: string
  unit: string
  is_active: boolean
  specifications: SpecificationField[]
}

const form = ref<FormState>({
  code: '',
  name: '',
  category: '',
  subcategory: '',
  standard: '',
  unit: 'pcs',
  is_active: true,
  specifications: [],
})

const categoryOptions = [
  { value: 'circuit_breaker', label: 'Circuit Breaker' },
  { value: 'contactor', label: 'Contactor' },
  { value: 'cable', label: 'Cable' },
  { value: 'busbar', label: 'Busbar' },
  { value: 'enclosure', label: 'Enclosure' },
  { value: 'relay', label: 'Relay' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'meter', label: 'Meter' },
  { value: 'transformer', label: 'Transformer' },
  { value: 'other', label: 'Other' },
]

const subcategoryOptions = computed(() => {
  const map: Record<string, Array<{ value: string; label: string }>> = {
    circuit_breaker: [
      { value: '', label: 'None' },
      { value: 'mcb', label: 'MCB (Miniature)' },
      { value: 'mccb', label: 'MCCB (Molded Case)' },
      { value: 'acb', label: 'ACB (Air Circuit)' },
      { value: 'rccb', label: 'RCCB (Residual Current)' },
      { value: 'rcbo', label: 'RCBO (Combined)' },
    ],
    contactor: [
      { value: '', label: 'None' },
      { value: 'ac', label: 'AC Contactor' },
      { value: 'dc', label: 'DC Contactor' },
      { value: 'auxiliary', label: 'Auxiliary Contactor' },
    ],
    relay: [
      { value: '', label: 'None' },
      { value: 'thermal', label: 'Thermal Overload' },
      { value: 'timer', label: 'Timer Relay' },
      { value: 'control', label: 'Control Relay' },
    ],
  }
  return map[form.value.category] || [{ value: '', label: 'None' }]
})

const unitOptions = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'set', label: 'Set' },
  { value: 'm', label: 'Meter (m)' },
  { value: 'roll', label: 'Roll' },
  { value: 'kg', label: 'Kilogram (kg)' },
]

// Specification templates per category
const specTemplates: Record<string, SpecificationField[]> = {
  circuit_breaker: [
    { key: 'rating_amps', value: '', type: 'number' },
    { key: 'poles', value: '', type: 'number' },
    { key: 'curve', value: 'C', type: 'text' },
    { key: 'breaking_capacity_ka', value: '', type: 'number' },
    { key: 'voltage', value: '230', type: 'number' },
  ],
  contactor: [
    { key: 'rating_amps', value: '', type: 'number' },
    { key: 'poles', value: '3', type: 'number' },
    { key: 'coil_voltage', value: '220', type: 'number' },
    { key: 'ac_category', value: 'AC3', type: 'text' },
  ],
  cable: [
    { key: 'conductor_size_mm2', value: '', type: 'number' },
    { key: 'cores', value: '', type: 'number' },
    { key: 'insulation', value: 'PVC', type: 'text' },
    { key: 'voltage_rating', value: '450/750', type: 'text' },
  ],
  busbar: [
    { key: 'material', value: 'copper', type: 'text' },
    { key: 'width_mm', value: '', type: 'number' },
    { key: 'thickness_mm', value: '', type: 'number' },
    { key: 'current_rating_a', value: '', type: 'number' },
  ],
  enclosure: [
    { key: 'width_mm', value: '', type: 'number' },
    { key: 'height_mm', value: '', type: 'number' },
    { key: 'depth_mm', value: '', type: 'number' },
    { key: 'ip_rating', value: 'IP65', type: 'text' },
    { key: 'material', value: 'steel', type: 'text' },
  ],
}

// When category changes, update spec template
watch(() => form.value.category, (newCategory) => {
  if (!isEditing.value && specTemplates[newCategory]) {
    form.value.specifications = [...specTemplates[newCategory]]
  }
})

// Populate form when editing
watch(existingStandard, (standard) => {
  if (standard) {
    form.value = {
      code: standard.code,
      name: standard.name,
      category: standard.category,
      subcategory: standard.subcategory || '',
      standard: standard.standard || '',
      unit: standard.unit,
      is_active: standard.is_active,
      specifications: Object.entries(standard.specifications).map(([key, value]) => ({
        key,
        value: String(value),
        type: typeof value === 'number' ? 'number' : 'text'
      })),
    }
  }
}, { immediate: true })

// Add/remove specification fields
function addSpecField() {
  form.value.specifications.push({ key: '', value: '', type: 'text' })
}

function removeSpecField(index: number) {
  form.value.specifications.splice(index, 1)
}

// Form submission
const createMutation = useCreateComponentStandard()
const updateMutation = useUpdateComponentStandard()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  if (!form.value.code.trim()) {
    errors.value.code = 'Code is required'
  }
  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
  }
  if (!form.value.category) {
    errors.value.category = 'Category is required'
  }

  if (Object.keys(errors.value).length > 0) return

  // Build specifications object
  const specifications: Record<string, unknown> = {}
  for (const spec of form.value.specifications) {
    if (spec.key.trim()) {
      specifications[spec.key.trim()] = spec.type === 'number' ? Number(spec.value) : spec.value
    }
  }

  const data = {
    code: form.value.code,
    name: form.value.name,
    category: form.value.category,
    subcategory: form.value.subcategory || undefined,
    standard: form.value.standard || undefined,
    unit: form.value.unit,
    is_active: form.value.is_active,
    specifications,
  }

  try {
    if (isEditing.value && standardId.value) {
      await updateMutation.mutateAsync({ id: standardId.value, data })
      toast.success('Component standard updated')
      router.push(`/settings/component-library/${standardId.value}`)
    } else {
      const result = await createMutation.mutateAsync(data)
      toast.success('Component standard created')
      router.push(`/settings/component-library/${result.id}`)
    }
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save'
    toast.error(message)
  }
}

function formatSpecLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ pageTitle }}</h1>
        <p class="text-slate-500">
          {{ isEditing ? 'Update component standard' : 'Create a new IEC component standard' }}
        </p>
      </div>
      <Button variant="ghost" @click="router.back()">Cancel</Button>
    </div>

    <div v-if="isEditing && loadingStandard" class="text-center py-12">
      <div class="text-slate-500">Loading component standard...</div>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Information -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900">Basic Information</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Code" required :error="errors.code">
            <Input
              v-model="form.code"
              placeholder="e.g., MCB-16A-1P-C"
              :disabled="isEditing"
            />
            <template #hint>
              Unique identifier for this component standard
            </template>
          </FormField>
          <FormField label="IEC Standard">
            <Input v-model="form.standard" placeholder="e.g., IEC 60898" />
          </FormField>
          <FormField label="Name" required :error="errors.name" class="md:col-span-2">
            <Input v-model="form.name" placeholder="e.g., MCB 16A 1P Curve C 6kA" />
          </FormField>
          <FormField label="Category" required :error="errors.category">
            <Select v-model="form.category" :options="categoryOptions" placeholder="Select category" />
          </FormField>
          <FormField label="Subcategory">
            <Select v-model="form.subcategory" :options="subcategoryOptions" />
          </FormField>
          <FormField label="Unit" required>
            <Select v-model="form.unit" :options="unitOptions" />
          </FormField>
        </div>
      </Card>

      <!-- Specifications -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-slate-900">Specifications</h2>
            <Button type="button" variant="ghost" size="sm" @click="addSpecField">
              + Add Field
            </Button>
          </div>
        </template>

        <div v-if="form.specifications.length === 0" class="py-4 text-center text-slate-500">
          Select a category to load specification template, or add fields manually.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(spec, index) in form.specifications"
            :key="index"
            class="flex items-center gap-3"
          >
            <div class="flex-1">
              <Input
                v-model="spec.key"
                :placeholder="formatSpecLabel(spec.key) || 'Specification key'"
                class="text-sm"
              />
            </div>
            <div class="flex-1">
              <Input
                v-model="spec.value"
                :type="spec.type"
                placeholder="Value"
                class="text-sm"
              />
            </div>
            <div class="w-24">
              <Select
                v-model="spec.type"
                :options="[
                  { value: 'number', label: 'Number' },
                  { value: 'text', label: 'Text' },
                ]"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              class="text-red-500 hover:text-red-600"
              @click="removeSpecField(index)"
            >
              Remove
            </Button>
          </div>
        </div>
      </Card>

      <!-- Status -->
      <Card>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-slate-900">Active Status</h3>
            <p class="text-sm text-slate-500">Inactive standards won't be used in BOM swapping</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.is_active" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>
      </Card>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">Cancel</Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Standard' : 'Create Standard' }}
        </Button>
      </div>
    </form>
  </div>
</template>
