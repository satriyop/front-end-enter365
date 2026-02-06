<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  useFollowUpList,
  useFollowUpSummary,
  useFollowUpStatistics,
  useAssignQuotation,
  useUpdatePriority,
  type FollowUpFilters,
  type StatisticsFilters,
} from '@/api/useQuotationFollowUp'
import type { Quotation } from '@/api/useQuotations'
import { useUsersLookup } from '@/api/useUsers'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate } from '@/utils/format'
import { AlertTriangle, Calendar, Clock, PhoneOff } from 'lucide-vue-next'
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from 'radix-vue'

import Button from '@/components/ui/Button.vue'
import Select from '@/components/ui/Select.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterGroup from '@/components/ui/FilterGroup.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { useToast } from '@/components/ui/Toast/useToast'
import { getErrorMessage } from '@/api/client'
import LogActivityModal from '@/components/quotations/LogActivityModal.vue'
import ScheduleFollowUpModal from '@/components/quotations/ScheduleFollowUpModal.vue'

const router = useRouter()
const toast = useToast()

// ─── User Filter (drives summary + list) ────────────────────────
const userFilter = ref<string>('')
const userIdForSummary = computed(() => userFilter.value || undefined)

// ─── Users Lookup ────────────────────────────────────────────────
const { data: users } = useUsersLookup()

const userOptions = computed(() => [
  { value: '', label: 'All Users' },
  ...(users.value?.map((u) => ({ value: String(u.id), label: u.name })) ?? []),
])

// ─── Summary (driven by user filter) ────────────────────────────
const { data: summary, isLoading: summaryLoading } = useFollowUpSummary(
  computed(() => userIdForSummary.value)
)

// ─── Statistics ──────────────────────────────────────────────────
const statsPreset = ref('30d')
const statsFilters = computed<StatisticsFilters>(() => computeDateRange(statsPreset.value))
const { data: statistics, isLoading: statsLoading } = useFollowUpStatistics(statsFilters)

const statsPresetOptions = [
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'all', label: 'All Time' },
]

function computeDateRange(preset: string): StatisticsFilters {
  const now = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]

  switch (preset) {
    case '30d':
      return { start_date: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30)), end_date: fmt(now) }
    case '90d':
      return { start_date: fmt(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90)), end_date: fmt(now) }
    case 'ytd':
      return { start_date: fmt(new Date(now.getFullYear(), 0, 1)), end_date: fmt(now) }
    case 'all':
    default:
      return {}
  }
}

// ─── Follow-Up List ──────────────────────────────────────────────
const {
  items: quotations,
  pagination,
  isLoading,
  error,
  filters,
  updateFilter,
} = useResourceList<Quotation, FollowUpFilters>({
  useListHook: useFollowUpList,
  initialFilters: {
    page: 1,
    per_page: 15,
    assigned_to: '',
    sort_by: 'next_follow_up_at',
    sort_dir: 'asc',
  },
})

// Sync user filter → list assigned_to
watch(userFilter, (val) => {
  updateFilter('assigned_to', val)
})

const sortOptions = [
  { value: 'next_follow_up_at', label: 'Follow-Up Date' },
  { value: 'days_since_last_contact', label: 'Days Since Contact' },
  { value: 'total_amount', label: 'Amount' },
]

const sortDirOptions = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
]

// ─── Mutations ───────────────────────────────────────────────────
const assignMutation = useAssignQuotation()
const priorityMutation = useUpdatePriority()

// ─── Modal State ─────────────────────────────────────────────────
const showLogActivity = ref(false)
const showScheduleFollowUp = ref(false)
const selectedQuotationId = ref(0)
const selectedFollowUp = ref<string | undefined>()

function openLogActivity(id: number) {
  selectedQuotationId.value = id
  showLogActivity.value = true
}

function openScheduleFollowUp(id: number, followUp?: string) {
  selectedQuotationId.value = id
  selectedFollowUp.value = followUp
  showScheduleFollowUp.value = true
}

async function handleAssign(quotationId: number, userId: number) {
  try {
    await assignMutation.mutateAsync({ id: quotationId, assigned_to: userId })
    toast.success('Quotation assigned')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to assign'))
  }
}

async function handlePriority(quotationId: number, priority: 'low' | 'normal' | 'high' | 'urgent') {
  try {
    await priorityMutation.mutateAsync({ id: quotationId, priority })
    toast.success('Priority updated')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to update priority'))
  }
}

// ─── Priority Helpers ────────────────────────────────────────────
type PriorityValue = 'low' | 'normal' | 'high' | 'urgent'
type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline'

const priorityBadgeVariant: Record<PriorityValue, BadgeVariant> = {
  low: 'outline',
  normal: 'default',
  high: 'warning',
  urgent: 'destructive',
}

function getPriorityVariant(priority?: { value: string }): BadgeVariant {
  return priorityBadgeVariant[(priority?.value as PriorityValue) ?? 'normal'] ?? 'default'
}

