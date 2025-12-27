<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useUsers,
  useRoles,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useToggleUserActive,
  useUpdateUserPassword,
  type UserFilters,
  type User,
} from '@/api/useUsers'
import { formatDate } from '@/utils/format'
import { Button, Input, Select, Badge, Modal, FormField, Pagination, EmptyState, useToast } from '@/components/ui'

const toast = useToast()

// Filters
const filters = ref<UserFilters>({
  page: 1,
  per_page: 15,
  search: '',
})

const { data, isLoading, error } = useUsers(filters)
const { data: roles } = useRoles()

const users = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

// Mutations
const createMutation = useCreateUser()
const updateMutation = useUpdateUser()
const deleteMutation = useDeleteUser()
const toggleActiveMutation = useToggleUserActive()
const updatePasswordMutation = useUpdateUserPassword()

// Modal states
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showPasswordModal = ref(false)
const selectedUser = ref<User | null>(null)

// Form state
const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  is_active: true,
  roles: [] as number[],
})

const passwordForm = ref({
  password: '',
  password_confirmation: '',
})

const formErrors = ref<Record<string, string>>({})

// Computed for role options
const roleOptions = computed(() => {
  return (roles.value ?? []).map(r => ({
    value: r.id,
    label: r.display_name,
  }))
})

function handlePageChange(page: number) {
  filters.value.page = page
}

function handleSearch(value: string | number) {
  filters.value.search = String(value)
  filters.value.page = 1
}

function handleStatusFilter(value: string | number | null) {
  const strValue = String(value ?? '')
  if (strValue === '') {
    filters.value.is_active = undefined
  } else {
    filters.value.is_active = strValue === 'true'
  }
  filters.value.page = 1
}

// Open create modal
function openCreateModal() {
  form.value = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    is_active: true,
    roles: [],
  }
  formErrors.value = {}
  showCreateModal.value = true
}

// Open edit modal
function openEditModal(user: User) {
  selectedUser.value = user
  form.value = {
    name: user.name,
    email: user.email,
    password: '',
    password_confirmation: '',
    is_active: user.is_active,
    roles: user.roles?.map(r => r.id) ?? [],
  }
  formErrors.value = {}
  showEditModal.value = true
}

// Open delete modal
function openDeleteModal(user: User) {
  selectedUser.value = user
  showDeleteModal.value = true
}

// Open password modal
function openPasswordModal(user: User) {
  selectedUser.value = user
  passwordForm.value = { password: '', password_confirmation: '' }
  formErrors.value = {}
  showPasswordModal.value = true
}

// Validate create form
function validateCreateForm(): boolean {
  formErrors.value = {}

  if (!form.value.name.trim()) {
    formErrors.value.name = 'Name is required'
  }
  if (!form.value.email.trim()) {
    formErrors.value.email = 'Email is required'
  }
  if (!form.value.password) {
    formErrors.value.password = 'Password is required'
  } else if (form.value.password.length < 8) {
    formErrors.value.password = 'Password must be at least 8 characters'
  }
  if (form.value.password !== form.value.password_confirmation) {
    formErrors.value.password_confirmation = 'Passwords do not match'
  }

  return Object.keys(formErrors.value).length === 0
}

// Validate edit form
function validateEditForm(): boolean {
  formErrors.value = {}

  if (!form.value.name.trim()) {
    formErrors.value.name = 'Name is required'
  }
  if (!form.value.email.trim()) {
    formErrors.value.email = 'Email is required'
  }

  return Object.keys(formErrors.value).length === 0
}

// Validate password form
function validatePasswordForm(): boolean {
  formErrors.value = {}

  if (!passwordForm.value.password) {
    formErrors.value.password = 'Password is required'
  } else if (passwordForm.value.password.length < 8) {
    formErrors.value.password = 'Password must be at least 8 characters'
  }
  if (passwordForm.value.password !== passwordForm.value.password_confirmation) {
    formErrors.value.password_confirmation = 'Passwords do not match'
  }

  return Object.keys(formErrors.value).length === 0
}

