<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { projectRevenueSchema, type ProjectRevenueFormData } from '@/utils/validation'
import { Modal, Button, FormField, Input, Select, Textarea } from '@/components/ui'
import type { ProjectRevenue } from '@/api/useProjects'

interface Props {
  open: boolean
  revenue?: ProjectRevenue | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  revenue: null,
  isLoading: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [data: ProjectRevenueFormData]
}>()

const isEditing = computed(() => !!props.revenue)
const modalTitle = computed(() => isEditing.value ? 'Edit Revenue' : 'Add Revenue')

const revenueTypeOptions = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'down_payment', label: 'Down Payment' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'other', label: 'Other' },
]

const {
  values,
  errors,
  handleSubmit,
  resetForm,
  validateField,
} = useForm<ProjectRevenueFormData>({
  validationSchema: toTypedSchema(projectRevenueSchema),
  initialValues: {
    type: 'invoice',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  },
})

// Reset form when modal opens or revenue changes
watch(() => [props.open, props.revenue], () => {
  if (props.open) {
    if (props.revenue) {
      resetForm({
        values: {
          type: props.revenue.revenue_type as ProjectRevenueFormData['type'],
          description: props.revenue.description,
          amount: props.revenue.amount,
          date: props.revenue.revenue_date?.split('T')[0] ?? '',
          reference: '',
          notes: props.revenue.notes ?? '',
        },
      })
    } else {
      resetForm({
        values: {
          type: 'invoice',
          description: '',
          amount: 0,
          date: new Date().toISOString().split('T')[0],
          reference: '',
          notes: '',
        },
      })
    }
  }
}, { immediate: true })

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
    <form id="revenue-form" novalidate @submit.prevent="onSubmit">
      <div class="space-y-4">
        <FormField label="Type" required :error="errors.type">
          <Select
            v-model="values.type"
            :options="revenueTypeOptions"
            placeholder="Select revenue type..."
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

        <FormField label="Amount" required :error="errors.amount">
          <Input
            v-model.number="values.amount"
            type="number"
            step="1"
            min="0"
            @blur="validateField('amount')"
          />
        </FormField>

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
        form="revenue-form"
        :loading="isLoading"
      >
        {{ isEditing ? 'Update Revenue' : 'Add Revenue' }}
      </Button>
    </template>
  </Modal>
</template>
