<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  useFiscalPeriods,
  useLockFiscalPeriod,
  useUnlockFiscalPeriod,
  getFiscalPeriodStatus,
  formatPeriodRange,
  getCurrentPeriod,
  type FiscalPeriod,
  type FiscalPeriodFilters,
} from '@/api/useFiscalPeriods'
import { useResourceList } from '@/composables/useResourceList'
import { formatDate } from '@/utils/format'
import { Button, Card, Modal, Select, Pagination, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus, Calendar, Lock, Unlock, CheckCircle, AlertTriangle } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

// Resource list with filters and pagination
const {
  items: periods,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
} = useResourceList<FiscalPeriod, FiscalPeriodFilters>({
  useListHook: useFiscalPeriods,
  initialFilters: {
    page: 1,
    per_page: 20,
    is_closed: undefined,
    is_locked: undefined,
  },
})

// Current period indicator
const currentPeriod = computed(() => {
  if (!periods.value) return null
  return getCurrentPeriod(periods.value)
})

// Status filter options
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'locked', label: 'Locked' },
  { value: 'closed', label: 'Closed' },
]

function handleStatusChange(value: string | number | null) {
  if (value === 'open') {
    updateFilter('is_closed', false)
    updateFilter('is_locked', false)
  } else if (value === 'locked') {
    updateFilter('is_closed', false)
    updateFilter('is_locked', true)
  } else if (value === 'closed') {
    updateFilter('is_closed', true)
    updateFilter('is_locked', undefined)
  } else {
    updateFilter('is_closed', undefined)
    updateFilter('is_locked', undefined)
  }
}

// Table columns
const columns: ResponsiveColumn[] = [
  { key: 'name', label: 'Period', mobilePriority: 1 },
  { key: 'range', label: 'Date Range', mobilePriority: 2 },
  { key: 'status', label: 'Status', mobilePriority: 3 },
  { key: 'actions', label: '', showInMobile: false },
]

// Lock/Unlock mutations
const lockMutation = useLockFiscalPeriod()
const unlockMutation = useUnlockFiscalPeriod()

// Modal states
const showLockModal = ref(false)
const showUnlockModal = ref(false)
const selectedPeriod = ref<FiscalPeriod | null>(null)

function openLockModal(period: FiscalPeriod) {
  selectedPeriod.value = period
  showLockModal.value = true
}

function openUnlockModal(period: FiscalPeriod) {
  selectedPeriod.value = period
  showUnlockModal.value = true
}

async function handleLock() {
  if (!selectedPeriod.value) return

  try {
    await lockMutation.mutateAsync(selectedPeriod.value.id)
    showLockModal.value = false
    selectedPeriod.value = null
    toast.success('Period locked')
  } catch {
    toast.error('Failed to lock period')
  }
}

async function handleUnlock() {
  if (!selectedPeriod.value) return

  try {
    await unlockMutation.mutateAsync(selectedPeriod.value.id)
    showUnlockModal.value = false
    selectedPeriod.value = null
    toast.success('Period unlocked')
  } catch {
    toast.error('Failed to unlock period')
  }
}

