<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useNsfpRange,
  useCreateNsfpRange,
  useUpdateNsfpRange,
  type CreateNsfpRangeData,
  type UpdateNsfpRangeData,
} from '@/api/useNsfpRanges'
import { setServerErrors } from '@/composables/useValidatedForm'
import { nsfpRangeCreateSchema, nsfpRangeEditSchema } from '@/utils/validation'
import { Button, Card, Input, Textarea, useToast } from '@/components/ui'
import { ArrowLeft, Save, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine mode
const rangeId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isEditing = computed(() => rangeId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit NSFP Range' : 'New NSFP Range')

// Fetch existing range if editing
const rangeIdRef = computed(() => rangeId.value ?? 0)
const { data: existingRange, isLoading: loadingRange } = useNsfpRange(rangeIdRef)

// Current 2-digit year
const currentYearCode = String(new Date().getFullYear()).slice(-2)

// ─────────────────────────────────────────────
// Create mode form
// ─────────────────────────────────────────────
const createForm = useForm({
  validationSchema: toTypedSchema(nsfpRangeCreateSchema),
  initialValues: {
    transaction_code: '010',
    branch_code: '000',
    year_code: currentYearCode,
    range_start: undefined as unknown as number,
    range_end: undefined as unknown as number,
    description: '',
  },
})

const [transactionCode] = createForm.defineField('transaction_code')
const [branchCode] = createForm.defineField('branch_code')
const [yearCode] = createForm.defineField('year_code')
const [rangeStart] = createForm.defineField('range_start')
const [rangeEnd] = createForm.defineField('range_end')
const [createDescription] = createForm.defineField('description')

// ─────────────────────────────────────────────
// Edit mode form
// ─────────────────────────────────────────────
const editForm = useForm({
  validationSchema: toTypedSchema(nsfpRangeEditSchema),
  initialValues: {
    description: '',
    is_active: true,
  },
})

const [editDescription] = editForm.defineField('description')
const [isActive] = editForm.defineField('is_active')

// Populate edit form when data loads
watch(existingRange, (range) => {
  if (range) {
    editForm.setValues({
      description: range.description ?? '',
      is_active: range.is_active,
    })
  }
}, { immediate: true })

// Preview of the NSFP number format
const previewFormat = computed(() => {
  if (isEditing.value) return null
  const tc = transactionCode.value || '___'
  const bc = branchCode.value || '___'
  const yc = yearCode.value || '__'
  return `${tc}.${bc}-${yc}.00000001`
})

// Mutations
const createMutation = useCreateNsfpRange()
const updateMutation = useUpdateNsfpRange()

const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

// Submit handlers
const onCreateSubmit = createForm.handleSubmit(async (formValues) => {
  const data: CreateNsfpRangeData = {
    transaction_code: formValues.transaction_code,
    branch_code: formValues.branch_code,
    year_code: formValues.year_code,
    range_start: formValues.range_start,
    range_end: formValues.range_end,
    description: formValues.description || null,
  }

  try {
    const result = await createMutation.mutateAsync(data)
    toast.success('NSFP range created')
    router.push(`/settings/nsfp-ranges/${result.id}`)
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors: createForm.setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to create NSFP range')
  }
})

const onEditSubmit = editForm.handleSubmit(async (formValues) => {
  if (!rangeId.value) return

  const data: UpdateNsfpRangeData = {
    description: formValues.description || null,
    is_active: formValues.is_active,
  }

  try {
    await updateMutation.mutateAsync({ id: rangeId.value, data })
    toast.success('NSFP range updated')
    router.push(`/settings/nsfp-ranges/${rangeId.value}`)
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      setServerErrors({ setErrors: editForm.setErrors }, response.errors)
    }
    toast.error(response?.message || 'Failed to update NSFP range')
  }
})

function handleSubmit(e: Event) {
  if (isEditing.value) {
    onEditSubmit(e)
  } else {
    onCreateSubmit(e)
  }
}

// Use separate error accessors to avoid TS union type issues
const createErrors = createForm.errors
const editErrors = editForm.errors
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
      <RouterLink to="/settings/nsfp-ranges" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
        <ArrowLeft class="w-4 h-4" />
        NSFP Ranges
      </RouterLink>
      <span>/</span>
      <span class="text-slate-900 dark:text-slate-100">{{ isEditing ? 'Edit' : 'New Range' }}</span>
    </div>

    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
      <p class="text-slate-500 dark:text-slate-400">
        {{ isEditing ? 'Update range metadata' : 'Allocate a new tax invoice serial number range' }}
      </p>
    </div>

    <!-- Loading state for edit mode -->
    <div v-if="isEditing && loadingRange" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading NSFP range...</div>
    </div>

    <!-- Form -->
    <form v-else novalidate @submit="handleSubmit">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Form -->
        <div class="lg:col-span-2">
          <!-- Create Mode Fields -->
          <Card v-if="!isEditing">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Range Information</h2>
            </template>

            <div class="space-y-4">
              <!-- Code Fields -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Code <span class="text-red-500">*</span>
                  </label>
                  <Input
                    v-model="transactionCode"
                    placeholder="010"
                    maxlength="3"
                    :error="createErrors.transaction_code"
                  />
                  <p v-if="createErrors.transaction_code" class="mt-1 text-sm text-red-500">{{ createErrors.transaction_code }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">3-digit code (e.g., 010)</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Branch Code <span class="text-red-500">*</span>
                  </label>
                  <Input
                    v-model="branchCode"
                    placeholder="000"
                    maxlength="3"
                    :error="createErrors.branch_code"
                  />
                  <p v-if="createErrors.branch_code" class="mt-1 text-sm text-red-500">{{ createErrors.branch_code }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">3-digit code (e.g., 000)</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Year Code <span class="text-red-500">*</span>
                  </label>
                  <Input
                    v-model="yearCode"
                    :placeholder="currentYearCode"
                    maxlength="2"
                    :error="createErrors.year_code"
                  />
                  <p v-if="createErrors.year_code" class="mt-1 text-sm text-red-500">{{ createErrors.year_code }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">2-digit year (e.g., {{ currentYearCode }})</p>
                </div>
              </div>

              <!-- Range Numbers -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Range Start <span class="text-red-500">*</span>
                  </label>
                  <Input
                    v-model.number="rangeStart"
                    type="number"
                    placeholder="1"
                    min="1"
                    :error="createErrors.range_start"
                  />
                  <p v-if="createErrors.range_start" class="mt-1 text-sm text-red-500">{{ createErrors.range_start }}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Range End <span class="text-red-500">*</span>
                  </label>
                  <Input
                    v-model.number="rangeEnd"
                    type="number"
                    placeholder="1000"
                    min="1"
                    :error="createErrors.range_end"
                  />
                  <p v-if="createErrors.range_end" class="mt-1 text-sm text-red-500">{{ createErrors.range_end }}</p>
                </div>
              </div>

              <!-- Preview -->
              <div v-if="previewFormat" class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p class="text-xs text-muted-foreground mb-1">Preview format:</p>
                <p class="font-mono text-sm text-slate-900 dark:text-slate-100">{{ previewFormat }}</p>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <Textarea
                  v-model="createDescription"
                  placeholder="Optional description for this range"
                  :rows="3"
                />
                <p v-if="createErrors.description" class="mt-1 text-sm text-red-500">{{ createErrors.description }}</p>
              </div>
            </div>
          </Card>

          <!-- Edit Mode Fields -->
          <template v-else>
            <!-- Read-only range info -->
            <Card class="mb-6">
              <template #header>
                <h2 class="font-semibold text-slate-900 dark:text-slate-100">Range Information (Read-only)</h2>
              </template>

              <dl class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt class="text-muted-foreground">Transaction Code</dt>
                  <dd class="font-mono font-medium text-slate-900 dark:text-slate-100">{{ existingRange?.transaction_code }}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">Branch Code</dt>
                  <dd class="font-mono font-medium text-slate-900 dark:text-slate-100">{{ existingRange?.branch_code }}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">Year Code</dt>
                  <dd class="font-mono font-medium text-slate-900 dark:text-slate-100">{{ existingRange?.year_code }}</dd>
                </div>
                <div>
                  <dt class="text-muted-foreground">Range</dt>
                  <dd class="font-mono font-medium text-slate-900 dark:text-slate-100">
                    {{ existingRange?.formatted_range_start }} — {{ existingRange?.formatted_range_end }}
                  </dd>
                </div>
              </dl>
            </Card>

            <!-- Editable fields -->
            <Card>
              <template #header>
                <h2 class="font-semibold text-slate-900 dark:text-slate-100">Editable Fields</h2>
              </template>

              <div class="space-y-4">
                <!-- Description -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <Textarea
                    v-model="editDescription"
                    placeholder="Optional description for this range"
                    :rows="3"
                  />
                  <p v-if="editErrors.description" class="mt-1 text-sm text-red-500">{{ editErrors.description }}</p>
                </div>

                <!-- Active toggle -->
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium text-foreground">Active Status</h3>
                    <p class="text-sm text-muted-foreground">
                      Deactivating will prevent this range from being used for new invoices
                    </p>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input
                      v-model="isActive"
                      type="checkbox"
                      class="sr-only peer"
                    />
                    <div class="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            </Card>
          </template>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Help Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">About NSFP</h2>
            </template>

            <div class="text-sm text-slate-600 dark:text-slate-400 space-y-3">
              <p>
                NSFP (Nomor Seri Faktur Pajak) is the tax invoice serial number
                allocated by the Indonesian tax authority (DJP).
              </p>
              <p><strong>Number Format:</strong></p>
              <p class="font-mono text-xs bg-slate-50 dark:bg-slate-800 p-2 rounded">
                {trans}.{branch}-{year}.{number}
              </p>
              <ul class="list-disc list-inside space-y-1 ml-2 text-xs">
                <li><strong>Trans code:</strong> Transaction type (e.g., 010)</li>
                <li><strong>Branch code:</strong> Branch office (e.g., 000 = HQ)</li>
                <li><strong>Year code:</strong> 2-digit fiscal year</li>
                <li><strong>Number:</strong> 8-digit sequential number</li>
              </ul>
            </div>
          </Card>

          <!-- Actions -->
          <Card>
            <div class="flex flex-col gap-3">
              <Button type="submit" :disabled="isSubmitting" class="w-full">
                <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
                <Save v-else class="w-4 h-4 mr-2" />
                {{ isEditing ? 'Update Range' : 'Create Range' }}
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
