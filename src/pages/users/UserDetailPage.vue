<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useUser,
  useUpdateUser,
  useDeleteUser,
  useToggleUserActive,
  useUpdateUserPassword,
  useAssignRoles,
  type UpdateUserInput,
} from '@/api/useUsers'
import { useAllRoles } from '@/api/useRoles'
import { formatDate, formatDateTime } from '@/utils/format'
import { Button, Card, Badge, Modal, Input, FormField, useToast } from '@/components/ui'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  KeyRound,
  Shield,
  UserCircle,
  Power,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const userId = computed(() => Number(route.params.id))
const { data: user, isLoading, error } = useUser(userId)
const { data: allRoles } = useAllRoles()

// Mutations
const updateMutation = useUpdateUser()
const deleteMutation = useDeleteUser()
const toggleActiveMutation = useToggleUserActive()
const updatePasswordMutation = useUpdateUserPassword()
const assignRolesMutation = useAssignRoles()

// ─────────────────────────────────────────────
// Edit Modal
// ─────────────────────────────────────────────
const showEditModal = ref(false)
const editForm = ref({ name: '', email: '', roles: [] as number[] })
const editErrors = ref<Record<string, string>>({})

function openEditModal() {
  if (!user.value) return
  editForm.value = {
    name: user.value.name,
    email: user.value.email,
    roles: user.value.roles?.map((r) => r.id) ?? [],
  }
  editErrors.value = {}
  showEditModal.value = true
}

function toggleRole(roleId: number) {
  const idx = editForm.value.roles.indexOf(roleId)
  if (idx === -1) {
    editForm.value.roles.push(roleId)
  } else {
    editForm.value.roles.splice(idx, 1)
  }
}

async function handleUpdate() {
  editErrors.value = {}
  if (!editForm.value.name.trim()) editErrors.value.name = 'Name is required'
  if (!editForm.value.email.trim()) editErrors.value.email = 'Email is required'
  if (Object.keys(editErrors.value).length > 0) return

  try {
    const data: UpdateUserInput = {
      name: editForm.value.name,
      email: editForm.value.email,
    }
    await updateMutation.mutateAsync({ id: userId.value, data })
    // Sync roles separately
    await assignRolesMutation.mutateAsync({ id: userId.value, roles: editForm.value.roles })
    showEditModal.value = false
    toast.success('User updated')
  } catch (err: any) {
    const errors = err?.response?.data?.errors || {}
    Object.entries(errors).forEach(([key, msgs]) => {
      const msg = (msgs as string[])[0]
      if (msg) editErrors.value[key] = msg
    })
    toast.error(err?.response?.data?.message || 'Failed to update user')
  }
}

// ─────────────────────────────────────────────
// Change Password Modal
// ─────────────────────────────────────────────
const showPasswordModal = ref(false)
const passwordForm = ref({ password: '', password_confirmation: '' })
const passwordErrors = ref<Record<string, string>>({})

function openPasswordModal() {
  passwordForm.value = { password: '', password_confirmation: '' }
  passwordErrors.value = {}
  showPasswordModal.value = true
}

async function handleUpdatePassword() {
  passwordErrors.value = {}
  if (!passwordForm.value.password) {
    passwordErrors.value.password = 'Password is required'
  } else if (passwordForm.value.password.length < 8) {
    passwordErrors.value.password = 'Password must be at least 8 characters'
  }
  if (passwordForm.value.password !== passwordForm.value.password_confirmation) {
    passwordErrors.value.password_confirmation = 'Passwords do not match'
  }
  if (Object.keys(passwordErrors.value).length > 0) return

  try {
    await updatePasswordMutation.mutateAsync({
      id: userId.value,
      password: passwordForm.value.password,
      password_confirmation: passwordForm.value.password_confirmation,
    })
    showPasswordModal.value = false
    toast.success('Password updated')
  } catch (err: any) {
    const errors = err?.response?.data?.errors || {}
    Object.entries(errors).forEach(([key, msgs]) => {
      const msg = (msgs as string[])[0]
      if (msg) passwordErrors.value[key] = msg
    })
    toast.error(err?.response?.data?.message || 'Failed to update password')
  }
}

// ─────────────────────────────────────────────
// Toggle Active
// ─────────────────────────────────────────────
async function handleToggleActive() {
  if (!user.value) return
  try {
    await toggleActiveMutation.mutateAsync(userId.value)
    toast.success(user.value.is_active ? 'User deactivated' : 'User activated')
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Failed to update status')
  }
}

// ─────────────────────────────────────────────
// Delete Modal
// ─────────────────────────────────────────────
const showDeleteModal = ref(false)

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(userId.value)
    toast.success('User deleted')
    router.push('/users')
  } catch (err: any) {
    toast.error(err?.response?.data?.message || 'Failed to delete user')
  } finally {
    showDeleteModal.value = false
  }
}

