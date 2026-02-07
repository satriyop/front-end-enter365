<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useWarehouse,
  useCreateWarehouse,
  useUpdateWarehouse,
  type CreateWarehouseData
} from '@/api/useWarehouses'
import { getErrorMessage } from '@/api/client'
import { warehouseSchema, type WarehouseFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { useFormShortcuts } from '@/composables/useFormShortcuts'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Card,
  PageSkeleton,
  useToast
} from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if we're editing
const warehouseId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => warehouseId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Warehouse' : 'New Warehouse')

// Fetch existing warehouse if editing
const warehouseIdRef = computed(() => warehouseId.value ?? 0)
const { data: existingWarehouse, isLoading: loadingWarehouse } = useWarehouse(warehouseIdRef)

// Form with Zod validation
const { errors, handleSubmit, setValues, setErrors, meta, validateField, defineField } = useForm<WarehouseFormData>({
  validationSchema: toTypedSchema(warehouseSchema),
  initialValues: {
    code: '',
    name: '',
    address: '',
    phone: '',
    contact_person: '',
    is_default: false,
    is_active: true,
    notes: '',
  },
})

const [code] = defineField('code')
const [name] = defineField('name')
const [address] = defineField('address')
const [phone] = defineField('phone')
const [contactPerson] = defineField('contact_person')
const [isDefault] = defineField('is_default')
const [isActive] = defineField('is_active')
const [notes] = defineField('notes')

// Populate form when editing
watch(existingWarehouse, (warehouse) => {
  if (warehouse) {
    setValues({
      code: warehouse.code || '',
      name: warehouse.name,
      address: warehouse.address || '',
      phone: warehouse.phone || '',
      contact_person: warehouse.contact_person || '',
      is_default: !!warehouse.is_default,
      is_active: !!warehouse.is_active,
      notes: warehouse.notes || '',
    })
  }
}, { immediate: true })

// Form submission
const createMutation = useCreateWarehouse()
const updateMutation = useUpdateWarehouse()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const onSubmit = handleSubmit(async (formValues) => {
  const payload: CreateWarehouseData = {
    code: formValues.code || null,
    name: formValues.name,
    address: formValues.address || null,
    phone: formValues.phone || null,
    contact_person: formValues.contact_person || null,
    is_default: formValues.is_default ?? false,
    is_active: formValues.is_active ?? true,
    notes: formValues.notes || null,
  }

  try {
    if (isEditing.value && warehouseId.value) {
      await updateMutation.mutateAsync({ id: warehouseId.value, data: payload })
      toast.success('Warehouse updated successfully')
      router.push(`/settings/warehouses/${warehouseId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload)
      toast.success('Warehouse created successfully')
      router.push(`/settings/warehouses/${result.id}`)
    }
  } catch (err: unknown) {
    // Handle server validation errors
    const error = err as { validationErrors?: Record<string, string[]> }
    if (error.validationErrors) {
      setServerErrors({ setErrors } as any, error.validationErrors)
    }
    toast.error(getErrorMessage(err, 'Failed to save warehouse'))
  }
})

// Keyboard shortcut: Ctrl+S to save
useFormShortcuts({
  onSave: async () => { await onSubmit() },
  onCancel: () => router.back(),
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">{{ pageTitle }}</h1>
        <p class="text-muted-foreground">
          {{ isEditing ? 'Update warehouse information' : 'Add a new inventory storage location' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <kbd class="hidden sm:inline-flex px-2 py-1 text-xs text-muted-foreground bg-muted rounded border border-border">
          Ctrl+S to save
        </kbd>
        <Button variant="ghost" @click="router.back()">
          Cancel
        </Button>
      </div>
    </div>

    <!-- Loading state for edit mode -->
    <PageSkeleton v-if="isEditing && loadingWarehouse" type="form" />

    <!-- Form -->
    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <!-- Basic Information -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Basic Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Code" :error="errors.code" hint="Leave empty for auto-generated code">
            <Input
              v-model="code"
              data-testid="warehouse-code"
              placeholder="e.g., WH-001"
              :disabled="isEditing"
              @blur="validateField('code')"
            />
          </FormField>

          <FormField label="Name" required :error="errors.name">
            <Input
              v-model="name"
              data-testid="warehouse-name"
              placeholder="e.g., Main Warehouse"
              @blur="validateField('name')"
            />
          </FormField>
        </div>
      </Card>

      <!-- Contact Details -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Contact Details</h2>
        </template>

        <div class="space-y-4">
          <FormField label="Address" :error="errors.address">
            <Textarea
              v-model="address"
              data-testid="warehouse-address"
              :rows="3"
              placeholder="Warehouse address"
            />
          </FormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Phone" :error="errors.phone">
              <Input
                v-model="phone"
                placeholder="e.g., 021-1234567"
                @blur="validateField('phone')"
              />
            </FormField>

            <FormField label="Contact Person" :error="errors.contact_person">
              <Input
                v-model="contactPerson"
                placeholder="Person in charge"
                @blur="validateField('contact_person')"
              />
            </FormField>
          </div>
        </div>
      </Card>

      <!-- Settings -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Settings</h2>
        </template>

        <div class="space-y-6">
          <!-- Default Warehouse Toggle -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-foreground">Default Warehouse</h3>
              <p class="text-sm text-muted-foreground">
                Set as default warehouse for new transactions
              </p>
              <p v-if="isDefault && isEditing && existingWarehouse?.is_default" class="text-xs text-amber-600 dark:text-amber-500 mt-1">
                This is currently the default warehouse
              </p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="isDefault"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <!-- Active Status Toggle -->
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-foreground">Active Status</h3>
              <p class="text-sm text-muted-foreground">Inactive warehouses won't appear in lookups</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                v-model="isActive"
                type="checkbox"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <!-- Notes -->
          <FormField label="Notes" :error="errors.notes">
            <Textarea
              v-model="notes"
              :rows="3"
              placeholder="Additional notes about this warehouse"
            />
          </FormField>
        </div>
      </Card>

      <!-- Form Status Indicator -->
      <div v-if="meta.dirty" class="text-sm text-amber-600 dark:text-amber-500">
        You have unsaved changes
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">
          Cancel
        </Button>
        <Button type="submit" data-testid="warehouse-submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Warehouse' : 'Create Warehouse' }}
        </Button>
      </div>
    </form>
  </div>
</template>
