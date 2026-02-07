<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  useNsfpRanges,
  useNsfpUtilization,
  type NsfpRange,
  type NsfpRangeFilters,
} from '@/api/useNsfpRanges'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Select, Pagination, EmptyState, Badge, Card, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Eye, Pencil, Hash } from 'lucide-vue-next'

// Year code filter for utilization
const yearCodeFilter = ref<string | undefined>(undefined)

// Utilization summary
const { data: utilization, isLoading: utilizationLoading } = useNsfpUtilization(
  computed(() => yearCodeFilter.value)
)

// Resource list with filters and pagination
const {
  items: ranges,
  pagination,
  isLoading,
  error,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<NsfpRange, NsfpRangeFilters>({
  useListHook: useNsfpRanges,
  initialFilters: {
    page: 1,
    per_page: 15,
    year_code: '',
    is_active: undefined,
  },
})

// Year options - current year + a few previous
const currentYear = new Date().getFullYear()
const yearOptions = computed(() => [
  { value: '', label: 'All Years' },
  ...Array.from({ length: 5 }, (_, i) => {
    const year = currentYear - i
    const code = String(year).slice(-2)
    return { value: code, label: `${year} (${code})` }
  }),
])

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

function handleYearChange(value: string | number | null) {
  const strValue = String(value ?? '')
  updateFilter('year_code', strValue)
  yearCodeFilter.value = strValue || undefined
}

// Status badge logic
function getStatusVariant(range: NsfpRange): 'success' | 'default' | 'destructive' | 'warning' {
  if (range.is_exhausted) return 'destructive'
  if (range.is_low_stock) return 'warning'
  if (!range.is_active) return 'default'
  return 'success'
}

function getStatusLabel(range: NsfpRange): string {
  if (range.is_exhausted) return 'Exhausted'
  if (range.is_low_stock) return 'Low Stock'
  if (!range.is_active) return 'Inactive'
  return 'Active'
}

// Utilization bar color
const utilizationBarColor = computed(() => {
  const pct = utilization.value?.summary.utilization_percent ?? 0
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 75) return 'bg-amber-500'
  return 'bg-green-500'
})

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'range', label: 'Range', mobilePriority: 1 },
  { key: 'year_code', label: 'Year', showInMobile: false },
  { key: 'usage', label: 'Used / Capacity', mobilePriority: 2 },
  { key: 'remaining', label: 'Remaining', showInMobile: false },
  { key: 'status', label: 'Status', align: 'center', showInMobile: false },
]
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">NSFP Ranges</h1>
        <p class="text-muted-foreground">Manage tax invoice serial number allocations</p>
      </div>
      <RouterLink to="/settings/nsfp-ranges/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Range
        </Button>
      </RouterLink>
    </div>

    <!-- Utilization Summary Card -->
    <Card v-if="!utilizationLoading && utilization" class="mb-6">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <Hash class="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-medium text-slate-900 dark:text-slate-100 mb-3">Utilization Overview</h4>

          <!-- Stats Row -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
            <div>
              <p class="text-xs text-muted-foreground">Total Capacity</p>
              <p class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {{ utilization.summary.total_capacity }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Used</p>
              <p class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {{ utilization.summary.total_used }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Remaining</p>
              <p class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {{ utilization.summary.total_remaining }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground">Active Ranges</p>
              <p class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {{ utilization.summary.active_ranges }} / {{ utilization.summary.total_ranges }}
              </p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
            <div
              class="h-2.5 rounded-full transition-all"
              :class="utilizationBarColor"
              :style="{ width: `${Math.min(utilization.summary.utilization_percent, 100)}%` }"
            />
          </div>
          <p class="text-xs text-muted-foreground mt-1">
            {{ utilization.summary.utilization_percent }}% utilized
          </p>
        </div>
      </div>
    </Card>

    <!-- Filters -->
    <div class="bg-card rounded-xl border border-border p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="w-40">
          <Select
            :model-value="filters.year_code ?? ''"
            :options="yearOptions"
            @update:model-value="handleYearChange"
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
      <p class="text-destructive">Failed to load NSFP ranges</p>
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
    <div v-else-if="ranges.length === 0" class="bg-card rounded-xl border border-border">
      <EmptyState
        title="No NSFP ranges found"
        description="Create an NSFP range to start allocating tax invoice serial numbers"
        action-label="New Range"
        @action="$router.push('/settings/nsfp-ranges/new')"
      />
    </div>

    <!-- Data Table -->
    <div v-else class="bg-card rounded-xl border border-border overflow-hidden">
      <ResponsiveTable
        :items="ranges"
        :columns="columns"
        :loading="isLoading"
        title-field="formatted_range_start"
        @row-click="(item) => $router.push(`/settings/nsfp-ranges/${item.id}`)"
      >
        <!-- Custom cell: Range -->
        <template #cell-range="{ item }">
          <span class="font-mono text-sm text-primary hover:text-primary/80 font-medium">
            {{ item.formatted_range_start }} — {{ item.formatted_range_end }}
          </span>
        </template>

        <!-- Custom cell: Year -->
        <template #cell-year_code="{ item }">
          <span class="text-sm text-foreground">20{{ item.year_code }}</span>
        </template>

        <!-- Custom cell: Usage -->
        <template #cell-usage="{ item }">
          <div class="flex items-center gap-2">
            <div class="flex-1 max-w-[120px]">
              <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                <div
                  class="h-1.5 rounded-full transition-all"
                  :class="{
                    'bg-red-500': item.utilization_percent >= 90,
                    'bg-amber-500': item.utilization_percent >= 75 && item.utilization_percent < 90,
                    'bg-green-500': item.utilization_percent < 75,
                  }"
                  :style="{ width: `${Math.min(item.utilization_percent, 100)}%` }"
                />
              </div>
            </div>
            <span class="text-xs text-muted-foreground whitespace-nowrap">
              {{ item.used_count }} / {{ item.capacity }}
            </span>
          </div>
        </template>

        <!-- Custom cell: Remaining -->
        <template #cell-remaining="{ item }">
          <span class="text-sm tabular-nums" :class="item.remaining <= 0 ? 'text-destructive' : 'text-foreground'">
            {{ item.remaining.toLocaleString() }}
          </span>
        </template>

        <!-- Custom cell: Status -->
        <template #cell-status="{ item }">
          <Badge :variant="getStatusVariant(item)">
            {{ getStatusLabel(item) }}
          </Badge>
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="font-mono text-primary font-medium text-sm">
            {{ item.formatted_range_start }} — {{ item.formatted_range_end }}
          </span>
        </template>

        <!-- Mobile status slot -->
        <template #mobile-status="{ item }">
          <Badge :variant="getStatusVariant(item)">
            {{ getStatusLabel(item) }}
          </Badge>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-1">
            <RouterLink :to="`/settings/nsfp-ranges/${item.id}`">
              <Button variant="ghost" size="xs" title="View Details">
                <Eye class="w-4 h-4" />
              </Button>
            </RouterLink>
            <RouterLink v-if="item.is_active && !item.is_exhausted" :to="`/settings/nsfp-ranges/${item.id}/edit`">
              <Button variant="ghost" size="xs" title="Edit">
                <Pencil class="w-4 h-4" />
              </Button>
            </RouterLink>
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
  </div>
</template>
