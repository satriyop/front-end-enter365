<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useContact,
  useCreateContact,
  useUpdateContact,
  type CreateContactData
} from '@/api/useContacts'
import { getErrorMessage } from '@/api/client'
import { toNumber } from '@/utils/format'
import { contactSchema, type ContactFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { useFormShortcuts } from '@/composables/useFormShortcuts'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Select,
  Card,
  PageSkeleton,
  useToast
} from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if we're editing
const contactId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => contactId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Contact' : 'New Contact')

// Fetch existing contact if editing
const contactIdRef = computed(() => contactId.value ?? 0)
const { data: existingContact, isLoading: loadingContact } = useContact(contactIdRef)

// Form with Zod validation
const { values: form, errors, handleSubmit, setValues, setErrors, meta, validateField, defineField } = useForm<ContactFormData>({
  validationSchema: toTypedSchema(contactSchema),
  initialValues: {
    code: '',
    name: '',
    type: 'customer',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    npwp: '',
    nik: '',
    credit_limit: 0,
    payment_term_days: 30,
    is_active: true,
  },
})

const [code] = defineField('code')
const [name] = defineField('name')
const [type] = defineField('type')
const [email] = defineField('email')
const [phone] = defineField('phone')
const [address] = defineField('address')
const [city] = defineField('city')
const [province] = defineField('province')
const [postalCode] = defineField('postal_code')
const [npwp] = defineField('npwp')
const [nik] = defineField('nik')
const [creditLimit] = defineField('credit_limit')
const [paymentTermDays] = defineField('payment_term_days')
const [isActive] = defineField('is_active')

// Type options
const typeOptions = [
  { value: 'customer', label: 'Customer' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'both', label: 'Both' },
]

// Populate form when editing
watch(existingContact, (contact) => {
  if (contact) {
    setValues({
      code: contact.code,
      name: contact.name,
      type: contact.type as 'customer' | 'supplier' | 'both',
      email: contact.email || '',
      phone: contact.phone || '',
      address: contact.address || '',
      city: contact.city || '',
      province: contact.province || '',
      postal_code: contact.postal_code || '',
      npwp: contact.npwp || '',
      nik: contact.nik || '',
      credit_limit: toNumber(contact.credit_limit),
      payment_term_days: toNumber(contact.payment_term_days),
      is_active: !!contact.is_active,
    })
  }
}, { immediate: true })

// Form submission
const createMutation = useCreateContact()
const updateMutation = useUpdateContact()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const onSubmit = handleSubmit(async (formValues) => {
  const payload: CreateContactData = {
    code: formValues.code,
    name: formValues.name,
    type: formValues.type,
    email: formValues.email || null,
    phone: formValues.phone || null,
    address: formValues.address || null,
    city: formValues.city || null,
    province: formValues.province || null,
    postal_code: formValues.postal_code || null,
    npwp: formValues.npwp || null,
    nik: formValues.nik || null,
    credit_limit: formValues.credit_limit ?? 0,
    payment_term_days: formValues.payment_term_days ?? 30,
    is_active: formValues.is_active ?? true,
  }

  try {
    if (isEditing.value && contactId.value) {
      await updateMutation.mutateAsync({ id: contactId.value, data: payload })
      toast.success('Contact updated successfully')
      router.push(`/contacts/${contactId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload)
      toast.success('Contact created successfully')
      router.push(`/contacts/${result.id}`)
    }
  } catch (err: unknown) {
    // Handle server validation errors
    const error = err as { validationErrors?: Record<string, string[]> }
    if (error.validationErrors) {
      setServerErrors({ setErrors } as any, error.validationErrors)
    }
    toast.error(getErrorMessage(err, 'Failed to save contact'))
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
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
        <p class="text-slate-500 dark:text-slate-400">
          {{ isEditing ? 'Update contact information' : 'Add a new customer or supplier' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <kbd class="hidden sm:inline-flex px-2 py-1 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-600">
          Ctrl+S to save
        </kbd>
        <Button variant="ghost" @click="router.back()">
          Cancel
        </Button>
      </div>
    </div>

    <!-- Loading state for edit mode -->
    <PageSkeleton v-if="isEditing && loadingContact" type="form" />

    <!-- Form -->
    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <!-- Basic Information -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Basic Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Code" required :error="errors.code">
            <Input
              v-model="code"
              placeholder="e.g., CUST001"
              :disabled="isEditing"
              @blur="validateField('code')"
            />
          </FormField>

          <FormField label="Type" required :error="errors.type">
            <Select
              v-model="type"
              :options="typeOptions"
              @blur="validateField('type')"
            />
          </FormField>

          <FormField label="Name" required :error="errors.name" class="md:col-span-2">
            <Input
              v-model="name"
              placeholder="Contact or company name"
              @blur="validateField('name')"
            />
          </FormField>

          <FormField label="Email" :error="errors.email">
            <Input
              v-model="email"
              type="email"
              placeholder="email@example.com"
              @blur="validateField('email')"
            />
          </FormField>

          <FormField label="Phone" :error="errors.phone">
            <Input
              v-model="phone"
              placeholder="08123456789"
              @blur="validateField('phone')"
            />
          </FormField>
        </div>
      </Card>

      <!-- Address -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Address</h2>
        </template>

        <div class="space-y-4">
          <FormField label="Street Address" :error="errors.address">
            <Textarea
              v-model="address"
              :rows="2"
              placeholder="Street address"
            />
          </FormField>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="City" :error="errors.city">
              <Input v-model="city" placeholder="City" />
            </FormField>

            <FormField label="Province" :error="errors.province">
              <Input v-model="province" placeholder="Province" />
            </FormField>

            <FormField label="Postal Code" :error="errors.postal_code">
              <Input v-model="postalCode" placeholder="12345" />
            </FormField>
          </div>
        </div>
      </Card>

      <!-- Tax & Payment -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Tax & Payment Terms</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="NPWP" :error="errors.npwp">
            <Input
              v-model="npwp"
              placeholder="00.000.000.0-000.000"
              @blur="validateField('npwp')"
            />
          </FormField>

          <FormField label="NIK" :error="errors.nik">
            <Input
              v-model="nik"
              placeholder="16-digit NIK"
              @blur="validateField('nik')"
            />
          </FormField>

          <FormField label="Credit Limit" :error="errors.credit_limit">
            <Input
              v-model.number="creditLimit"
              type="number"
              min="0"
              step="1000000"
            />
          </FormField>

          <FormField label="Payment Terms (days)" :error="errors.payment_term_days">
            <Input
              v-model.number="paymentTermDays"
              type="number"
              min="0"
            />
          </FormField>
        </div>
      </Card>

      <!-- Status -->
      <Card>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-slate-900 dark:text-slate-100">Active Status</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">Inactive contacts won't appear in lookups</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="isActive"
              type="checkbox"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-300 after:border-slate-300 dark:after:border-slate-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
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
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Contact' : 'Create Contact' }}
        </Button>
      </div>
    </form>
  </div>
</template>
