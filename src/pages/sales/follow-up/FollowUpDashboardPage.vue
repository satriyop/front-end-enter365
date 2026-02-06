<script setup lang="ts">
import { ref, computed } from 'vue'
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

// ─── Summary ──────────────────────────────────────────────────────
const { data: summary, isLoading: summaryLoading } = useFollowUpSummary()

// ─── Statistics ───────────────────────────────────────────────────
const showStatistics = ref(false)
const statsFilters = ref<StatisticsFilters>({})
const { data: statistics, isLoading: statsLoading } = useFollowUpStatistics(statsFilters)

// ─── Follow-Up List ───────────────────────────────────────────────
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

// ─── Users Lookup ─────────────────────────────────────────────────
const { data: users } = useUsersLookup()

const assignedToOptions = computed(() => [
  { value: '', label: 'All Users' },
  ...(users.value?.map((u) => ({ value: String(u.id), label: u.name })) ?? []),
])

const sortOptions = [
  { value: 'next_follow_up_at', label: 'Follow-Up Date' },
  { value: 'total_amount', label: 'Amount' },
  { value: 'priority', label: 'Priority' },
]

// ─── Mutations ────────────────────────────────────────────────────
const assignMutation = useAssignQuotation()
const priorityMutation = useUpdatePriority()

// ─── Modal State ──────────────────────────────────────────────────
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
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to assign'))
  }
}

async function handlePriority(quotationId: number, priority: 'low' | 'normal' | 'high' | 'urgent') {
  try {
    await priorityMutation.mutateAsync({ id: quotationId, priority })
    toast.success('Priority updated')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to update priority'))
  }
}

// ─── Priority Helpers ─────────────────────────────────────────────
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

// ─── Follow-Up Date Urgency ───────────────────────────────────────
function getFollowUpClass(dateStr?: string): string {
  if (!dateStr) return 'text-muted-foreground'
  const date = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const followUpDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (followUpDate < today) return 'text-red-600 dark:text-red-400 font-medium'
  if (followUpDate.getTime() === today.getTime()) return 'text-orange-600 dark:text-orange-400 font-medium'
  return 'text-muted-foreground'
}

// ─── Table Columns ────────────────────────────────────────────────
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
    <div class="mb-6">
      <h1 class="text-2xl font-semibold">Follow-Up Dashboard</h1>
      <p class="text-muted-foreground">Track and manage quotation follow-ups</p>
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

    <!-- Statistics Panel (collapsible) -->
    <Card class="mb-6">
      <button
        class="w-full flex items-center justify-between px-6 py-4 text-left"
        @click="showStatistics = !showStatistics"
      >
        <h2 class="font-semibold text-sm">Win/Loss Statistics</h2>
        <svg
          class="w-5 h-5 text-muted-foreground transition-transform"
          :class="{ 'rotate-180': showStatistics }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div v-if="showStatistics" class="px-6 pb-6 space-y-4">
        <!-- Date Range -->
        <div class="flex gap-4 items-end">
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">Start Date</label>
            <input
              v-model="statsFilters.start_date"
              type="date"
              class="h-8 px-3 text-sm rounded-md border border-border bg-background"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted-foreground mb-1">End Date</label>
            <input
              v-model="statsFilters.end_date"
              type="date"
              class="h-8 px-3 text-sm rounded-md border border-border bg-background"
            />
          </div>
        </div>

        <div v-if="statsLoading" class="text-center text-muted-foreground py-4">Loading statistics...</div>

        <template v-else-if="statistics">
          <!-- Counts Row -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div class="text-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div class="text-2xl font-bold">{{ statistics.counts.total }}</div>
              <div class="text-xs text-muted-foreground">Total</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ statistics.counts.won }}</div>
              <div class="text-xs text-muted-foreground">Won</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ statistics.counts.lost }}</div>
              <div class="text-xs text-muted-foreground">Lost</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ statistics.counts.pending }}</div>
              <div class="text-xs text-muted-foreground">Pending</div>
            </div>
            <div class="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ statistics.conversion_rate }}%</div>
              <div class="text-xs text-muted-foreground">Conversion</div>
            </div>
          </div>

          <!-- Won / Lost Reasons -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Won Reasons -->
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

            <!-- Lost Reasons -->
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
          :model-value="String(filters.assigned_to ?? '')"
          :options="assignedToOptions"
          placeholder="Assigned To"
          @update:model-value="(v) => updateFilter('assigned_to', String(v ?? ''))"
        />
      </FilterGroup>
      <FilterGroup min-width="160px">
        <Select
          :model-value="filters.sort_by"
          :options="sortOptions"
          placeholder="Sort By"
          @update:model-value="(v) => updateFilter('sort_by', String(v))"
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
        @row-click="(item) => router.push(`/quotations/${item.id}`)"
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
                ? 'text-red-600 dark:text-red-400 font-medium'
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
