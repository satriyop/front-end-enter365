<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { Button, Input, FormField, Card, useToast } from '@/components/ui'

const auth = useAuthStore()
const toast = useToast()

// Active tab
const activeTab = ref<'profile' | 'password'>('profile')

// Profile form
const profileForm = ref({
  name: auth.user?.name || '',
  email: auth.user?.email || '',
})

// Password form
const passwordForm = ref({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const profileErrors = ref<Record<string, string>>({})
const passwordErrors = ref<Record<string, string>>({})

// Update profile mutation
const updateProfileMutation = useMutation({
  mutationFn: async (data: { name: string; email: string }) => {
    if (!auth.user?.id) throw new Error('Not authenticated')
    const response = await api.put(`/users/${auth.user.id}`, data)
    return response.data
  },
  onSuccess: async () => {
    await auth.fetchUser()
    toast.success('Profile updated successfully')
  },
  onError: (error: any) => {
    const errors = error?.response?.data?.errors || {}
    const errorsMap: Record<string, string> = {}
    Object.entries(errors).forEach(([key, msgs]) => {
      const msg = (msgs as string[])[0]
      if (msg) errorsMap[key] = msg
    })
    profileErrors.value = errorsMap
    toast.error(error?.response?.data?.message || 'Failed to update profile')
  },
})

// Update password mutation
const updatePasswordMutation = useMutation({
  mutationFn: async (data: { current_password: string; password: string; password_confirmation: string }) => {
    if (!auth.user?.id) throw new Error('Not authenticated')
    const response = await api.post(`/users/${auth.user.id}/password`, data)
    return response.data
  },
  onSuccess: () => {
    passwordForm.value = {
      current_password: '',
      password: '',
      password_confirmation: '',
    }
    toast.success('Password updated successfully')
  },
  onError: (error: any) => {
    const errs = error?.response?.data?.errors || {}
    const errorsMap: Record<string, string> = {}
    Object.entries(errs).forEach(([key, msgs]) => {
      const msg = (msgs as string[])[0]
      if (msg) errorsMap[key] = msg
    })
    passwordErrors.value = errorsMap
    toast.error(error?.response?.data?.message || 'Failed to update password')
  },
})

function handleProfileSubmit() {
  profileErrors.value = {}

  if (!profileForm.value.name.trim()) {
    profileErrors.value.name = 'Name is required'
    return
  }
  if (!profileForm.value.email.trim()) {
    profileErrors.value.email = 'Email is required'
    return
  }

  updateProfileMutation.mutate({
    name: profileForm.value.name,
    email: profileForm.value.email,
  })
}

function handlePasswordSubmit() {
  passwordErrors.value = {}

  if (!passwordForm.value.current_password) {
    passwordErrors.value.current_password = 'Current password is required'
  }
  if (!passwordForm.value.password) {
    passwordErrors.value.password = 'New password is required'
  }
  if (passwordForm.value.password.length < 8) {
    passwordErrors.value.password = 'Password must be at least 8 characters'
  }
  if (passwordForm.value.password !== passwordForm.value.password_confirmation) {
    passwordErrors.value.password_confirmation = 'Passwords do not match'
  }

  if (Object.keys(passwordErrors.value).length > 0) return

  updatePasswordMutation.mutate({
    current_password: passwordForm.value.current_password,
    password: passwordForm.value.password,
    password_confirmation: passwordForm.value.password_confirmation,
  })
}

const isProfileSaving = computed(() => updateProfileMutation.isPending.value)
const isPasswordSaving = computed(() => updatePasswordMutation.isPending.value)
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900">Settings</h1>
      <p class="text-slate-500">Manage your account settings</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 p-1 bg-slate-100 rounded-lg mb-6">
      <button
        type="button"
        @click="activeTab = 'profile'"
        class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors"
        :class="activeTab === 'profile'
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:text-slate-900'"
      >
        Profile
      </button>
      <button
        type="button"
        @click="activeTab = 'password'"
        class="flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors"
        :class="activeTab === 'password'
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-600 hover:text-slate-900'"
      >
        Password
      </button>
    </div>

    <!-- Profile Tab -->
    <form v-if="activeTab === 'profile'" @submit.prevent="handleProfileSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900">Profile Information</h2>
        </template>
        <div class="space-y-4">
          <FormField label="Name" required :error="profileErrors.name">
            <Input v-model="profileForm.name" placeholder="Your name" />
          </FormField>
          <FormField label="Email" required :error="profileErrors.email">
            <Input v-model="profileForm.email" type="email" placeholder="your@email.com" />
          </FormField>
        </div>
      </Card>

      <!-- Account Info (read-only) -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900">Account Information</h2>
        </template>
        <div class="space-y-4">
          <div>
            <div class="text-sm font-medium text-slate-500">Roles</div>
            <div class="mt-1 flex flex-wrap gap-2">
              <span
                v-for="role in auth.user?.roles"
                :key="role.id"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
              >
                {{ role.display_name }}
              </span>
              <span v-if="!auth.user?.roles?.length" class="text-slate-400">No roles assigned</span>
            </div>
          </div>
          <div>
            <div class="text-sm font-medium text-slate-500">Account Status</div>
            <div class="mt-1">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="auth.user?.is_active !== false
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'"
              >
                {{ auth.user?.is_active !== false ? 'Active' : 'Inactive' }}
              </span>
            </div>
          </div>
          <div v-if="auth.user?.created_at">
            <div class="text-sm font-medium text-slate-500">Member Since</div>
            <div class="mt-1 text-slate-900">
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
    <form v-if="activeTab === 'password'" @submit.prevent="handlePasswordSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900">Change Password</h2>
        </template>
        <div class="space-y-4">
          <FormField label="Current Password" required :error="passwordErrors.current_password">
            <Input
              v-model="passwordForm.current_password"
              type="password"
              placeholder="Enter current password"
              autocomplete="current-password"
            />
          </FormField>
          <FormField label="New Password" required :error="passwordErrors.password">
            <Input
              v-model="passwordForm.password"
              type="password"
              placeholder="Enter new password"
              autocomplete="new-password"
            />
            <p class="text-xs text-slate-500 mt-1">Must be at least 8 characters</p>
          </FormField>
          <FormField label="Confirm New Password" required :error="passwordErrors.password_confirmation">
            <Input
              v-model="passwordForm.password_confirmation"
              type="password"
              placeholder="Confirm new password"
              autocomplete="new-password"
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
