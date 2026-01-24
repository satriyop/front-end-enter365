<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useBomTemplate,
  useBomTemplateMetadata,
  useCreateBomTemplate,
  useUpdateBomTemplate,
} from '@/api/useBomTemplates'
import { bomTemplateSchema, type BomTemplateFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { Button, Input, Select, FormField, Card, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const templateId = computed(() => route.params.id ? Number(route.params.id) : null)
const isEditing = computed(() => templateId.value !== null)

// Fetch data
const { data: existingTemplate, isLoading: isLoadingTemplate } = useBomTemplate(
  computed(() => templateId.value ?? 0)
)
const { data: metadata, isLoading: isLoadingMetadata } = useBomTemplateMetadata()

// Mutations
const createMutation = useCreateBomTemplate()
const updateMutation = useUpdateBomTemplate()

// Form with VeeValidate
const {
  values: form,
  errors,
  handleSubmit,
  setValues,
  setErrors,
  validateField,
  defineField,
} = useForm<BomTemplateFormData>({
  validationSchema: toTypedSchema(bomTemplateSchema),
  initialValues: {
    code: '',
    name: '',
    description: '',
    category: 'panel',
    default_output_unit: 'unit',
    default_rule_set_id: null,
    is_active: true,
  },
})

const [code] = defineField('code')
const [name] = defineField('name')
const [description] = defineField('description')
const [category] = defineField('category')
const [defaultOutputUnit] = defineField('default_output_unit')
const [defaultRuleSetId] = defineField('default_rule_set_id')
const [isActive] = defineField('is_active')

// Populate form when editing
watch(existingTemplate, (template) => {
  if (template) {
    setValues({
      code: template.code,
      name: template.name,
      description: template.description ?? '',
      category: template.category,
      default_output_unit: template.default_output_unit,
      default_rule_set_id: template.default_rule_set_id,
      is_active: template.is_active,
    })
  }
}, { immediate: true })

// Computed options
const categoryOptions = computed(() => {
  if (!metadata.value?.categories) {
    return [
      { value: 'panel', label: 'Panel' },
      { value: 'solar_system', label: 'Solar System' },
      { value: 'installation', label: 'Installation' },
      { value: 'maintenance', label: 'Maintenance' },
    ]
  }
  return Object.entries(metadata.value.categories).map(([value, label]) => ({
    value,
    label: label as string
  }))
})

const ruleSetOptions = computed(() => {
  const options = [{ value: '', label: '-- Use Default --' }]
  if (metadata.value?.rule_sets) {
    for (const rs of metadata.value.rule_sets) {
      options.push({
        value: String(rs.id),
        label: `${rs.code} - ${rs.name}${rs.is_default ? ' (Default)' : ''}`
      })
    }
  }
  return options
})

const unitOptions = computed(() => {
  const defaultUnits = ['unit', 'pcs', 'set', 'lot']
  const units = metadata.value?.units ?? defaultUnits
  return units.map(u => ({ value: u, label: u }))
})

const isLoading = computed(() => isLoadingTemplate.value || isLoadingMetadata.value)
const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const onSubmit = handleSubmit(async (formValues) => {
  // Convert empty string to null for rule_set_id
  const data = {
    ...formValues,
    default_rule_set_id: formValues.default_rule_set_id || null,
  }

  try {
    if (isEditing.value && templateId.value) {
      await updateMutation.mutateAsync({
        id: templateId.value,
        data,
      })
      toast.success('Template updated')
      router.push(`/settings/bom-templates/${templateId.value}`)
    } else {
      const newTemplate = await createMutation.mutateAsync(data)
      toast.success('Template created')
      router.push(`/settings/bom-templates/${newTemplate.id}`)
    }
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to save template')
  }
})

function generateCode() {
  if (!form.name) return
  setValues({
    code: form.name
      .toUpperCase()
      .replace(/[^A-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20)
  })
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <RouterLink to="/settings/bom-templates">
        <Button variant="ghost" size="sm">
          <ArrowLeft class="w-4 h-4 mr-2" />
          Back
        </Button>
      </RouterLink>
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {{ isEditing ? 'Edit Template' : 'New Template' }}
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ isEditing ? 'Update template details' : 'Create a new BOM template' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="onSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Basic Information</h2>
        </template>

        <div class="space-y-4">
          <FormField label="Name" required :error="errors.name">
            <Input
              v-model="name"
              placeholder="e.g., Standard Panel 100A"
              @blur="() => { validateField('name'); !code && generateCode() }"
            />
          </FormField>

          <FormField
            label="Code"
            required
            :error="errors.code"
            hint="Unique identifier (uppercase, no spaces)"
          >
            <div class="flex gap-2">
              <Input
                v-model="code"
                placeholder="e.g., PANEL_100A"
                class="flex-1 font-mono"
                @blur="validateField('code')"
              />
              <Button type="button" variant="outline" @click="generateCode">
                Generate
              </Button>
            </div>
          </FormField>

          <FormField label="Category" required :error="errors.category">
            <Select v-model="category" :options="categoryOptions" @update:model-value="validateField('category')" />
          </FormField>

          <FormField label="Description">
            <textarea
              v-model="description"
              rows="3"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Describe what this template is for..."
            />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Defaults</h2>
        </template>

        <div class="space-y-4">
          <FormField label="Default Output Unit" hint="Unit for the finished product">
            <Select v-model="defaultOutputUnit" :options="unitOptions" />
          </FormField>

          <FormField label="Validation Rule Set" hint="Applied when creating BOMs from this template">
            <Select
              v-model="defaultRuleSetId"
              :options="ruleSetOptions"
            />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Settings</h2>
        </template>

        <label class="flex items-center gap-3 cursor-pointer">
          <input
            v-model="isActive"
            type="checkbox"
            class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-500"
          />
          <div>
            <span class="font-medium text-slate-900 dark:text-slate-100">Active</span>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Only active templates can be used to create new BOMs
            </p>
          </div>
        </label>
      </Card>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <RouterLink to="/settings/bom-templates">
          <Button type="button" variant="ghost">Cancel</Button>
        </RouterLink>
        <Button type="submit" :loading="isSaving">
          {{ isEditing ? 'Update Template' : 'Create Template' }}
        </Button>
      </div>
    </form>
  </div>
</template>
