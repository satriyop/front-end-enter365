<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkOrder, useCreateWorkOrder, useUpdateWorkOrder } from '@/api/useWorkOrders'
import { useProductsLookup } from '@/api/useProducts'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { Button, Input, FormField, Textarea, Select, Card, useToast } from '@/components/ui'

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

interface FormState {
  type: string
  name: string
  description: string
  product_id: number | null
  project_id: number | null
  quantity_ordered: number
  priority: string
  planned_start_date: string
  planned_end_date: string
  estimated_material_cost: number
  estimated_labor_cost: number
  estimated_overhead_cost: number
  notes: string
}

const today = new Date().toISOString().split('T')[0] as string
const form = ref<FormState>({
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
})

watch(existingWorkOrder, (wo) => {
  if (wo) {
    form.value = {
      type: wo.type || 'production',
      name: wo.name || '',
      description: wo.description || '',
      product_id: wo.product_id ? Number(wo.product_id) : null,
      project_id: wo.project_id ? Number(wo.project_id) : null,
      quantity_ordered: wo.quantity_ordered || 1,
      priority: wo.priority || 'medium',
      planned_start_date: wo.planned_start_date || today,
      planned_end_date: wo.planned_end_date || '',
      estimated_material_cost: Number(wo.estimated_material_cost) || 0,
      estimated_labor_cost: Number(wo.estimated_labor_cost) || 0,
      estimated_overhead_cost: Number(wo.estimated_overhead_cost) || 0,
      notes: wo.notes || '',
    }
  }
}, { immediate: true })

const estimatedTotal = computed(() =>
  form.value.estimated_material_cost +
  form.value.estimated_labor_cost +
  form.value.estimated_overhead_cost
)

const createMutation = useCreateWorkOrder()
const updateMutation = useUpdateWorkOrder()
const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
  }
  if (form.value.quantity_ordered < 1) {
    errors.value.quantity_ordered = 'Quantity must be at least 1'
  }

  if (Object.keys(errors.value).length > 0) return

  try {
    if (isEditing.value && workOrderId.value) {
      await updateMutation.mutateAsync({ id: workOrderId.value, data: form.value as any })
      toast.success('Work order updated')
      router.push(`/work-orders/${workOrderId.value}`)
    } else {
      const result = await createMutation.mutateAsync(form.value as any)
      toast.success('Work order created')
      router.push(`/work-orders/${result.id}`)
    }
  } catch (err) {
    toast.error('Failed to save work order')
    console.error(err)
  }
}
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

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Work Order Information</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Type" required>
            <Select v-model="form.type" :options="typeOptions" />
          </FormField>
          <FormField label="Priority">
            <Select v-model="form.priority" :options="priorityOptions" />
          </FormField>
          <FormField label="Name" required :error="errors.name" class="md:col-span-2">
            <Input v-model="form.name" placeholder="e.g., Solar Panel Assembly Batch #1" />
          </FormField>
          <FormField label="Product">
            <Select v-model="form.product_id" :options="productOptions" placeholder="Select product" />
          </FormField>
          <FormField label="Project">
            <Select v-model="form.project_id" :options="projectOptions" placeholder="Select project (optional)" />
          </FormField>
          <FormField label="Description" class="md:col-span-2">
            <Textarea v-model="form.description" :rows="3" placeholder="Work order description" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Quantity & Schedule</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Quantity Ordered" required :error="errors.quantity_ordered">
            <Input v-model.number="form.quantity_ordered" type="number" min="1" />
          </FormField>
          <FormField label="Planned Start Date">
            <Input v-model="form.planned_start_date" type="date" />
          </FormField>
          <FormField label="Planned End Date">
            <Input v-model="form.planned_end_date" type="date" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Estimated Costs</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Material Cost">
            <Input v-model.number="form.estimated_material_cost" type="number" min="0" step="100000" />
          </FormField>
          <FormField label="Labor Cost">
            <Input v-model.number="form.estimated_labor_cost" type="number" min="0" step="100000" />
          </FormField>
          <FormField label="Overhead Cost">
            <Input v-model.number="form.estimated_overhead_cost" type="number" min="0" step="100000" />
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
          <Textarea v-model="form.notes" :rows="3" placeholder="Any additional notes or instructions" />
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
