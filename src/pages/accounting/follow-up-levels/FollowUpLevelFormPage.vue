<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useCreateFollowUpLevel,
  useFollowUpLevel,
  useUpdateFollowUpLevel,
} from '@/api/useFollowUpLevels'
import { Button, Card, Input, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const levelId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!levelId.value)
const { data: existing } = useFollowUpLevel(levelId)

const name = ref('')
const delayDays = ref('1')
const sequence = ref('10')
const sendEmail = ref(true)
const joinInvoices = ref(true)
const message = ref('')
const isActive = ref(true)

watch(existing, (level) => {
  if (!level) return
  name.value = level.name
  delayDays.value = String(level.delay_days)
  sequence.value = String(level.sequence)
  sendEmail.value = level.send_email
  joinInvoices.value = level.join_invoices
  message.value = level.message ?? ''
  isActive.value = level.is_active
}, { immediate: true })

const createMutation = useCreateFollowUpLevel()
const updateMutation = useUpdateFollowUpLevel()

function goBack() {
  router.push('/accounting/follow-up-levels')
}

async function handleSubmit() {
  if (!name.value.trim() || delayDays.value === '') {
    toast.error('Name and delay days are required')
    return
  }
  const payload = {
    name: name.value.trim(),
    delay_days: Number(delayDays.value),
    sequence: Number(sequence.value) || 10,
    send_email: sendEmail.value,
    join_invoices: joinInvoices.value,
    message: message.value.trim() || null,
    is_active: isActive.value,
  }
  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: levelId.value, data: payload })
      toast.success('Follow-up level updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Follow-up level created')
    }
    goBack()
  } catch {
    toast.error('Failed to save follow-up level')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goBack">
        <ArrowLeft class="w-4 h-4" />
        Follow-up Levels
      </button>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Follow-up Level' : 'New Follow-up Level' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="name" data-testid="follow-up-level-name" placeholder="Name" />
        <Input v-model="delayDays" type="number" data-testid="follow-up-level-days" placeholder="Days after due date" />
        <Input v-model="sequence" type="number" min="0" placeholder="Sequence" />
        <Input v-model="message" placeholder="Message" />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="sendEmail" type="checkbox">
          Send email
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="joinInvoices" type="checkbox">
          Join invoices
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isActive" type="checkbox">
          Active
        </label>
      </Card>
      <Button type="submit" data-testid="follow-up-level-save">Save</Button>
    </form>
  </div>
</template>
