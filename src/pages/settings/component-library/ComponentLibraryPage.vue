<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useComponentStandards,
  useComponentCategories,
  useAvailableBrands,
  useDeleteComponentStandard,
  type ComponentStandardFilters
} from '@/api/useComponentStandards'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast } from '@/components/ui'

const toast = useToast()

const filters = ref<ComponentStandardFilters>({
  page: 1,
  per_page: 15,
  category: undefined,
  brand: undefined,
  is_active: true,
  search: '',
})

const { data, isLoading, error } = useComponentStandards(filters)
const { data: categories } = useComponentCategories()
const { data: brands } = useAvailableBrands()

const standards = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

const categoryOptions = computed(() => [
  { value: '', label: 'All Categories' },
  ...(categories.value?.map(c => ({ value: c.category, label: `${c.label} (${c.count})` })) ?? [])
])

const brandOptions = computed(() => [
  { value: '', label: 'All Brands' },
  ...(brands.value?.map(b => ({ value: b.code, label: b.name })) ?? [])
])

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

function handlePageChange(page: number) {
  filters.value.page = page
}

function handleSearch(value: string | number) {
  filters.value.search = String(value)
  filters.value.page = 1
}

function handleStatusChange(value: string | number | null) {
  const strValue = String(value ?? '')
  filters.value.is_active = strValue === '' ? undefined : strValue === 'true'
  filters.value.page = 1
}

// Delete handling
const deleteMutation = useDeleteComponentStandard()
const showDeleteModal = ref(false)
const standardToDelete = ref<{ id: number; name: string } | null>(null)

function confirmDelete(id: number, name: string) {
  standardToDelete.value = { id, name }
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!standardToDelete.value) return
  try {
    await deleteMutation.mutateAsync(standardToDelete.value.id)
    showDeleteModal.value = false
    standardToDelete.value = null
    toast.success('Component standard deleted')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete'
    toast.error(message)
  }
}

// Format specs for display
function formatSpecs(specs: Record<string, unknown>): string {
  const parts: string[] = []
  if (specs.rating_amps) parts.push(`${specs.rating_amps}A`)
  if (specs.poles) parts.push(`${specs.poles}P`)
  if (specs.curve) parts.push(`Curve ${specs.curve}`)
  if (specs.breaking_capacity_ka) parts.push(`${specs.breaking_capacity_ka}kA`)
  if (specs.conductor_size_mm2) parts.push(`${specs.conductor_size_mm2}mm²`)
  if (specs.cores) parts.push(`${specs.cores} core`)
  if (specs.current_rating_a) parts.push(`${specs.current_rating_a}A`)
  return parts.join(' | ') || '-'
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    circuit_breaker: 'bg-blue-50 text-blue-700',
    contactor: 'bg-purple-50 text-purple-700',
    cable: 'bg-green-50 text-green-700',
    busbar: 'bg-orange-50 text-orange-700',
    enclosure: 'bg-slate-100 text-slate-700',
    relay: 'bg-pink-50 text-pink-700',
    terminal: 'bg-cyan-50 text-cyan-700',
  }
  return colors[category] || 'bg-slate-100 text-slate-700'
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Component Library</h1>
        <p class="text-slate-500">Manage IEC component standards and brand mappings</p>
      </div>
      <RouterLink to="/settings/component-library/new">
        <Button>
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Standard
        </Button>
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search by code, name..."
            @update:model-value="handleSearch"
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
            v-model="filters.brand"
            :options="brandOptions"
            placeholder="All Brands"
          />
        </div>
        <div class="w-32">
          <Select
            :model-value="filters.is_active === undefined ? '' : String(filters.is_active)"
            :options="statusOptions"
            @update:model-value="handleStatusChange"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <p class="text-red-500">Failed to load component standards</p>
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
    <div v-else-if="standards.length === 0" class="bg-white rounded-xl border border-slate-200">
      <EmptyState
        title="No component standards found"
        description="Create component standards to enable cross-brand BOM swapping"
        action-label="New Standard"
        @action="$router.push('/settings/component-library/new')"
      />
    </div>

    <!-- Data Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Specifications</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Brands</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="standard in standards" :key="standard.id" class="hover:bg-slate-50">
            <td class="px-6 py-4">
              <span class="font-mono text-sm text-slate-600">{{ standard.code }}</span>
            </td>
            <td class="px-6 py-4">
              <RouterLink
                :to="`/settings/component-library/${standard.id}`"
                class="text-orange-600 hover:text-orange-700 font-medium"
              >
                {{ standard.name }}
              </RouterLink>
              <div v-if="standard.standard" class="text-xs text-slate-400">
                {{ standard.standard }}
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                :class="getCategoryColor(standard.category)"
              >
                {{ standard.category_label }}
              </span>
              <div v-if="standard.subcategory" class="text-xs text-slate-400 mt-1">
                {{ standard.subcategory }}
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">
              {{ formatSpecs(standard.specifications) }}
            </td>
            <td class="px-6 py-4 text-center">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-medium">
                {{ standard.brand_mappings_count ?? standard.brand_mappings?.length ?? 0 }}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <Badge :variant="standard.is_active ? 'success' : 'default'">
                {{ standard.is_active ? 'Active' : 'Inactive' }}
              </Badge>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <RouterLink :to="`/settings/component-library/${standard.id}`">
                  <Button variant="ghost" size="xs">View</Button>
                </RouterLink>
                <RouterLink :to="`/settings/component-library/${standard.id}/edit`">
                  <Button variant="ghost" size="xs">Edit</Button>
                </RouterLink>
                <Button
                  variant="ghost"
                  size="xs"
                  class="text-red-500 hover:text-red-600"
                  @click="confirmDelete(standard.id, standard.name)"
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

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Component Standard" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600">
        Are you sure you want to delete <strong>{{ standardToDelete?.name }}</strong>?
        This will also remove all brand mappings.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
