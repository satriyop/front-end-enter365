<script setup lang="ts">
import { computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import { useSendReminder } from '@/api/usePaymentReminders'
import { useToast } from '@/components/ui/Toast/useToast'
import { getErrorMessage } from '@/api/client'

interface Props {
  open: boolean
  reminderId: number
  reminderType?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const toast = useToast()
const sendMutation = useSendReminder()

const isSubmitting = computed(() => sendMutation.isPending.value)

function handleClose() {
  emit('update:open', false)
}

async function handleSend() {
  try {
    await sendMutation.mutateAsync({ id: props.reminderId })
    toast.success('Reminder sent successfully')
    emit('update:open', false)
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to send reminder'))
  }
}
</script>

<template>
  <Modal
    :open="open"
    title="Send Reminder"
    size="sm"
    @update:open="handleClose"
  >
    <p class="text-sm text-muted-foreground">
      Are you sure you want to send this
      <span class="font-medium">{{ reminderType ?? 'payment' }}</span>
      reminder now?
    </p>

    <template #footer>
      <Button variant="secondary" @click="handleClose">Cancel</Button>
      <Button
        :loading="isSubmitting"
        @click="handleSend"
      >
        Send Now
      </Button>
    </template>
  </Modal>
</template>
