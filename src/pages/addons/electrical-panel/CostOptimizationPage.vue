<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useBoms, type Bom, type BomFilters } from '@/api/useBoms'
import { api } from '@/api/client'
import type { CostOptimizationPreview } from '@/api/useComponentStandards'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatPercent, toNumber } from '@/utils/format'
import {
  Badge,
  Button,
  Select,
  StatCard,
  Pagination,
  ResponsiveTable,
  type ResponsiveColumn,
} from '@/components/ui'
import { Package, TrendingDown, DollarSign, Percent, Eye } from 'lucide-vue-next'

const router = useRouter()

// ─────────────────────────────────────────────
// BOM List (active only)
// ─────────────────────────────────────────────

const {
  items: boms,
  pagination,
  isLoading: bomsLoading,
  error: bomsError,
  isEmpty: bomsEmpty,
  goToPage,
} = useResourceList<Bom, BomFilters>({
  useListHook: useBoms,
  initialFilters: {
    page: 1,
    per_page: 100,
    status: 'active',
  },
})

// ─────────────────────────────────────────────
// Progressive Optimization Loading
// ─────────────────────────────────────────────

type OptResult = CostOptimizationPreview | 'loading' | 'error'

const optimizationResults = ref<Map<number, OptResult>>(new Map())
const isAnalyzing = ref(false)

async function loadOptimizationBatch(bomIds: number[]) {
  const promises = bomIds.map(async (id) => {
    optimizationResults.value.set(id, 'loading')
    try {
      const response = await api.get<{ data: CostOptimizationPreview }>(
        `/boms/${id}/cost-optimization`
      )
      optimizationResults.value.set(id, response.data.data)
    } catch {
      optimizationResults.value.set(id, 'error')
    }
    // Trigger reactivity
    optimizationResults.value = new Map(optimizationResults.value)
  })
  await Promise.all(promises)
}

watch(
  () => boms.value,
  async (data) => {
    if (!data?.length) return
    isAnalyzing.value = true
    const bomIds = data.map((b) => b.id)

    for (let i = 0; i < bomIds.length; i += 5) {
      const batch = bomIds.slice(i, i + 5)
      await loadOptimizationBatch(batch)
    }
    isAnalyzing.value = false
  },
  { immediate: true }
)

// ─────────────────────────────────────────────
// Computed Aggregates
// ─────────────────────────────────────────────

const analyzedBoms = computed(() => {
  return [...optimizationResults.value.entries()]
    .filter(([, v]) => typeof v === 'object')
    .map(([id, preview]) => ({ id, preview: preview as CostOptimizationPreview }))
})

const totalAnalyzed = computed(() => analyzedBoms.value.length)
const totalBoms = computed(() => boms.value?.length ?? 0)

const bomsWithSavings = computed(() =>
  analyzedBoms.value.filter((b) => toNumber(b.preview.savings) > 0).length
)

const totalSavings = computed(() =>
  analyzedBoms.value.reduce((sum, b) => sum + toNumber(b.preview.savings), 0)
)

const avgSavingsPercent = computed(() => {
  const optimizable = analyzedBoms.value.filter((b) => toNumber(b.preview.savings) > 0)
  if (optimizable.length === 0) return 0
  const total = optimizable.reduce((sum, b) => sum + toNumber(b.preview.savings_percentage), 0)
  return total / optimizable.length
})

const progressPercent = computed(() => {
  if (totalBoms.value === 0) return 0
  return Math.round((totalAnalyzed.value / totalBoms.value) * 100)
})

// ─────────────────────────────────────────────
// Sort Controls
// ─────────────────────────────────────────────

type SortKey = 'savings' | 'savings_pct' | 'optimizable' | 'name'

const sortBy = ref<SortKey>('savings')

const sortOptions = [
  { value: 'savings', label: 'Highest Savings' },
  { value: 'savings_pct', label: 'Highest Savings %' },
  { value: 'optimizable', label: 'Most Optimizable Items' },
  { value: 'name', label: 'BOM Name A-Z' },
]

// ─────────────────────────────────────────────
// Sorted Rows
// ─────────────────────────────────────────────

interface TableRow {
  bom: Bom
  optimization: OptResult | undefined
}

const sortedRows = computed<TableRow[]>(() => {
  const rows: TableRow[] = (boms.value ?? []).map((bom) => ({
    bom,
    optimization: optimizationResults.value.get(bom.id),
  }))

  return rows.sort((a, b) => {
    const aOpt = typeof a.optimization === 'object' ? a.optimization : null
    const bOpt = typeof b.optimization === 'object' ? b.optimization : null

    switch (sortBy.value) {
      case 'savings': {
        const aVal = aOpt ? toNumber(aOpt.savings) : -1
        const bVal = bOpt ? toNumber(bOpt.savings) : -1
        return bVal - aVal
      }
      case 'savings_pct': {
        const aVal = aOpt ? toNumber(aOpt.savings_percentage) : -1
        const bVal = bOpt ? toNumber(bOpt.savings_percentage) : -1
        return bVal - aVal
      }
      case 'optimizable': {
        const aVal = aOpt ? aOpt.summary.can_optimize : -1
        const bVal = bOpt ? bOpt.summary.can_optimize : -1
        return bVal - aVal
      }
      case 'name':
        return (a.bom.bom_number ?? '').localeCompare(b.bom.bom_number ?? '')
      default:
        return 0
    }
  })
})

