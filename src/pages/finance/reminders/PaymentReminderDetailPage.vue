<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useSendReminder, useCancelReminder, type PaymentReminder } from '@/api/usePaymentReminders'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Badge, Modal, Card, useToast } from '@/components/ui'
import { Send, X, FileText, Mail, Calendar, User, MessageSquare } from 'lucide-vue-next'

const route = useRoute()
const toast = useToast()
const queryClient = useQueryClient()

const reminderId = computed(() => Number(route.params.id))

// Query for single reminder
const { data: reminder, isLoading, error } = useQuery({
  queryKey: computed(() => ['payment-reminder', reminderId.value]),
  queryFn: async () => {
    const response = await api.get<{ data: PaymentReminder }>(`/payment-reminders/${reminderId.value}`)
    return response.data.data
  },
  enabled: computed(() => !!reminderId.value && reminderId.value > 0),
})

// Mutations
const sendMutation = useSendReminder()
const cancelMutation = useCancelReminder()

// Modal states
const showCancelModal = ref(false)

// Computed helpers
const reminderTypeLabel = computed(() => {
  if (!reminder.value) return ''
  const typeMap = {
    upcoming: 'Upcoming',
    overdue: 'Overdue',
    final_notice: 'Final Notice',
  }
  return typeMap[reminder.value.type] || reminder.value.type
})

const statusVariant = computed(() => {
  if (!reminder.value) return 'default'
  const map: Record<string, 'outline' | 'default' | 'secondary' | 'destructive'> = {
    pending: 'outline',
    sent: 'default',
    cancelled: 'secondary',
    failed: 'destructive',
  }
  return map[reminder.value.status] ?? 'default'
})

const typeVariant = computed(() => {
  if (!reminder.value) return 'default'
  const map: Record<string, 'default' | 'destructive'> = {
    upcoming: 'default',
    overdue: 'destructive',
    final_notice: 'destructive',
  }
  return map[reminder.value.type] ?? 'default'
})

const channelLabel = computed(() => {
  if (!reminder.value) return ''
  const channelMap = {
    email: 'Email',
    sms: 'SMS',
    whatsapp: 'WhatsApp',
    database: 'Database',
  }
  return channelMap[reminder.value.channel] || reminder.value.channel
})

const documentNumber = computed(() => {
  if (!reminder.value?.remindable) return '-'
  return reminder.value.remindable.invoice_number || reminder.value.remindable.bill_number || `#${reminder.value.remindable_id}`
})

const documentLabel = computed(() => {
  if (!reminder.value) return 'Document'
  return reminder.value.remindable_type === 'Invoice' ? 'Invoice' : 'Bill'
})

const documentRoute = computed(() => {
  if (!reminder.value?.remindable) return ''
  if (reminder.value.remindable_type === 'Invoice') {
    return `/invoices/${reminder.value.remindable_id}`
  }
  return `/bills/${reminder.value.remindable_id}`
})

const canSend = computed(() => reminder.value?.status === 'pending')
const canCancel = computed(() => reminder.value?.status === 'pending')

// Action handlers
async function handleSend() {
  if (!reminder.value) return
  try {
    await sendMutation.mutateAsync({ id: reminder.value.id })
    queryClient.invalidateQueries({ queryKey: ['payment-reminder', reminderId.value] })
    toast.success('Reminder sent successfully')
  } catch {
    toast.error('Failed to send reminder')
  }
}

