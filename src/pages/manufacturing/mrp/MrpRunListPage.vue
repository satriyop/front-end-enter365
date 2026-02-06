<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  useMrpRuns,
  getMrpRunStatusLabel,
  formatMrpRunNumber,
  type MrpRun,
  type MrpRunFilters,
} from '@/api/useMrp'
import { useResourceList } from '@/composables/useResourceList'
import { formatDate } from '@/utils/format'
import { Cpu, Plus } from 'lucide-vue-next'

// UI Components
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  Pagination,
  ResponsiveTable,
  type ResponsiveColumn,
} from '@/components/ui'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterGroup from '@/components/ui/FilterGroup.vue'

const router = useRouter()

// Resource list with filters and pagination
const {
  items: mrpRuns,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<MrpRun, MrpRunFilters>({
  useListHook: useMrpRuns,
  initialFilters: {
    page: 1,
    per_page: 20,
    status: undefined,
    search: '',
  },
})

// Status options for filter
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Completed' },
  { value: 'applied', label: 'Applied' },
  { value: 'cancelled', label: 'Cancelled' },
]

// Handle status filter change
function handleStatusChange(value: string | number | null) {
  updateFilter('status', value === '' ? undefined : String(value))
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'run_number', label: 'Run #', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'planning_horizon', label: 'Horizon', showInMobile: false },
  { key: 'demands_count', label: 'Shortages', align: 'center', showInMobile: false },
  { key: 'suggestions_count', label: 'Suggestions', align: 'center', mobilePriority: 3 },
  { key: 'status', label: 'Status', showInMobile: false },
  { key: 'created_at', label: 'Created', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'actions', label: '', showInMobile: false },
]

// Navigate to detail
function viewMrpRun(item: Record<string, unknown>) {
  router.push(`/manufacturing/mrp/${item.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">MRP Runs</h1>
        <p class="text-muted-foreground">Material Requirements Planning - Plan and manage material needs</p>
      </div>
      <RouterLink to="/manufacturing/mrp/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New MRP Run
        </Button>
      </RouterLink>
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup grow>
        <Input
          :model-value="filters.search"
          placeholder="Search run number, name..."
          @update:model-value="(v) => updateFilter('search', String(v))"
        />
      </FilterGroup>

      <FilterGroup min-width="180px">
        <Select
          :model-value="filters.status || ''"
          :options="statusOptions"
          placeholder="Status"
          @update:model-value="handleStatusChange"
        />
      </FilterGroup>
    </FilterBar>

    <!-- Error State -->
    <Card v-if="error" class="text-center py-8">
      <p class="text-destructive">Failed to load MRP runs</p>
    </Card>

    <!-- Loading State -->
    <Card v-else-if="isLoading" class="text-center py-8">
      <div class="flex items-center justify-center gap-2 text-muted-foreground">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </Card>

    <!-- Empty State -->
    <Card v-else-if="isEmpty" class="text-center py-12">
      <Cpu class="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
      <h3 class="text-lg font-medium text-foreground mb-1">No MRP runs found</h3>
      <p class="text-muted-foreground mb-4">
        Create an MRP run to analyze material requirements and generate suggestions
      </p>
      <RouterLink to="/manufacturing/mrp/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Create MRP Run
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="mrpRuns"
        :columns="columns"
        :loading="isLoading"
        title-field="run_number"
        @row-click="viewMrpRun"
      >
        <!-- Run Number -->
        <template #cell-run_number="{ item }">
          <span class="text-primary font-medium">
            {{ formatMrpRunNumber(item as MrpRun) }}
          </span>
        </template>

        <!-- Name -->
        <template #cell-name="{ item }">
          <span class="text-foreground">
            {{ (item as MrpRun).name || '-' }}
          </span>
        </template>

        <!-- Planning Horizon -->
        <template #cell-planning_horizon="{ item }">
          <div class="text-foreground">
            <div>{{ formatDate((item as MrpRun).planning_horizon_start || '') }}</div>
            <div class="text-muted-foreground text-sm">
              to {{ formatDate((item as MrpRun).planning_horizon_end || '') }}
            </div>
          </div>
        </template>

        <!-- Demands Count (Shortages) -->
        <template #cell-demands_count="{ item }">
          <span
            :class="[
              'font-medium',
              ((item as MrpRun).demands?.filter(d => d.quantity_short && d.quantity_short > 0).length || 0) > 0
                ? 'text-destructive'
                : 'text-muted-foreground'
            ]"
          >
            {{ (item as MrpRun).demands?.filter(d => d.quantity_short && d.quantity_short > 0).length || 0 }}
          </span>
        </template>

        <!-- Suggestions Count -->
        <template #cell-suggestions_count="{ item }">
          <span class="text-foreground">
            {{ (item as MrpRun).suggestions?.length || 0 }}
          </span>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <Badge :class="getMrpRunStatusLabel(item as MrpRun).color">
            {{ getMrpRunStatusLabel(item as MrpRun).label }}
          </Badge>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="text-primary font-medium">
            {{ formatMrpRunNumber(item as MrpRun) }}
          </span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <Badge :class="getMrpRunStatusLabel(item as MrpRun).color">
            {{ getMrpRunStatusLabel(item as MrpRun).label }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <Button variant="ghost" size="xs" @click.stop="viewMrpRun(item as Record<string, unknown>)">
            View
          </Button>
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
    </Card>
  </div>
</template>