// ─────────────────────────────────────────────
// Table Columns
// ─────────────────────────────────────────────

const columns: ResponsiveColumn[] = [
  { key: 'bom_number', label: 'BOM #', mobilePriority: 1 },
  { key: 'product', label: 'Product', mobilePriority: 2 },
  { key: 'current_cost', label: 'Current Cost', align: 'right', showInMobile: false },
  { key: 'optimized_cost', label: 'Optimized Cost', align: 'right', showInMobile: false },
  { key: 'savings', label: 'Potential Savings', align: 'right', mobilePriority: 3 },
  { key: 'savings_pct', label: 'Savings %', align: 'right', showInMobile: false },
  { key: 'optimizable_items', label: 'Optimizable', align: 'center', showInMobile: false },
  { key: 'status_col', label: 'Status', showInMobile: false },
]

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getPreview(row: TableRow): CostOptimizationPreview | null {
  return typeof row.optimization === 'object' ? row.optimization : null
}

function isRowLoading(row: TableRow): boolean {
  return row.optimization === 'loading'
}

function isRowError(row: TableRow): boolean {
  return row.optimization === 'error'
}

function getSavingsBadgeVariant(pct: number): string {
  if (pct <= 0) return 'secondary'
  if (pct < 10) return 'info'
  if (pct < 25) return 'warning'
  return 'success'
}

function getSavingsBadgeLabel(pct: number): string {
  if (pct <= 0) return 'Already Optimal'
  if (pct < 10) return 'Low'
  if (pct < 25) return 'Medium'
  return 'High'
}

