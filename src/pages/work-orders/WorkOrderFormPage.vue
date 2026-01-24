<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useWorkOrder, useCreateWorkOrder, useUpdateWorkOrder } from '@/api/useWorkOrders'
import { useProductsLookup } from '@/api/useProducts'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { workOrderSchema, type WorkOrderFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { Button, Input, FormField, Textarea, Select, Card, useToast, CurrencyInput } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const workOrderId = computed(() => {
  const id = route.params.id
  return id ? String(id) : null
})

// Pre-fill from query params
const initialProjectId = route.query.project_id ? Number(route.query.project_id) : null

const isEditing = computed(() => workOrderId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Work Order' : 'New Work Order')

const workOrderIdRef = computed(() => workOrderId.value ?? '')
const { data: existingWorkOrder, isLoading: loadingWorkOrder } = useWorkOrder(workOrderIdRef)

// Products lookup
const { data: products } = useProductsLookup()
const productOptions = computed(() =>
  (products.value ?? []).map(p => ({ value: p.id, label: `${p.sku} - ${p.name}` }))
)

// Projects lookup
const { data: projectsData } = useQuery({
  queryKey: ['projects', 'lookup'],
  queryFn: async () => {
    const response = await api.get<{ data: Array<{ id: number; project_number: string; name: string }> }>('/projects', {
      params: { per_page: 100, status: 'in_progress' }
    })
    return response.data.data
  },
})
const projectOptions = computed(() =>
  (projectsData.value ?? []).map(p => ({ value: p.id, label: `${p.project_number} - ${p.name}` }))
)

const typeOptions = [
  { value: 'production', label: 'Production' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'installation', label: 'Installation' },
  { value: 'maintenance', label: 'Maintenance' },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const today = new Date().toISOString().split('T')[0]!

// Form with VeeValidate
const {
  values: form,
  errors,
  handleSubmit,
  setValues,
  setErrors,
  validateField,
  defineField,
} = useForm<WorkOrderFormData>({
  validationSchema: toTypedSchema(workOrderSchema),
  initialValues: {
    type: 'production',
    name: '',
    description: '',
    product_id: null,
    project_id: initialProjectId,
    quantity_ordered: 1,
    priority: 'medium',
    planned_start_date: today,
    planned_end_date: '',
    estimated_material_cost: 0,
    estimated_labor_cost: 0,
    estimated_overhead_cost: 0,
    notes: '',
  },
})

const [type] = defineField('type')
const [name] = defineField('name')
const [description] = defineField('description')
const [productId] = defineField('product_id')
const [projectId] = defineField('project_id')
const [quantityOrdered] = defineField('quantity_ordered')
const [priority] = defineField('priority')
const [plannedStartDate] = defineField('planned_start_date')
const [plannedEndDate] = defineField('planned_end_date')
const [estimatedMaterialCost] = defineField('estimated_material_cost')
const [estimatedLaborCost] = defineField('estimated_labor_cost')
const [estimatedOverheadCost] = defineField('estimated_overhead_cost')
const [notes] = defineField('notes')

// Populate form when editing
watch(existingWorkOrder, (wo) => {
  if (wo) {
    setValues({
      type: (wo.type as 'production' | 'assembly' | 'installation' | 'maintenance') || 'production',
      name: wo.name || '',
      description: wo.description || '',
      product_id: wo.product_id ? Number(wo.product_id) : null,
      project_id: wo.project_id ? Number(wo.project_id) : null,
      quantity_ordered: wo.quantity_ordered || 1,
      priority: (wo.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
      planned_start_date: wo.planned_start_date || today,
      planned_end_date: wo.planned_end_date || '',
      estimated_material_cost: Number(wo.estimated_material_cost) || 0,
      estimated_labor_cost: Number(wo.estimated_labor_cost) || 0,
      estimated_overhead_cost: Number(wo.estimated_overhead_cost) || 0,
      notes: wo.notes || '',
    })
  }
}, { immediate: true })

const estimatedTotal = computed(() =>
  (estimatedMaterialCost.value || 0) +
  (estimatedLaborCost.value || 0) +
  (estimatedOverheadCost.value || 0)
)

// Mutations
const createMutation = useCreateWorkOrder()
const updateMutation = useUpdateWorkOrder()
const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const onSubmit = handleSubmit(async (formValues) => {
  const payload = {
    type: formValues.type,
    priority: formValues.priority,
    name: formValues.name,
    description: formValues.description || undefined,
    product_id: formValues.product_id || undefined,
    project_id: formValues.project_id || undefined,
    quantity_ordered: formValues.quantity_ordered,
    planned_start_date: formValues.planned_start_date || undefined,
    planned_end_date: formValues.planned_end_date || undefined,
    estimated_material_cost: formValues.estimated_material_cost,
    estimated_labor_cost: formValues.estimated_labor_cost,
    estimated_overhead_cost: formValues.estimated_overhead_cost,
    notes: formValues.notes || undefined,
  }

  try {
    if (isEditing.value && workOrderId.value) {
      await updateMutation.mutateAsync({ id: workOrderId.value, data: payload as any })
      toast.success('Work order updated')
      router.push(`/work-orders/${workOrderId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload as any)
      toast.success('Work order created')
      router.push(`/work-orders/${result.id}`)
    }
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to save work order')
  }
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
        <p class="text-slate-500 dark:text-slate-400">
          {{ isEditing ? 'Update work order details' : 'Create a new work order' }}
        </p>
      </div>
      <Button variant="ghost" @click="router.back()">Cancel</Button>
    </div>

    <div v-if="isEditing && loadingWorkOrder" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading work order...</div>
    </div>

    <form v-else @submit.prevent="onSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Work Order Information</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Type" required>
            <Select v-model="type" :options="typeOptions" />
          </FormField>
          <FormField label="Priority">
            <Select v-model="priority" :options="priorityOptions" />
          </FormField>
          <FormField label="Name" required :error="errors.name" class="md:col-span-2">
            <Input v-model="name" placeholder="e.g., Solar Panel Assembly Batch #1" @blur="validateField('name')" />
          </FormField>
          <FormField label="Product">
            <Select v-model="productId" :options="productOptions" placeholder="Select product" />
          </FormField>
          <FormField label="Project">
            <Select v-model="projectId" :options="projectOptions" placeholder="Select project (optional)" />
          </FormField>
          <FormField label="Description" class="md:col-span-2">
            <Textarea v-model="description" :rows="3" placeholder="Work order description" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Quantity & Schedule</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Quantity Ordered" required :error="errors.quantity_ordered">
            <Input v-model.number="quantityOrdered" type="number" min="1" @blur="validateField('quantity_ordered')" />
          </FormField>
          <FormField label="Planned Start Date">
            <Input v-model="plannedStartDate" type="date" />
          </FormField>
          <FormField label="Planned End Date">
            <Input v-model="plannedEndDate" type="date" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Estimated Costs</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Material Cost">
            <CurrencyInput v-model="estimatedMaterialCost" :min="0" />
          </FormField>
          <FormField label="Labor Cost">
            <CurrencyInput v-model="estimatedLaborCost" :min="0" />
          </FormField>
          <FormField label="Overhead Cost">
            <CurrencyInput v-model="estimatedOverheadCost" :min="0" />
          </FormField>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div class="flex justify-between text-lg font-medium">
            <span class="text-slate-700 dark:text-slate-300">Estimated Total</span>
            <span class="text-slate-900 dark:text-slate-100">Rp {{ estimatedTotal.toLocaleString('id-ID') }}</span>
          </div>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Notes</h2>
        </template>
        <FormField label="Additional Notes">
          <Textarea v-model="notes" :rows="3" placeholder="Any additional notes or instructions" />
        </FormField>
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
