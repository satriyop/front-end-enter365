<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useCreateCustomerRating,
  useCustomerRating,
  useUpdateCustomerRating,
} from '@/api/useCustomerRatings'
import { useProjectsLookup } from '@/api/useProjects'
import { useProjectTasks } from '@/api/useProjectTasks'
import { useContactsLookup } from '@/api/useContacts'
import { toLocalISODate } from '@/utils/format'
import { Button, Card, Input, Select, Textarea, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const ratingId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!ratingId.value)
const { data: existing } = useCustomerRating(ratingId)
const { data: projects } = useProjectsLookup()
const { data: contacts } = useContactsLookup('customer')

const projectId = ref('')
const rateableType = ref('project')
const rateableId = ref('')
const contactId = ref('')
const rating = ref('5')
const comment = ref('')
const ratedAt = ref(toLocalISODate())

const taskFilters = ref({ page: 1, per_page: 100 })
const { data: tasksPage } = useProjectTasks(projectId, taskFilters)

watch(existing, (row) => {
  if (!row) return
  projectId.value = String(row.project_id)
  rateableType.value = row.rateable_type === 'task' ? 'task' : 'project'
  rateableId.value = row.rateable_id ? String(row.rateable_id) : String(row.project_id)
  contactId.value = row.contact_id ? String(row.contact_id) : ''
  rating.value = String(row.rating)
  comment.value = row.comment ?? ''
  ratedAt.value = row.rated_at ? row.rated_at.slice(0, 10) : toLocalISODate()
}, { immediate: true })

const projectOptions = computed(() =>
  (projects.value ?? []).map((project) => ({
    value: String(project.id),
    label: (project.project_number ? project.project_number + ' · ' : '') + project.name,
  })),
)
const contactOptions = computed(() =>
  (contacts.value ?? []).map((contact) => ({
    value: String(contact.id),
    label: contact.name,
  })),
)
const taskOptions = computed(() =>
  (tasksPage.value?.data ?? []).map((task) => ({
    value: String(task.id),
    label: task.task_number + ' · ' + task.title,
  })),
)
const typeOptions = [
  { value: 'project', label: 'Project' },
  { value: 'task', label: 'Task' },
]
const ratingOptions = [1, 2, 3, 4, 5].map((value) => ({
  value: String(value),
  label: String(value),
}))

const createMutation = useCreateCustomerRating()
const updateMutation = useUpdateCustomerRating()

function goBack() {
  router.push('/projects/customer-ratings')
}

async function handleSubmit() {
  if (!projectId.value || !rating.value) {
    toast.error('Project and rating are required')
    return
  }
  const type = rateableType.value === 'task' ? 'task' : 'project'
  const subjectId = type === 'task' ? Number(rateableId.value) : Number(projectId.value)
  if (type === 'task' && !subjectId) {
    toast.error('Select a task to rate')
    return
  }
  const payload = {
    project_id: Number(projectId.value),
    rateable_type: type as 'task' | 'project',
    rateable_id: subjectId,
    contact_id: contactId.value ? Number(contactId.value) : null,
    rating: Number(rating.value),
    comment: comment.value.trim() || null,
    rated_at: ratedAt.value || null,
  }
  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: ratingId.value, data: payload })
      toast.success('Rating updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Rating created')
    }
    router.push('/projects/customer-ratings')
  } catch {
    toast.error('Failed to save rating')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goBack">
        <ArrowLeft class="w-4 h-4" />
        Customer Ratings
      </button>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Customer Rating' : 'New Customer Rating' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Select
          :model-value="projectId"
          :options="projectOptions"
          placeholder="Project"
          test-id="customer-rating-project"
          @update:model-value="(v) => { projectId = v ? String(v) : '' }"
        />
        <Select
          :model-value="rateableType"
          :options="typeOptions"
          placeholder="Rate"
          @update:model-value="(v) => { rateableType = v ? String(v) : 'project' }"
        />
        <Select
          v-if="rateableType === 'task'"
          :model-value="rateableId"
          :options="taskOptions"
          placeholder="Task"
          test-id="customer-rating-task"
          @update:model-value="(v) => { rateableId = v ? String(v) : '' }"
        />
        <Select
          :model-value="contactId"
          :options="contactOptions"
          placeholder="Customer (optional)"
          @update:model-value="(v) => { contactId = v ? String(v) : '' }"
        />
        <Select
          :model-value="rating"
          :options="ratingOptions"
          placeholder="Rating"
          test-id="customer-rating-score"
          @update:model-value="(v) => { rating = v ? String(v) : '5' }"
        />
        <Input v-model="ratedAt" type="date" data-testid="customer-rating-date" />
        <Textarea v-model="comment" placeholder="Comment" />
      </Card>
      <div class="flex gap-2">
        <Button type="submit" data-testid="customer-rating-save">Save</Button>
        <Button type="button" variant="outline" @click="goBack">Cancel</Button>
      </div>
    </form>
  </div>
</template>
