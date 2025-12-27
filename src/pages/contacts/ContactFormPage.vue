<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useContact,
  useCreateContact,
  useUpdateContact,
  type CreateContactData
} from '@/api/useContacts'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Select,
  Card,
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

// Form state - use strings for form binding, convert to null on submit
interface FormState {
  code: string
  name: string
  type: 'customer' | 'supplier' | 'both'
  email: string
  phone: string
  address: string
  city: string
  province: string
  postal_code: string
  npwp: string
  nik: string
  credit_limit: number
  payment_term_days: number
  is_active: boolean
}

const form = ref<FormState>({
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
})

// Type options
const typeOptions = [
  { value: 'customer', label: 'Customer' },
  { value: 'supplier', label: 'Supplier' },
  { value: 'both', label: 'Both' },
]

// Populate form when editing
watch(existingContact, (contact) => {
  if (contact) {
    form.value = {
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
      credit_limit: contact.credit_limit,
      payment_term_days: contact.payment_term_days,
      is_active: contact.is_active,
    }
  }
}, { immediate: true })

// Form submission
const createMutation = useCreateContact()
const updateMutation = useUpdateContact()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  // Basic validation
  if (!form.value.code.trim()) {
    errors.value.code = 'Code is required'
  }
  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
  }
  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Invalid email format'
  }

  if (Object.keys(errors.value).length > 0) {
    return
  }

  const payload: CreateContactData = {
    code: form.value.code,
    name: form.value.name,
    type: form.value.type,
    email: form.value.email || null,
    phone: form.value.phone || null,
    address: form.value.address || null,
    city: form.value.city || null,
    province: form.value.province || null,
    postal_code: form.value.postal_code || null,
    npwp: form.value.npwp || null,
    nik: form.value.nik || null,
    credit_limit: form.value.credit_limit,
    payment_term_days: form.value.payment_term_days,
    is_active: form.value.is_active,
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
  } catch (err) {
    toast.error('Failed to save contact')
    console.error(err)
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">{{ pageTitle }}</h1>
        <p class="text-slate-500">
          {{ isEditing ? 'Update contact information' : 'Add a new customer or supplier' }}
        </p>
      </div>
      <Button variant="ghost" @click="router.back()">
        Cancel
      </Button>
    </div>

    <!-- Loading state for edit mode -->
    <div v-if="isEditing && loadingContact" class="text-center py-12">
      <div class="text-slate-500">Loading contact...</div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Information -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900">Basic Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Code" required :error="errors.code">
            <Input
              v-model="form.code"
              placeholder="e.g., CUST001"
              :disabled="isEditing"
            />
          </FormField>

          <FormField label="Type" required>
            <Select
              v-model="form.type"
              :options="typeOptions"
            />
          </FormField>

          <FormField label="Name" required :error="errors.name" class="md:col-span-2">
            <Input v-model="form.name" placeholder="Contact or company name" />
          </FormField>

          <FormField label="Email" :error="errors.email">
            <Input v-model="form.email" type="email" placeholder="email@example.com" />
          </FormField>

          <FormField label="Phone">
            <Input v-model="form.phone" placeholder="+62 812 3456 7890" />
          </FormField>
        </div>
      </Card>

      <!-- Address -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900">Address</h2>
        </template>

        <div class="space-y-4">
          <FormField label="Street Address">
            <Textarea
              v-model="form.address"
              :rows="2"
              placeholder="Street address"
            />
          </FormField>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="City">
              <Input v-model="form.city" placeholder="City" />
            </FormField>

            <FormField label="Province">
              <Input v-model="form.province" placeholder="Province" />
            </FormField>

            <FormField label="Postal Code">
              <Input v-model="form.postal_code" placeholder="12345" />
            </FormField>
          </div>
        </div>
      </Card>

      <!-- Tax & Payment -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900">Tax & Payment Terms</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="NPWP">
            <Input v-model="form.npwp" placeholder="00.000.000.0-000.000" />
          </FormField>

          <FormField label="NIK">
            <Input v-model="form.nik" placeholder="16-digit NIK" />
          </FormField>

          <FormField label="Credit Limit">
            <Input
              v-model.number="form.credit_limit"
              type="number"
              min="0"
              step="1000000"
            />
          </FormField>

          <FormField label="Payment Terms (days)">
            <Input
              v-model.number="form.payment_term_days"
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
            <h3 class="font-medium text-slate-900">Active Status</h3>
            <p class="text-sm text-slate-500">Inactive contacts won't appear in lookups</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="form.is_active"
              type="checkbox"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
          </label>
        </div>
      </Card>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">
          Cancel
        </Button>
        <Button type="submit" variant="primary" :loading="isSubmitting">
          {{ isEditing ? 'Update Contact' : 'Create Contact' }}
        </Button>
      </div>
    </form>
  </div>
</template>
