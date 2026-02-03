<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm, useFieldArray } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useDeliveryOrder,
  useCreateDeliveryOrder,
  useUpdateDeliveryOrder,
  type CreateDeliveryOrderItem,
} from '@/api/useDeliveryOrders'
import { useContactsLookup } from '@/api/useContacts'
import { useWarehousesLookup } from '@/api/useInventory'
import { deliveryOrderSchema, type DeliveryOrderFormData, type DeliveryOrderItemFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Select,
  Card,
  Alert,
  useToast,
} from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if we're editing
const deliveryOrderId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => deliveryOrderId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Delivery Order' : 'New Delivery Order')

// Fetch existing delivery order if editing
const doIdRef = computed(() => deliveryOrderId.value ?? 0)
const { data: existingDO, isLoading: loadingDO } = useDeliveryOrder(doIdRef)

// Lookups
const { data: contacts, isLoading: loadingContacts } = useContactsLookup('customer')
const { data: warehouses, isLoading: loadingWarehouses } = useWarehousesLookup()

function createEmptyItem(): DeliveryOrderItemFormData {
  return {
    description: '',
    quantity: 1,
    unit: 'pcs',
    notes: '',
  }
}

// Form with VeeValidate
const {
  errors,
  handleSubmit,
  setValues,
  setFieldValue,
  setErrors,
  validateField,
  defineField,
} = useForm<DeliveryOrderFormData>({
  validationSchema: toTypedSchema(deliveryOrderSchema),
  initialValues: {
    contact_id: undefined as unknown as number,
    warehouse_id: undefined,
    do_date: new Date().toISOString().split('T')[0]!,
    shipping_address: '',
    shipping_method: '',
    notes: '',
    items: [createEmptyItem()],
  },
})

const [contactId] = defineField('contact_id')
const [warehouseId] = defineField('warehouse_id')
const [doDate] = defineField('do_date')
const [shippingAddress] = defineField('shipping_address')
const [shippingMethod] = defineField('shipping_method')
const [notes] = defineField('notes')

// Field array for line items
const { fields: itemFields, push: pushItem, remove: removeItem } = useFieldArray<DeliveryOrderItemFormData>('items')

