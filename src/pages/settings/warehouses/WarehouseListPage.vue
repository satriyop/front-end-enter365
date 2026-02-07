<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  useWarehouses,
  useDeleteWarehouse,
  type Warehouse,
  type WarehouseFilters,
} from '@/api/useWarehouses'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Trash2, Eye, Pencil, Plus, Warehouse as WarehouseIcon } from 'lucide-vue-next'

const toast = useToast()

// Resource list with filters and pagination
const {
  items: warehouses,
  pagination,
  isLoading,
  error,
  filters,
  updateFilter,
  goToPage,
  deleteConfirmation,
} = useResourceList<Warehouse, WarehouseFilters>({
  useListHook: useWarehouses,
  initialFilters: {
    page: 1,
    per_page: 15,
    is_active: undefined,
    search: '',
  },
})

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

function handleStatusChange(value: string | number | null) {
  const strValue = String(value ?? '')
  const boolValue = strValue === '' ? undefined : strValue === 'true'
  updateFilter('is_active', boolValue)
}

// Delete handling
const deleteMutation = useDeleteWarehouse()
const warehouseToDelete = ref<{ id: number; name: string } | null>(null)

function confirmDelete(id: number, name: string) {
  warehouseToDelete.value = { id, name }
  deleteConfirmation.confirmDelete(id)
}

async function handleDelete() {
  const id = deleteConfirmation.executeDelete()
  if (id === null) return
  try {
    await deleteMutation.mutateAsync(id as number)
    warehouseToDelete.value = null
    toast.success('Warehouse deleted')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete warehouse. It may have stock or be referenced by other records.'
    toast.error(message)
  }
}

// Table columns with mobile priorities
const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', showInMobile: false },
  { key: 'name', label: 'Name', mobilePriority: 1 },
  { key: 'contact_person', label: 'Contact Person', showInMobile: false },
  { key: 'is_default', label: 'Default', align: 'center', mobilePriority: 2 },
  { key: 'is_active', label: 'Status', align: 'center', showInMobile: false },
]
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Warehouses</h1>
        <p class="text-muted-foreground">Manage inventory storage locations</p>
      </div>
      <RouterLink to="/settings/warehouses/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Warehouse
        </Button>
      </RouterLink>
    </div>

    <!-- Info Banner -->
    <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div class="flex items-start gap-3">
        <WarehouseIcon class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <h4 class="font-medium text-blue-900 dark:text-blue-100">About Warehouses</h4>
          <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Warehouses are storage locations for your inventory. Set a default warehouse for automatic selection
            in transactions. Warehouses with stock cannot be deleted.
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
            placeholder="Search by code, name, contact..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
        <div class="w-40">
          <Select
            :model-value="filters.is_active === undefined ? '' : String(filters.is_active)"
            :options="statusOptions"
            @update:model-value="handleStatusChange"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-card rounded-xl border border-border p-8 text-center">
      <p class="text-destructive">Failed to load warehouses</p>
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
    <div v-else-if="warehouses.length === 0" class="bg-card rounded-xl border border-border">
      <EmptyState
        title="No warehouses found"
        description="Create a warehouse to start managing your inventory locations"
        action-label="New Warehouse"
        @action="$router.push('/settings/warehouses/new')"
      />
    </div>

    <!-- Data Table -->
    <div v-else class="bg-card rounded-xl border border-border overflow-hidden">
      <ResponsiveTable
        :items="warehouses"
        :columns="columns"
        :loading="isLoading"
        title-field="name"
        subtitle-field="code"
        @row-click="(item) => $router.push(`/settings/warehouses/${item.id}`)"
      >
        <!-- Custom cell: Code -->
        <template #cell-code="{ item }">
          <span class="font-mono text-sm text-muted-foreground">{{ item.code }}</span>
        </template>

        <!-- Custom cell: Name -->
        <template #cell-name="{ item }">
          <span class="text-primary hover:text-primary/80 font-medium">
            {{ item.name }}
          </span>
          <div v-if="item.address" class="text-xs text-muted-foreground truncate max-w-[300px]">
            {{ item.address }}
          </div>
        </template>

        <!-- Custom cell: Contact Person -->
        <template #cell-contact_person="{ item }">
          <span class="text-sm text-foreground">
            {{ item.contact_person || '-' }}
          </span>
          <div v-if="item.phone" class="text-xs text-muted-foreground">
            {{ item.phone }}
          </div>
        </template>

        <!-- Custom cell: Default -->
        <template #cell-is_default="{ item }">
          <Badge v-if="item.is_default" variant="info">
            Default
          </Badge>
          <span v-else class="text-muted-foreground">-</span>
        </template>

        <!-- Custom cell: Status -->
        <template #cell-is_active="{ item }">
          <Badge :variant="item.is_active ? 'success' : 'default'">
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </Badge>
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="text-primary font-medium">
            {{ item.name }}
          </span>
        </template>

        <!-- Mobile status slot -->
        <template #mobile-status="{ item }">
          <Badge v-if="item.is_default" variant="info">Default</Badge>
          <Badge v-else :variant="item.is_active ? 'success' : 'default'">
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <RouterLink :to="`/settings/warehouses/${item.id}`">
              <Button variant="ghost" size="xs" title="View Details">
                <Eye class="w-4 h-4" />
              </Button>
            </RouterLink>
            <RouterLink :to="`/settings/warehouses/${item.id}/edit`">
              <Button variant="ghost" size="xs" title="Edit">
                <Pencil class="w-4 h-4" />
              </Button>
            </RouterLink>
            <Button
              variant="ghost"
              size="xs"
              class="text-destructive hover:text-destructive/80"
              title="Delete"
              :disabled="item.is_default"
              @click.stop="confirmDelete(item.id, item.name)"
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
    <Modal :open="deleteConfirmation.showModal.value" title="Delete Warehouse" size="sm" @update:open="deleteConfirmation.showModal.value = $event">
      <p class="text-muted-foreground">
        Are you sure you want to delete <strong class="text-foreground">{{ warehouseToDelete?.name }}</strong>?
        This action cannot be undone.
      </p>
      <p class="text-sm text-amber-600 dark:text-amber-500 mt-2">
        Note: Warehouses with existing stock cannot be deleted.
      </p>
      <template #footer>
        <Button variant="ghost" @click="deleteConfirmation.showModal.value = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
