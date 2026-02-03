<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useSubcontractorWorkOrder,
  useCreateSubcontractorWorkOrder,
  useUpdateSubcontractorWorkOrder,
} from '@/api/useSubcontractorWorkOrders'
import { useWorkOrdersLookup } from '@/api/useWorkOrders'
import { useProjectsLookup } from '@/api/useProjects'
import { subcontractorWorkOrderSchema, type SubcontractorWorkOrderFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { Button, Input, FormField, Textarea, Select, Card, CurrencyInput, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const scwoId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => scwoId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Subcontractor Work Order' : 'New Subcontractor Work Order')

const scwoIdRef = computed(() => scwoId.value ?? 0)
const { data: existingScwo, isLoading: loadingScwo } = useSubcontractorWorkOrder(scwoIdRef)

// Lookups
const { data: workOrders } = useWorkOrdersLookup({})
const workOrderOptions = computed(() => [
  { value: '', label: 'None' },
  ...(workOrders.value ?? []).map(wo => ({
    value: Number(wo.id),
    label: `${wo.wo_number || `WO-${wo.id}`} - ${wo.name}`,
  })),
])

const { data: projects } = useProjectsLookup({})
const projectOptions = computed(() => [
  { value: '', label: 'None' },
  ...(projects.value ?? []).map(p => ({
    value: Number(p.id),
    label: `${p.project_number || `PRJ-${p.id}`} - ${p.name}`,
  })),
])

const today = new Date().toISOString().slice(0, 10)

// Form with VeeValidate
const {
  values: form,
  errors,
  handleSubmit,
  setValues,
  setErrors,
  validateField,
  defineField,
} = useForm<SubcontractorWorkOrderFormData>({
  validationSchema: toTypedSchema(subcontractorWorkOrderSchema),
  initialValues: {
    work_order_id: undefined,
    project_id: undefined,
    name: '',
    description: '',
    scope_of_work: '',
    agreed_amount: 0,
    retention_percent: 0,
    scheduled_start_date: today,
    scheduled_end_date: today,
    work_location: '',
    location_address: '',
    notes: '',
  },
})

const [name] = defineField('name')
const [workOrderId] = defineField('work_order_id')
const [projectId] = defineField('project_id')
const [description] = defineField('description')
const [scopeOfWork] = defineField('scope_of_work')
const [agreedAmount] = defineField('agreed_amount')
const [retentionPercent] = defineField('retention_percent')
const [scheduledStartDate] = defineField('scheduled_start_date')
const [scheduledEndDate] = defineField('scheduled_end_date')
const [workLocation] = defineField('work_location')
const [locationAddress] = defineField('location_address')
const [notes] = defineField('notes')

// Populate form when editing
watch(existingScwo, (scwo) => {
  if (scwo) {
    setValues({
      work_order_id: scwo.work_order_id ? Number(scwo.work_order_id) : undefined,
      project_id: scwo.project_id ? Number(scwo.project_id) : undefined,
      name: scwo.name,
      description: scwo.description || '',
      scope_of_work: scwo.scope_of_work || '',
      agreed_amount: Number(scwo.agreed_amount) || 0,
      retention_percent: Number(scwo.retention_percent) || 0,
      scheduled_start_date: scwo.scheduled_start_date?.slice(0, 10) || today,
      scheduled_end_date: scwo.scheduled_end_date?.slice(0, 10) || today,
      work_location: scwo.work_location || '',
      location_address: scwo.location_address || '',
      notes: scwo.notes || '',
    })
  }
}, { immediate: true })

// Mutations
const createMutation = useCreateSubcontractorWorkOrder()
const updateMutation = useUpdateSubcontractorWorkOrder()
const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const onSubmit = handleSubmit(async (formValues) => {
  const payload = {
    work_order_id: formValues.work_order_id || undefined,
    project_id: formValues.project_id || undefined,
    name: formValues.name,
    description: formValues.description || undefined,
    scope_of_work: formValues.scope_of_work,
    agreed_amount: formValues.agreed_amount,
    retention_percent: formValues.retention_percent || undefined,
    scheduled_start_date: formValues.scheduled_start_date,
    scheduled_end_date: formValues.scheduled_end_date,
    work_location: formValues.work_location || undefined,
    location_address: formValues.location_address || undefined,
    notes: formValues.notes || undefined,
  }

  try {
    if (isEditing.value && scwoId.value) {
      await updateMutation.mutateAsync({ id: scwoId.value, data: payload })
      toast.success('Subcontractor work order updated')
      router.push(`/manufacturing/subcontractor-work-orders/${scwoId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload)
      toast.success('Subcontractor work order created')
      router.push(`/manufacturing/subcontractor-work-orders/${result.id}`)
    }
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to save subcontractor work order')
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
        <p class="text-slate-500 dark:text-slate-400">{{ isEditing ? 'Update work order details' : 'Create a new subcontractor work order' }}</p>
      </div>
      <Button variant="ghost" @click="router.back()">Cancel</Button>
    </div>

    <div v-if="isEditing && loadingScwo" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading work order...</div>
    </div>

    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Basic Information</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Name" required :error="errors.name" class="md:col-span-2">
            <Input v-model="name" placeholder="Work order name" @blur="validateField('name')" />
          </FormField>
          <FormField label="Related Work Order">
            <Select
              v-model="workOrderId"
              :options="workOrderOptions"
              placeholder="Select work order (optional)"
            />
          </FormField>
          <FormField label="Related Project">
            <Select
              v-model="projectId"
              :options="projectOptions"
              placeholder="Select project (optional)"
            />
          </FormField>
          <FormField label="Description" class="md:col-span-2">
            <Textarea v-model="description" :rows="2" placeholder="Brief description" />
          </FormField>
          <FormField label="Scope of Work" required :error="errors.scope_of_work" class="md:col-span-2">
            <Textarea v-model="scopeOfWork" :rows="4" placeholder="Detailed scope of work" @blur="validateField('scope_of_work')" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Financial Details</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Agreed Amount" required :error="errors.agreed_amount">
            <CurrencyInput v-model="agreedAmount" @blur="validateField('agreed_amount')" />
          </FormField>
          <FormField label="Retention %" :error="errors.retention_percent">
            <Input v-model.number="retentionPercent" type="number" min="0" max="100" step="0.5" placeholder="0" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Schedule & Location</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Scheduled Start Date" required :error="errors.scheduled_start_date">
            <Input v-model="scheduledStartDate" type="date" @blur="validateField('scheduled_start_date')" />
          </FormField>
          <FormField label="Scheduled End Date" required :error="errors.scheduled_end_date">
            <Input v-model="scheduledEndDate" type="date" @blur="validateField('scheduled_end_date')" />
          </FormField>
          <FormField label="Work Location">
            <Input v-model="workLocation" placeholder="Location name" />
          </FormField>
          <FormField label="Location Address">
            <Input v-model="locationAddress" placeholder="Full address" />
          </FormField>
          <FormField label="Notes" class="md:col-span-2">
            <Textarea v-model="notes" :rows="2" placeholder="Additional notes" />
          </FormField>
        </div>
      </Card>

      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">Cancel</Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Work Order' : 'Create Work Order' }}
        </Button>
      </div>
    </form>
  </div>
</template>
