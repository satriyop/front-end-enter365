<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useRole,
  useCreateRole,
  useUpdateRole,
  type StoreRoleRequest,
} from '@/api/useRoles'
import { getErrorMessage } from '@/api/client'
import { roleSchema, type RoleFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { useFormShortcuts } from '@/composables/useFormShortcuts'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Card,
  PageSkeleton,
  useToast,
} from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if we're editing
const roleId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})

const isEditing = computed(() => roleId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Role' : 'New Role')

// Fetch existing role if editing
const roleIdRef = computed(() => roleId.value ?? 0)
const { data: existingRole, isLoading: loadingRole } = useRole(roleIdRef)

// Form with Zod validation
const { errors, handleSubmit, setValues, setErrors, meta, validateField, defineField } = useForm<RoleFormData>({
  validationSchema: toTypedSchema(roleSchema),
  initialValues: {
    name: '',
    display_name: '',
    description: '',
  },
})

const [name] = defineField('name')
const [displayName] = defineField('display_name')
const [description] = defineField('description')

// Populate form when editing
watch(existingRole, (role) => {
  if (role) {
    setValues({
      name: role.name,
      display_name: role.display_name,
      description: role.description || '',
    })
  }
}, { immediate: true })

// Redirect if trying to edit a system role
watch(existingRole, (role) => {
  if (role?.is_system) {
    toast.error('System roles cannot be edited')
    router.replace(`/settings/roles/${role.id}`)
  }
}, { immediate: true })

// Form submission
const createMutation = useCreateRole()
const updateMutation = useUpdateRole()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

const onSubmit = handleSubmit(async (formValues) => {
  const payload: StoreRoleRequest = {
    name: formValues.name,
    display_name: formValues.display_name,
    description: formValues.description || null,
  }

  try {
    if (isEditing.value && roleId.value) {
      await updateMutation.mutateAsync({ id: roleId.value, data: payload })
      toast.success('Role updated successfully')
      router.push(`/settings/roles/${roleId.value}`)
    } else {
      const result = await createMutation.mutateAsync(payload)
      toast.success('Role created successfully')
      router.push(`/settings/roles/${result.id}`)
    }
  } catch (err: unknown) {
    const error = err as { validationErrors?: Record<string, string[]> }
    if (error.validationErrors) {
      setServerErrors({ setErrors } as any, error.validationErrors)
    }
    toast.error(getErrorMessage(err, 'Failed to save role'))
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
          {{ isEditing ? 'Update role information' : 'Create a new role for permission management' }}
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
    <PageSkeleton v-if="isEditing && loadingRole" type="form" />

    <!-- Form -->
    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <!-- Basic Information -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Role Information</h2>
        </template>

        <div class="space-y-4">
          <FormField label="Display Name" required :error="errors.display_name">
            <Input
              v-model="displayName"
              placeholder="e.g., Sales Manager"
              @blur="validateField('display_name')"
            />
          </FormField>

          <FormField
            label="Slug"
            required
            :error="errors.name"
            hint="Unique identifier used in code. Use lowercase with hyphens."
          >
            <Input
              v-model="name"
              placeholder="e.g., sales-manager"
              :disabled="isEditing"
              @blur="validateField('name')"
            />
          </FormField>

          <FormField label="Description" :error="errors.description">
            <Textarea
              v-model="description"
              :rows="3"
              placeholder="Describe what this role is for..."
            />
          </FormField>
        </div>
      </Card>

      <p class="text-sm text-muted-foreground">
        After creating the role, you can assign permissions from its detail page.
      </p>

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
          {{ isEditing ? 'Update Role' : 'Create Role' }}
        </Button>
      </div>
    </form>
  </div>
</template>
