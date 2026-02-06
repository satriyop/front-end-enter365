<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useMrpRun, useCreateMrpRun, useUpdateMrpRun } from '@/api/useMrp'
import { useWarehousesLookup } from '@/api/useWarehouses'
import { mrpRunSchema, type MrpRunFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { Button, Input, FormField, Textarea, Select, Card, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const mrpRunId = computed(() => {
  const id = route.params.id
  return id ? String(id) : null
})

const isEditing = computed(() => mrpRunId.value !== null)
const pageTitle = computed(() => (isEditing.value ? 'Edit MRP Run' : 'New MRP Run'))

const mrpRunIdRef = computed(() => mrpRunId.value ?? '')
const { data: existingMrpRun, isLoading: loadingMrpRun } = useMrpRun(mrpRunIdRef)

// Warehouses lookup
const { data: warehouses } = useWarehousesLookup()
const warehouseOptions = computed(() => [
  { value: '', label: 'All Warehouses' },
  ...(warehouses.value ?? []).map((w) => ({
    value: String(w.id),
    label: `${w.code} - ${w.name}`,
  })),
])

// Get default planning horizon (this month to 3 months from now)
const today = new Date()
const defaultStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]!
const defaultEnd = new Date(today.getFullYear(), today.getMonth() + 3, 0).toISOString().split('T')[0]!

// Form with VeeValidate
const {
  errors,
  handleSubmit,
  setValues,
  setErrors,
  defineField,
} = useForm<MrpRunFormData>({
  validationSchema: toTypedSchema(mrpRunSchema),
  initialValues: {
    name: '',
    planning_horizon_start: defaultStart,
    planning_horizon_end: defaultEnd,
    warehouse_id: null,
    notes: '',
    parameters: {
      include_safety_stock: true,
      respect_moq: true,
      respect_order_multiple: true,
    },
  },
})

const [name] = defineField('name')
const [planningHorizonStart] = defineField('planning_horizon_start')
const [planningHorizonEnd] = defineField('planning_horizon_end')
const [notes] = defineField('notes')

// Parameters managed separately due to nested object
const includeSafetyStock = ref(true)
const respectMoq = ref(true)
const respectOrderMultiple = ref(true)
const warehouseId = ref<number | null>(null)

// Populate form when editing
watch(existingMrpRun, (run) => {
  if (run) {
    setValues({
      name: run.name || '',
      planning_horizon_start: run.planning_horizon_start || defaultStart,
      planning_horizon_end: run.planning_horizon_end || defaultEnd,
      warehouse_id: run.warehouse_id || null,
      notes: run.notes || '',
    })
    warehouseId.value = run.warehouse_id || null
    // Parse parameters if available
    if (run.parameters) {
      const params = typeof run.parameters === 'string' ? JSON.parse(run.parameters) : run.parameters
      includeSafetyStock.value = params.include_safety_stock ?? true
      respectMoq.value = params.respect_moq ?? true
      respectOrderMultiple.value = params.respect_order_multiple ?? true
    }
  }
}, { immediate: true })

// Handle warehouse change
function handleWarehouseChange(value: string | number | null) {
  warehouseId.value = value ? Number(value) : null
}

// Quick date presets
function setThisMonth() {
  const today = new Date()
  planningHorizonStart.value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]!
  planningHorizonEnd.value = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]!
}

function setNextMonth() {
  const today = new Date()
  planningHorizonStart.value = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString().split('T')[0]!
  planningHorizonEnd.value = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0]!
}

function setNextQuarter() {
  const today = new Date()
  planningHorizonStart.value = today.toISOString().split('T')[0]!
  planningHorizonEnd.value = new Date(today.getFullYear(), today.getMonth() + 3, 0).toISOString().split('T')[0]!
}

