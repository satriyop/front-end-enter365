<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  useBomTemplates,
  useBomTemplateMetadata,
  useDeleteBomTemplate,
  useDuplicateBomTemplate,
  useToggleTemplateActive,
  type BomTemplate,
  type BomTemplateFilters,
} from '@/api/useBomTemplates'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast } from '@/components/ui'
import { Copy, Trash2, Eye, Pencil, Power, FileStack } from 'lucide-vue-next'

const toast = useToast()

// Resource list with filters and pagination
const {
  items: templates,
  pagination,
  isLoading,
  error,
  filters,
  updateFilter,
  goToPage,
  deleteConfirmation,
} = useResourceList<BomTemplate, BomTemplateFilters>({
  useListHook: useBomTemplates,
  initialFilters: {
    page: 1,
    per_page: 15,
    category: undefined,
    is_active: undefined,
    search: '',
  },
})

const { data: metadata } = useBomTemplateMetadata()

const categoryOptions = computed(() => {
  if (!metadata.value?.categories) return [{ value: '', label: 'All Categories' }]
  return [
    { value: '', label: 'All Categories' },
    ...Object.entries(metadata.value.categories).map(([value, label]) => ({
      value,
      label: label as string
    }))
  ]
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
const deleteMutation = useDeleteBomTemplate()
const templateToDelete = ref<{ id: number; name: string } | null>(null)

function confirmDelete(id: number, name: string) {
  templateToDelete.value = { id, name }
  deleteConfirmation.confirmDelete(id)
}

async function handleDelete() {
  const id = deleteConfirmation.executeDelete()
  if (id === null) return
  try {
    await deleteMutation.mutateAsync(id as number)
    templateToDelete.value = null
    toast.success('Template deleted')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete'
    toast.error(message)
  }
}

// Duplicate handling
const duplicateMutation = useDuplicateBomTemplate()

async function handleDuplicate(id: number) {
  try {
    await duplicateMutation.mutateAsync(id)
    toast.success('Template duplicated')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to duplicate'
    toast.error(message)
  }
}

// Toggle active handling
const toggleActiveMutation = useToggleTemplateActive()

async function handleToggleActive(id: number) {
  try {
    await toggleActiveMutation.mutateAsync(id)
    toast.success('Template status updated')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update status'
    toast.error(message)
  }
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    panel: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    solar_system: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    installation: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    maintenance: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  }
  return colors[category] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">BOM Templates</h1>
        <p class="text-muted-foreground">Reusable panel configurations for quick BOM creation</p>
      </div>
      <RouterLink to="/settings/bom-templates/new">
        <Button>
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Template
        </Button>
      </RouterLink>
    </div>

    <!-- Info Banner -->
    <div class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
      <div class="flex items-start gap-3">
        <FileStack class="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
        <div>
          <h4 class="font-medium text-green-900 dark:text-green-100">About BOM Templates</h4>
          <p class="text-sm text-green-700 dark:text-green-300 mt-1">
            Templates define standard component configurations. Use them to quickly create BOMs with consistent structures,
            then swap brands to generate cost-optimized variants.
          </p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search by code, name..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
        <div class="w-48">
          <Select
            v-model="filters.category"
            :options="categoryOptions"
            placeholder="All Categories"
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
    <div v-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500 dark:text-red-400">Failed to load templates</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="templates.length === 0" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No templates found"
        description="Create BOM templates to speed up panel configuration"
        action-label="New Template"
        @action="$router.push('/settings/bom-templates/new')"
      />
    </div>

    <!-- Data Table -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Code</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Items</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usage</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          <tr v-for="template in templates" :key="template.id" class="hover:bg-slate-50 dark:hover:bg-slate-800">
            <td class="px-6 py-4">
              <span class="font-mono text-sm text-slate-600 dark:text-slate-400">{{ template.code }}</span>
            </td>
            <td class="px-6 py-4">
              <RouterLink
                :to="`/settings/bom-templates/${template.id}`"
                class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
              >
                {{ template.name }}
              </RouterLink>
              <div v-if="template.description" class="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[300px]">
                {{ template.description }}
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                :class="getCategoryColor(template.category)"
              >
                {{ template.category_label }}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100">
                {{ template.items_count ?? template.items?.length ?? 0 }}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <span class="text-sm text-slate-600 dark:text-slate-400">
                {{ template.usage_count }} BOM{{ template.usage_count !== 1 ? 's' : '' }}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <Badge :variant="template.is_active ? 'success' : 'default'">
                {{ template.is_active ? 'Active' : 'Inactive' }}
              </Badge>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center justify-end gap-1">
                <RouterLink :to="`/settings/bom-templates/${template.id}`">
                  <Button variant="ghost" size="xs" title="View Details">
                    <Eye class="w-4 h-4" />
                  </Button>
                </RouterLink>
                <RouterLink :to="`/settings/bom-templates/${template.id}/edit`">
                  <Button variant="ghost" size="xs" title="Edit">
                    <Pencil class="w-4 h-4" />
                  </Button>
                </RouterLink>
                <Button
                  variant="ghost"
                  size="xs"
                  title="Duplicate"
                  :loading="duplicateMutation.isPending.value"
                  @click="handleDuplicate(template.id)"
                >
                  <Copy class="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  :title="template.is_active ? 'Deactivate' : 'Activate'"
                  @click="handleToggleActive(template.id)"
                >
                  <Power class="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  class="text-red-500 hover:text-red-600"
                  title="Delete"
                  @click="confirmDelete(template.id, template.name)"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
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
    <Modal :open="deleteConfirmation.showModal.value" title="Delete Template" size="sm" @update:open="deleteConfirmation.showModal.value = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete <strong class="text-slate-900 dark:text-slate-100">{{ templateToDelete?.name }}</strong>?
        This will also remove all template items.
      </p>
      <template #footer>
        <Button variant="ghost" @click="deleteConfirmation.showModal.value = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
