<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useFiscalPeriod,
  useFiscalPeriodClosingChecklist,
  useCloseFiscalPeriod,
  getFiscalPeriodStatus,
} from '@/api/useFiscalPeriods'
import { formatDate, formatCurrency } from '@/utils/format'
import { Button, Card, Alert, Textarea, Badge, useToast } from '@/components/ui'
import WizardStepIndicator from '@/components/solar/WizardStepIndicator.vue'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ClipboardList,
  FileText,
  CheckCircle2,
  CheckCircle,
  Circle,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const periodId = computed(() => Number(route.params.id))

// Data
const { data: period, isLoading } = useFiscalPeriod(periodId)
const { data: checklist, isLoading: checklistLoading, refetch: refetchChecklist } = useFiscalPeriodClosingChecklist(periodId)
const closeMutation = useCloseFiscalPeriod()

// Wizard state
const currentStep = ref(1)
const closingNotes = ref('')
const closeCompleted = ref(false)

const wizardSteps = [
  { number: 1, title: 'Review', description: 'Verify period' },
  { number: 2, title: 'Checklist', description: 'Pre-close items' },
  { number: 3, title: 'Confirm', description: 'Notes & close' },
  { number: 4, title: 'Complete', description: 'Results' },
]

const wizardIcons = [Calendar, ClipboardList, FileText, CheckCircle2]

const status = computed(() => period.value ? getFiscalPeriodStatus(period.value) : null)

// Step 1: Can proceed if period is locked and not closed
const step1Ready = computed(() =>
  period.value?.is_locked && !period.value?.is_closed
)

// Step 2: Can proceed if no required items are incomplete
const hasBlockingErrors = computed(() => {
  if (!checklist.value) return true
  return checklist.value.items.some(i => i.is_required && !i.is_completed)
})

const hasWarnings = computed(() => {
  if (!checklist.value) return false
  return checklist.value.items.some(i => !i.is_required && !i.is_completed)
})

const completedCount = computed(() =>
  checklist.value?.items.filter(i => i.is_completed).length ?? 0
)

const totalCount = computed(() =>
  checklist.value?.items.length ?? 0
)

// Navigation
const canGoNext = computed(() => {
  if (currentStep.value === 1) return step1Ready.value
  if (currentStep.value === 2) return !hasBlockingErrors.value
  if (currentStep.value === 3) return false // Only via mutation
  return false
})

function goNext() {
  if (canGoNext.value && currentStep.value < 3) {
    currentStep.value++
  }
}

function goBack() {
  if (currentStep.value > 1 && !closeCompleted.value) {
    currentStep.value--
  }
}

function goToStep(step: number) {
  if (closeCompleted.value) return
  // Can go backward to completed steps, cannot skip forward
  if (step < currentStep.value) {
    currentStep.value = step
  }
}

// Close action
async function handleClose() {
  try {
    await closeMutation.mutateAsync({
      id: periodId.value,
      closing_notes: closingNotes.value || undefined,
    })
    closeCompleted.value = true
    currentStep.value = 4
    toast.success('Fiscal period closed successfully')
  } catch {
    toast.error('Failed to close fiscal period. Please try again.')
  }
}

