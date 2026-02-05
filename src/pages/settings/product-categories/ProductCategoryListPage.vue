<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  useProductCategories,
  useDeleteProductCategory,
  type ProductCategory,
  type ProductCategoryFilters,
} from '@/api/useProductCategories'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Trash2, Eye, Pencil, Plus, FolderTree } from 'lucide-vue-next'

const toast = useToast()

// Resource list with filters and pagination
const {
  items: categories,
  pagination,
  isLoading,
  error,
  filters,
  updateFilter,
  goToPage,
  deleteConfirmation,
} = useResourceList<ProductCategory, ProductCategoryFilters>({
  useListHook: useProductCategories,
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
const deleteMutation = useDeleteProductCategory()
const categoryToDelete = ref<{ id: number; name: string } | null>(null)

function confirmDelete(id: number, name: string) {
  categoryToDelete.value = { id, name }
  deleteConfirmation.confirmDelete(id)
}

async function handleDelete() {
  const id = deleteConfirmation.executeDelete()
  if (id === null) return
  try {
    await deleteMutation.mutateAsync(id as number)
    categoryToDelete.value = null
    toast.success('Category deleted')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete category. It may have products assigned.'
    toast.error(message)
  }
}

// Table columns with mobile priorities
const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', showInMobile: false },
  { key: 'name', label: 'Name', mobilePriority: 1 },
  { key: 'parent', label: 'Parent', showInMobile: false },
  { key: 'sort_order', label: 'Order', align: 'center', showInMobile: false },
  { key: 'is_active', label: 'Status', align: 'center', mobilePriority: 2 },
]
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">Product Categories</h1>
        <p class="text-muted-foreground">Organize products into categories</p>
      </div>
      <RouterLink to="/settings/product-categories/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Category
        </Button>
      </RouterLink>
    </div>

    <!-- Info Banner -->
    <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div class="flex items-start gap-3">
        <FolderTree class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div>
          <h4 class="font-medium text-blue-900 dark:text-blue-100">About Product Categories</h4>
          <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Product categories help organize your product catalog. You can create hierarchical categories
            using parent categories. Categories with products assigned cannot be deleted.
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
            placeholder="Search by code or name..."
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
      <p class="text-destructive">Failed to load categories</p>
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
    <div v-else-if="categories.length === 0" class="bg-card rounded-xl border border-border">
      <EmptyState
        title="No categories found"
        description="Create a category to organize your products"
        action-label="New Category"
        @action="$router.push('/settings/product-categories/new')"
      />
    </div>

    <!-- Data Table -->
    <div v-else class="bg-card rounded-xl border border-border overflow-hidden">
      <ResponsiveTable
        :items="categories"
        :columns="columns"
        :loading="isLoading"
        title-field="name"
        subtitle-field="code"
        @row-click="(item) => $router.push(`/settings/product-categories/${item.id}`)"
      >
        <!-- Custom cell: Code -->
        <template #cell-code="{ item }">
          <span class="font-mono text-sm text-muted-foreground">{{ item.code || '-' }}</span>
        </template>

        <!-- Custom cell: Name -->
        <template #cell-name="{ item }">
          <span class="text-primary hover:text-primary/80 font-medium">
            {{ item.name }}
          </span>
          <div v-if="item.description" class="text-xs text-muted-foreground truncate max-w-[300px]">
            {{ item.description }}
          </div>
        </template>

        <!-- Custom cell: Parent -->
        <template #cell-parent="{ item }">
          <span v-if="item.parent" class="text-sm text-foreground">
            {{ item.parent.name }}
          </span>
          <span v-else class="text-muted-foreground">-</span>
        </template>

        <!-- Custom cell: Sort Order -->
        <template #cell-sort_order="{ item }">
          <span class="text-sm text-muted-foreground">{{ item.sort_order }}</span>
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
          <Badge :variant="item.is_active ? 'success' : 'default'">
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <RouterLink :to="`/settings/product-categories/${item.id}`">
              <Button variant="ghost" size="xs" title="View Details">
                <Eye class="w-4 h-4" />
              </Button>
            </RouterLink>
            <RouterLink :to="`/settings/product-categories/${item.id}/edit`">
              <Button variant="ghost" size="xs" title="Edit">
                <Pencil class="w-4 h-4" />
              </Button>
            </RouterLink>
            <Button
              variant="ghost"
              size="xs"
              class="text-destructive hover:text-destructive/80"
              title="Delete"
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
    <Modal :open="deleteConfirmation.showModal.value" title="Delete Category" size="sm" @update:open="deleteConfirmation.showModal.value = $event">
      <p class="text-muted-foreground">
        Are you sure you want to delete <strong class="text-foreground">{{ categoryToDelete?.name }}</strong>?
        This action cannot be undone.
      </p>
      <p class="text-sm text-amber-600 dark:text-amber-500 mt-2">
        Note: Categories with products assigned cannot be deleted.
      </p>
      <template #footer>
        <Button variant="ghost" @click="deleteConfirmation.showModal.value = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
