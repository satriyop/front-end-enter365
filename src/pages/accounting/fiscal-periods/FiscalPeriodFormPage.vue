<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import {
  useFiscalPeriod,
  useCreateFiscalPeriod,
  useUpdateFiscalPeriod,
  type CreateFiscalPeriodData,
} from '@/api/useFiscalPeriods'
import { setServerErrors } from '@/composables/useValidatedForm'
import { Button, Card, Input, useToast } from '@/components/ui'
import { ArrowLeft, Save, Loader2, Calendar } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if editing
const periodId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isEditing = computed(() => periodId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Fiscal Period' : 'New Fiscal Period')

// Fetch existing period if editing
const periodIdRef = computed(() => periodId.value ?? 0)
const { data: existingPeriod, isLoading: loadingPeriod } = useFiscalPeriod(periodIdRef)

// Form validation schema
const fiscalPeriodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
}).refine((data) => {
  if (data.start_date && data.end_date) {
    return new Date(data.start_date) <= new Date(data.end_date)
  }
  return true
}, {
  message: 'End date must be after start date',
  path: ['end_date'],
})

type FiscalPeriodFormValues = z.infer<typeof fiscalPeriodSchema>

// Form setup
const { errors, handleSubmit, setFieldValue, setValues, setErrors, defineField } = useForm<FiscalPeriodFormValues>({
  validationSchema: toTypedSchema(fiscalPeriodSchema),
  initialValues: {
    name: '',
    start_date: '',
    end_date: '',
  },
})

const [name] = defineField('name')
const [startDate] = defineField('start_date')
const [endDate] = defineField('end_date')

// Populate form when editing
watch(existingPeriod, (period) => {
  if (period) {
    setValues({
      name: period.name,
      start_date: period.start_date?.split('T')[0] ?? '',
      end_date: period.end_date?.split('T')[0] ?? '',
    })
  }
}, { immediate: true })

// Auto-generate name based on dates (only on create, and only if name is empty)
watch([startDate, endDate], ([start, end]) => {
  if (isEditing.value) return
  if (start && end && !name.value) {
    const startDateObj = new Date(start)
    const endDateObj = new Date(end)

    const startYear = startDateObj.getFullYear()
    const endYear = endDateObj.getFullYear()

    if (startYear === endYear) {
      const startMonth = startDateObj.toLocaleDateString('en-US', { month: 'short' })
      const endMonth = endDateObj.toLocaleDateString('en-US', { month: 'short' })

      const isFullYear = startDateObj.getMonth() === 0 && startDateObj.getDate() === 1 &&
        endDateObj.getMonth() === 11 && endDateObj.getDate() === 31

      if (isFullYear) {
        setFieldValue('name', `Fiscal Year ${startYear}`)
      } else {
        setFieldValue('name', `${startMonth} - ${endMonth} ${startYear}`)
      }
    } else {
      setFieldValue('name', `${startYear} - ${endYear}`)
    }
  }
})

// Quick period presets (only on create)
function setYearlyPeriod() {
  const year = new Date().getFullYear()
  setFieldValue('start_date', `${year}-01-01`)
  setFieldValue('end_date', `${year}-12-31`)
  setFieldValue('name', `Fiscal Year ${year}`)
}

function setNextYearPeriod() {
  const year = new Date().getFullYear() + 1
  setFieldValue('start_date', `${year}-01-01`)
  setFieldValue('end_date', `${year}-12-31`)
  setFieldValue('name', `Fiscal Year ${year}`)
}

// Mutations
const createMutation = useCreateFiscalPeriod()
const updateMutation = useUpdateFiscalPeriod()

const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