async function handleCancel() {
  if (!reminder.value) return
  try {
    await cancelMutation.mutateAsync({ id: reminder.value.id })
    queryClient.invalidateQueries({ queryKey: ['payment-reminder', reminderId.value] })
    showCancelModal.value = false
    toast.success('Reminder cancelled')
  } catch {
    toast.error('Failed to cancel reminder')
  }
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-muted-foreground">
      Loading...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-destructive">
      Failed to load reminder
    </div>

    <!-- Content -->
    <template v-else-if="reminder">
      <!-- Breadcrumb -->
      <div class="text-sm text-muted-foreground mb-4">
        <RouterLink to="/finance/reminders" class="hover:text-foreground">Reminders</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-foreground">Reminder #{{ reminder.id }}</span>
      </div>

      <!-- Header -->
      <Card class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-foreground">
                Reminder #{{ reminder.id }}
              </h1>
              <Badge :variant="typeVariant">
                {{ reminderTypeLabel }}
              </Badge>
              <Badge :variant="statusVariant">
                {{ reminder.status }}
              </Badge>
            </div>
            <p class="text-muted-foreground">{{ reminder.contact?.name }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <!-- Send (pending only) -->
            <Button
              v-if="canSend"
              size="sm"
              :loading="sendMutation.isPending.value"
              @click="handleSend"
            >
              <Send class="w-4 h-4 mr-2" />
              Send Now
            </Button>

            <!-- Cancel (pending only) -->
            <Button
              v-if="canCancel"
              variant="destructive"
              size="sm"
              @click="showCancelModal = true"
            >
              <X class="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </Card>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Contact & Document Details Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-foreground">Details</h2>
            </template>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-muted-foreground flex items-center gap-2">
                  <User class="w-4 h-4" />
                  Contact
                </dt>
                <dd class="font-medium text-foreground">{{ reminder.contact?.name }}</dd>
                <dd v-if="reminder.contact?.email" class="text-sm text-muted-foreground">
                  {{ reminder.contact.email }}
                </dd>
              </div>

              <div>
                <dt class="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText class="w-4 h-4" />
                  {{ documentLabel }}
                </dt>
                <dd class="font-medium text-foreground">
                  <RouterLink
                    v-if="documentRoute"
                    :to="documentRoute"
                    class="text-primary hover:underline"
                  >
                    {{ documentNumber }}
                  </RouterLink>
                  <span v-else>{{ documentNumber }}</span>
                </dd>
              </div>

              <div>
                <dt class="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar class="w-4 h-4" />
                  Scheduled Date
                </dt>
                <dd class="font-medium text-foreground">{{ formatDate(reminder.scheduled_date) }}</dd>
              </div>

              <div>
                <dt class="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar class="w-4 h-4" />
                  Sent Date
                </dt>
                <dd class="font-medium text-foreground">
                  {{ reminder.sent_date ? formatDate(reminder.sent_date) : '-' }}
                </dd>
              </div>

              <div>
                <dt class="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail class="w-4 h-4" />
                  Channel
                </dt>
                <dd class="font-medium text-foreground">{{ channelLabel }}</dd>
              </div>

              <div>
                <dt class="text-sm text-muted-foreground">Days Offset</dt>
                <dd class="font-medium text-foreground">
                  {{ reminder.days_offset >= 0 ? `+${reminder.days_offset}` : reminder.days_offset }} days
                </dd>
              </div>

              <div v-if="reminder.creator" class="col-span-2">
                <dt class="text-sm text-muted-foreground">Created By</dt>
                <dd class="font-medium text-foreground">{{ reminder.creator.name }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Message Card -->
          <Card v-if="reminder.message">
            <template #header>
              <h2 class="font-semibold text-foreground flex items-center gap-2">
                <MessageSquare class="w-4 h-4" />
                Message
              </h2>
            </template>

            <div class="text-foreground whitespace-pre-wrap">
              {{ reminder.message }}
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Related Document Card -->
          <Card v-if="reminder.remindable">
            <template #header>
              <h2 class="font-semibold text-foreground">{{ documentLabel }} Details</h2>
            </template>

            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Number</dt>
                <dd class="font-medium text-foreground">
                  <RouterLink
                    v-if="documentRoute"
                    :to="documentRoute"
                    class="text-primary hover:underline"
                  >
                    {{ documentNumber }}
                  </RouterLink>
                  <span v-else>{{ documentNumber }}</span>
                </dd>
              </div>

              <div v-if="reminder.remindable.status" class="flex justify-between items-center">
                <dt class="text-sm text-muted-foreground">Status</dt>
                <dd>
                  <Badge :status="reminder.remindable.status.value">
                    {{ reminder.remindable.status.label }}
                  </Badge>
                </dd>
              </div>

              <div v-if="reminder.remindable.contact" class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Contact</dt>
                <dd class="font-medium text-foreground">{{ reminder.remindable.contact.name }}</dd>
              </div>

              <div v-if="reminder.remindable.total_amount !== undefined" class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Total</dt>
                <dd class="font-medium text-foreground">{{ formatCurrency(reminder.remindable.total_amount) }}</dd>
              </div>

              <div v-if="reminder.remindable.outstanding_amount !== undefined" class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Outstanding</dt>
                <dd class="font-medium text-destructive">
                  {{ formatCurrency(reminder.remindable.outstanding_amount) }}
                </dd>
              </div>

              <div v-if="reminder.remindable.due_date" class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Due Date</dt>
                <dd class="font-medium text-foreground">{{ formatDate(reminder.remindable.due_date) }}</dd>
              </div>
            </dl>

            <div v-if="documentRoute" class="mt-4 pt-4 border-t border-border">
              <RouterLink :to="documentRoute">
                <Button variant="secondary" size="sm" class="w-full">
                  <FileText class="w-4 h-4 mr-2" />
                  View {{ documentLabel }}
                </Button>
              </RouterLink>
            </div>
          </Card>
        </div>
      </div>
    </template>

    <!-- Cancel Modal -->
    <Modal :open="showCancelModal" title="Cancel Reminder" size="sm" @update:open="showCancelModal = $event">
      <p class="text-muted-foreground">
        Are you sure you want to cancel this reminder? This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showCancelModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="cancelMutation.isPending.value"
          @click="handleCancel"
        >
          Cancel Reminder
        </Button>
      </template>
    </Modal>
  </div>
</template>
