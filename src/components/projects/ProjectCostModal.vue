<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { projectCostSchema, type ProjectCostFormData } from '@/utils/validation'
import { Modal, Button, FormField, Input, Select, Textarea } from '@/components/ui'
import type { ProjectCost } from '@/api/useProjects'

interface Props {
  open: boolean
  cost?: ProjectCost | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  cost: null,
  isLoading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [data: ProjectCostFormData]
}>()

const isEditing = computed(() => !!props.cost)
const modalTitle = computed(() => isEditing.value ? 'Edit Cost' : 'Add Cost')

const costTypeOptions = [
  { value: 'material', label: 'Material' },
  { value: 'labor', label: 'Labor' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'overhead', label: 'Overhead' },
  { value: 'other', label: 'Other' },
]

const {
  values,
  errors,
  handleSubmit,
  resetForm,
  validateField,
} = useForm<ProjectCostFormData>({
  validationSchema: toTypedSchema(projectCostSchema),
  initialValues: {
    type: 'material',
    description: '',
    quantity: 1,
    unit: '',
    unit_cost: 0,
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  },
})

// Reset form when modal opens or cost changes
watch(() => [props.open, props.cost], () => {
  if (props.open) {
    if (props.cost) {
      resetForm({
        values: {
          type: props.cost.cost_type as ProjectCostFormData['type'],
          description: props.cost.description,
          quantity: props.cost.quantity,
          unit: props.cost.unit ?? '',
          unit_cost: props.cost.unit_cost,
          date: props.cost.cost_date?.split('T')[0] ?? '',
          reference: '',
          notes: props.cost.notes ?? '',
        },
      })
    } else {
      resetForm({
        values: {
          type: 'material',
          description: '',
          quantity: 1,
          unit: '',
          unit_cost: 0,
          date: new Date().toISOString().split('T')[0],
          reference: '',
          notes: '',
        },
      })
    }
  }
}, { immediate: true })

const totalCost = computed(() => {
  const qty = values.quantity ?? 1
  const cost = values.unit_cost ?? 0
  return qty * cost
})

const onSubmit = handleSubmit((formValues) => {
  emit('submit', formValues)
})

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="modalTitle"
    @update:open="$emit('update:open', $event)"
  >
    <form id="cost-form" novalidate @submit.prevent="onSubmit">
      <div class="space-y-4">
        <FormField label="Type" required :error="errors.type">
          <Select
            v-model="values.type"
            :options="costTypeOptions"
            placeholder="Select cost type..."
            @blur="validateField('type')"
          />
        </FormField>

        <FormField label="Description" required :error="errors.description">
          <Input
            v-model="values.description"
            placeholder="Enter description"
            @blur="validateField('description')"
          />
        </FormField>

        <div class="grid grid-cols-3 gap-4">
          <FormField label="Quantity" :error="errors.quantity">
            <Input
              v-model.number="values.quantity"
              type="number"
              step="0.01"
              min="0"
              @blur="validateField('quantity')"
            />
          </FormField>

          <FormField label="Unit">
            <Input
              v-model="values.unit"
              placeholder="e.g., pcs, kg"
            />
          </FormField>

          <FormField label="Unit Cost" required :error="errors.unit_cost">
            <Input
              v-model.number="values.unit_cost"
              type="number"
              step="1"
              min="0"
              @blur="validateField('unit_cost')"
            />
          </FormField>
        </div>

        <!-- Total display -->
        <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="text-sm text-slate-600 dark:text-slate-400">Total Cost</span>
            <span class="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalCost) }}
            </span>
          </div>
        </div>

        <FormField label="Date">
          <Input
            v-model="values.date"
            type="date"
          />
        </FormField>

        <FormField label="Notes">
          <Textarea
            v-model="values.notes"
            :rows="2"
            placeholder="Additional notes..."
          />
        </FormField>
      </div>
    </form>

    <template #footer>
      <Button variant="ghost" @click="handleClose">Cancel</Button>
      <Button
        type="submit"
        form="cost-form"
        :loading="isLoading"
      >
        {{ isEditing ? 'Update Cost' : 'Add Cost' }}
      </Button>
    </template>
  </Modal>
</template>