// Handle create
async function handleCreate() {
  if (!validateCreateForm()) return

  try {
    await createMutation.mutateAsync({
      name: form.value.name,
      email: form.value.email,
      password: form.value.password,
      is_active: form.value.is_active,
      roles: form.value.roles,
    })
    showCreateModal.value = false
    toast.success('User created successfully')
  } catch (err: any) {
    const errors = err?.response?.data?.errors || {}
    Object.entries(errors).forEach(([key, msgs]) => {
      const msg = (msgs as string[])[0]
      if (msg) formErrors.value[key] = msg
    })
    toast.error(err?.response?.data?.message || 'Failed to create user')
  }
}

// Handle update
async function handleUpdate() {
  if (!validateEditForm() || !selectedUser.value) return

  try {
    await updateMutation.mutateAsync({
      id: selectedUser.value.id,
      data: {
        name: form.value.name,
        email: form.value.email,
        is_active: form.value.is_active,
        roles: form.value.roles,
      },
    })
    showEditModal.value = false
    toast.success('User updated successfully')
  } catch (err: any) {
    const errors = err?.response?.data?.errors || {}
    Object.entries(errors).forEach(([key, msgs]) => {
      const msg = (msgs as string[])[0]
      if (msg) formErrors.value[key] = msg
    })
    toast.error(err?.response?.data?.message || 'Failed to update user')
  }
}

// Handle delete
async function handleDelete() {
  if (!selectedUser.value) return

  try {
    await deleteMutation.mutateAsync(selectedUser.value.id)
    showDeleteModal.value = false
    toast.success('User deleted successfully')
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Failed to delete user')
  }
}

// Handle toggle active
async function handleToggleActive(user: User) {
  try {
    await toggleActiveMutation.mutateAsync(user.id)
    toast.success(user.is_active ? 'User deactivated' : 'User activated')
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Failed to update user status')
  }
}

// Handle password update
async function handleUpdatePassword() {
  if (!validatePasswordForm() || !selectedUser.value) return

  try {
    await updatePasswordMutation.mutateAsync({
      id: selectedUser.value.id,
      password: passwordForm.value.password,
      password_confirmation: passwordForm.value.password_confirmation,
    })
    showPasswordModal.value = false
    toast.success('Password updated successfully')
  } catch (err: any) {
    const errors = err?.response?.data?.errors || {}
    Object.entries(errors).forEach(([key, msgs]) => {
      const msg = (msgs as string[])[0]
      if (msg) formErrors.value[key] = msg
    })
    toast.error(err?.response?.data?.message || 'Failed to update password')
  }
}