function handleOptimize(bomId: number) {
  router.push(`/boms/${bomId}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Cost Optimization</h1>
      <p class="text-slate-500 dark:text-slate-400">
        Analisis potensi penghematan biaya material BOM
      </p>
    </div>

    <!-- Progress Bar (during analysis) -->
    <div
      v-if="isAnalyzing && totalBoms > 0"
      class="mb-6 bg-card rounded-lg border border-border p-4"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">
          Analyzing BOMs...
        </span>
        <span class="text-sm text-muted-foreground">
          {{ totalAnalyzed }} of {{ totalBoms }} BOMs
        </span>
      </div>
      <div class="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary rounded-full transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <!-- Summary StatCards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total BOMs Analyzed"
        :value="bomsLoading ? '...' : `${totalAnalyzed} / ${totalBoms}`"
        :icon="Package"
      />
      <StatCard
        label="BOMs with Savings"
        :value="bomsLoading ? '...' : String(bomsWithSavings)"
        :icon="TrendingDown"
        :alert="bomsWithSavings > 0"
      />
      <StatCard
        label="Total Potential Savings"
        :value="bomsLoading ? '...' : formatCurrency(totalSavings)"
        :icon="DollarSign"
      />
      <StatCard
        label="Avg Savings %"
        :value="bomsLoading ? '...' : formatPercent(avgSavingsPercent)"
        :icon="Percent"
      />
    </div>

    <!-- Sort Controls -->
    <div class="bg-card rounded-xl border border-border p-4 mb-6">
      <div class="flex items-center gap-4">
        <span class="text-sm text-muted-foreground whitespace-nowrap">Sort by:</span>
        <div class="w-56">
          <Select v-model="sortBy" :options="sortOptions" />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-if="bomsError"
      class="bg-card rounded-xl border border-border p-8 text-center"
    >
      <p class="text-destructive">Failed to load BOMs</p>
    </div>

    <!-- Loading State -->
    <div
      v-else-if="bomsLoading"
      class="bg-card rounded-xl border border-border p-8 text-center"
    >
      <div class="flex items-center justify-center gap-2 text-muted-foreground">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading active BOMs...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="bomsEmpty"
      class="bg-card rounded-xl border border-border p-8 text-center"
    >
      <Package class="w-12 h-12 text-muted-foreground mx-auto mb-3" />
      <p class="text-slate-700 dark:text-slate-300 font-medium">No active BOMs found</p>
      <p class="text-sm text-muted-foreground">
        Activate BOMs to analyze their cost optimization potential
      </p>
    </div>

    <!-- Main Table -->
    <div
      v-else
      class="bg-card rounded-xl border border-border overflow-hidden"
    >
      <ResponsiveTable
        :items="sortedRows"
        :columns="columns"
        :loading="bomsLoading"
        title-field="bom.bom_number"
        subtitle-field="bom.product.name"
        @row-click="(row) => handleOptimize(row.bom.id)"
      >
        <!-- BOM Number -->
        <template #cell-bom_number="{ item }">
          <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 font-medium">
            {{ item.bom.bom_number }}
          </span>
          <div v-if="item.bom.variant_label" class="text-xs text-muted-foreground">
            {{ item.bom.variant_label }}
          </div>
        </template>

        <!-- Product -->
        <template #cell-product="{ item }">
          <div class="font-medium text-slate-900 dark:text-slate-100">
            {{ item.bom.product?.name }}
          </div>
          <div class="text-sm text-muted-foreground">{{ item.bom.name }}</div>
        </template>

        <!-- Current Cost -->
        <template #cell-current_cost="{ item }">
          <template v-if="isRowLoading(item)">
            <span class="text-muted-foreground">—</span>
          </template>
          <template v-else-if="isRowError(item)">
            <span class="text-destructive text-sm">Error</span>
          </template>
          <template v-else-if="getPreview(item)">
            {{ formatCurrency(getPreview(item)!.current_total) }}
          </template>
          <template v-else>
            <span class="text-muted-foreground">—</span>
          </template>
        </template>

        <!-- Optimized Cost -->
        <template #cell-optimized_cost="{ item }">
          <template v-if="isRowLoading(item)">
            <span class="text-muted-foreground">—</span>
          </template>
          <template v-else-if="isRowError(item)">
            <span class="text-destructive text-sm">Error</span>
          </template>
          <template v-else-if="getPreview(item)">
            <span
              :class="
                toNumber(getPreview(item)!.optimized_total) < toNumber(getPreview(item)!.current_total)
                  ? 'text-green-600 dark:text-green-400'
                  : ''
              "
            >
              {{ formatCurrency(getPreview(item)!.optimized_total) }}
            </span>
          </template>
          <template v-else>
            <span class="text-muted-foreground">—</span>
          </template>
        </template>

        <!-- Potential Savings -->
        <template #cell-savings="{ item }">
          <template v-if="isRowLoading(item)">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          </template>
          <template v-else-if="isRowError(item)">
            <span class="text-destructive text-sm">Failed</span>
          </template>
          <template v-else-if="getPreview(item)">
            <span
              v-if="toNumber(getPreview(item)!.savings) > 0"
              class="text-green-600 dark:text-green-400 font-semibold"
            >
              {{ formatCurrency(getPreview(item)!.savings) }}
            </span>
            <span v-else class="text-muted-foreground">—</span>
          </template>
          <template v-else>
            <span class="text-muted-foreground">—</span>
          </template>
        </template>

        <!-- Savings % -->
        <template #cell-savings_pct="{ item }">
          <template v-if="isRowLoading(item) || isRowError(item) || !getPreview(item)">
            <span class="text-muted-foreground">—</span>
          </template>
          <template v-else>
            <Badge :status="getSavingsBadgeVariant(toNumber(getPreview(item)!.savings_percentage))">
              {{ getSavingsBadgeLabel(toNumber(getPreview(item)!.savings_percentage)) }}
              <template v-if="toNumber(getPreview(item)!.savings_percentage) > 0">
                ({{ formatPercent(getPreview(item)!.savings_percentage) }})
              </template>
            </Badge>
          </template>
        </template>

        <!-- Optimizable Items -->
        <template #cell-optimizable_items="{ item }">
          <template v-if="isRowLoading(item) || isRowError(item) || !getPreview(item)">
            <span class="text-muted-foreground">—</span>
          </template>
          <template v-else>
            <span class="text-sm">
              {{ getPreview(item)!.summary.can_optimize }} / {{ getPreview(item)!.summary.total_items }}
            </span>
          </template>
        </template>

        <!-- Status -->
        <template #cell-status_col="{ item }">
          <template v-if="isRowLoading(item)">
            <div class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span class="text-sm text-muted-foreground">Analyzing</span>
            </div>
          </template>
          <template v-else-if="isRowError(item)">
            <span class="text-destructive text-sm">Failed to analyze</span>
          </template>
          <template v-else-if="getPreview(item)">
            <Badge
              v-if="toNumber(getPreview(item)!.savings) > 0"
              status="success"
            >
              Has Savings
            </Badge>
            <Badge v-else status="secondary">
              Already Optimal
            </Badge>
          </template>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ item.bom.bom_number }}
          </span>
        </template>

        <!-- Mobile status -->
        <template #mobile-status="{ item }">
          <template v-if="isRowLoading(item)">
            <svg class="w-4 h-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </template>
          <template v-else-if="getPreview(item) && toNumber(getPreview(item)!.savings) > 0">
            <span class="text-green-600 dark:text-green-400 font-semibold text-sm">
              {{ formatCurrency(getPreview(item)!.savings) }}
            </span>
          </template>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center gap-1">
            <Button
              v-if="getPreview(item) && toNumber(getPreview(item)!.savings) > 0"
              variant="default"
              size="xs"
              @click.stop="handleOptimize(item.bom.id)"
            >
              Optimize
            </Button>
            <RouterLink :to="`/boms/${item.bom.id}`">
              <Button variant="ghost" size="xs">
                <Eye class="w-4 h-4" />
              </Button>
            </RouterLink>
          </div>
        </template>
      </ResponsiveTable>

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
