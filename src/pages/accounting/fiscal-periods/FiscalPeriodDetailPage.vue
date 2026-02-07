<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useFiscalPeriod,
  useFiscalPeriodClosingChecklist,
  useLockFiscalPeriod,
  useUnlockFiscalPeriod,
  useReopenFiscalPeriod,
  getFiscalPeriodStatus,
} from '@/api/useFiscalPeriods'
import { formatDate, formatCurrency } from '@/utils/format'
import { Button, Card, Modal, useToast } from '@/components/ui'
import {
  ArrowLeft,
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Circle,
  FileText,
  ExternalLink,
  Pencil,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const periodId = computed(() => Number(route.params.id))

// Fetch fiscal period
const { data: period, isLoading, error, refetch } = useFiscalPeriod(periodId)

// Fetch closing checklist
const { data: checklist, isLoading: checklistLoading } = useFiscalPeriodClosingChecklist(periodId)

// Status info
const status = computed(() => period.value ? getFiscalPeriodStatus(period.value) : null)

// Mutations
const lockMutation = useLockFiscalPeriod()
const unlockMutation = useUnlockFiscalPeriod()
const reopenMutation = useReopenFiscalPeriod()

// Modal states
const showLockModal = ref(false)
const showUnlockModal = ref(false)
const showReopenModal = ref(false)

// Permissions
const canEdit = computed(() => period.value && !period.value.is_locked && !period.value.is_closed)
const canLock = computed(() => period.value && !period.value.is_locked && !period.value.is_closed)
const canUnlock = computed(() => period.value && period.value.is_locked && !period.value.is_closed)
const canClose = computed(() => period.value && period.value.is_locked && !period.value.is_closed && checklist.value?.can_close)
const canReopen = computed(() => period.value && period.value.is_closed)

// Handlers
async function handleLock() {
  try {
    await lockMutation.mutateAsync(periodId.value)
    showLockModal.value = false
    toast.success('Period locked')
    refetch()
  } catch {
    toast.error('Failed to lock period')
  }
}

async function handleUnlock() {
  try {
    await unlockMutation.mutateAsync(periodId.value)
    showUnlockModal.value = false
    toast.success('Period unlocked')
    refetch()
  } catch {
    toast.error('Failed to unlock period')
  }
}

async function handleReopen() {
  try {
    await reopenMutation.mutateAsync(periodId.value)
    showReopenModal.value = false
    toast.success('Period reopened')
    refetch()
  } catch {
    toast.error('Failed to reopen period')
  }
}

// Navigate to checklist item action
function handleChecklistAction(url?: string) {
  if (url) {
    router.push(url)
  }
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-slate-500 dark:text-slate-400">
      Loading...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500 dark:text-red-400">
      Failed to load fiscal period
    </div>

    <!-- Content -->
    <template v-else-if="period">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/accounting/fiscal-periods" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft class="w-4 h-4" />
          Fiscal Periods
        </RouterLink>
        <span>/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ period.name }}</span>
      </div>

      <!-- Header Card -->
      <Card class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <Calendar class="w-6 h-6 text-slate-400" />
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ period.name }}
              </h1>
              <span
                v-if="status"
                class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium"
                :class="status.color"
              >
                <Lock v-if="period.is_locked && !period.is_closed" class="w-3 h-3" />
                <CheckCircle v-else-if="period.is_closed" class="w-3 h-3" />
                {{ status.label }}
              </span>
            </div>
            <p class="text-slate-600 dark:text-slate-400">
              {{ formatDate(period.start_date) }} - {{ formatDate(period.end_date) }}
            </p>
            <p v-if="status" class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {{ status.description }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <!-- Edit Button (open periods only) -->
            <Button
              v-if="canEdit"
              variant="secondary"
              size="sm"
              @click="router.push(`/accounting/fiscal-periods/${periodId}/edit`)"
            >
              <Pencil class="w-4 h-4 mr-2" />
              Edit
            </Button>

            <!-- Lock Button -->
            <Button
              v-if="canLock"
              variant="secondary"
              size="sm"
              @click="showLockModal = true"
            >
              <Lock class="w-4 h-4 mr-2" />
              Lock Period
            </Button>

            <!-- Unlock Button -->
            <Button
              v-if="canUnlock"
              variant="secondary"
              size="sm"
              @click="showUnlockModal = true"
            >
              <Unlock class="w-4 h-4 mr-2" />
              Unlock
            </Button>

            <!-- Close Button -->
            <Button
              v-if="canClose"
              size="sm"
              @click="$router.push({ name: 'fiscal-period-close-wizard', params: { id: period.id } })"
            >
              <CheckCircle class="w-4 h-4 mr-2" />
              Close Period
            </Button>

            <!-- Reopen Button -->
            <Button
              v-if="canReopen"
              variant="ghost"
              size="sm"
              @click="showReopenModal = true"
            >
              Reopen
            </Button>
          </div>
        </div>
      </Card>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Closing Checklist (only for locked, unclosed periods) -->
          <Card v-if="period.is_locked && !period.is_closed">
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="font-semibold text-slate-900 dark:text-slate-100">Closing Checklist</h2>
                <span
                  v-if="checklist"
                  class="text-sm text-slate-500 dark:text-slate-400"
                >
                  {{ checklist.required_items_completed }}/{{ checklist.required_items_total }} required
                </span>
              </div>
            </template>

            <div v-if="checklistLoading" class="text-center py-4 text-slate-500 dark:text-slate-400">
              Loading checklist...
            </div>

            <div v-else-if="checklist" class="space-y-3">
              <div
                v-for="item in checklist.items"
                :key="item.id"
                class="flex items-start gap-3 p-3 rounded-lg"
                :class="{
                  'bg-green-50 dark:bg-green-900/20': item.is_completed,
                  'bg-slate-50 dark:bg-slate-800/50': !item.is_completed,
                }"
              >
                <!-- Status Icon -->
                <div class="flex-shrink-0 mt-0.5">
                  <CheckCircle
                    v-if="item.is_completed"
                    class="w-5 h-5 text-green-500"
                  />
                  <Circle
                    v-else
                    class="w-5 h-5"
                    :class="item.is_required ? 'text-amber-400' : 'text-slate-300 dark:text-slate-600'"
                  />
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span
                      class="font-medium"
                      :class="item.is_completed
                        ? 'text-green-700 dark:text-green-400'
                        : 'text-slate-900 dark:text-slate-100'"
                    >
                      {{ item.label }}
                    </span>
                    <span
                      v-if="item.is_required && !item.is_completed"
                      class="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded"
                    >
                      Required
                    </span>
                  </div>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {{ item.description }}
                  </p>
                </div>

                <!-- Action Button -->
                <Button
                  v-if="item.action_url && !item.is_completed"
                  variant="ghost"
                  size="xs"
                  @click="handleChecklistAction(item.action_url)"
                >
                  <ExternalLink class="w-3.5 h-3.5 mr-1" />
                  Go
                </Button>
              </div>

              <!-- Cannot Close Warning -->
              <div
                v-if="!checklist.can_close"
                class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
              >
                <div class="flex items-start gap-2">
                  <AlertTriangle class="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p class="text-sm text-amber-700 dark:text-amber-400">
                    Complete all required items before closing this period.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <!-- Closing Entry Info (for closed periods) -->
          <Card v-if="period.is_closed && period.closing_entry">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Closing Entry</h2>
            </template>

            <div class="flex items-start gap-3">
              <FileText class="w-5 h-5 text-slate-400" />
              <div>
                <RouterLink
                  :to="`/accounting/journal-entries/${period.closing_entry.id}`"
                  class="font-mono text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                >
                  {{ period.closing_entry.entry_number }}
                </RouterLink>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {{ period.closing_entry.description }}
                </p>
              </div>
            </div>
          </Card>

          <!-- Closing Notes (for closed periods) -->
          <Card v-if="period.is_closed && period.closing_notes">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Closing Notes</h2>
            </template>
            <p class="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
              {{ period.closing_notes }}
            </p>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Period Details -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Details</h2>
            </template>

            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Start Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(period.start_date) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">End Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(period.end_date) }}
                </dd>
              </div>
              <div v-if="period.is_closed" class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Closed On</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(period.closed_at) }}
                </dd>
              </div>
              <div v-if="period.retained_earnings_amount" class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Retained Earnings</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(period.retained_earnings_amount) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Created</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(period.created_at) }}
                </dd>
              </div>
            </dl>
          </Card>

          <!-- Quick Links -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Related</h2>
            </template>

            <div class="space-y-2">
              <RouterLink
                :to="`/accounting/journal-entries?fiscal_period_id=${period.id}`"
                class="block"
              >
                <Button variant="ghost" class="w-full justify-start">
                  View Journal Entries
                </Button>
              </RouterLink>
              <RouterLink to="/reports/trial-balance" class="block">
                <Button variant="ghost" class="w-full justify-start">
                  Trial Balance
                </Button>
              </RouterLink>
              <RouterLink to="/reports/income-statement" class="block">
                <Button variant="ghost" class="w-full justify-start">
                  Income Statement
                </Button>
              </RouterLink>
            </div>
          </Card>
        </div>
      </div>
    </template>

    <!-- Lock Modal -->
    <Modal :open="showLockModal" title="Lock Fiscal Period" size="sm" @update:open="showLockModal = $event">
      <div class="space-y-4">
        <p class="text-slate-600 dark:text-slate-400">
          Are you sure you want to lock <strong>{{ period?.name }}</strong>?
        </p>
        <div class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p class="text-sm text-amber-700 dark:text-amber-400">
            Locking this period will prevent new transactions from being posted.
          </p>
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showLockModal = false">Cancel</Button>
        <Button :loading="lockMutation.isPending.value" @click="handleLock">
          <Lock class="w-4 h-4 mr-2" />
          Lock Period
        </Button>
      </template>
    </Modal>

    <!-- Unlock Modal -->
    <Modal :open="showUnlockModal" title="Unlock Fiscal Period" size="sm" @update:open="showUnlockModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to unlock <strong>{{ period?.name }}</strong>?
      </p>
      <template #footer>
        <Button variant="ghost" @click="showUnlockModal = false">Cancel</Button>
        <Button :loading="unlockMutation.isPending.value" @click="handleUnlock">
          <Unlock class="w-4 h-4 mr-2" />
          Unlock Period
        </Button>
      </template>
    </Modal>

    <!-- Reopen Modal -->
    <Modal :open="showReopenModal" title="Reopen Fiscal Period" size="sm" @update:open="showReopenModal = $event">
      <div class="space-y-4">
        <p class="text-slate-600 dark:text-slate-400">
          Are you sure you want to reopen <strong>{{ period?.name }}</strong>?
        </p>
        <div class="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p class="text-sm text-amber-700 dark:text-amber-400">
            The closing entry will be reversed and you'll need to close the period again.
          </p>
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showReopenModal = false">Cancel</Button>
        <Button :loading="reopenMutation.isPending.value" @click="handleReopen">
          Reopen Period
        </Button>
      </template>
    </Modal>
  </div>
</template>
