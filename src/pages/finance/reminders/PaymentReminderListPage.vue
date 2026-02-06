<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  usePaymentReminderList,
  usePaymentReminderSummary,
  useCancelReminder,
  type PaymentReminder,
  type ReminderFilters,
} from '@/api/usePaymentReminders'
import { useResourceList } from '@/composables/useResourceList'
import { formatDate } from '@/utils/format'
import { AlertTriangle, Clock, XCircle, Mail, MessageCircle, Send } from 'lucide-vue-next'

import Button from '@/components/ui/Button.vue'
import Select from '@/components/ui/Select.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterGroup from '@/components/ui/FilterGroup.vue'
import StatCard from '@/components/ui/StatCard.vue'
import Input from '@/components/ui/Input.vue'
import { ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { useToast } from '@/components/ui/Toast/useToast'
import { getErrorMessage } from '@/api/client'
import SendReminderModal from '@/components/invoices/SendReminderModal.vue'

const router = useRouter()
const toast = useToast()

// ─── Summary ──────────────────────────────────────────────────────
const { data: summary, isLoading: summaryLoading } = usePaymentReminderSummary()

// ─── Reminder List ────────────────────────────────────────────────
const {
  items: reminders,
  pagination,
  isLoading,
  error,
  filters,
  updateFilter,
} = useResourceList<PaymentReminder, ReminderFilters>({
  useListHook: usePaymentReminderList,
  initialFilters: {
    page: 1,
    per_page: 15,
    status: '',
    type: '',
    remindable_type: '',
    date_from: '',
    date_to: '',
    sort_by: 'scheduled_date',
    sort_dir: 'asc',
  },
})

// ─── Mutations ────────────────────────────────────────────────────
const cancelMutation = useCancelReminder()

// ─── Modal State ──────────────────────────────────────────────────
const showSendModal = ref(false)
const selectedReminderId = ref(0)
const selectedReminderType = ref('')

function openSendModal(reminder: PaymentReminder) {
  selectedReminderId.value = reminder.id
  selectedReminderType.value = reminder.type
  showSendModal.value = true
}

async function handleCancel(reminder: PaymentReminder) {
  try {
    await cancelMutation.mutateAsync({ id: reminder.id })
    toast.success('Reminder cancelled')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to cancel reminder'))
  }
}

// ─── Filter Options ──────────────────────────────────────────────
const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
]

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'final_notice', label: 'Final Notice' },
]

const docTypeOptions = [
  { value: '', label: 'All Documents' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'bill', label: 'Bill' },
]

// ─── Badge Helpers ────────────────────────────────────────────────
type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'outline'

const statusVariant: Record<string, BadgeVariant> = {
  pending: 'outline',
  sent: 'default',
  cancelled: 'secondary',
  failed: 'destructive',
}

const typeVariant: Record<string, BadgeVariant> = {
  upcoming: 'info',
  overdue: 'warning',
  final_notice: 'destructive',
}

function getDocumentNumber(reminder: PaymentReminder): string {
  if (reminder.remindable_type === 'Invoice') {
    return reminder.remindable?.invoice_number ?? `Invoice #${reminder.remindable_id}`
  }
  return reminder.remindable?.bill_number ?? `Bill #${reminder.remindable_id}`
}

