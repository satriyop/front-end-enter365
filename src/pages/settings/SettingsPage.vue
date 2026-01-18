<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import {
  profileUpdateSchema,
  passwordChangeSchema,
  type ProfileUpdateFormData,
  type PasswordChangeFormData,
} from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { Button, Input, FormField, Card, useToast } from '@/components/ui'

const auth = useAuthStore()
const toast = useToast()

// Active tab
const activeTab = ref<'profile' | 'password'>('profile')

// Profile form with VeeValidate
const {
  values: profileValues,
  errors: profileErrors,
  handleSubmit: handleProfileSubmit,
  setErrors: setProfileErrors,
  validateField: validateProfileField,
} = useForm<ProfileUpdateFormData>({
  validationSchema: toTypedSchema(profileUpdateSchema),
  initialValues: {
    name: auth.user?.name || '',
    email: auth.user?.email || '',
  },
})

// Sync profile form when auth user changes
watch(() => auth.user, (user) => {
  if (user) {
    profileValues.name = user.name || ''
    profileValues.email = user.email || ''
  }
}, { immediate: true })

// Password form with VeeValidate
const {
  values: passwordValues,
  errors: passwordErrors,
  handleSubmit: handlePasswordSubmit,
  setErrors: setPasswordErrors,
  resetForm: resetPasswordForm,
  validateField: validatePasswordField,
} = useForm<PasswordChangeFormData>({
  validationSchema: toTypedSchema(passwordChangeSchema),
  initialValues: {
    current_password: '',
    password: '',
    password_confirmation: '',
  },
})

// Update profile mutation
const updateProfileMutation = useMutation({
  mutationFn: async (data: ProfileUpdateFormData) => {
    if (!auth.user?.id) throw new Error('Not authenticated')
    const response = await api.put(`/users/${auth.user.id}`, data)
    return response.data
  },
  onSuccess: async () => {
    await auth.fetchUser()
    toast.success('Profile updated successfully')
  },
  onError: (error: unknown) => {
    const err = error as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
    if (err.response?.data?.errors) {
      setServerErrors({ setErrors: setProfileErrors }, err.response.data.errors)
    }
    toast.error(err.response?.data?.message || 'Failed to update profile')
  },
})

// Update password mutation
const updatePasswordMutation = useMutation({
  mutationFn: async (data: PasswordChangeFormData) => {
    if (!auth.user?.id) throw new Error('Not authenticated')
    const response = await api.post(`/users/${auth.user.id}/password`, data)
    return response.data
  },
  onSuccess: () => {
    resetPasswordForm()
    toast.success('Password updated successfully')
  },
  onError: (error: unknown) => {
    const err = error as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
    if (err.response?.data?.errors) {
      setServerErrors({ setErrors: setPasswordErrors }, err.response.data.errors)
    }
    toast.error(err.response?.data?.message || 'Failed to update password')
  },
})

const onProfileSubmit = handleProfileSubmit((values) => {
  updateProfileMutation.mutate(values)
})

const onPasswordSubmit = handlePasswordSubmit((values) => {
  updatePasswordMutation.mutate(values)
})

const isProfileSaving = computed(() => updateProfileMutation.isPending.value)
const isPasswordSaving = computed(() => updatePasswordMutation.isPending.value)
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
      <p class="text-slate-500 dark:text-slate-400">Manage your account settings</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6">
      <button
        type="button"
        @click="activeTab = 'profile'"
        class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors"
        :class="activeTab === 'profile'
          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'"
      >
        Profile
      </button>
      <button
        type="button"
        @click="activeTab = 'password'"
        class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors"
        :class="activeTab === 'password'
          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'"
      >
        Password
      </button>
    </div>

    <!-- Profile Tab -->
    <form v-if="activeTab === 'profile'" @submit.prevent="onProfileSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Profile Information</h2>
        </template>
        <div class="space-y-4">
          <FormField label="Name" required :error="profileErrors.name">
            <Input
              v-model="profileValues.name"
              placeholder="Your name"
              @blur="validateProfileField('name')"
            />
          </FormField>
          <FormField label="Email" required :error="profileErrors.email">
            <Input
              v-model="profileValues.email"
              type="email"
              placeholder="your@email.com"
              @blur="validateProfileField('email')"
            />
          </FormField>
        </div>
      </Card>

      <!-- Account Info (read-only) -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Account Information</h2>
        </template>
        <div class="space-y-4">
          <div>
            <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Roles</div>
            <div class="mt-1 flex flex-wrap gap-2">
              <span
                v-for="role in auth.user?.roles"
                :key="role.id"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
              >
                {{ role.display_name }}
              </span>
              <span v-if="!auth.user?.roles?.length" class="text-slate-400 dark:text-slate-500">No roles assigned</span>
            </div>
          </div>
          <div>
            <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Account Status</div>
            <div class="mt-1">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="auth.user?.is_active !== false
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'"
              >
                {{ auth.user?.is_active !== false ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
          <div v-if="auth.user?.created_at">
            <div class="text-sm font-medium text-slate-500 dark:text-slate-400">Member Since</div>
            <div class="mt-1 text-slate-900 dark:text-slate-100">
              {{ new Date(auth.user.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) }}
            </div>
          </div>
        </div>
      </Card>

      <div class="flex justify-end">
        <Button type="submit" :loading="isProfileSaving">
          Save Changes
        </Button>
      </div>
    </form>

    <!-- Password Tab -->
    <form v-if="activeTab === 'password'" @submit.prevent="onPasswordSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Change Password</h2>
        </template>
        <div class="space-y-4">
          <FormField label="Current Password" required :error="passwordErrors.current_password">
            <Input
              v-model="passwordValues.current_password"
              type="password"
              placeholder="Enter current password"
              autocomplete="current-password"
              @blur="validatePasswordField('current_password')"
            />
          </FormField>
          <FormField label="New Password" required :error="passwordErrors.password">
            <Input
              v-model="passwordValues.password"
              type="password"
              placeholder="Enter new password"
              autocomplete="new-password"
              @blur="validatePasswordField('password')"
            />
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Must be at least 8 characters</p>
          </FormField>
          <FormField label="Confirm New Password" required :error="passwordErrors.password_confirmation">
            <Input
              v-model="passwordValues.password_confirmation"
              type="password"
              placeholder="Confirm new password"
              autocomplete="new-password"
              @blur="validatePasswordField('password_confirmation')"
            />
          </FormField>
        </div>
      </Card>

      <div class="flex justify-end">
        <Button type="submit" :loading="isPasswordSaving">
          Update Password
        </Button>
      </div>
    </form>
  </div>
</template>
