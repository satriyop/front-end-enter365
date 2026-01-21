<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm, useFieldArray } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useMaterialRequisition,
  useCreateMaterialRequisition,
  useUpdateMaterialRequisition,
} from '@/api/useMaterialRequisitions'
import { useWorkOrdersLookup } from '@/api/useWorkOrders'
import { useWarehousesLookup } from '@/api/useInventory'
import { materialRequisitionSchema, type MaterialRequisitionFormData, type MaterialRequisitionItemFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { Button, Input, FormField, Textarea, Select, Card, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const requisitionId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => requisitionId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Material Requisition' : 'New Material Requisition')

const requisitionIdRef = computed(() => requisitionId.value ?? 0)
const { data: existingRequisition, isLoading: loadingRequisition } = useMaterialRequisition(requisitionIdRef)

// Lookups
const { data: workOrders } = useWorkOrdersLookup({})
const workOrderOptions = computed(() =>
  (workOrders.value ?? []).map(wo => ({
    value: wo.id,
    label: `${wo.wo_number || `WO-${wo.id}`} - ${wo.name}`,
  }))
)

const { data: warehouses } = useWarehousesLookup()
const warehouseOptions = computed(() =>
  (warehouses.value ?? []).map(w => ({
    value: w.id,
    label: `${w.code} - ${w.name}`,
  }))
)

function createEmptyItem(): MaterialRequisitionItemFormData {
  return {
    work_order_item_id: null,
    product_id: null,
    description: '',
    quantity_requested: 1,
    unit: 'unit',
    notes: '',
  }
}

const today = new Date().toISOString().slice(0, 10)

// Form with VeeValidate
const {
  values: form,
  errors,
  handleSubmit,
  setValues,
  setErrors,
  validateField,
} = useForm<MaterialRequisitionFormData>({
  validationSchema: toTypedSchema(materialRequisitionSchema),
  initialValues: {
    work_order_id: undefined as unknown as number,
    warehouse_id: undefined as unknown as number,
    required_date: today,
    notes: '',
    items: [createEmptyItem()],
  },
})

// Field array for line items
const { fields: itemFields, push: pushItem, remove: removeItem } = useFieldArray<MaterialRequisitionItemFormData>('items')

// Populate form when editing
watch(existingRequisition, (requisition) => {
  if (requisition) {
    setValues({
      work_order_id: Number(requisition.work_order_id),
      warehouse_id: Number(requisition.warehouse_id),
      required_date: requisition.required_date?.slice(0, 10) || today,
      notes: requisition.notes || '',
      items: requisition.items && requisition.items.length > 0
        ? requisition.items.map(item => ({
            work_order_item_id: item.work_order_item_id ? Number(item.work_order_item_id) : null,
            product_id: item.product_id ? Number(item.product_id) : null,
            description: item.product?.name || '',
            quantity_requested: Number(item.quantity_requested),
            unit: item.unit || 'unit',
            notes: item.notes || '',
          }))
        : [createEmptyItem()],
    })
  }
}, { immediate: true })

// Item management
function addItem() {
  pushItem(createEmptyItem())
}

function handleRemoveItem(index: number) {
  if (itemFields.value.length > 1) {
    removeItem(index)
  }
}

// Total calculation
const totalQuantity = computed(() =>
  (form.items || []).reduce((sum, item) => sum + (item.quantity_requested || 0), 0)
)

// Mutations
const createMutation = useCreateMaterialRequisition()
const updateMutation = useUpdateMaterialRequisition()
const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const onSubmit = handleSubmit(async (formValues) => {
  const itemsPayload = (formValues.items || [])
    .filter(item => item.description || item.product_id || item.work_order_item_id)
    .map(item => ({
      work_order_item_id: item.work_order_item_id || undefined,
      product_id: item.product_id || undefined,
      quantity_requested: item.quantity_requested,
      notes: item.notes || undefined,
    }))

  const payload = {
    work_order_id: formValues.work_order_id,
    warehouse_id: formValues.warehouse_id,
    required_date: formValues.required_date,
    notes: formValues.notes || undefined,
    items: itemsPayload,
  }

  try {
    if (isEditing.value && requisitionId.value) {
      await updateMutation.mutateAsync({ id: requisitionId.value, data: payload as unknown as Record<string, unknown> })
      toast.success('Material requisition updated')
      router.push(`/manufacturing/material-requisitions/${requisitionId.value}`)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await createMutation.mutateAsync(payload as any)
      toast.success('Material requisition created')
      router.push(`/manufacturing/material-requisitions/${result.id}`)
    }
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to save material requisition')
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
        <p class="text-slate-500 dark:text-slate-400">{{ isEditing ? 'Update requisition details' : 'Request materials for work order' }}</p>
      </div>
      <Button variant="ghost" @click="router.back()">Cancel</Button>
    </div>

    <div v-if="isEditing && loadingRequisition" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading requisition...</div>
    </div>

    <form v-else @submit.prevent="onSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Requisition Information</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Work Order" required :error="errors.work_order_id">
            <Select
              v-model="form.work_order_id"
              :options="workOrderOptions"
              placeholder="Select work order"
              :disabled="isEditing"
              @update:model-value="validateField('work_order_id')"
            />
          </FormField>
          <FormField label="Warehouse" required :error="errors.warehouse_id">
            <Select
              v-model="form.warehouse_id"
              :options="warehouseOptions"
              placeholder="Select warehouse"
              @update:model-value="validateField('warehouse_id')"
            />
          </FormField>
          <FormField label="Required Date" required :error="errors.required_date">
            <Input v-model="form.required_date" type="date" @blur="validateField('required_date')" />
          </FormField>
          <div></div>
          <FormField label="Notes" class="md:col-span-2">
            <Textarea :model-value="form.notes ?? ''" @update:model-value="(v: string) => form.notes = v" :rows="2" placeholder="Additional notes" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-slate-900 dark:text-slate-100">Requested Items</h2>
            <Button type="button" variant="secondary" size="sm" @click="addItem">Add Item</Button>
          </div>
        </template>

        <div class="space-y-4">
          <div v-for="(field, index) in itemFields" :key="field.key" class="grid grid-cols-12 gap-2 items-end">
            <div class="col-span-5">
              <label v-if="index === 0" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
              <Input v-model="field.value.description" placeholder="Material description" />
            </div>
            <div class="col-span-2">
              <label v-if="index === 0" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Quantity</label>
              <Input v-model.number="field.value.quantity_requested" type="number" min="1" />
            </div>
            <div class="col-span-2">
              <label v-if="index === 0" class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Unit</label>
              <Input v-model="field.value.unit" placeholder="unit" />
            </div>
            <div class="col-span-3 flex justify-end">
              <Button type="button" variant="ghost" size="sm" @click="handleRemoveItem(index)" :disabled="itemFields.length === 1">
                Remove
              </Button>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div class="flex justify-end">
            <dl class="w-48">
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Total Items</dt>
                <dd class="text-slate-900 dark:text-slate-100 font-medium">{{ itemFields.length }}</dd>
              </div>
              <div class="flex justify-between mt-2">
                <dt class="text-slate-500 dark:text-slate-400">Total Quantity</dt>
                <dd class="text-slate-900 dark:text-slate-100 font-medium">{{ totalQuantity.toLocaleString('id-ID') }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">Cancel</Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Requisition' : 'Create Requisition' }}
        </Button>
      </div>
    </form>
  </div>
</template>