// ─── Follow-Up Date Urgency ─────────────────────────────────────
function getFollowUpClass(dateStr?: string): string {
  if (!dateStr) return 'text-muted-foreground'
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const followUpDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (followUpDate < today) return 'text-destructive font-medium'
  if (followUpDate.getTime() === today.getTime()) return 'text-amber-600 dark:text-amber-400 font-medium'
  return 'text-muted-foreground'
}

// ─── Table Columns ───────────────────────────────────────────────
const columns: ResponsiveColumn[] = [
  { key: 'quotation', label: 'Quotation', mobilePriority: 1 },
  { key: 'total_amount', label: 'Amount', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(v as number) },
  { key: 'priority', label: 'Priority', showInMobile: false },
  { key: 'next_follow_up_at', label: 'Next Follow-Up', mobilePriority: 2 },
  { key: 'assigned_user', label: 'Assigned To', showInMobile: false },
  { key: 'days_since_last_contact', label: 'Days Silent', align: 'right', showInMobile: false },
  { key: 'actions', label: '', width: '48px' },
]
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold">Quotation Follow-Up</h1>
        <p class="text-muted-foreground">Track and manage quotation follow-ups</p>
      </div>
      <div class="w-48">
        <Select
          v-model="userFilter"
          :options="userOptions"
          placeholder="Filter by user"
        />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Overdue"
        :value="summaryLoading ? '...' : summary?.overdue ?? '0'"
        :icon="AlertTriangle"
        :alert="Number(summary?.overdue ?? 0) > 0"
      />
      <StatCard
        label="Due Today"
        :value="summaryLoading ? '...' : summary?.today ?? '0'"
        :icon="Calendar"
      />
      <StatCard
        label="This Week"
        :value="summaryLoading ? '...' : summary?.upcoming_week ?? '0'"
        :icon="Clock"
      />
      <StatCard
        label="No Follow-Up"
        :value="summaryLoading ? '...' : summary?.no_follow_up_scheduled ?? '0'"
        :icon="PhoneOff"
        :alert="Number(summary?.no_follow_up_scheduled ?? 0) > 0"
      />
    </div>

    <!-- Conversion Statistics -->
    <Card class="mb-6">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-sm">Conversion Statistics</h2>
          <div class="w-40">
            <Select
              v-model="statsPreset"
              :options="statsPresetOptions"
            />
          </div>
        </div>

        <div v-if="statsLoading" class="text-center text-muted-foreground py-4">Loading statistics...</div>

        <template v-else-if="statistics">
          <!-- Metrics Row -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
            <div class="text-center p-3 rounded-lg bg-muted/50">
              <div class="text-2xl font-bold">{{ statistics.conversion_rate }}%</div>
              <div class="text-xs text-muted-foreground">Conversion Rate</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <div class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(statistics.values.won) }}</div>
              <div class="text-xs text-muted-foreground">Won Value</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div class="text-lg font-bold text-red-600 dark:text-red-400">{{ formatCurrency(statistics.values.lost) }}</div>
              <div class="text-xs text-muted-foreground">Lost Value</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <div class="text-lg font-bold text-amber-600 dark:text-amber-400">{{ formatCurrency(statistics.values.pending) }}</div>
              <div class="text-xs text-muted-foreground">Pending Value</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-muted/50">
              <div class="text-2xl font-bold">{{ statistics.counts.total }}</div>
              <div class="text-xs text-muted-foreground">Total Quotations</div>
            </div>
          </div>

          <!-- Lost Reasons Breakdown -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6" v-if="statistics.won_reasons.length > 0 || statistics.lost_reasons.length > 0">
            <div v-if="statistics.won_reasons.length > 0">
              <h3 class="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">Won Reasons</h3>
              <ul class="space-y-1.5">
                <li
                  v-for="r in statistics.won_reasons"
                  :key="r.reason"
                  class="flex items-center justify-between text-sm"
                >
                  <span class="text-muted-foreground">{{ r.label }}</span>
                  <span class="font-medium">{{ r.count }} ({{ formatCurrency(r.value) }})</span>
                </li>
              </ul>
            </div>
            <div v-if="statistics.lost_reasons.length > 0">
              <h3 class="text-sm font-medium text-red-700 dark:text-red-400 mb-2">Lost Reasons</h3>
              <ul class="space-y-1.5">
                <li
                  v-for="r in statistics.lost_reasons"
                  :key="r.reason"
                  class="flex items-center justify-between text-sm"
                >
                  <span class="text-muted-foreground">{{ r.label }}</span>
                  <span class="font-medium">{{ r.count }} ({{ formatCurrency(r.value) }})</span>
                </li>
              </ul>
            </div>
          </div>
        </template>
      </div>
    </Card>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup min-width="180px">
        <Select
          :model-value="filters.sort_by"
          :options="sortOptions"
          placeholder="Sort By"
          @update:model-value="(v) => updateFilter('sort_by', String(v))"
        />
      </FilterGroup>
      <FilterGroup min-width="140px">
        <Select
          :model-value="filters.sort_dir"
          :options="sortDirOptions"
          placeholder="Direction"
          @update:model-value="(v) => updateFilter('sort_dir', String(v))"
        />
      </FilterGroup>
    </FilterBar>

    <!-- Follow-Up List -->
    <Card :padding="false">
      <div v-if="isLoading" class="p-8 text-center text-muted-foreground">Loading...</div>
      <div v-else-if="error" class="p-8 text-center text-destructive">Failed to load follow-ups</div>
      <div v-else-if="quotations.length === 0" class="p-8 text-center">
        <div class="text-4xl mb-2">📞</div>
        <div class="font-medium">No quotations need follow-up</div>
        <div class="text-muted-foreground text-sm">All caught up!</div>
      </div>

      <ResponsiveTable
        v-if="quotations.length > 0"
        :items="quotations"
        :columns="columns"
        :loading="isLoading"
        title-field="quotation"
        @row-click="(item) => router.push({ name: 'quotation-detail', params: { id: item.id } })"
      >
        <!-- Quotation -->
        <template #cell-quotation="{ item }">
          <div class="font-medium text-orange-600 dark:text-orange-400">
            {{ (item as Quotation).full_number }}
          </div>
          <div class="text-sm text-muted-foreground">{{ (item as Quotation).contact?.name }}</div>
        </template>

        <!-- Priority -->
        <template #cell-priority="{ item }">
          <Badge :variant="getPriorityVariant((item as Quotation).priority as any)">
            {{ (item as Quotation).priority?.label ?? 'Normal' }}
          </Badge>
        </template>

        <!-- Next Follow-Up -->
        <template #cell-next_follow_up_at="{ item }">
          <span :class="getFollowUpClass((item as Quotation).next_follow_up_at)">
            {{ (item as Quotation).next_follow_up_at ? formatDate((item as Quotation).next_follow_up_at) : 'Not set' }}
          </span>
        </template>

        <!-- Assigned To -->
        <template #cell-assigned_user="{ item }">
          <span class="text-muted-foreground">
            {{ (item as Quotation).assigned_user?.name ?? 'Unassigned' }}
          </span>
        </template>

        <!-- Days Silent -->
        <template #cell-days_since_last_contact="{ item }">
          <span
            :class="[
              'tabular-nums',
              ((item as Quotation).days_since_last_contact ?? 0) > 7
                ? 'text-destructive font-medium'
                : 'text-muted-foreground',
            ]"
          >
            {{ (item as Quotation).days_since_last_contact ?? '-' }}
          </span>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ item }">
          <DropdownMenuRoot>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon-sm" @click.stop>
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent
                class="z-50 min-w-[10rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                :side-offset="4"
                align="end"
                @click.stop
              >
                <DropdownMenuItem
                  class="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
                  @select="openScheduleFollowUp(item.id as number, (item as Quotation).next_follow_up_at)"
                >
                  Schedule Follow-Up
                </DropdownMenuItem>
                <DropdownMenuItem
                  class="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
                  @select="openLogActivity(item.id as number)"
                >
                  Log Activity
                </DropdownMenuItem>

                <DropdownMenuSeparator class="h-px bg-border my-1" />

                <!-- Priority Sub-menu -->
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger
                    class="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent"
                  >
                    Set Priority
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent
                      class="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                    >
                      <DropdownMenuItem
                        v-for="p in (['low', 'normal', 'high', 'urgent'] as PriorityValue[])"
                        :key="p"
                        class="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground capitalize"
                        @select="handlePriority(item.id as number, p)"
                      >
                        {{ p }}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <!-- Assign Sub-menu -->
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger
                    class="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent"
                  >
                    Assign To
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent
                      class="z-50 min-w-[10rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-h-60 overflow-y-auto"
                    >
                      <DropdownMenuItem
                        v-for="u in (users ?? [])"
                        :key="u.id"
                        class="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
                        @select="handleAssign(item.id as number, u.id)"
                      >
                        {{ u.name }}
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuRoot>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ (item as Quotation).full_number }}
          </span>
        </template>
      </ResponsiveTable>

      <!-- Pagination -->
      <div
        v-if="pagination"
        class="px-6 py-4 border-t flex items-center justify-between"
      >
        <div class="text-sm text-muted-foreground">
          Showing {{ (pagination.current_page - 1) * pagination.per_page + 1 }}
          to {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }}
          of {{ pagination.total }}
        </div>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.current_page === 1"
            @click="filters.page = pagination.current_page - 1"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="pagination.current_page === pagination.last_page"
            @click="filters.page = pagination.current_page + 1"
          >
            Next
          </Button>
        </div>
      </div>
    </Card>

    <!-- Modals -->
    <LogActivityModal
      :open="showLogActivity"
      :quotation-id="selectedQuotationId"
      @update:open="showLogActivity = $event"
    />
    <ScheduleFollowUpModal
      :open="showScheduleFollowUp"
      :quotation-id="selectedQuotationId"
      :current-follow-up="selectedFollowUp"
      @update:open="showScheduleFollowUp = $event"
    />
  </div>
</template>
