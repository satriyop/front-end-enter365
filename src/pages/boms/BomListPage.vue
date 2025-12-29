<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBoms, type BomFilters } from '@/api/useBoms'
import { formatCurrency } from '@/utils/format'
import { Button, Input, Select, Badge, Pagination, EmptyState } from '@/components/ui'

const filters = ref<BomFilters>({
  page: 1,
  per_page: 15,
  status: undefined,
  search: '',
})

const { data, isLoading, error } = useBoms(filters)

const boms = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

function handlePageChange(page: number) {
  filters.value.page = page
}

function handleSearch(value: string | number) {
  filters.value.search = String(value)
  filters.value.page = 1
}

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
    draft: 'default',
    active: 'success',
    inactive: 'warning',
  }
  return map[status] || 'default'
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Bill of Materials</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage product BOMs and production costs</p>
      </div>
      <RouterLink to="/boms/new">
        <Button>
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New BOM
        </Button>
      </RouterLink>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search BOMs..."
            @update:model-value="handleSearch"
          />
        </div>
        <div class="w-48">
          <Select
            v-model="filters.status"
            :options="statusOptions"
            placeholder="All Status"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500">Failed to load BOMs</p>
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
    <div v-else-if="boms.length === 0" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No BOMs found"
        description="Create your first Bill of Materials to define production costs"
        action-label="New BOM"
        @action="$router.push('/boms/new')"
      />
    </div>

    <!-- Table -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              BOM #
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Product
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Output
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Unit Cost
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Cost
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          <tr
            v-for="bom in boms"
            :key="bom.id"
            class="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            @click="$router.push(`/boms/${bom.id}`)"
          >
            <td class="px-6 py-4">
              <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
                {{ bom.bom_number }}
              </span>
              <div v-if="bom.variant_label" class="text-xs text-slate-500 dark:text-slate-400">
                {{ bom.variant_label }}
              </div>
            </td>
            <td class="px-6 py-4">
              <div class="font-medium text-slate-900 dark:text-slate-100">{{ bom.product?.name }}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">{{ bom.name }}</div>
            </td>
            <td class="px-6 py-4 text-right text-slate-900 dark:text-slate-100">
              {{ bom.output_quantity }} {{ bom.output_unit }}
            </td>
            <td class="px-6 py-4 text-right font-medium text-slate-900 dark:text-slate-100">
              {{ formatCurrency(bom.unit_cost) }}
            </td>
            <td class="px-6 py-4 text-right text-slate-900 dark:text-slate-100">
              {{ formatCurrency(bom.total_cost) }}
            </td>
            <td class="px-6 py-4">
              <Badge :variant="getStatusVariant(bom.status)">
                {{ bom.status }}
              </Badge>
            </td>
            <td class="px-6 py-4 text-right" @click.stop>
              <RouterLink :to="`/boms/${bom.id}`">
                <Button variant="ghost" size="xs">View</Button>
              </RouterLink>
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
  </div>
</template>