// Mutations
const createMutation = useCreateMrpRun()
const updateMutation = useUpdateMrpRun()
const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const onSubmit = handleSubmit(async (formValues) => {
  const payload = {
    name: formValues.name || undefined,
    planning_horizon_start: formValues.planning_horizon_start,
    planning_horizon_end: formValues.planning_horizon_end,
    warehouse_id: warehouseId.value || undefined,
    notes: formValues.notes || undefined,
    parameters: {
      include_safety_stock: includeSafetyStock.value,
      respect_moq: respectMoq.value,
      respect_order_multiple: respectOrderMultiple.value,
    },
  }

  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({
        id: mrpRunId.value!,
        data: payload,
      })
      toast.success('MRP run updated successfully')
    } else {
      const result = await createMutation.mutateAsync(payload)
      toast.success('MRP run created successfully')
      router.push(`/manufacturing/mrp/${result.id}`)
      return
    }
    router.push(`/manufacturing/mrp/${mrpRunId.value}`)
  } catch (err: unknown) {
    const error = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
    if (error?.response?.data?.errors) {
      setServerErrors({ setErrors }, error.response.data.errors)
    } else {
      const message = error?.response?.data?.message || 'Failed to save MRP run'
      toast.error(message)
    }
  }
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">{{ pageTitle }}</h1>
        <p class="text-muted-foreground">Plan material requirements for a date range</p>
      </div>
      <Button variant="ghost" @click="router.back()">Cancel</Button>
    </div>

    <!-- Loading State -->
    <Card v-if="isEditing && loadingMrpRun" class="text-center py-12">
      <div class="text-muted-foreground">Loading MRP run...</div>
    </Card>

    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <!-- Basic Information -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Basic Information</h2>
        </template>
        <div class="space-y-4">
          <FormField label="Name" :error="errors.name" hint="Optional - a descriptive name for this run">
            <Input v-model="name" placeholder="e.g., Q1 2024 Planning" />
          </FormField>
        </div>
      </Card>

      <!-- Planning Horizon -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Planning Horizon</h2>
        </template>
        <div class="space-y-4">
          <div class="flex gap-2 mb-4">
            <Button type="button" variant="secondary" size="sm" @click="setThisMonth">This Month</Button>
            <Button type="button" variant="secondary" size="sm" @click="setNextMonth">Next Month</Button>
            <Button type="button" variant="secondary" size="sm" @click="setNextQuarter">Next 3 Months</Button>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <FormField label="Start Date" required :error="errors.planning_horizon_start">
              <Input v-model="planningHorizonStart" type="date" />
            </FormField>
            <FormField label="End Date" required :error="errors.planning_horizon_end">
              <Input v-model="planningHorizonEnd" type="date" />
            </FormField>
          </div>

          <FormField label="Warehouse" hint="Leave empty to plan for all warehouses">
            <Select
              :model-value="warehouseId ? String(warehouseId) : ''"
              :options="warehouseOptions"
              @update:model-value="handleWarehouseChange"
            />
          </FormField>
        </div>
      </Card>

      <!-- Parameters -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Planning Parameters</h2>
        </template>
        <div class="space-y-4">
          <label class="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <div class="font-medium text-foreground">Include Safety Stock</div>
              <div class="text-sm text-muted-foreground">
                Factor in safety stock levels when calculating requirements
              </div>
            </div>
            <input
              type="checkbox"
              v-model="includeSafetyStock"
              class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>

          <label class="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <div class="font-medium text-foreground">Respect Minimum Order Quantity</div>
              <div class="text-sm text-muted-foreground">
                Round up suggestions to meet MOQ requirements
              </div>
            </div>
            <input
              type="checkbox"
              v-model="respectMoq"
              class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>

          <label class="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <div class="font-medium text-foreground">Respect Order Multiple</div>
              <div class="text-sm text-muted-foreground">
                Round up suggestions to order multiple quantities
              </div>
            </div>
            <input
              type="checkbox"
              v-model="respectOrderMultiple"
              class="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
          </label>
        </div>
      </Card>

      <!-- Notes -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Notes</h2>
        </template>
        <FormField :error="errors.notes">
          <Textarea v-model="notes" :rows="3" placeholder="Any additional notes about this MRP run..." />
        </FormField>
      </Card>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">Cancel</Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Save Changes' : 'Create MRP Run' }}
        </Button>
      </div>
    </form>
  </div>
</template>