// Navigate to detail
function viewPeriod(period: FiscalPeriod) {
  router.push(`/accounting/fiscal-periods/${period.id}`)
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Fiscal Periods</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage accounting periods and closings</p>
      </div>
      <RouterLink to="/accounting/fiscal-periods/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          New Period
        </Button>
      </RouterLink>
    </div>

    <!-- Current Period Banner -->
    <Card v-if="currentPeriod" class="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20">
      <div class="flex items-center gap-3">
        <div class="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
          <Calendar class="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p class="text-sm text-green-600 dark:text-green-400 font-medium">Current Period</p>
          <p class="text-lg font-semibold text-green-700 dark:text-green-300">
            {{ currentPeriod.name }}
            <span class="text-sm font-normal text-green-600 dark:text-green-400">
              ({{ formatPeriodRange(currentPeriod) }})
            </span>
          </p>
        </div>
      </div>
    </Card>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Status Filter -->
        <div class="w-40">
          <Select
            :model-value="filters.is_closed === true ? 'closed' : filters.is_locked === true ? 'locked' : filters.is_closed === false && filters.is_locked === false ? 'open' : ''"
            :options="statusOptions"
            placeholder="All Status"
            @update:model-value="handleStatusChange"
          />
        </div>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-if="error" class="text-center py-8">
      <p class="text-red-500">Failed to load fiscal periods</p>
    </Card>

    <!-- Loading State -->
    <Card v-else-if="isLoading" class="text-center py-8">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </Card>

    <!-- Empty State -->
    <Card v-else-if="isEmpty" class="text-center py-12">
      <Calendar class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No fiscal periods found</h3>
      <p class="text-slate-500 dark:text-slate-400 mb-4">
        Create your first fiscal period to start tracking accounting periods
      </p>
      <RouterLink to="/accounting/fiscal-periods/new">
        <Button>
          <Plus class="w-4 h-4 mr-2" />
          Create Period
        </Button>
      </RouterLink>
    </Card>

    <!-- Table -->
    <Card v-else :padding="false">
      <ResponsiveTable
        :items="periods"
        :columns="columns"
        :loading="isLoading"
        title-field="name"
        @row-click="viewPeriod"
      >
        <!-- Period Name -->
        <template #cell-name="{ item }">
          <div class="flex items-center gap-2">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</span>
            <span
              v-if="currentPeriod?.id === item.id"
              class="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded"
            >
              Current
            </span>
          </div>
        </template>

        <!-- Date Range -->
        <template #cell-range="{ item }">
          <span class="text-slate-600 dark:text-slate-400">
            {{ formatDate(item.start_date) }} - {{ formatDate(item.end_date) }}
          </span>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <span
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
            :class="getFiscalPeriodStatus(item).color"
          >
            <Lock v-if="item.is_locked && !item.is_closed" class="w-3 h-3" />
            <CheckCircle v-else-if="item.is_closed" class="w-3 h-3" />
            {{ getFiscalPeriodStatus(item).label }}
          </span>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</span>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-2">
            <!-- Lock Button (for open periods) -->
            <Button
              v-if="!item.is_locked && !item.is_closed"
              variant="ghost"
              size="xs"
              @click.stop="openLockModal(item)"
            >
              <Lock class="w-3.5 h-3.5 mr-1" />
              Lock
            </Button>

            <!-- Unlock Button (for locked periods) -->
            <Button
              v-if="item.is_locked && !item.is_closed"
              variant="ghost"
              size="xs"
              @click.stop="openUnlockModal(item)"
            >
              <Unlock class="w-3.5 h-3.5 mr-1" />
              Unlock
            </Button>

            <!-- Close Button (for locked periods) -->
            <RouterLink
              v-if="item.is_locked && !item.is_closed"
              :to="`/accounting/fiscal-periods/${item.id}`"
              @click.stop
            >
              <Button variant="ghost" size="xs">
                Close Period
              </Button>
            </RouterLink>

            <!-- View Button -->
            <Button variant="ghost" size="xs" @click.stop="viewPeriod(item)">
              View
            </Button>
          </div>
        </template>
      </ResponsiveTable>

      <!-- Pagination -->
      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :per-page="pagination.per_page"
          @page-change="goToPage"
        />
      </div>
    </Card>

    <!-- Lock Modal -->
    <Modal :open="showLockModal" title="Lock Fiscal Period" size="sm" @update:open="showLockModal = $event">
      <div class="space-y-4">
        <p class="text-slate-600 dark:text-slate-400">
          Are you sure you want to lock <strong>{{ selectedPeriod?.name }}</strong>?
        </p>
        <div class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div class="flex items-start gap-2">
            <AlertTriangle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p class="text-sm text-amber-700 dark:text-amber-400">
              Locking this period will prevent new transactions from being posted.
              The period can be unlocked later if needed.
            </p>
          </div>
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showLockModal = false">Cancel</Button>
        <Button
          :loading="lockMutation.isPending.value"
          @click="handleLock"
        >
          <Lock class="w-4 h-4 mr-2" />
          Lock Period
        </Button>
      </template>
    </Modal>

    <!-- Unlock Modal -->
    <Modal :open="showUnlockModal" title="Unlock Fiscal Period" size="sm" @update:open="showUnlockModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to unlock <strong>{{ selectedPeriod?.name }}</strong>?
        This will allow new transactions to be posted to this period.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showUnlockModal = false">Cancel</Button>
        <Button
          :loading="unlockMutation.isPending.value"
          @click="handleUnlock"
        >
          <Unlock class="w-4 h-4 mr-2" />
          Unlock Period
        </Button>
      </template>
    </Modal>
  </div>
</template>
