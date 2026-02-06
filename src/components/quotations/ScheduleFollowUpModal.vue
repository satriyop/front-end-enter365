<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Textarea from '@/components/ui/Textarea.vue'
import FormField from '@/components/ui/FormField.vue'
import { useScheduleFollowUp } from '@/api/useQuotationFollowUp'
import { useToast } from '@/components/ui/Toast/useToast'
import { getErrorMessage } from '@/api/client'

interface Props {
  open: boolean
  quotationId: number
  currentFollowUp?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const toast = useToast()
const scheduleFollowUp = useScheduleFollowUp()

const nextFollowUpAt = ref('')
const notes = ref('')

const isSubmitting = computed(() => scheduleFollowUp.isPending.value)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      // Pre-fill with current follow-up date or tomorrow
      if (props.currentFollowUp) {
        nextFollowUpAt.value = props.currentFollowUp.slice(0, 16)
      } else {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(9, 0, 0, 0)
        nextFollowUpAt.value = tomorrow.toISOString().slice(0, 16)
      }
      notes.value = ''
    }
  }
)

async function handleSubmit() {
  if (!nextFollowUpAt.value) return

  try {
    await scheduleFollowUp.mutateAsync({
      id: props.quotationId,
      next_follow_up_at: new Date(nextFollowUpAt.value).toISOString(),
      notes: notes.value || null,
    })
    toast.success('Follow-up scheduled')
    emit('update:open', false)
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to schedule follow-up'))
  }
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Schedule Follow-Up"
    @update:open="handleClose"
  >
    <form novalidate class="space-y-4" @submit.prevent="handleSubmit">
      <FormField label="Next Follow-Up Date" required>
        <Input v-model="nextFollowUpAt" type="datetime-local" />
      </FormField>

      <FormField label="Notes">
        <Textarea v-model="notes" placeholder="Any notes about this follow-up..." :rows="3" />
      </FormField>
    </form>

    <template #footer>
      <Button variant="secondary" @click="handleClose">Cancel</Button>
      <Button
        :loading="isSubmitting"
        :disabled="!nextFollowUpAt"
        @click="handleSubmit"
      >
        Schedule
      </Button>
    </template>
  </Modal>
</template>