// Populate form when editing
watch(existingDO, (dorder) => {
  if (dorder) {
    setValues({
      contact_id: Number(dorder.contact_id),
      warehouse_id: dorder.warehouse_id ? Number(dorder.warehouse_id) : undefined,
      do_date: dorder.do_date?.split('T')[0] || new Date().toISOString().split('T')[0]!,
      shipping_address: dorder.shipping_address ?? '',
      shipping_method: dorder.shipping_method ?? '',
      notes: dorder.notes ?? '',
      items: dorder.items && dorder.items.length > 0
        ? dorder.items.map(item => ({
            product_id: item.product_id || undefined,
            description: item.description || '',
            quantity: item.quantity,
            unit: item.unit || 'pcs',
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

// Form submission
const createMutation = useCreateDeliveryOrder()
const updateMutation = useUpdateDeliveryOrder()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const onSubmit = handleSubmit(async (formValues) => {
  const itemsPayload: CreateDeliveryOrderItem[] = (formValues.items || [])
    .filter(item => item.description)
    .map(item => ({
      product_id: item.product_id || undefined,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
    }))

  const payload = {
    contact_id: formValues.contact_id!,
    warehouse_id: formValues.warehouse_id || undefined,
    do_date: formValues.do_date || new Date().toISOString().split('T')[0]!,
    shipping_address: formValues.shipping_address || undefined,
    shipping_method: formValues.shipping_method || undefined,
    notes: formValues.notes || undefined,
    items: itemsPayload,
  }

  try {
    if (isEditing.value && deliveryOrderId.value) {
      await updateMutation.mutateAsync({ id: deliveryOrderId.value, data: payload as any })
      toast.success('Delivery order updated successfully')
      router.push(`/sales/delivery-orders/${deliveryOrderId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload as any)
      toast.success('Delivery order created successfully')
      router.push(`/sales/delivery-orders/${result.id}`)
    }
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to save delivery order')
  }
})

// Select options
const contactOptions = computed(() => {
  if (!contacts.value) return []
  return contacts.value.map(c => ({
    value: c.id,
    label: c.name || `Contact #${c.id}`,
  }))
})

const warehouseOptions = computed(() => {
  if (!warehouses.value) return []
  return [
    { value: '', label: 'No warehouse' },
    ...warehouses.value.map(w => ({
      value: w.id,
      label: w.name || `Warehouse #${w.id}`,
    })),
  ]
})
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
        <p class="text-slate-500 dark:text-slate-400">
          {{ isEditing ? 'Update delivery order details' : 'Create a new delivery order' }}
        </p>
      </div>
      <Button variant="ghost" @click="router.back()">
        Cancel
      </Button>
    </div>

    <!-- Loading state for edit mode -->
    <div v-if="isEditing && loadingDO" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading delivery order...</div>
    </div>

    <!-- Form -->
    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <!-- Header Info Card -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Delivery Order Details</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Customer -->
          <FormField label="Customer" required :error="errors.contact_id">
            <Select
              :model-value="contactId"
              :options="contactOptions"
              placeholder="Select customer..."
              :loading="loadingContacts"
              @update:model-value="(v) => { setFieldValue('contact_id', Number(v)); validateField('contact_id'); }"
            />
          </FormField>

          <!-- Warehouse -->
          <FormField label="Warehouse" :error="errors.warehouse_id">
            <Select
              :model-value="warehouseId"
              :options="warehouseOptions"
              placeholder="Select warehouse..."
              :loading="loadingWarehouses"
              @update:model-value="(v) => { setFieldValue('warehouse_id', v ? Number(v) : undefined); }"
            />
          </FormField>

          <!-- DO Date -->
          <FormField label="DO Date" required :error="errors.do_date">
            <Input v-model="doDate" type="date" @blur="validateField('do_date')" />
          </FormField>

          <!-- Shipping Method -->
          <FormField label="Shipping Method">
            <Input v-model="shippingMethod" placeholder="e.g. Courier, Self-pickup" />
          </FormField>

          <!-- Shipping Address -->
          <FormField label="Shipping Address" class="md:col-span-2">
            <Textarea
              v-model="shippingAddress"
              :rows="2"
              placeholder="Delivery address"
            />
          </FormField>

          <!-- Notes -->
          <FormField label="Notes" class="md:col-span-2">
            <Textarea
              v-model="notes"
              :rows="2"
              placeholder="Additional notes"
            />
          </FormField>
        </div>
      </Card>

      <!-- Line Items Card -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-slate-900 dark:text-slate-100">Items</h2>
            <Button type="button" variant="ghost" size="sm" @click="addItem">
              + Add Item
            </Button>
          </div>
        </template>

        <Alert v-if="errors.items" variant="destructive" class="mb-4">
          {{ errors.items }}
        </Alert>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <tr>
                <th class="px-3 py-2 text-left">Description</th>
                <th class="px-3 py-2 text-right w-24">Qty</th>
                <th class="px-3 py-2 text-left w-20">Unit</th>
                <th class="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              <tr v-for="(field, index) in itemFields" :key="field.key" class="align-top">
                <td class="px-3 py-2">
                  <input
                    v-model="field.value.description"
                    type="text"
                    placeholder="Item description"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model.number="field.value.quantity"
                    type="number"
                    min="0.0001"
                    step="any"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm text-right focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <input
                    v-model="field.value.unit"
                    type="text"
                    placeholder="pcs"
                    class="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </td>
                <td class="px-3 py-2">
                  <button
                    type="button"
                    @click="handleRemoveItem(index)"
                    :disabled="itemFields.length === 1"
                    class="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">
          Cancel
        </Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Delivery Order' : 'Create Delivery Order' }}
        </Button>
      </div>
    </form>
  </div>
</template>
