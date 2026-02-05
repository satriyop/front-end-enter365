<script setup lang="ts">
import { useBoms, type BomFilters, type Bom } from '@/api/useBoms'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency } from '@/utils/format'
import { Button, Input, Select, Badge, Pagination, EmptyState, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { FileStack } from 'lucide-vue-next'

// Resource list with filters and pagination
const {
  items: boms,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<Bom, BomFilters>({
  useListHook: useBoms,
  initialFilters: {
    page: 1,
    per_page: 15,
    status: undefined,
    search: '',
  },
})

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

// Table columns with mobile priorities
const columns: ResponsiveColumn[] = [
  { key: 'bom_number', label: 'BOM #', mobilePriority: 1 },
  { key: 'product.name', label: 'Product', mobilePriority: 2 },
  { key: 'output_quantity', label: 'Output', align: 'right', showInMobile: false },
  { key: 'unit_cost', label: 'Unit Cost', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(v as number) },
  { key: 'total_cost', label: 'Total Cost', align: 'right', showInMobile: false, format: (v) => formatCurrency(v as number) },
  { key: 'status', label: 'Status', showInMobile: false },
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Bill of Materials</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage product BOMs and production costs</p>
      </div>
      <div class="flex items-center gap-2">
        <RouterLink to="/boms/from-template">
          <Button variant="outline">
            <FileStack class="w-4 h-4 mr-2" />
            From Template
          </Button>
        </RouterLink>
        <RouterLink to="/boms/new">
          <Button>
            <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New BOM
          </Button>
        </RouterLink>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search BOMs..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
        <div class="w-48">
          <Select v-model="filters.status" :options="statusOptions" placeholder="All Status" />
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500">Failed to load BOMs</p>
    </div>

    <div v-else-if="isLoading" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <div v-else-if="isEmpty" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No BOMs found"
        description="Create your first Bill of Materials to define production costs"
        action-label="New BOM"
        @action="$router.push('/boms/new')"
      />
    </div>

    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <ResponsiveTable
        :items="boms"
        :columns="columns"
        :loading="isLoading"
        title-field="bom_number"
        subtitle-field="name"
        status-field="status"
        @row-click="(item) => $router.push(`/boms/${item.id}`)"
      >
        <!-- Custom cell: BOM number -->
        <template #cell-bom_number="{ item }">
          <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
            {{ item.bom_number }}
          </span>
          <div v-if="item.variant_label" class="text-xs text-slate-500 dark:text-slate-400">
            {{ item.variant_label }}
          </div>
        </template>

        <!-- Custom cell: Product -->
        <template #cell-product\.name="{ item }">
          <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.product?.name }}</div>
          <div class="text-sm text-slate-500 dark:text-slate-400">{{ item.name }}</div>
        </template>

        <!-- Custom cell: Output -->
        <template #cell-output_quantity="{ item }">
          {{ item.output_quantity }} {{ item.output_unit }}
        </template>

        <!-- Custom cell: Status -->
        <template #cell-status="{ item }">
          <Badge :status="item.status">
            {{ item.status.label }}
          </Badge>
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ item.bom_number }}
          </span>
        </template>

        <!-- Mobile status slot -->
        <template #mobile-status="{ item }">
          <Badge :status="item.status">
            {{ item.status.label }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <RouterLink :to="`/boms/${item.id}`">
            <Button variant="ghost" size="xs">View</Button>
          </RouterLink>
        </template>
      </ResponsiveTable>

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
  </div>
</template>
