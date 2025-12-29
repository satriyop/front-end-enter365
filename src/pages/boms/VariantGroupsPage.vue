<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  useBomVariantGroups,
  useDeleteBomVariantGroup,
  type VariantGroupFilters
} from '@/api/useComponentStandards'
import { Button, Input, Pagination, EmptyState, Modal, Badge, Card, useToast } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'

const router = useRouter()
const toast = useToast()

const filters = ref<VariantGroupFilters>({
  page: 1,
  per_page: 10,
  search: '',
})

const { data, isLoading, error } = useBomVariantGroups(filters)
const deleteMutation = useDeleteBomVariantGroup()

const groups = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

function handlePageChange(page: number) {
  filters.value.page = page
}

function handleSearch(value: string | number) {
  filters.value.search = String(value)
  filters.value.page = 1
}

// Delete handling
const showDeleteModal = ref(false)
const groupToDelete = ref<{ id: number; name: string } | null>(null)

function confirmDelete(id: number, name: string) {
  groupToDelete.value = { id, name }
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!groupToDelete.value) return
  try {
    await deleteMutation.mutateAsync(groupToDelete.value.id)
    showDeleteModal.value = false
    groupToDelete.value = null
    toast.success('Variant group deleted')
  } catch {
    toast.error('Failed to delete variant group')
  }
}

// Expanded group for comparison view
const expandedGroupId = ref<number | null>(null)

function toggleExpand(id: number) {
  expandedGroupId.value = expandedGroupId.value === id ? null : id
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Variant Groups</h1>
        <p class="text-slate-500 dark:text-slate-400">Compare BOM brand variants side-by-side</p>
      </div>
      <RouterLink to="/boms">
        <Button variant="secondary">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to BOMs
        </Button>
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search groups..."
            @update:model-value="handleSearch"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500">Failed to load variant groups</p>
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
    <div v-else-if="groups.length === 0" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No variant groups yet"
        description="Generate brand variants from a BOM to create a comparison group"
        action-label="Go to BOMs"
        @action="router.push('/boms')"
      />
    </div>

    <!-- Groups List -->
    <div v-else class="space-y-4">
      <Card v-for="group in groups" :key="group.id" class="overflow-hidden">
        <!-- Group Header -->
        <div
          class="flex items-center justify-between cursor-pointer"
          @click="toggleExpand(group.id)"
        >
          <div class="flex items-center gap-4">
            <button
              type="button"
              class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-transform"
              :class="{ 'rotate-90': expandedGroupId === group.id }"
            >
              <svg class="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-slate-100">{{ group.name }}</h3>
              <p v-if="group.description" class="text-sm text-slate-500 dark:text-slate-400">{{ group.description }}</p>
              <div class="flex items-center gap-3 mt-1 text-sm text-slate-400 dark:text-slate-500">
                <span>{{ group.boms_count }} variants</span>
                <span>Created {{ formatDate(group.created_at) }}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <Badge v-if="group.primary_bom" variant="info">
              Primary: {{ group.primary_bom.bom_number }}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              class="text-red-500 hover:text-red-600"
              @click.stop="confirmDelete(group.id, group.name)"
            >
              Delete
            </Button>
          </div>
        </div>

        <!-- Expanded Comparison View -->
        <div v-if="expandedGroupId === group.id && group.boms?.length" class="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div
              v-for="bom in group.boms"
              :key="bom.id"
              class="border rounded-lg p-4"
              :class="bom.is_primary_variant ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' : 'border-slate-200 dark:border-slate-700'"
            >
              <div class="flex items-start justify-between mb-2">
                <div>
                  <div class="font-medium text-slate-900 dark:text-slate-100">{{ bom.variant_label || bom.bom_number }}</div>
                  <div class="text-sm text-slate-500 dark:text-slate-400">{{ bom.bom_number }}</div>
                </div>
                <Badge v-if="bom.is_primary_variant" variant="warning" size="sm">Primary</Badge>
              </div>
              <div class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3">
                {{ formatCurrency(bom.total_cost) }}
              </div>
              <div class="flex gap-2">
                <RouterLink :to="`/boms/${bom.id}`" class="flex-1">
                  <Button variant="secondary" size="sm" class="w-full">View</Button>
                </RouterLink>
              </div>
            </div>
          </div>

          <!-- Cost Comparison Summary -->
          <div v-if="group.boms.length > 1" class="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div class="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Cost Comparison</div>
            <div class="flex items-center gap-6">
              <div>
                <span class="text-slate-500 dark:text-slate-400">Lowest:</span>
                <span class="ml-2 font-bold text-green-600 dark:text-green-400">
                  {{ formatCurrency(Math.min(...group.boms.map(b => b.total_cost))) }}
                </span>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">Highest:</span>
                <span class="ml-2 font-bold text-red-600 dark:text-red-400">
                  {{ formatCurrency(Math.max(...group.boms.map(b => b.total_cost))) }}
                </span>
              </div>
              <div>
                <span class="text-slate-500 dark:text-slate-400">Difference:</span>
                <span class="ml-2 font-bold text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(Math.max(...group.boms.map(b => b.total_cost)) - Math.min(...group.boms.map(b => b.total_cost))) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Pagination -->
      <div v-if="pagination" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-6 py-4">
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
    <Modal :open="showDeleteModal" title="Delete Variant Group" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600">
        Are you sure you want to delete <strong>{{ groupToDelete?.name }}</strong>?
        This will not delete the BOMs in this group.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