// Form submission
const onSubmit = handleSubmit(async (formValues) => {
  const data: CreateFiscalPeriodData = {
    name: formValues.name,
    start_date: formValues.start_date,
    end_date: formValues.end_date,
  }

  try {
    if (isEditing.value && periodId.value) {
      await updateMutation.mutateAsync({ id: periodId.value, data })
      toast.success('Fiscal period updated')
      router.push(`/accounting/fiscal-periods/${periodId.value}`)
    } else {
      const result = await createMutation.mutateAsync(data)
      toast.success('Fiscal period created')
      router.push(`/accounting/fiscal-periods/${result.id}`)
    }
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors }, response.errors)
    }
    toast.error(response?.message || `Failed to ${isEditing.value ? 'update' : 'create'} fiscal period`)
  }
})
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
      <RouterLink to="/accounting/fiscal-periods" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
        <ArrowLeft class="w-4 h-4" />
        Fiscal Periods
      </RouterLink>
      <span>/</span>
      <span class="text-slate-900 dark:text-slate-100">{{ isEditing ? 'Edit' : 'New Period' }}</span>
    </div>

    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
      <p class="text-slate-500 dark:text-slate-400">
        {{ isEditing ? 'Update fiscal period details' : 'Create a new accounting period' }}
      </p>
    </div>

    <!-- Loading state for edit mode -->
    <div v-if="isEditing && loadingPeriod" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading fiscal period...</div>
    </div>

    <!-- Form -->
    <form v-else novalidate @submit="onSubmit">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Form -->
        <div class="lg:col-span-2">
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Period Information</h2>
            </template>

            <div class="space-y-4">
              <!-- Quick Presets (create only) -->
              <div v-if="!isEditing">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Quick Setup
                </label>
                <div class="flex gap-2">
                  <Button type="button" variant="secondary" size="sm" @click="setYearlyPeriod">
                    <Calendar class="w-4 h-4 mr-1" />
                    Current Year
                  </Button>
                  <Button type="button" variant="secondary" size="sm" @click="setNextYearPeriod">
                    <Calendar class="w-4 h-4 mr-1" />
                    Next Year
                  </Button>
                </div>
              </div>

              <!-- Date Range -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Date <span class="text-red-500">*</span>
                  </label>
                  <Input
                    v-model="startDate"
                    type="date"
                    :error="errors.start_date"
                  />
                  <p v-if="errors.start_date" class="mt-1 text-sm text-red-500">{{ errors.start_date }}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Date <span class="text-red-500">*</span>
                  </label>
                  <Input
                    v-model="endDate"
                    type="date"
                    :error="errors.end_date"
                  />
                  <p v-if="errors.end_date" class="mt-1 text-sm text-red-500">{{ errors.end_date }}</p>
                </div>
              </div>

              <!-- Name -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Period Name <span class="text-red-500">*</span>
                </label>
                <Input
                  v-model="name"
                  placeholder="e.g., Fiscal Year 2024"
                  :error="errors.name"
                />
                <p v-if="errors.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  A descriptive name for this period{{ isEditing ? '' : ' (auto-generated from dates)' }}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Help Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">About Fiscal Periods</h2>
            </template>

            <div class="text-sm text-slate-600 dark:text-slate-400 space-y-3">
              <p>
                Fiscal periods help organize your accounting by time ranges.
                Typically, companies use annual periods (Jan 1 - Dec 31).
              </p>
              <p>
                <strong>Period Lifecycle:</strong>
              </p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li><strong>Open:</strong> Transactions can be posted</li>
                <li><strong>Locked:</strong> No new transactions</li>
                <li><strong>Closed:</strong> Permanently closed with closing entry</li>
              </ul>
            </div>
          </Card>

          <!-- Actions -->
          <Card>
            <div class="flex flex-col gap-3">
              <Button type="submit" :disabled="isSubmitting" class="w-full">
                <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
                <Save v-else class="w-4 h-4 mr-2" />
                {{ isEditing ? 'Update Period' : 'Create Period' }}
              </Button>
              <Button
                type="button"
                variant="ghost"
                class="w-full"
                @click="router.back()"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </form>
  </div>
</template>