// Toggle role selection
function toggleRole(roleId: number) {
  const index = form.value.roles.indexOf(roleId)
  if (index === -1) {
    form.value.roles.push(roleId)
  } else {
    form.value.roles.splice(index, 1)
  }
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Users</h1>
        <p class="text-slate-500">Manage user accounts and roles</p>
      </div>
      <Button variant="primary" @click="openCreateModal">
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New User
      </Button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search users..."
            @update:model-value="handleSearch"
          />
        </div>
        <div class="w-48">
          <Select
            :model-value="filters.is_active === undefined ? '' : String(filters.is_active)"
            :options="statusOptions"
            placeholder="All Status"
            @update:model-value="handleStatusFilter"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <p class="text-red-500">Failed to load users</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="users.length === 0" class="bg-white rounded-xl border border-slate-200">
      <EmptyState
        title="No users found"
        description="Create a new user to get started"
        action-label="New User"
        @action="openCreateModal"
      />
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              User
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Email
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Roles
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Created
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <div class="font-medium text-slate-900">{{ user.name }}</div>
              </div>
            </td>
            <td class="px-6 py-4 text-slate-600">
              {{ user.email }}
            </td>
            <td class="px-6 py-4">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="role in user.roles"
                  :key="role.id"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700"
                >
                  {{ role.display_name }}
                </span>
                <span v-if="!user.roles?.length" class="text-slate-400">No roles</span>
              </div>
            </td>
            <td class="px-6 py-4">
              <Badge :variant="user.is_active ? 'success' : 'error'">
                {{ user.is_active ? 'Active' : 'Inactive' }}
              </Badge>
            </td>
            <td class="px-6 py-4 text-slate-500">
              {{ formatDate(user.created_at) }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex justify-end gap-1">
                <Button variant="ghost" size="xs" @click="openEditModal(user)">
                  Edit
                </Button>
                <Button variant="ghost" size="xs" @click="openPasswordModal(user)">
                  Password
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  :class="user.is_active ? 'text-orange-600' : 'text-green-600'"
                  :loading="toggleActiveMutation.isPending.value"
                  @click="handleToggleActive(user)"
                >
                  {{ user.is_active ? 'Deactivate' : 'Activate' }}
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  class="text-red-500"
                  @click="openDeleteModal(user)"
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200">
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :per-page="pagination.per_page"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Create Modal -->
    <Modal :open="showCreateModal" title="Create User" size="md" @update:open="showCreateModal = $event">
      <div class="space-y-4">
        <FormField label="Name" required :error="formErrors.name || ''">
          <Input v-model="form.name" placeholder="Full name" />
        </FormField>

        <FormField label="Email" required :error="formErrors.email || ''">
          <Input v-model="form.email" type="email" placeholder="email@example.com" />
        </FormField>

        <FormField label="Password" required :error="formErrors.password || ''">
          <Input v-model="form.password" type="password" placeholder="Minimum 8 characters" />
        </FormField>

        <FormField label="Confirm Password" required :error="formErrors.password_confirmation || ''">
          <Input v-model="form.password_confirmation" type="password" placeholder="Confirm password" />
        </FormField>

        <FormField label="Roles">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="role in roleOptions"
              :key="role.value"
              type="button"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              :class="form.roles.includes(role.value)
                ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'"
              @click="toggleRole(role.value)"
            >
              {{ role.label }}
            </button>
          </div>
        </FormField>

        <FormField label="Status">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="form.is_active"
              type="checkbox"
              class="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
            <span class="text-sm text-slate-700">Active</span>
          </label>
        </FormField>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showCreateModal = false">Cancel</Button>
        <Button variant="primary" :loading="createMutation.isPending.value" @click="handleCreate">
          Create User
        </Button>
      </template>
    </Modal>

    <!-- Edit Modal -->
    <Modal :open="showEditModal" title="Edit User" size="md" @update:open="showEditModal = $event">
      <div class="space-y-4">
        <FormField label="Name" required :error="formErrors.name || ''">
          <Input v-model="form.name" placeholder="Full name" />
        </FormField>

        <FormField label="Email" required :error="formErrors.email || ''">
          <Input v-model="form.email" type="email" placeholder="email@example.com" />
        </FormField>

        <FormField label="Roles">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="role in roleOptions"
              :key="role.value"
              type="button"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              :class="form.roles.includes(role.value)
                ? 'bg-orange-100 text-orange-700 border-2 border-orange-300'
                : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:bg-slate-200'"
              @click="toggleRole(role.value)"
            >
              {{ role.label }}
            </button>
          </div>
        </FormField>

        <FormField label="Status">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="form.is_active"
              type="checkbox"
              class="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
            <span class="text-sm text-slate-700">Active</span>
          </label>
        </FormField>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showEditModal = false">Cancel</Button>
        <Button variant="primary" :loading="updateMutation.isPending.value" @click="handleUpdate">
          Save Changes
        </Button>
      </template>
    </Modal>

    <!-- Password Modal -->
    <Modal :open="showPasswordModal" title="Change Password" size="sm" @update:open="showPasswordModal = $event">
      <p class="text-slate-600 mb-4">
        Change password for <strong>{{ selectedUser?.name }}</strong>
      </p>

      <div class="space-y-4">
        <FormField label="New Password" required :error="formErrors.password || ''">
          <Input v-model="passwordForm.password" type="password" placeholder="Minimum 8 characters" />
        </FormField>

        <FormField label="Confirm Password" required :error="formErrors.password_confirmation || ''">
          <Input v-model="passwordForm.password_confirmation" type="password" placeholder="Confirm password" />
        </FormField>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showPasswordModal = false">Cancel</Button>
        <Button variant="primary" :loading="updatePasswordMutation.isPending.value" @click="handleUpdatePassword">
          Update Password
        </Button>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete User" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600">
        Are you sure you want to delete <strong>{{ selectedUser?.name }}</strong>? This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="danger" :loading="deleteMutation.isPending.value" @click="handleDelete">
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
