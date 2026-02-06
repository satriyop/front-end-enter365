<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Select from '@/components/ui/Select.vue'
import Input from '@/components/ui/Input.vue'
import Textarea from '@/components/ui/Textarea.vue'
import FormField from '@/components/ui/FormField.vue'
import { useLogActivity, type StoreActivityData } from '@/api/useQuotationFollowUp'
import { useToast } from '@/components/ui/Toast/useToast'
import { getErrorMessage } from '@/api/client'

interface Props {
  open: boolean
  quotationId: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const toast = useToast()
const logActivity = useLogActivity()

// Form state
const activityType = ref<StoreActivityData['type']>('call')
const activityAt = ref('')
const subject = ref('')
const description = ref('')
const durationMinutes = ref<number | undefined>(undefined)
const contactPerson = ref('')
const contactMethod = ref<StoreActivityData['contact_method'] | ''>('')
const outcome = ref<StoreActivityData['outcome'] | ''>('')
const nextFollowUpAt = ref('')
const followUpType = ref<string>('')

const isSubmitting = computed(() => logActivity.isPending.value)

const showFollowUpFields = computed(() => !!nextFollowUpAt.value)

// Options
const typeOptions = [
  { value: 'call', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'visit', label: 'Site Visit' },
]

const contactMethodOptions = [
  { value: '', label: 'None' },
  { value: 'phone', label: 'Phone' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'visit', label: 'Visit' },
]

const outcomeOptions = [
  { value: '', label: 'Not Set' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'no_answer', label: 'No Answer' },
]

const followUpTypeOptions = [
  { value: '', label: 'None' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'visit', label: 'Visit' },
]

// Reset form when opened
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      activityType.value = 'call'
      activityAt.value = new Date().toISOString().slice(0, 16)
      subject.value = ''
      description.value = ''
      durationMinutes.value = undefined
      contactPerson.value = ''
      contactMethod.value = ''
      outcome.value = ''
      nextFollowUpAt.value = ''
      followUpType.value = ''
    }
  }
)

async function handleSubmit() {
  if (!activityType.value || !activityAt.value) return

  const data: StoreActivityData = {
    type: activityType.value,
    activity_at: new Date(activityAt.value).toISOString(),
  }

  if (subject.value) data.subject = subject.value
  if (description.value) data.description = description.value
  if (durationMinutes.value) data.duration_minutes = durationMinutes.value
  if (contactPerson.value) data.contact_person = contactPerson.value
  if (contactMethod.value) data.contact_method = contactMethod.value as StoreActivityData['contact_method']
  if (outcome.value) data.outcome = outcome.value as StoreActivityData['outcome']
  if (nextFollowUpAt.value) data.next_follow_up_at = new Date(nextFollowUpAt.value).toISOString()
  if (followUpType.value) data.follow_up_type = followUpType.value as StoreActivityData['follow_up_type']

  try {
    await logActivity.mutateAsync({ id: props.quotationId, data })
    toast.success('Activity logged successfully')
    emit('update:open', false)
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to log activity'))
  }
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    size="lg"
    title="Log Activity"
    @update:open="handleClose"
  >
    <form novalidate class="space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Type -->
        <FormField label="Activity Type" required>
          <Select v-model="activityType" :options="typeOptions" />
        </FormField>

        <!-- Activity Date -->
        <FormField label="Date & Time" required>
          <Input v-model="activityAt" type="datetime-local" />
        </FormField>
      </div>

      <!-- Subject -->
      <FormField label="Subject">
        <Input v-model="subject" placeholder="Brief summary of the activity..." />
      </FormField>

      <!-- Description -->
      <FormField label="Description">
        <Textarea v-model="description" placeholder="Details of the interaction..." :rows="3" />
      </FormField>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Duration -->
        <FormField label="Duration (min)">
          <Input v-model.number="durationMinutes" type="number" placeholder="0" min="0" />
        </FormField>

        <!-- Contact Person -->
        <FormField label="Contact Person">
          <Input v-model="contactPerson" placeholder="Person contacted" />
        </FormField>

        <!-- Contact Method -->
        <FormField label="Contact Method">
          <Select v-model="contactMethod" :options="contactMethodOptions" />
        </FormField>
      </div>

      <!-- Outcome -->
      <FormField label="Outcome">
        <Select v-model="outcome" :options="outcomeOptions" />
      </FormField>

      <!-- Next Follow-Up (optional) -->
      <div class="border-t border-border pt-4 space-y-4">
        <p class="text-sm font-medium text-muted-foreground">Schedule Next Follow-Up (optional)</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Next Follow-Up Date">
            <Input v-model="nextFollowUpAt" type="datetime-local" />
          </FormField>

          <FormField v-if="showFollowUpFields" label="Follow-Up Type">
            <Select v-model="followUpType" :options="followUpTypeOptions" />
          </FormField>
        </div>
      </div>
    </form>

    <template #footer>
      <Button variant="secondary" @click="handleClose">Cancel</Button>
      <Button
        :loading="isSubmitting"
        :disabled="!activityType || !activityAt"
        @click="handleSubmit"
      >
        Log Activity
      </Button>
    </template>
  </Modal>
</template>
