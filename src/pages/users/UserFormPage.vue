<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useUser,
  useCreateUser,
  useUpdateUser,
  useAssignRoles,
  type CreateUserInput,
  type UpdateUserInput,
} from '@/api/useUsers'
import { useAllRoles } from '@/api/useRoles'
import { getErrorMessage } from '@/api/client'
import { userSchema, type UserFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { useFormShortcuts } from '@/composables/useFormShortcuts'
import {
  Button,
  Input,
  FormField,
  Card,
  PageSkeleton,
  useToast,
} from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if editing
const userId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isEditing = computed(() => userId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit User' : 'New User')

// Fetch existing user if editing
const userIdRef = computed(() => userId.value ?? 0)
const { data: existingUser, isLoading: loadingUser } = useUser(userIdRef)

// Role options
const { data: allRoles } = useAllRoles()
const roleOptions = computed(() =>
  (allRoles.value ?? []).map((r) => ({ value: r.id, label: r.display_name }))
)

// Form setup
const { errors, handleSubmit, setValues, setErrors, meta, validateField, defineField } = useForm<UserFormData>({
  validationSchema: toTypedSchema(userSchema),
  initialValues: {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    is_active: true,
    roles: [],
  },
})

const [name] = defineField('name')
const [email] = defineField('email')
const [password] = defineField('password')
const [passwordConfirmation] = defineField('password_confirmation')
const [isActive] = defineField('is_active')
const [roles] = defineField('roles')

// Populate form when editing
watch(existingUser, (user) => {
  if (!user) return
  setValues({
    name: user.name,
    email: user.email,
    password: '',
    password_confirmation: '',
    is_active: !!user.is_active,
    roles: user.roles?.map((r) => r.id) ?? [],
  })
}, { immediate: true })

function toggleRole(roleId: number) {
  const current = roles.value ?? []
  const idx = current.indexOf(roleId)
  if (idx === -1) {
    roles.value = [...current, roleId]
  } else {
    roles.value = current.filter((id) => id !== roleId)
  }
}

// Submit
const createMutation = useCreateUser()
const updateMutation = useUpdateUser()
const assignRolesMutation = useAssignRoles()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value || assignRolesMutation.isPending.value
)

const onSubmit = handleSubmit(async (formValues) => {
  // Password confirmation check (create mode)
  if (!isEditing.value && formValues.password !== formValues.password_confirmation) {
    setErrors({ password_confirmation: 'Passwords do not match' } as any)
    return
  }

  try {
    if (isEditing.value && userId.value) {
      const data: UpdateUserInput = {
        name: formValues.name,
        email: formValues.email,
        is_active: formValues.is_active,
      }
      await updateMutation.mutateAsync({ id: userId.value, data })
      await assignRolesMutation.mutateAsync({ id: userId.value, roles: formValues.roles })
      toast.success('User updated successfully')
      router.push(`/users/${userId.value}`)
    } else {
      const data: CreateUserInput = {
        name: formValues.name,
        email: formValues.email,
        password: formValues.password,
        is_active: formValues.is_active,
        roles: formValues.roles,
      }
      const result = await createMutation.mutateAsync(data)
      toast.success('User created successfully')
      router.push(`/users/${result.id}`)
    }
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    if (error.response?.data?.errors) {
      setServerErrors({ setErrors } as any, error.response.data.errors)
    }
    toast.error(getErrorMessage(err, 'Failed to save user'))
  }
})

useFormShortcuts({
  onSave: async () => { await onSubmit() },
  onCancel: () => router.back(),
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">{{ pageTitle }}</h1>
        <p class="text-muted-foreground">
          {{ isEditing ? 'Update user account information' : 'Create a new user account' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <kbd class="hidden sm:inline-flex px-2 py-1 text-xs text-muted-foreground bg-muted rounded border border-border">
          Ctrl+S to save
        </kbd>
        <Button variant="ghost" @click="router.back()">Cancel</Button>
      </div>
    </div>

    <PageSkeleton v-if="isEditing && loadingUser" type="form" />

    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <!-- Account Information -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Account Information</h2>
        </template>
        <div class="space-y-4">
          <FormField label="Name" required :error="errors.name">
            <Input v-model="name" placeholder="Full name" @blur="validateField('name')" />
          </FormField>

          <FormField label="Email" required :error="errors.email">
            <Input v-model="email" type="email" placeholder="email@example.com" @blur="validateField('email')" />
          </FormField>
        </div>
      </Card>

      <!-- Password (only required on create) -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">
            {{ isEditing ? 'Change Password' : 'Password' }}
          </h2>
        </template>
        <div class="space-y-4">
          <p v-if="isEditing" class="text-sm text-muted-foreground">
            Leave blank to keep the current password. Use the detail page to change password separately.
          </p>
          <FormField
            :label="isEditing ? 'New Password' : 'Password'"
            :required="!isEditing ? true : false"
            :error="errors.password"
          >
            <Input
              v-model="password"
              type="password"
              placeholder="Minimum 8 characters"
              @blur="validateField('password')"
            />
          </FormField>

          <FormField
            label="Confirm Password"
            :required="!isEditing ? true : false"
            :error="errors.password_confirmation"
          >
            <Input
              v-model="passwordConfirmation"
              type="password"
              placeholder="Confirm password"
            />
          </FormField>
        </div>
      </Card>

      <!-- Roles -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Roles</h2>
        </template>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="role in roleOptions"
            :key="role.value"
            type="button"
            class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            :class="(roles ?? []).includes(role.value)
              ? 'bg-primary/10 text-primary border-2 border-primary/30'
              : 'bg-muted text-muted-foreground border-2 border-transparent hover:bg-muted/80'"
            @click="toggleRole(role.value)"
          >
            {{ role.label }}
          </button>
          <p v-if="roleOptions.length === 0" class="text-sm text-muted-foreground">
            No roles available
          </p>
        </div>
      </Card>

      <!-- Settings -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Settings</h2>
        </template>
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-medium text-foreground">Active Status</h3>
            <p class="text-sm text-muted-foreground">Inactive users cannot log in</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="isActive" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </Card>

      <!-- Form status -->
      <div v-if="meta.dirty" class="text-sm text-amber-600 dark:text-amber-500">
        You have unsaved changes
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">Cancel</Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update User' : 'Create User' }}
        </Button>
      </div>
    </form>
  </div>
</template>
