<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Textarea from '@/components/ui/Textarea.vue'
import FormField from '@/components/ui/FormField.vue'
import { useScheduleReminder, type ScheduleReminderData } from '@/api/usePaymentReminders'
import { useToast } from '@/components/ui/Toast/useToast'
import { getErrorMessage } from '@/api/client'

interface Props {
  open: boolean
  invoiceId: number
  dueDate?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const toast = useToast()
const scheduleMutation = useScheduleReminder()

const scheduledDate = ref('')
const type = ref<'upcoming' | 'overdue' | 'final_notice'>('overdue')
const channel = ref<'email' | 'whatsapp'>('email')
const message = ref('')

const isSubmitting = computed(() => scheduleMutation.isPending.value)

const typeOptions = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'final_notice', label: 'Final Notice' },
]

const channelOptions = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Default to tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      scheduledDate.value = tomorrow.toISOString().split('T')[0] ?? ''
      type.value = 'overdue'
      channel.value = 'email'
      message.value = ''
    }
  }
)

async function handleSubmit() {
  if (!scheduledDate.value) return

  const data: ScheduleReminderData = {
    scheduled_date: scheduledDate.value,
    type: type.value,
    channel: channel.value,
    message: message.value || undefined,
  }

  try {
    await scheduleMutation.mutateAsync({ invoiceId: props.invoiceId, data })
    toast.success('Reminder scheduled')
    emit('update:open', false)
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to schedule reminder'))
  }
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Schedule Reminder"
    @update:open="handleClose"
  >
    <form novalidate class="space-y-4" @submit.prevent="handleSubmit">
      <FormField label="Scheduled Date" required>
        <Input v-model="scheduledDate" type="date" />
      </FormField>

      <FormField label="Type" required>
        <Select
          :model-value="type"
          :options="typeOptions"
          @update:model-value="(v) => type = v as typeof type"
        />
      </FormField>

      <FormField label="Channel" required>
        <Select
          :model-value="channel"
          :options="channelOptions"
          @update:model-value="(v) => channel = v as typeof channel"
        />
      </FormField>

      <FormField label="Custom Message">
        <Textarea
          v-model="message"
          placeholder="Optional custom message..."
          :rows="3"
        />
      </FormField>
    </form>

    <template #footer>
      <Button variant="secondary" @click="handleClose">Cancel</Button>
      <Button
        :loading="isSubmitting"
        :disabled="!scheduledDate"
        @click="handleSubmit"
      >
        Schedule
      </Button>
    </template>
  </Modal>
</template>
