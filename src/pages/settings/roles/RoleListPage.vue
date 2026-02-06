<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  useRoles,
  useDeleteRole,
  type Role,
  type RoleFilters,
} from '@/api/useRoles'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Pagination, EmptyState, Modal, Badge, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Trash2, Eye, Pencil, Plus, Shield } from 'lucide-vue-next'

const toast = useToast()

// Resource list with filters and pagination
const {
  items: roles,
  pagination,
  isLoading,
  error,
  filters,
  updateFilter,
  goToPage,
  deleteConfirmation,
} = useResourceList<Role, RoleFilters>({
  resourceName: 'role',
  useListHook: useRoles,
  initialFilters: {
    page: 1,
    per_page: 15,
    search: '',
  },
})

// Delete handling
const deleteMutation = useDeleteRole()
const roleToDelete = ref<{ id: number; name: string } | null>(null)

function confirmDelete(role: Role) {
  if (role.is_system) return
  roleToDelete.value = { id: role.id, name: role.display_name }
  deleteConfirmation.confirmDelete(role.id)
}

async function handleDelete() {
  const id = deleteConfirmation.executeDelete()
  if (id === null) return
  try {
    await deleteMutation.mutateAsync(id as number)
    roleToDelete.value = null
    toast.success('Role deleted')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete role'
    toast.error(message)
  }
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'display_name', label: 'Name', mobilePriority: 1 },
  { key: 'name', label: 'Slug', showInMobile: false },
  { key: 'permissions_count', label: 'Permissions', align: 'center', mobilePriority: 2 },
  { key: 'users_count', label: 'Users', align: 'center', showInMobile: false },
  { key: 'is_system', label: 'Type', align: 'center', showInMobile: false },
]
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Roles</h1>
        <p class="text-muted-foreground">Manage user roles and permissions</p>
      </div>
      <RouterLink to="/settings/roles/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Role
        </Button>
      </RouterLink>
    </div>

    <!-- Info Banner -->
    <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div class="flex items-start gap-3">
        <Shield class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <h4 class="font-medium text-blue-900 dark:text-blue-100">About Roles</h4>
          <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Roles group permissions that control what users can access. System roles cannot be deleted.
            Assign permissions to a role from its detail page.
          </p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-card rounded-xl border border-border p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search roles..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-card rounded-xl border border-border p-8 text-center">
      <p class="text-destructive">Failed to load roles</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="bg-card rounded-xl border border-border p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-muted-foreground">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="roles.length === 0" class="bg-card rounded-xl border border-border">
      <EmptyState
        title="No roles found"
        description="Create a role to start managing permissions"
        action-label="New Role"
        @action="$router.push('/settings/roles/new')"
      />
    </div>

    <!-- Data Table -->
    <div v-else class="bg-card rounded-xl border border-border overflow-hidden">
      <ResponsiveTable
        :items="roles"
        :columns="columns"
        :loading="isLoading"
        title-field="display_name"
        subtitle-field="name"
        @row-click="(item) => $router.push(`/settings/roles/${item.id}`)"
      >
        <!-- Custom cell: Display Name -->
        <template #cell-display_name="{ item }">
          <span class="text-primary hover:text-primary/80 font-medium">
            {{ item.display_name }}
          </span>
          <div v-if="item.description" class="text-xs text-muted-foreground truncate max-w-[300px]">
            {{ item.description }}
          </div>
        </template>

        <!-- Custom cell: Slug -->
        <template #cell-name="{ item }">
          <span class="font-mono text-sm text-muted-foreground">{{ item.name }}</span>
        </template>

        <!-- Custom cell: Permissions count -->
        <template #cell-permissions_count="{ item }">
          <span class="text-sm text-foreground">{{ item.permissions_count ?? 0 }}</span>
        </template>

        <!-- Custom cell: Users count -->
        <template #cell-users_count="{ item }">
          <span class="text-sm text-foreground">{{ item.users_count ?? 0 }}</span>
        </template>

        <!-- Custom cell: Type -->
        <template #cell-is_system="{ item }">
          <Badge v-if="item.is_system" variant="warning">System</Badge>
          <Badge v-else variant="default">Custom</Badge>
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="text-primary font-medium">
            {{ item.display_name }}
          </span>
        </template>

        <!-- Mobile status slot -->
        <template #mobile-status="{ item }">
          <Badge v-if="item.is_system" variant="warning">System</Badge>
          <span v-else class="text-xs text-muted-foreground">{{ item.permissions_count ?? 0 }} permissions</span>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <RouterLink :to="`/settings/roles/${item.id}`">
              <Button variant="ghost" size="xs" title="View Details">
                <Eye class="w-4 h-4" />
              </Button>
            </RouterLink>
            <RouterLink :to="`/settings/roles/${item.id}/edit`">
              <Button variant="ghost" size="xs" title="Edit" :disabled="item.is_system">
                <Pencil class="w-4 h-4" />
              </Button>
            </RouterLink>
            <Button
              variant="ghost"
              size="xs"
              class="text-destructive hover:text-destructive/80"
              title="Delete"
              :disabled="item.is_system"
              @click.stop="confirmDelete(item)"
            >
              <Trash2 class="w-4 h-4" />
            </Button>
          </div>
        </template>
      </ResponsiveTable>

      <!-- Pagination -->
      <div v-if="pagination" class="px-6 py-4 border-t border-border">
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :per-page="pagination.per_page"
          @page-change="goToPage"
        />
      </div>
    </div>

    <!-- Delete Modal -->
    <Modal :open="deleteConfirmation.showModal.value" title="Delete Role" size="sm" @update:open="deleteConfirmation.showModal.value = $event">
      <p class="text-muted-foreground">
        Are you sure you want to delete <strong class="text-foreground">{{ roleToDelete?.name }}</strong>?
        This action cannot be undone.
      </p>
      <p class="text-sm text-amber-600 dark:text-amber-500 mt-2">
        Users with this role will lose its associated permissions.
      </p>
      <template #footer>
        <Button variant="ghost" @click="deleteConfirmation.showModal.value = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
