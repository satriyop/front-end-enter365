<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  useRole,
  useDeleteRole,
  useGroupedPermissions,
  useSyncRolePermissions,
  type GroupedPermission,
} from '@/api/useRoles'
import { Button, Card, Badge, Modal, useToast } from '@/components/ui'
import { Pencil, Trash2, ArrowLeft, Shield, Save, ChevronDown, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const roleId = computed(() => Number(route.params.id))
const { data: role, isLoading } = useRole(roleId)
const { data: groupedPermissions, isLoading: loadingPermissions } = useGroupedPermissions()

const deleteMutation = useDeleteRole()
const syncMutation = useSyncRolePermissions()

// ─────────────────────────────────────────────
// Permission selection state
// ─────────────────────────────────────────────

const selectedPermissions = ref<Set<number>>(new Set())
const hasChanges = ref(false)

// Sync selected permissions when role data loads
watch(
  () => role.value?.permissions,
  (permissions) => {
    if (permissions) {
      selectedPermissions.value = new Set(permissions.map((p) => p.id))
      hasChanges.value = false
    }
  },
  { immediate: true }
)

function togglePermission(permissionId: number) {
  const next = new Set(selectedPermissions.value)
  if (next.has(permissionId)) {
    next.delete(permissionId)
  } else {
    next.add(permissionId)
  }
  selectedPermissions.value = next
  hasChanges.value = true
}

function toggleGroup(group: GroupedPermission) {
  const groupIds = group.permissions.map((p) => p.id)
  const allSelected = groupIds.every((id) => selectedPermissions.value.has(id))
  const next = new Set(selectedPermissions.value)

  if (allSelected) {
    groupIds.forEach((id) => next.delete(id))
  } else {
    groupIds.forEach((id) => next.add(id))
  }

  selectedPermissions.value = next
  hasChanges.value = true
}

function isGroupFullySelected(group: GroupedPermission): boolean {
  return group.permissions.every((p) => selectedPermissions.value.has(p.id))
}

function isGroupPartiallySelected(group: GroupedPermission): boolean {
  const some = group.permissions.some((p) => selectedPermissions.value.has(p.id))
  return some && !isGroupFullySelected(group)
}

function groupSelectedCount(group: GroupedPermission): number {
  return group.permissions.filter((p) => selectedPermissions.value.has(p.id)).length
}

// ─────────────────────────────────────────────
// Collapsible groups
// ─────────────────────────────────────────────

const expandedGroups = ref<Set<string>>(new Set())

function toggleGroupExpand(groupName: string) {
  const next = new Set(expandedGroups.value)
  if (next.has(groupName)) {
    next.delete(groupName)
  } else {
    next.add(groupName)
  }
  expandedGroups.value = next
}

function expandAll() {
  if (groupedPermissions.value) {
    expandedGroups.value = new Set(groupedPermissions.value.map((g) => g.group))
  }
}

function collapseAll() {
  expandedGroups.value = new Set()
}

// Start with all expanded
watch(groupedPermissions, (groups) => {
  if (groups) {
    expandedGroups.value = new Set(groups.map((g) => g.group))
  }
}, { immediate: true })

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

async function handleSyncPermissions() {
  try {
    await syncMutation.mutateAsync({
      id: roleId.value,
      permissions: Array.from(selectedPermissions.value),
    })
    hasChanges.value = false
    toast.success('Permissions updated')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to sync permissions'
    toast.error(message)
  }
}

// Delete modal
const showDeleteModal = ref(false)

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(roleId.value)
    toast.success('Role deleted')
    router.push('/settings/roles')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete role'
    toast.error(message)
  } finally {
    showDeleteModal.value = false
  }
}
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
        <span>Loading role...</span>
      </div>
    </div>

    <template v-else-if="role">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-foreground">{{ role.display_name }}</h1>
            <Badge v-if="role.is_system" variant="warning">System</Badge>
          </div>
          <p class="text-muted-foreground font-mono">{{ role.name }}</p>
          <p v-if="role.description" class="text-muted-foreground mt-1">{{ role.description }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="ghost" @click="router.push('/settings/roles')">
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back
          </Button>
          <RouterLink v-if="!role.is_system" :to="`/settings/roles/${role.id}/edit`">
            <Button variant="secondary">
              <Pencil class="w-4 h-4 mr-2" />
              Edit
            </Button>
          </RouterLink>
          <Button
            v-if="!role.is_system"
            variant="destructive"
            @click="showDeleteModal = true"
          >
            <Trash2 class="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main: Permissions -->
        <div class="lg:col-span-2 space-y-6">
          <Card>
            <template #header>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <Shield class="w-4 h-4 text-muted-foreground" />
                  <h2 class="font-medium text-foreground">Permissions</h2>
                  <Badge variant="default">{{ selectedPermissions.size }} selected</Badge>
                </div>
                <div class="flex items-center gap-2">
                  <Button variant="ghost" size="xs" @click="expandAll">Expand All</Button>
                  <Button variant="ghost" size="xs" @click="collapseAll">Collapse All</Button>
                </div>
              </div>
            </template>

            <!-- Loading permissions -->
            <div v-if="loadingPermissions" class="flex items-center justify-center py-8 text-muted-foreground">
              <svg class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading permissions...
            </div>

            <!-- Grouped permissions -->
            <div v-else-if="groupedPermissions" class="divide-y divide-border -mx-4 sm:-mx-6">
              <div v-for="group in groupedPermissions" :key="group.group">
                <!-- Group header (clickable to expand/collapse) -->
                <button
                  type="button"
                  class="w-full flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-muted/50 transition-colors"
                  @click="toggleGroupExpand(group.group)"
                >
                  <div class="flex items-center gap-3">
                    <component
                      :is="expandedGroups.has(group.group) ? ChevronDown : ChevronRight"
                      class="w-4 h-4 text-muted-foreground"
                    />
                    <!-- Group checkbox -->
                    <label
                      class="flex items-center gap-2 cursor-pointer"
                      @click.stop
                    >
                      <input
                        type="checkbox"
                        class="rounded border-border text-primary focus:ring-primary"
                        :checked="isGroupFullySelected(group)"
                        :indeterminate="isGroupPartiallySelected(group)"
                        @change="toggleGroup(group)"
                      />
                      <span class="font-medium text-foreground">{{ group.group_label }}</span>
                    </label>
                  </div>
                  <span class="text-sm text-muted-foreground">
                    {{ groupSelectedCount(group) }}/{{ group.permissions.length }}
                  </span>
                </button>

                <!-- Permission checkboxes -->
                <div
                  v-if="expandedGroups.has(group.group)"
                  class="px-4 sm:px-6 pb-3 pt-1"
                >
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                    <label
                      v-for="permission in group.permissions"
                      :key="permission.id"
                      class="flex items-start gap-2 cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        class="rounded border-border text-primary focus:ring-primary mt-0.5"
                        :checked="selectedPermissions.has(permission.id)"
                        @change="togglePermission(permission.id)"
                      />
                      <div>
                        <span class="text-sm text-foreground">{{ permission.display_name }}</span>
                        <p v-if="permission.description" class="text-xs text-muted-foreground">
                          {{ permission.description }}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div v-else class="text-center py-8 text-muted-foreground">
              <p class="text-sm">No permissions available</p>
            </div>
          </Card>

          <!-- Save button (sticky at bottom when changes exist) -->
          <div
            v-if="hasChanges"
            class="sticky bottom-4 flex justify-end"
          >
            <Button
              :loading="syncMutation.isPending.value"
              @click="handleSyncPermissions"
              class="shadow-lg"
            >
              <Save class="w-4 h-4 mr-2" />
              Save Permissions
            </Button>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Details</h2>
            </template>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-muted-foreground">Name</dt>
                <dd class="text-foreground">{{ role.display_name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Slug</dt>
                <dd class="font-mono text-sm text-foreground">{{ role.name }}</dd>
              </div>
              <div v-if="role.description">
                <dt class="text-sm text-muted-foreground">Description</dt>
                <dd class="text-foreground">{{ role.description }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Type</dt>
                <dd>
                  <Badge v-if="role.is_system" variant="warning">System</Badge>
                  <Badge v-else variant="default">Custom</Badge>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Users</dt>
                <dd class="text-foreground">{{ role.users_count ?? 0 }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Permissions</dt>
                <dd class="text-foreground">{{ selectedPermissions.size }}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Timestamps</h2>
            </template>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Created</dt>
                <dd class="text-foreground">
                  {{ new Date(role.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Updated</dt>
                <dd class="text-foreground">
                  {{ new Date(role.updated_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) }}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </template>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Role" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-muted-foreground">
        Are you sure you want to delete <strong class="text-foreground">{{ role?.display_name }}</strong>?
        This action cannot be undone.
      </p>
      <p class="text-sm text-amber-600 dark:text-amber-500 mt-2">
        Users with this role will lose its associated permissions.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