function handleChecklistAction(url?: string) {
  if (url) {
    router.push(url)
  }
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-muted-foreground">
      Loading...
    </div>

    <template v-else-if="period">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <RouterLink
          :to="`/accounting/fiscal-periods/${period.id}`"
          class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
        >
          <ArrowLeft class="w-4 h-4" />
          {{ period.name }}
        </RouterLink>
        <span>/</span>
        <span class="text-slate-900 dark:text-slate-100">Close Period</span>
      </div>

      <!-- Step Indicator -->
      <Card class="mb-6">
        <WizardStepIndicator
          :steps="wizardSteps"
          :current-step="currentStep"
          :icons="wizardIcons"
          @go-to-step="goToStep"
        />
      </Card>

      <!-- Step 1: Review Period -->
      <Card v-if="currentStep === 1" class="mb-6">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Review Period</h2>
        </template>

        <div class="space-y-4">
          <!-- Period info -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span class="text-sm text-muted-foreground">Period Name</span>
              <p class="font-medium text-slate-900 dark:text-slate-100">{{ period.name }}</p>
            </div>
            <div>
              <span class="text-sm text-muted-foreground">Date Range</span>
              <p class="font-medium text-slate-900 dark:text-slate-100">
                {{ formatDate(period.start_date) }} - {{ formatDate(period.end_date) }}
              </p>
            </div>
            <div>
              <span class="text-sm text-muted-foreground">Status</span>
              <div class="mt-1">
                <Badge v-if="status" :class="status.color">
                  {{ status.label }}
                </Badge>
              </div>
            </div>
          </div>

          <!-- Status alerts -->
          <Alert v-if="period.is_closed" variant="destructive" title="Period Already Closed">
            This period has already been closed. No further closing action is needed.
          </Alert>

          <Alert v-else-if="!period.is_locked" variant="warning" title="Period Not Locked">
            This period must be locked before it can be closed. Go back to the period detail page to lock it first.
          </Alert>

          <Alert v-else variant="success" title="Ready for Closing">
            This period is locked and ready for the year-end closing process.
          </Alert>
        </div>
      </Card>

      <!-- Step 2: Pre-Flight Checklist -->
      <Card v-if="currentStep === 2" class="mb-6">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Pre-Close Checklist</h2>
            <div class="flex items-center gap-3">
              <span class="text-sm text-muted-foreground">
                {{ completedCount }}/{{ totalCount }} items completed
              </span>
              <Button variant="ghost" size="sm" @click="refetchChecklist()">
                <RefreshCw class="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </template>

        <div v-if="checklistLoading" class="text-center py-8 text-muted-foreground">
          Loading checklist...
        </div>

        <div v-else-if="checklist" class="space-y-3">
          <div
            v-for="item in checklist.items"
            :key="item.id"
            class="flex items-start gap-3 p-3 rounded-lg"
            :class="{
              'bg-green-50 dark:bg-green-900/20': item.is_completed,
              'bg-red-50 dark:bg-red-900/10': !item.is_completed && item.is_required,
              'bg-slate-50 dark:bg-slate-800/50': !item.is_completed && !item.is_required,
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
                :class="item.is_required ? 'text-red-400' : 'text-muted-foreground'"
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
                <Badge
                  v-if="!item.is_completed && item.is_required"
                  variant="destructive"
                >
                  Required
                </Badge>
                <Badge
                  v-else-if="!item.is_completed && !item.is_required"
                  variant="warning"
                >
                  Optional
                </Badge>
              </div>
              <p class="text-sm text-muted-foreground mt-0.5">
                {{ item.description }}
              </p>
            </div>

            <!-- Action Button -->
            <Button
              v-if="item.action_url && !item.is_completed"
              variant="ghost"
              size="sm"
              @click="handleChecklistAction(item.action_url)"
            >
              <ExternalLink class="w-3.5 h-3.5 mr-1" />
              Go
            </Button>
          </div>

          <!-- Bottom alerts -->
          <Alert v-if="hasBlockingErrors" variant="destructive" title="Cannot Proceed">
            Complete all required items before continuing to the next step.
          </Alert>

          <Alert v-else-if="hasWarnings" variant="warning" title="Optional Items Incomplete">
            Some optional items are incomplete. You may proceed with closing.
          </Alert>

          <Alert v-else variant="success" title="All Clear">
            All checklist items are complete. You may proceed.
          </Alert>
        </div>
      </Card>

      <!-- Step 3: Confirm & Notes -->
      <Card v-if="currentStep === 3" class="mb-6">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Confirm & Close</h2>
        </template>

        <div class="space-y-5">
          <!-- Warning -->
          <Alert variant="destructive" title="Permanent Action">
            Closing this period is permanent. A closing journal entry will be created to transfer
            income and expense balances to retained earnings.
          </Alert>

          <!-- Summary -->
          <div class="rounded-lg border border-border p-4">
            <h3 class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">Summary</h3>
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Period</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ period.name }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Date Range</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(period.start_date) }} - {{ formatDate(period.end_date) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Current Status</dt>
                <dd>
                  <Badge v-if="status" :class="status.color">{{ status.label }}</Badge>
                </dd>
              </div>
            </dl>
          </div>

          <!-- What will happen -->
          <div>
            <h3 class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">What will happen</h3>
            <ul class="space-y-1.5 text-sm text-muted-foreground">
              <li class="flex items-start gap-2">
                <CheckCircle2 class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                Revenue and expense accounts will be zeroed out
              </li>
              <li class="flex items-start gap-2">
                <CheckCircle2 class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                A closing journal entry will be created automatically
              </li>
              <li class="flex items-start gap-2">
                <CheckCircle2 class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                Retained earnings will be calculated and posted
              </li>
              <li class="flex items-start gap-2">
                <CheckCircle2 class="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                The next fiscal period may be auto-created
              </li>
            </ul>
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Closing Notes (optional)
            </label>
            <Textarea
              v-model="closingNotes"
              :rows="3"
              placeholder="Add any notes about this period closing..."
            />
          </div>

          <!-- Close Button -->
          <div class="flex justify-end">
            <Button
              variant="destructive"
              :loading="closeMutation.isPending.value"
              @click="handleClose"
            >
              <AlertTriangle class="w-4 h-4 mr-2" />
              Close Period
            </Button>
          </div>
        </div>
      </Card>

      <!-- Step 4: Results -->
      <Card v-if="currentStep === 4" class="mb-6">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Period Closed</h2>
        </template>

        <div class="space-y-5">
          <Alert variant="success" title="Successfully Closed">
            {{ period.name }} has been closed. All income and expense accounts have been zeroed
            and a closing journal entry has been created.
          </Alert>

          <!-- Closing entry link -->
          <div v-if="period.closing_entry" class="rounded-lg border border-border p-4">
            <h3 class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">Closing Journal Entry</h3>
            <RouterLink
              :to="`/accounting/journal-entries/${period.closing_entry.id}`"
              class="inline-flex items-center gap-2 font-mono text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
            >
              <FileText class="w-4 h-4" />
              {{ period.closing_entry.entry_number }}
            </RouterLink>
            <p v-if="period.closing_entry.description" class="text-sm text-muted-foreground mt-1">
              {{ period.closing_entry.description }}
            </p>
          </div>

          <!-- Retained earnings -->
          <div v-if="period.retained_earnings_amount" class="rounded-lg border border-border p-4">
            <h3 class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Retained Earnings</h3>
            <p class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(period.retained_earnings_amount) }}
            </p>
          </div>

          <!-- Closing notes -->
          <div v-if="closingNotes" class="rounded-lg border border-border p-4">
            <h3 class="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">Closing Notes</h3>
            <p class="text-sm text-muted-foreground whitespace-pre-wrap">{{ closingNotes }}</p>
          </div>

          <!-- Navigation -->
          <div class="flex justify-end">
            <Button @click="router.push({ name: 'fiscal-period-detail', params: { id: period.id } })">
              View Period Details
            </Button>
          </div>
        </div>
      </Card>

      <!-- Bottom Navigation -->
      <div v-if="!closeCompleted" class="flex justify-between">
        <Button
          v-if="currentStep > 1"
          variant="ghost"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4 mr-2" />
          Back
        </Button>
        <div v-else />

        <Button
          v-if="currentStep < 3"
          :disabled="!canGoNext"
          @click="goNext"
        >
          Next
          <ArrowRight class="w-4 h-4 ml-2" />
        </Button>
      </div>
    </template>
  </div>
</template>
