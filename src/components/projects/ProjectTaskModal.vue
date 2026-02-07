<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { projectTaskSchema, type ProjectTaskFormData } from '@/utils/validation'
import { Modal, Button, FormField, Input, Select, Textarea } from '@/components/ui'
import { useUsersLookup } from '@/api/useUsers'
import type { ProjectTask } from '@/api/useProjectTasks'

interface Props {
  open: boolean
  task?: ProjectTask | null
  isLoading?: boolean
  parentTask?: ProjectTask | null
}

const props = withDefaults(defineProps<Props>(), {
  task: null,
  isLoading: false,
  parentTask: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [data: ProjectTaskFormData]
}>()

const isEditing = computed(() => !!props.task)
const isSubtask = computed(() => !!props.parentTask)
const modalTitle = computed(() => {
  if (isSubtask.value) return 'Add Subtask'
  return isEditing.value ? 'Edit Task' : 'Add Task'
})

const { data: users } = useUsersLookup()

const userOptions = computed(() =>
  (users.value ?? []).map(u => ({ value: u.id, label: u.name })),
)

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

const defaultValues: ProjectTaskFormData = {
  title: '',
  description: '',
  priority: 'normal',
  assigned_to: null,
  start_date: '',
  due_date: '',
  estimated_hours: null,
  notes: '',
}

const {
  values,
  errors,
  handleSubmit,
  resetForm,
  validateField,
} = useForm<ProjectTaskFormData>({
  validationSchema: toTypedSchema(projectTaskSchema),
  initialValues: { ...defaultValues },
})

watch(() => [props.open, props.task], () => {
  if (props.open) {
    if (props.task) {
      resetForm({
        values: {
          title: props.task.title,
          description: props.task.description ?? '',
          priority: props.task.priority as ProjectTaskFormData['priority'],
          assigned_to: props.task.assigned_to ?? null,
          start_date: props.task.start_date?.split('T')[0] ?? '',
          due_date: props.task.due_date?.split('T')[0] ?? '',
          estimated_hours: props.task.estimated_hours ?? null,
          notes: props.task.notes ?? '',
        },
      })
    } else {
      resetForm({ values: { ...defaultValues } })
    }
  }
}, { immediate: true })

const onSubmit = handleSubmit((formValues) => {
  emit('submit', formValues)
})

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    :title="modalTitle"
    @update:open="$emit('update:open', $event)"
  >
    <form id="task-form" novalidate @submit.prevent="onSubmit">
      <div class="space-y-4">
        <div v-if="isSubtask" class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <span class="text-xs text-muted-foreground">Parent Task</span>
          <p class="text-sm font-medium text-foreground">{{ parentTask?.task_number }} — {{ parentTask?.title }}</p>
        </div>

        <FormField label="Title" required :error="errors.title">
          <Input
            v-model="values.title"
            placeholder="Enter task title"
            @blur="validateField('title')"
          />
        </FormField>

        <FormField label="Description" :error="errors.description">
          <Textarea
            v-model="values.description"
            :rows="3"
            placeholder="Describe what needs to be done..."
          />
        </FormField>

        <div class="grid grid-cols-2 gap-4">
          <FormField label="Priority" :error="errors.priority">
            <Select
              v-model="values.priority"
              :options="priorityOptions"
              placeholder="Select priority..."
              @blur="validateField('priority')"
            />
          </FormField>

          <FormField label="Assignee">
            <Select
              :model-value="values.assigned_to ?? null"
              :options="userOptions"
              placeholder="Unassigned"
              clearable
              @update:model-value="values.assigned_to = $event != null ? Number($event) : null"
            />
          </FormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormField label="Start Date">
            <Input v-model="values.start_date" type="date" />
          </FormField>

          <FormField label="Due Date">
            <Input v-model="values.due_date" type="date" />
          </FormField>
        </div>

        <FormField label="Estimated Hours" :error="errors.estimated_hours">
          <Input
            :model-value="values.estimated_hours ?? ''"
            type="number"
            step="0.5"
            min="0"
            placeholder="0"
            @update:model-value="values.estimated_hours = $event !== '' ? Number($event) : null"
            @blur="validateField('estimated_hours')"
          />
        </FormField>

        <FormField label="Notes">
          <Textarea
            v-model="values.notes"
            :rows="2"
            placeholder="Additional notes..."
          />
        </FormField>
      </div>
    </form>

    <template #footer>
      <Button variant="ghost" @click="handleClose">Cancel</Button>
      <Button
        type="submit"
        form="task-form"
        :loading="isLoading"
      >
        {{ isEditing ? 'Update Task' : isSubtask ? 'Add Subtask' : 'Add Task' }}
      </Button>
    </template>
  </Modal>
</template>
