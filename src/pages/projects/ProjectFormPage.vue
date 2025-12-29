<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProject, useCreateProject, useUpdateProject } from '@/api/useProjects'
import { useContactsLookup } from '@/api/useContacts'
import { Button, Input, FormField, Textarea, Select, Card, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const projectId = computed(() => {
  const id = route.params.id
  return id ? String(id) : null
})

const isEditing = computed(() => projectId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Project' : 'New Project')

const projectIdRef = computed(() => projectId.value ?? '')
const { data: existingProject, isLoading: loadingProject } = useProject(projectIdRef)

// Contacts lookup
const { data: contacts } = useContactsLookup('customer')
const contactOptions = computed(() =>
  (contacts.value ?? []).map(c => ({ value: c.id, label: c.name }))
)

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

interface FormState {
  name: string
  contact_id: number | null
  description: string
  location: string
  start_date: string
  end_date: string
  priority: string
  budget_amount: number
  contract_amount: number
}

const today = new Date().toISOString().split('T')[0] as string
const form = ref<FormState>({
  name: '',
  contact_id: null,
  description: '',
  location: '',
  start_date: today,
  end_date: '',
  priority: 'medium',
  budget_amount: 0,
  contract_amount: 0,
})

watch(existingProject, (project) => {
  if (project) {
    form.value = {
      name: project.name || '',
      contact_id: project.contact_id ? Number(project.contact_id) : null,
      description: project.description || '',
      location: project.location || '',
      start_date: project.start_date || today,
      end_date: project.end_date || '',
      priority: project.priority || 'medium',
      budget_amount: Number(project.budget_amount) || 0,
      contract_amount: Number(project.contract_amount) || 0,
    }
  }
}, { immediate: true })

const createMutation = useCreateProject()
const updateMutation = useUpdateProject()
const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const errors = ref<Record<string, string>>({})

async function handleSubmit() {
  errors.value = {}

  if (!form.value.name.trim()) {
    errors.value.name = 'Project name is required'
  }
  if (!form.value.contact_id) {
    errors.value.contact_id = 'Customer is required'
  }
  if (!form.value.start_date) {
    errors.value.start_date = 'Start date is required'
  }

  if (Object.keys(errors.value).length > 0) return

  try {
    if (isEditing.value && projectId.value) {
      await updateMutation.mutateAsync({ id: projectId.value, data: form.value as any })
      toast.success('Project updated')
      router.push(`/projects/${projectId.value}`)
    } else {
      const result = await createMutation.mutateAsync(form.value as any)
      toast.success('Project created')
      router.push(`/projects/${result.id}`)
    }
  } catch (err) {
    toast.error('Failed to save project')
    console.error(err)
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
        <p class="text-slate-500 dark:text-slate-400">
          {{ isEditing ? 'Update project details' : 'Create a new EPC project' }}
        </p>
      </div>
      <Button variant="ghost" @click="router.back()">Cancel</Button>
    </div>

    <div v-if="isEditing && loadingProject" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading project...</div>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Project Information</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Project Name" required :error="errors.name" class="md:col-span-2">
            <Input v-model="form.name" placeholder="e.g., Solar Installation - Site ABC" />
          </FormField>
          <FormField label="Customer" required :error="errors.contact_id">
            <Select v-model="form.contact_id" :options="contactOptions" placeholder="Select customer" />
          </FormField>
          <FormField label="Priority">
            <Select v-model="form.priority" :options="priorityOptions" />
          </FormField>
          <FormField label="Location" class="md:col-span-2">
            <Input v-model="form.location" placeholder="Project site location" />
          </FormField>
          <FormField label="Description" class="md:col-span-2">
            <Textarea v-model="form.description" :rows="3" placeholder="Project description and scope" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Timeline</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Start Date" required :error="errors.start_date">
            <Input v-model="form.start_date" type="date" />
          </FormField>
          <FormField label="End Date">
            <Input v-model="form.end_date" type="date" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Budget & Contract</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Contract Amount">
            <Input v-model.number="form.contract_amount" type="number" min="0" step="1000000" />
          </FormField>
          <FormField label="Budget Amount">
            <Input v-model.number="form.budget_amount" type="number" min="0" step="1000000" />
          </FormField>
        </div>
      </Card>

      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">Cancel</Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Project' : 'Create Project' }}
        </Button>
      </div>
    </form>
  </div>
</template>
