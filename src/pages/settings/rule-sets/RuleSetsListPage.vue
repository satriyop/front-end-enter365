<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  useSpecRuleSets,
  useDeleteRuleSet,
  useSetDefaultRuleSet,
  type RuleSetFilters,
} from '@/api/useSpecRuleSets'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast } from '@/components/ui'
import { Star, StarOff, Trash2, Eye, Pencil } from 'lucide-vue-next'

const toast = useToast()

const filters = ref<RuleSetFilters>({
  page: 1,
  per_page: 15,
  is_active: undefined,
  search: '',
})

const { data, isLoading, error } = useSpecRuleSets(filters)

const ruleSets = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

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
const deleteMutation = useDeleteRuleSet()
const showDeleteModal = ref(false)
const ruleSetToDelete = ref<{ id: number; name: string } | null>(null)

function confirmDelete(id: number, name: string) {
  ruleSetToDelete.value = { id, name }
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!ruleSetToDelete.value) return
  try {
    await deleteMutation.mutateAsync(ruleSetToDelete.value.id)
    showDeleteModal.value = false
    ruleSetToDelete.value = null
    toast.success('Rule set deleted')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete'
    toast.error(message)
  }
}

// Set default handling
const setDefaultMutation = useSetDefaultRuleSet()

async function handleSetDefault(id: number) {
  try {
    await setDefaultMutation.mutateAsync(id)
    toast.success('Rule set set as default')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to set default'
    toast.error(message)
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Validation Rule Sets</h1>
        <p class="text-muted-foreground">Configure validation rules for component swapping</p>
      </div>
      <RouterLink to="/settings/rule-sets/new">
        <Button>
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Rule Set
        </Button>
      </RouterLink>
    </div>

    <!-- Info Banner -->
    <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div class="flex items-start gap-3">
        <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h4 class="font-medium text-blue-900 dark:text-blue-100">About Validation Rule Sets</h4>
          <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
            Rule sets define which specifications must match when swapping components between brands.
            The default rule set is automatically applied when no specific rule set is selected for a BOM.
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
            @update:model-value="handleSearch"
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
      <p class="text-red-500 dark:text-red-400">Failed to load rule sets</p>
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
    <div v-else-if="ruleSets.length === 0" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No rule sets found"
        description="Create validation rule sets to control component swap behavior"
        action-label="New Rule Set"
        @action="$router.push('/settings/rule-sets/new')"
      />
    </div>

    <!-- Data Table -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Code</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rules</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">BOMs</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          <tr v-for="ruleSet in ruleSets" :key="ruleSet.id" class="hover:bg-slate-50 dark:hover:bg-slate-800">
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <span class="font-mono text-sm text-slate-600 dark:text-slate-400">{{ ruleSet.code }}</span>
                <span
                  v-if="ruleSet.is_default"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                >
                  <Star class="w-3 h-3" />
                  Default
                </span>
              </div>
            </td>
            <td class="px-6 py-4">
              <RouterLink
                :to="`/settings/rule-sets/${ruleSet.id}`"
                class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
              >
                {{ ruleSet.name }}
              </RouterLink>
              <div v-if="ruleSet.description" class="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[300px]">
                {{ ruleSet.description }}
              </div>
            </td>
            <td class="px-6 py-4 text-center">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100">
                {{ ruleSet.rules_count ?? ruleSet.rules?.length ?? 0 }}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <span class="text-sm text-slate-600 dark:text-slate-400">
                {{ ruleSet.boms_count ?? 0 }}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <Badge :variant="ruleSet.is_active ? 'success' : 'default'">
                {{ ruleSet.is_active ? 'Active' : 'Inactive' }}
              </Badge>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center justify-end gap-1">
                <RouterLink :to="`/settings/rule-sets/${ruleSet.id}`">
                  <Button variant="ghost" size="xs" title="View Details">
                    <Eye class="w-4 h-4" />
                  </Button>
                </RouterLink>
                <RouterLink :to="`/settings/rule-sets/${ruleSet.id}/edit`">
                  <Button variant="ghost" size="xs" title="Edit">
                    <Pencil class="w-4 h-4" />
                  </Button>
                </RouterLink>
                <Button
                  v-if="!ruleSet.is_default"
                  variant="ghost"
                  size="xs"
                  title="Set as Default"
                  :loading="setDefaultMutation.isPending.value"
                  @click="handleSetDefault(ruleSet.id)"
                >
                  <StarOff class="w-4 h-4" />
                </Button>
                <Button
                  v-if="!ruleSet.is_default"
                  variant="ghost"
                  size="xs"
                  class="text-red-500 hover:text-red-600"
                  title="Delete"
                  @click="confirmDelete(ruleSet.id, ruleSet.name)"
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
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Rule Set" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete <strong class="text-slate-900 dark:text-slate-100">{{ ruleSetToDelete?.name }}</strong>?
        This will also remove all rules in this set.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