// Computed helpers
const roleOptions = computed(() =>
  (allRoles.value ?? []).map((r) => ({ value: r.id, label: r.display_name }))
)
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="flex items-center justify-center gap-2 text-muted-foreground">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading user...</span>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <p class="text-destructive">Failed to load user</p>
      <Button variant="ghost" class="mt-4" @click="router.push('/users')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Users
      </Button>
    </div>

    <template v-else-if="user">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
              {{ user.name.charAt(0).toUpperCase() }}
            </div>
            <div>
              <h1 class="text-2xl font-semibold text-foreground">{{ user.name }}</h1>
              <p class="text-muted-foreground">{{ user.email }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <Badge :variant="user.is_active ? 'success' : 'destructive'">
              {{ user.is_active ? 'Active' : 'Inactive' }}
            </Badge>
            <Badge
              v-for="role in user.roles"
              :key="role.id"
              variant="default"
            >
              {{ role.display_name }}
            </Badge>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="ghost" @click="router.push('/users')">
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="secondary" @click="openEditModal">
            <Pencil class="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="secondary" @click="openPasswordModal">
            <KeyRound class="w-4 h-4 mr-2" />
            Password
          </Button>
          <Button variant="destructive" @click="showDeleteModal = true">
            <Trash2 class="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Column -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Account Information -->
          <Card>
            <template #header>
              <div class="flex items-center gap-2">
                <UserCircle class="w-4 h-4 text-muted-foreground" />
                <h2 class="font-medium text-foreground">Account Information</h2>
              </div>
            </template>
            <dl class="space-y-4">
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Name</dt>
                <dd class="text-foreground">{{ user.name }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Email</dt>
                <dd class="text-foreground">{{ user.email }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Status</dt>
                <dd>
                  <Badge :variant="user.is_active ? 'success' : 'destructive'">
                    {{ user.is_active ? 'Active' : 'Inactive' }}
                  </Badge>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Email Verified</dt>
                <dd>
                  <Badge v-if="user.email_verified_at" variant="success">
                    {{ formatDate(user.email_verified_at) }}
                  </Badge>
                  <span v-else class="text-muted-foreground text-sm">Not verified</span>
                </dd>
              </div>
            </dl>
          </Card>

          <!-- Roles & Permissions -->
          <Card>
            <template #header>
              <div class="flex items-center gap-2">
                <Shield class="w-4 h-4 text-muted-foreground" />
                <h2 class="font-medium text-foreground">Roles & Permissions</h2>
                <Badge variant="default">{{ user.roles?.length ?? 0 }} roles</Badge>
              </div>
            </template>
            <div v-if="user.roles?.length" class="space-y-3">
              <div
                v-for="role in user.roles"
                :key="role.id"
                class="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
              >
                <div>
                  <span class="font-medium text-foreground">{{ role.display_name }}</span>
                  <span class="text-sm text-muted-foreground ml-2 font-mono">{{ role.name }}</span>
                </div>
                <RouterLink :to="`/settings/roles/${role.id}`">
                  <Button variant="ghost" size="xs">View Role</Button>
                </RouterLink>
              </div>
            </div>
            <div v-else class="text-center py-6 text-muted-foreground">
              <p class="text-sm">No roles assigned</p>
              <Button variant="ghost" size="sm" class="mt-2" @click="openEditModal">
                Assign Roles
              </Button>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Details -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Details</h2>
            </template>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Created</dt>
                <dd class="text-foreground">{{ formatDate(user.created_at) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Updated</dt>
                <dd class="text-foreground">{{ formatDateTime(user.updated_at) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Email Verified</dt>
                <dd class="text-foreground">
                  {{ user.email_verified_at ? formatDateTime(user.email_verified_at) : 'Never' }}
                </dd>
              </div>
            </dl>
          </Card>

          <!-- Quick Actions -->
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Quick Actions</h2>
            </template>
            <div class="space-y-2">
              <Button
                variant="secondary"
                class="w-full justify-start"
                :loading="toggleActiveMutation.isPending.value"
                @click="handleToggleActive"
              >
                <Power class="w-4 h-4 mr-2" />
                {{ user.is_active ? 'Deactivate User' : 'Activate User' }}
              </Button>
              <Button
                variant="secondary"
                class="w-full justify-start"
                @click="openPasswordModal"
              >
                <KeyRound class="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </template>

    <!-- Edit Modal -->
    <Modal :open="showEditModal" title="Edit User" @update:open="showEditModal = $event">
      <div class="space-y-4">
        <FormField label="Name" required :error="editErrors.name || ''">
          <Input v-model="editForm.name" placeholder="Full name" />
        </FormField>

        <FormField label="Email" required :error="editErrors.email || ''">
          <Input v-model="editForm.email" type="email" placeholder="email@example.com" />
        </FormField>

        <FormField label="Roles">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="role in roleOptions"
              :key="role.value"
              type="button"
              class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              :class="editForm.roles.includes(role.value)
                ? 'bg-primary/10 text-primary border-2 border-primary/30'
                : 'bg-muted text-muted-foreground border-2 border-transparent hover:bg-muted/80'"
              @click="toggleRole(role.value)"
            >
              {{ role.label }}
            </button>
          </div>
        </FormField>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showEditModal = false">Cancel</Button>
        <Button
          :loading="updateMutation.isPending.value || assignRolesMutation.isPending.value"
          @click="handleUpdate"
        >
          Save Changes
        </Button>
      </template>
    </Modal>

    <!-- Change Password Modal -->
    <Modal :open="showPasswordModal" title="Change Password" size="sm" @update:open="showPasswordModal = $event">
      <p class="text-muted-foreground mb-4">
        Change password for <strong class="text-foreground">{{ user?.name }}</strong>
      </p>
      <div class="space-y-4">
        <FormField label="New Password" required :error="passwordErrors.password || ''">
          <Input v-model="passwordForm.password" type="password" placeholder="Minimum 8 characters" />
        </FormField>
        <FormField label="Confirm Password" required :error="passwordErrors.password_confirmation || ''">
          <Input v-model="passwordForm.password_confirmation" type="password" placeholder="Confirm password" />
        </FormField>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showPasswordModal = false">Cancel</Button>
        <Button :loading="updatePasswordMutation.isPending.value" @click="handleUpdatePassword">
          Update Password
        </Button>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete User" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-muted-foreground">
        Are you sure you want to delete <strong class="text-foreground">{{ user?.name }}</strong>?
        This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