// ─── Table Columns ────────────────────────────────────────────────
const columns: ResponsiveColumn[] = [
  { key: 'document', label: 'Document', mobilePriority: 1 },
  { key: 'type', label: 'Type', mobilePriority: 3 },
  { key: 'status', label: 'Status', mobilePriority: 2 },
  { key: 'scheduled_date', label: 'Scheduled', showInMobile: false },
  { key: 'sent_date', label: 'Sent', showInMobile: false },
  { key: 'channel', label: 'Channel', showInMobile: false },
  { key: 'actions', label: '', width: '120px' },
]
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold">Payment Reminders</h1>
      <p class="text-muted-foreground">Manage and track payment reminder notifications</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Due Today"
        :value="summaryLoading ? '...' : String(summary?.due_today ?? 0)"
        :icon="AlertTriangle"
        :alert="(summary?.due_today ?? 0) > 0"
      />
      <StatCard
        label="Pending"
        :value="summaryLoading ? '...' : String(summary?.pending ?? 0)"
        :icon="Clock"
      />
      <StatCard
        label="Sent This Week"
        :value="summaryLoading ? '...' : String(summary?.sent_this_week ?? 0)"
        :icon="Send"
      />
      <StatCard
        label="Failed"
        :value="summaryLoading ? '...' : String(summary?.failed ?? 0)"
        :icon="XCircle"
        :alert="(summary?.failed ?? 0) > 0"
      />
    </div>

    <!-- Filters -->
    <FilterBar class="mb-6">
      <FilterGroup min-width="140px">
        <Select
          :model-value="String(filters.status ?? '')"
          :options="statusOptions"
          placeholder="Status"
          @update:model-value="(v) => updateFilter('status', String(v ?? ''))"
        />
      </FilterGroup>
      <FilterGroup min-width="140px">
        <Select
          :model-value="String(filters.type ?? '')"
          :options="typeOptions"
          placeholder="Type"
          @update:model-value="(v) => updateFilter('type', String(v ?? ''))"
        />
      </FilterGroup>
      <FilterGroup min-width="150px">
        <Select
          :model-value="String(filters.remindable_type ?? '')"
          :options="docTypeOptions"
          placeholder="Document Type"
          @update:model-value="(v) => updateFilter('remindable_type', String(v ?? ''))"
        />
      </FilterGroup>
      <FilterGroup min-width="140px">
        <Input
          :model-value="filters.date_from ?? ''"
          type="date"
          placeholder="From"
          @update:model-value="(v) => updateFilter('date_from', String(v ?? ''))"
        />
      </FilterGroup>
      <FilterGroup min-width="140px">
        <Input
          :model-value="filters.date_to ?? ''"
          type="date"
          placeholder="To"
          @update:model-value="(v) => updateFilter('date_to', String(v ?? ''))"
        />
      </FilterGroup>
    </FilterBar>

    <!-- Reminder List -->
    <Card :padding="false">
      <div v-if="isLoading" class="p-8 text-center text-muted-foreground">Loading...</div>
      <div v-else-if="error" class="p-8 text-center text-destructive">Failed to load reminders</div>
      <div v-else-if="reminders.length === 0" class="p-8 text-center">
        <div class="text-4xl mb-2">🔔</div>
        <div class="font-medium">No reminders found</div>
        <div class="text-muted-foreground text-sm">Payment reminders will appear here</div>
      </div>

      <ResponsiveTable
        v-if="reminders.length > 0"
        :items="reminders"
        :columns="columns"
        :loading="isLoading"
        title-field="document"
        @row-click="(item) => {
          const r = item as PaymentReminder
          if (r.remindable_type === 'Invoice') {
            router.push(`/invoices/${r.remindable_id}`)
          } else {
            router.push(`/bills/${r.remindable_id}`)
          }
        }"
      >
        <!-- Document -->
        <template #cell-document="{ item }">
          <div class="font-medium text-orange-600 dark:text-orange-400">
            {{ getDocumentNumber(item as PaymentReminder) }}
          </div>
          <div class="text-sm text-muted-foreground">
            {{ (item as PaymentReminder).contact?.name ?? '—' }}
          </div>
        </template>

        <!-- Type -->
        <template #cell-type="{ item }">
          <Badge :variant="typeVariant[(item as PaymentReminder).type] ?? 'default'">
            {{ (item as PaymentReminder).type === 'final_notice' ? 'Final Notice' : (item as PaymentReminder).type }}
          </Badge>
        </template>

        <!-- Status -->
        <template #cell-status="{ item }">
          <Badge :variant="statusVariant[(item as PaymentReminder).status] ?? 'default'">
            {{ (item as PaymentReminder).status }}
          </Badge>
        </template>

        <!-- Scheduled Date -->
        <template #cell-scheduled_date="{ item }">
          <span class="text-muted-foreground">
            {{ formatDate((item as PaymentReminder).scheduled_date) }}
          </span>
        </template>

        <!-- Sent Date -->
        <template #cell-sent_date="{ item }">
          <span class="text-muted-foreground">
            {{ (item as PaymentReminder).sent_date ? formatDate((item as PaymentReminder).sent_date!) : '—' }}
          </span>
        </template>

        <!-- Channel -->
        <template #cell-channel="{ item }">
          <div class="flex items-center gap-1 text-muted-foreground">
            <Mail v-if="(item as PaymentReminder).channel === 'email'" class="w-4 h-4" />
            <MessageCircle v-else-if="(item as PaymentReminder).channel === 'whatsapp'" class="w-4 h-4" />
            <span class="text-sm capitalize">{{ (item as PaymentReminder).channel }}</span>
          </div>
        </template>

        <!-- Actions -->
        <template #cell-actions="{ item }">
          <div v-if="(item as PaymentReminder).status === 'pending'" class="flex items-center gap-1" @click.stop>
            <Button
              variant="ghost"
              size="sm"
              @click="openSendModal(item as PaymentReminder)"
            >
              Send
            </Button>
            <Button
              variant="ghost"
              size="sm"
              class="text-destructive hover:text-destructive"
              :loading="cancelMutation.isPending.value"
              @click="handleCancel(item as PaymentReminder)"
            >
              Cancel
            </Button>
          </div>
        </template>

        <!-- Mobile title -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ getDocumentNumber(item as PaymentReminder) }}
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

    <!-- Send Reminder Modal -->
    <SendReminderModal
      :open="showSendModal"
      :reminder-id="selectedReminderId"
      :reminder-type="selectedReminderType"
      @update:open="showSendModal = $event"
    />
  </div>
</template>
