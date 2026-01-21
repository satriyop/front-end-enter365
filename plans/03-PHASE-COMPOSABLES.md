# Phase 3: Composables Consolidation

## Overview

This phase creates powerful, unified composables that encapsulate common patterns found across the application. These composables build on the infrastructure (Phase 1) and services (Phase 2) to dramatically reduce code duplication in pages.

**Prerequisites:** Phase 1, Phase 2

**Deliverables:**
1. `useDocumentForm` - unified document form lifecycle
2. `useDocumentWorkflow` - status transitions and actions
3. `useResourceDetail` - detail page data fetching
4. Enhanced `useResourceList` - with built-in state management
5. `useFormWithLineItems` - form + line items integration

---

## 3.1 useDocumentForm

### The Problem

Every form page (Quotation, Invoice, Bill, PO) has similar logic:
- Detect create vs edit mode from route
- Fetch existing data for edit mode
- Initialize form with VeeValidate + Zod
- Handle form submission (create/update)
- Handle server validation errors
- Manage loading states
- Handle successful save (redirect or stay)

**Current duplication:** ~100-150 lines per form page

### The Solution

```typescript
// src/composables/useDocumentForm/types.ts
import type { ZodSchema } from 'zod'
import type { UseMutationReturnType } from '@tanstack/vue-query'

export interface DocumentFormConfig<TForm, TResponse> {
  // Document type for events
  documentType: string

  // Validation schema
  schema: ZodSchema<TForm>

  // Default values for new document
  defaultValues: TForm

  // Route param name for ID (default: 'id')
  idParam?: string

  // Custom route for redirect after save
  listRoute?: string
  detailRoute?: string

  // Whether to redirect after create (default: true)
  redirectAfterCreate?: boolean

  // Whether to stay on page after save (edit mode)
  stayOnPageAfterSave?: boolean
}

export interface DocumentFormReturn<TForm, TResponse> {
  // Mode
  isEditMode: ComputedRef<boolean>
  isCreateMode: ComputedRef<boolean>
  documentId: ComputedRef<number | null>

  // Form
  form: ReturnType<typeof useForm<TForm>>
  values: ComputedRef<TForm>
  errors: ComputedRef<Record<string, string>>
  isValid: ComputedRef<boolean>
  isDirty: ComputedRef<boolean>

  // Data fetching (edit mode)
  existingData: Ref<TResponse | null>
  isLoadingData: ComputedRef<boolean>
  dataError: ComputedRef<Error | null>

  // Submission
  isSubmitting: ComputedRef<boolean>
  submitError: ComputedRef<Error | null>
  submit: () => Promise<void>
  reset: () => void

  // Utilities
  setFieldValue: (field: keyof TForm, value: any) => void
  setFieldError: (field: keyof TForm, error: string) => void
  setServerErrors: (errors: Record<string, string[]>) => void
}
```

### Implementation

```typescript
// src/composables/useDocumentForm/useDocumentForm.ts
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useEventBus } from '@/infrastructure/events'
import { useLogger } from '@/infrastructure/logger'
import { extractValidationErrors, getErrorMessage } from '@/infrastructure/errors'
import { useToast } from '@/components/ui/Toast'
import type { DocumentFormConfig, DocumentFormReturn } from './types'

export function useDocumentForm<
  TForm extends Record<string, any>,
  TResponse extends { id: number },
  TCreate = TForm,
  TUpdate = Partial<TForm>
>(
  config: DocumentFormConfig<TForm, TResponse>,
  hooks: {
    useFetch?: (id: number) => { data: Ref<TResponse | undefined>; isLoading: Ref<boolean>; error: Ref<Error | null> }
    useCreate: () => { mutateAsync: (data: TCreate) => Promise<TResponse>; isPending: Ref<boolean> }
    useUpdate: () => { mutateAsync: (data: { id: number } & TUpdate) => Promise<TResponse>; isPending: Ref<boolean> }
  }
): DocumentFormReturn<TForm, TResponse> {
  const route = useRoute()
  const router = useRouter()
  const { emit } = useEventBus()
  const logger = useLogger('useDocumentForm')
  const { toast } = useToast()

  const {
    documentType,
    schema,
    defaultValues,
    idParam = 'id',
    listRoute,
    detailRoute,
    redirectAfterCreate = true,
    stayOnPageAfterSave = false,
  } = config

  // ─────────────────────────────────────────────────────────────
  // Mode Detection
  // ─────────────────────────────────────────────────────────────

  const documentId = computed(() => {
    const id = route.params[idParam]
    return id ? Number(id) : null
  })

  const isEditMode = computed(() => documentId.value !== null)
  const isCreateMode = computed(() => !isEditMode.value)

  // ─────────────────────────────────────────────────────────────
  // Form Setup
  // ─────────────────────────────────────────────────────────────

  const form = useForm<TForm>({
    validationSchema: toTypedSchema(schema),
    initialValues: defaultValues,
  })

  const values = computed(() => form.values)
  const errors = computed(() => {
    const result: Record<string, string> = {}
    Object.entries(form.errors.value).forEach(([key, value]) => {
      if (value) result[key] = value
    })
    return result
  })
  const isValid = computed(() => form.meta.value.valid)
  const isDirty = computed(() => form.meta.value.dirty)

  // ─────────────────────────────────────────────────────────────
  // Data Fetching (Edit Mode)
  // ─────────────────────────────────────────────────────────────

  const existingData = ref<TResponse | null>(null)
  const isLoadingData = ref(false)
  const dataError = ref<Error | null>(null)

  // Only fetch if we have useFetch hook and are in edit mode
  if (hooks.useFetch && isEditMode.value) {
    const fetchHook = hooks.useFetch(documentId.value!)
    isLoadingData.value = fetchHook.isLoading.value
    dataError.value = fetchHook.error.value

    watch(fetchHook.data, (data) => {
      if (data) {
        existingData.value = data as TResponse
        // Populate form with existing data
        form.setValues(data as unknown as TForm)
        logger.debug('Populated form with existing data', { id: documentId.value })
      }
    }, { immediate: true })

    watch(fetchHook.isLoading, (loading) => {
      isLoadingData.value = loading
    })

    watch(fetchHook.error, (error) => {
      dataError.value = error
    })
  }

  // ─────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────

  const createMutation = hooks.useCreate()
  const updateMutation = hooks.useUpdate()

  const isSubmitting = computed(() =>
    createMutation.isPending.value || updateMutation.isPending.value
  )

  const submitError = ref<Error | null>(null)

  // ─────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────

  async function submit(): Promise<void> {
    submitError.value = null

    // Validate form
    const { valid } = await form.validate()
    if (!valid) {
      emit('form:validation-failed', {
        formName: documentType,
        errors: Object.keys(errors.value),
      })
      logger.warn('Form validation failed', { errors: errors.value })
      return
    }

    const formData = form.values

    try {
      let result: TResponse

      if (isEditMode.value) {
        result = await updateMutation.mutateAsync({
          id: documentId.value!,
          ...formData,
        } as { id: number } & TUpdate)

        emit('document:updated', {
          documentType,
          id: result.id,
          changes: Object.keys(formData),
        })

        toast.success(`${documentType} updated successfully`)
        logger.info('Document updated', { documentType, id: result.id })
      } else {
        result = await createMutation.mutateAsync(formData as TCreate)

        emit('document:created', {
          documentType,
          id: result.id,
        })

        toast.success(`${documentType} created successfully`)
        logger.info('Document created', { documentType, id: result.id })
      }

      emit('form:submitted', { formName: documentType, success: true })

      // Handle navigation after save
      if (!stayOnPageAfterSave) {
        if (isCreateMode.value && redirectAfterCreate && detailRoute) {
          router.push({ name: detailRoute, params: { id: result.id } })
        } else if (listRoute) {
          router.push({ name: listRoute })
        }
      }
    } catch (error) {
      submitError.value = error as Error
      logger.error('Form submission failed', error as Error, { documentType })

      // Handle validation errors from server
      const validationErrors = extractValidationErrors(error)
      if (validationErrors) {
        setServerErrors(validationErrors)
      } else {
        toast.error(getErrorMessage(error))
      }

      emit('form:submitted', { formName: documentType, success: false })
    }
  }

  function reset(): void {
    if (isEditMode.value && existingData.value) {
      form.setValues(existingData.value as unknown as TForm)
    } else {
      form.resetForm({ values: defaultValues })
    }
    submitError.value = null
  }

  function setFieldValue(field: keyof TForm, value: any): void {
    form.setFieldValue(field as string, value)
  }

  function setFieldError(field: keyof TForm, error: string): void {
    form.setFieldError(field as string, error)
  }

  function setServerErrors(errors: Record<string, string[]>): void {
    Object.entries(errors).forEach(([field, messages]) => {
      form.setFieldError(field, messages[0])
    })
  }

  return {
    // Mode
    isEditMode,
    isCreateMode,
    documentId,

    // Form
    form,
    values,
    errors,
    isValid,
    isDirty,

    // Data fetching
    existingData,
    isLoadingData: computed(() => isLoadingData.value),
    dataError: computed(() => dataError.value),

    // Submission
    isSubmitting,
    submitError: computed(() => submitError.value),
    submit,
    reset,

    // Utilities
    setFieldValue,
    setFieldError,
    setServerErrors,
  }
}
```

### Usage Example

```vue
<!-- src/pages/quotations/QuotationFormPage.vue (AFTER refactoring) -->
<script setup lang="ts">
import { useDocumentForm } from '@/composables/useDocumentForm'
import { useQuotation, useCreateQuotation, useUpdateQuotation } from '@/api/useQuotations'
import { quotationSchema, type QuotationFormData } from '@/utils/validation'
import { DocumentFormLayout, LineItemsTable } from '@/components/document'
import { useLineItems } from '@/composables/useLineItems'

// Much simpler form setup!
const {
  isEditMode,
  isCreateMode,
  form,
  values,
  errors,
  isLoadingData,
  isSubmitting,
  submit,
  reset,
  setFieldValue,
} = useDocumentForm<QuotationFormData, Quotation>(
  {
    documentType: 'quotation',
    schema: quotationSchema,
    defaultValues: {
      contact_id: null,
      date: new Date().toISOString().split('T')[0],
      valid_until: null,
      reference: '',
      notes: '',
      items: [],
    },
    listRoute: 'quotations',
    detailRoute: 'quotation-detail',
  },
  {
    useFetch: useQuotation,
    useCreate: useCreateQuotation,
    useUpdate: useUpdateQuotation,
  }
)

// Line items with calculations
const { items, totals, addItem, removeItem } = useLineItems({
  initialItems: values.value.items,
  onItemsChange: (newItems) => setFieldValue('items', newItems),
})
</script>

<template>
  <DocumentFormLayout
    :title="isEditMode ? 'Edit Quotation' : 'New Quotation'"
    :is-loading="isLoadingData"
    :is-submitting="isSubmitting"
    @submit="submit"
    @cancel="$router.back()"
  >
    <!-- Contact selection, date fields, etc. -->
    <template #header>
      <ContactSelect v-model="values.contact_id" :error="errors.contact_id" />
      <!-- ... other header fields -->
    </template>

    <!-- Line items -->
    <template #items>
      <LineItemsTable
        :items="items"
        :calculations="totals"
        @add="addItem"
        @remove="removeItem"
      />
    </template>

    <!-- Totals summary -->
    <template #totals>
      <TotalsSummary :totals="totals" />
    </template>
  </DocumentFormLayout>
</template>
```

**Result:** Form page reduced from ~500 lines to ~80 lines!

---

## 3.2 useDocumentWorkflow

### The Problem

Status transitions (submit, approve, reject) are implemented individually:

```typescript
// QuotationDetailPage.vue
const submitMutation = useSubmitQuotation()
const approveMutation = useApproveQuotation()
// ... handling each separately

// InvoiceDetailPage.vue
const sendMutation = useSendInvoice()
// ... similar but different
```

### The Solution

```typescript
// src/composables/useDocumentWorkflow/types.ts
export interface WorkflowAction {
  name: string
  label: string
  icon?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  requiresConfirmation?: boolean
  confirmationMessage?: string
  allowedFromStatuses: string[]
}

export interface WorkflowConfig {
  documentType: string
  actions: WorkflowAction[]
}

export interface WorkflowReturn {
  currentStatus: ComputedRef<string>
  availableActions: ComputedRef<WorkflowAction[]>
  isProcessing: ComputedRef<boolean>
  executeAction: (actionName: string, payload?: any) => Promise<void>
  canExecute: (actionName: string) => boolean
}
```

```typescript
// src/composables/useDocumentWorkflow/useDocumentWorkflow.ts
import { computed, ref } from 'vue'
import { useEventBus } from '@/infrastructure/events'
import { useLogger } from '@/infrastructure/logger'
import { useToast } from '@/components/ui/Toast'
import type { WorkflowConfig, WorkflowAction, WorkflowReturn } from './types'

export function useDocumentWorkflow<T extends { id: number; status: string }>(
  document: Ref<T | null>,
  config: WorkflowConfig,
  mutations: Record<string, () => { mutateAsync: (id: number, payload?: any) => Promise<T> }>
): WorkflowReturn {
  const { emit } = useEventBus()
  const logger = useLogger('useDocumentWorkflow')
  const { toast } = useToast()

  const isProcessing = ref(false)
  const processingAction = ref<string | null>(null)

  const currentStatus = computed(() => document.value?.status ?? '')

  const availableActions = computed(() => {
    if (!document.value) return []

    return config.actions.filter((action) =>
      action.allowedFromStatuses.includes(currentStatus.value)
    )
  })

  function canExecute(actionName: string): boolean {
    return availableActions.value.some((a) => a.name === actionName)
  }

  async function executeAction(actionName: string, payload?: any): Promise<void> {
    if (!document.value) return
    if (!canExecute(actionName)) {
      logger.warn('Action not allowed', { actionName, status: currentStatus.value })
      return
    }

    const action = config.actions.find((a) => a.name === actionName)
    if (!action) return

    const mutationHook = mutations[actionName]
    if (!mutationHook) {
      logger.error('Mutation not found for action', undefined, { actionName })
      return
    }

    const oldStatus = currentStatus.value
    isProcessing.value = true
    processingAction.value = actionName

    try {
      const mutation = mutationHook()
      const result = await mutation.mutateAsync(document.value.id, payload)

      emit('document:status-changed', {
        documentType: config.documentType,
        id: document.value.id,
        from: oldStatus,
        to: result.status,
      })

      toast.success(`${action.label} completed successfully`)
      logger.info('Workflow action executed', {
        action: actionName,
        documentId: document.value.id,
        from: oldStatus,
        to: result.status,
      })
    } catch (error) {
      logger.error('Workflow action failed', error as Error, { actionName })
      toast.error(`Failed to ${action.label.toLowerCase()}`)
      throw error
    } finally {
      isProcessing.value = false
      processingAction.value = null
    }
  }

  return {
    currentStatus,
    availableActions,
    isProcessing: computed(() => isProcessing.value),
    executeAction,
    canExecute,
  }
}
```

### Workflow Configuration Example

```typescript
// src/config/workflows/quotationWorkflow.ts
import type { WorkflowConfig } from '@/composables/useDocumentWorkflow'

export const quotationWorkflow: WorkflowConfig = {
  documentType: 'quotation',
  actions: [
    {
      name: 'submit',
      label: 'Submit for Approval',
      icon: 'Send',
      variant: 'default',
      allowedFromStatuses: ['draft'],
    },
    {
      name: 'approve',
      label: 'Approve',
      icon: 'Check',
      variant: 'success',
      allowedFromStatuses: ['submitted'],
    },
    {
      name: 'reject',
      label: 'Reject',
      icon: 'X',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to reject this quotation?',
      allowedFromStatuses: ['submitted'],
    },
    {
      name: 'convert',
      label: 'Convert to Invoice',
      icon: 'FileText',
      variant: 'success',
      allowedFromStatuses: ['approved'],
    },
    {
      name: 'cancel',
      label: 'Cancel',
      icon: 'Trash',
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'This action cannot be undone.',
      allowedFromStatuses: ['draft', 'submitted'],
    },
  ],
}
```

### Usage Example

```vue
<!-- QuotationDetailPage.vue -->
<script setup lang="ts">
import { useDocumentWorkflow } from '@/composables/useDocumentWorkflow'
import { quotationWorkflow } from '@/config/workflows/quotationWorkflow'
import {
  useQuotation,
  useSubmitQuotation,
  useApproveQuotation,
  useRejectQuotation,
  useCancelQuotation,
} from '@/api/useQuotations'

const { data: quotation } = useQuotation(route.params.id)

const {
  currentStatus,
  availableActions,
  isProcessing,
  executeAction,
} = useDocumentWorkflow(quotation, quotationWorkflow, {
  submit: useSubmitQuotation,
  approve: useApproveQuotation,
  reject: useRejectQuotation,
  cancel: useCancelQuotation,
})
</script>

<template>
  <div class="flex gap-2">
    <Button
      v-for="action in availableActions"
      :key="action.name"
      :variant="action.variant"
      :disabled="isProcessing"
      @click="executeAction(action.name)"
    >
      <component :is="action.icon" class="w-4 h-4 mr-2" />
      {{ action.label }}
    </Button>
  </div>
</template>
```

---

## 3.3 useResourceDetail

### The Problem

Detail pages share common patterns:
- Fetch single resource by ID
- Loading state
- Error handling
- Refresh functionality
- Delete with confirmation

### The Solution

```typescript
// src/composables/useResourceDetail/useResourceDetail.ts
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { useEventBus } from '@/infrastructure/events'
import { useLogger } from '@/infrastructure/logger'
import { useToast } from '@/components/ui/Toast'

export interface ResourceDetailConfig {
  resourceName: string
  idParam?: string
  listRoute?: string
  editRoute?: string
}

export function useResourceDetail<T extends { id: number }>(
  config: ResourceDetailConfig,
  hooks: {
    useFetch: (id: number) => { data: Ref<T | undefined>; isLoading: Ref<boolean>; error: Ref<Error | null>; refetch: () => void }
    useDelete?: () => { mutateAsync: (id: number) => Promise<void>; isPending: Ref<boolean> }
  }
) {
  const route = useRoute()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { emit } = useEventBus()
  const logger = useLogger('useResourceDetail')
  const { toast } = useToast()

  const { resourceName, idParam = 'id', listRoute, editRoute } = config

  // Resource ID from route
  const resourceId = computed(() => Number(route.params[idParam]))

  // Fetch data
  const { data, isLoading, error, refetch } = hooks.useFetch(resourceId.value)

  // Delete state
  const showDeleteModal = ref(false)
  const isDeleting = ref(false)

  const deleteMutation = hooks.useDelete?.()

  async function handleDelete(): Promise<void> {
    if (!deleteMutation || !data.value) return

    isDeleting.value = true
    try {
      await deleteMutation.mutateAsync(data.value.id)

      emit('document:deleted', {
        documentType: resourceName,
        id: data.value.id,
      })

      toast.success(`${resourceName} deleted successfully`)
      logger.info('Resource deleted', { resourceName, id: data.value.id })

      // Navigate to list
      if (listRoute) {
        router.push({ name: listRoute })
      } else {
        router.back()
      }
    } catch (error) {
      logger.error('Delete failed', error as Error, { resourceName })
      toast.error('Failed to delete')
    } finally {
      isDeleting.value = false
      showDeleteModal.value = false
    }
  }

  function navigateToEdit(): void {
    if (editRoute && data.value) {
      router.push({ name: editRoute, params: { id: data.value.id } })
    }
  }

  function navigateToList(): void {
    if (listRoute) {
      router.push({ name: listRoute })
    } else {
      router.back()
    }
  }

  return {
    // Data
    data,
    resourceId,

    // States
    isLoading,
    error,
    isDeleting: computed(() => isDeleting.value),

    // Delete modal
    showDeleteModal,
    confirmDelete: () => (showDeleteModal.value = true),
    cancelDelete: () => (showDeleteModal.value = false),
    executeDelete: handleDelete,

    // Actions
    refresh: refetch,
    navigateToEdit,
    navigateToList,
  }
}
```

---

## 3.4 Enhanced useResourceList

### Current Implementation

The existing `useResourceList` is good but can be enhanced with:
- Built-in empty/loading/error states
- Export functionality
- Bulk selection
- Preset filters

### Enhanced Version

```typescript
// src/composables/useResourceList/useResourceList.ts (enhanced)
import { ref, computed, watch } from 'vue'
import { useEventBus } from '@/infrastructure/events'
import { useLogger } from '@/infrastructure/logger'
import type { PaginatedFilters, PaginatedResponse } from '@/infrastructure/types'

export interface ResourceListConfig<TFilters extends PaginatedFilters> {
  resourceName: string
  initialFilters: TFilters
  persistFilters?: boolean
  filterStorageKey?: string
}

export interface ResourceListReturn<T, TFilters> {
  // Data
  items: ComputedRef<T[]>
  pagination: ComputedRef<PaginatedResponse<T>['meta'] | null>
  isEmpty: ComputedRef<boolean>
  totalCount: ComputedRef<number>

  // States
  isLoading: ComputedRef<boolean>
  isRefreshing: ComputedRef<boolean>
  error: ComputedRef<Error | null>
  hasError: ComputedRef<boolean>

  // UI States (for template conditions)
  showLoading: ComputedRef<boolean>
  showEmpty: ComputedRef<boolean>
  showError: ComputedRef<boolean>
  showData: ComputedRef<boolean>

  // Filters
  filters: Ref<TFilters>
  updateFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void
  resetFilters: () => void
  hasActiveFilters: ComputedRef<boolean>

  // Pagination
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setPerPage: (perPage: number) => void

  // Bulk selection
  selectedIds: Ref<number[]>
  selectAll: () => void
  deselectAll: () => void
  toggleSelection: (id: number) => void
  isSelected: (id: number) => boolean
  selectionCount: ComputedRef<number>

  // Delete
  deleteConfirmation: {
    showModal: Ref<boolean>
    itemToDelete: Ref<T | null>
    confirmDelete: (item: T) => void
    cancelDelete: () => void
    executeDelete: () => Promise<void>
  }

  // Refresh
  refresh: () => void
}

export function useResourceList<
  T extends { id: number },
  TFilters extends PaginatedFilters
>(
  config: ResourceListConfig<TFilters>,
  hooks: {
    useList: (filters: Ref<TFilters>) => {
      data: Ref<PaginatedResponse<T> | undefined>
      isLoading: Ref<boolean>
      isFetching: Ref<boolean>
      error: Ref<Error | null>
      refetch: () => void
    }
    useDelete?: () => {
      mutateAsync: (id: number) => Promise<void>
      isPending: Ref<boolean>
    }
  }
): ResourceListReturn<T, TFilters> {
  const { emit } = useEventBus()
  const logger = useLogger('useResourceList')

  const { resourceName, initialFilters, persistFilters, filterStorageKey } = config

  // ─────────────────────────────────────────────────────────────
  // Filters
  // ─────────────────────────────────────────────────────────────

  const filters = ref<TFilters>({ ...initialFilters })

  // Persist filters to localStorage
  if (persistFilters && filterStorageKey) {
    const stored = localStorage.getItem(filterStorageKey)
    if (stored) {
      try {
        filters.value = { ...initialFilters, ...JSON.parse(stored) }
      } catch {
        // Ignore invalid JSON
      }
    }

    watch(filters, (newFilters) => {
      localStorage.setItem(filterStorageKey, JSON.stringify(newFilters))
    }, { deep: true })
  }

  function updateFilter<K extends keyof TFilters>(key: K, value: TFilters[K]): void {
    filters.value = { ...filters.value, [key]: value, page: 1 }
  }

  function resetFilters(): void {
    filters.value = { ...initialFilters }
    if (persistFilters && filterStorageKey) {
      localStorage.removeItem(filterStorageKey)
    }
  }

  const hasActiveFilters = computed(() => {
    return Object.entries(filters.value).some(([key, value]) => {
      if (key === 'page' || key === 'per_page') return false
      const initialValue = initialFilters[key as keyof TFilters]
      return value !== initialValue && value !== '' && value !== null
    })
  })

  // ─────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────

  const { data, isLoading, isFetching, error, refetch } = hooks.useList(filters as Ref<TFilters>)

  const items = computed(() => data.value?.data ?? [])
  const pagination = computed(() => data.value?.meta ?? null)
  const isEmpty = computed(() => !isLoading.value && items.value.length === 0)
  const totalCount = computed(() => pagination.value?.total ?? 0)

  // UI states
  const showLoading = computed(() => isLoading.value && items.value.length === 0)
  const showEmpty = computed(() => !isLoading.value && isEmpty.value && !error.value)
  const showError = computed(() => !isLoading.value && !!error.value)
  const showData = computed(() => !showLoading.value && !showEmpty.value && !showError.value)

  // ─────────────────────────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────────────────────────

  function goToPage(page: number): void {
    if (!pagination.value) return
    if (page < 1 || page > pagination.value.last_page) return
    updateFilter('page' as keyof TFilters, page as TFilters[keyof TFilters])
  }

  function nextPage(): void {
    if (!pagination.value) return
    goToPage(pagination.value.current_page + 1)
  }

  function prevPage(): void {
    if (!pagination.value) return
    goToPage(pagination.value.current_page - 1)
  }

  function setPerPage(perPage: number): void {
    updateFilter('per_page' as keyof TFilters, perPage as TFilters[keyof TFilters])
  }

  // ─────────────────────────────────────────────────────────────
  // Bulk Selection
  // ─────────────────────────────────────────────────────────────

  const selectedIds = ref<number[]>([])

  function selectAll(): void {
    selectedIds.value = items.value.map((item) => item.id)
  }

  function deselectAll(): void {
    selectedIds.value = []
  }

  function toggleSelection(id: number): void {
    const index = selectedIds.value.indexOf(id)
    if (index === -1) {
      selectedIds.value.push(id)
    } else {
      selectedIds.value.splice(index, 1)
    }
  }

  function isSelected(id: number): boolean {
    return selectedIds.value.includes(id)
  }

  const selectionCount = computed(() => selectedIds.value.length)

  // Clear selection when filters change
  watch(filters, () => {
    deselectAll()
  }, { deep: true })

  // ─────────────────────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────────────────────

  const showDeleteModal = ref(false)
  const itemToDelete = ref<T | null>(null)
  const deleteMutation = hooks.useDelete?.()

  function confirmDelete(item: T): void {
    itemToDelete.value = item
    showDeleteModal.value = true
  }

  function cancelDelete(): void {
    itemToDelete.value = null
    showDeleteModal.value = false
  }

  async function executeDelete(): Promise<void> {
    if (!deleteMutation || !itemToDelete.value) return

    try {
      await deleteMutation.mutateAsync(itemToDelete.value.id)

      emit('document:deleted', {
        documentType: resourceName,
        id: itemToDelete.value.id,
      })

      logger.info('Resource deleted', { resourceName, id: itemToDelete.value.id })
      refetch()
    } catch (err) {
      logger.error('Delete failed', err as Error)
      throw err
    } finally {
      cancelDelete()
    }
  }

  return {
    // Data
    items,
    pagination,
    isEmpty,
    totalCount,

    // States
    isLoading,
    isRefreshing: isFetching,
    error,
    hasError: computed(() => !!error.value),

    // UI States
    showLoading,
    showEmpty,
    showError,
    showData,

    // Filters
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,

    // Pagination
    goToPage,
    nextPage,
    prevPage,
    setPerPage,

    // Bulk selection
    selectedIds,
    selectAll,
    deselectAll,
    toggleSelection,
    isSelected,
    selectionCount,

    // Delete
    deleteConfirmation: {
      showModal,
      itemToDelete,
      confirmDelete,
      cancelDelete,
      executeDelete,
    },

    // Refresh
    refresh: refetch,
  }
}
```

---

## 3.5 File Structure

```
src/composables/
├── index.ts                          # Re-exports
│
├── useDocumentForm/
│   ├── index.ts
│   ├── types.ts
│   ├── useDocumentForm.ts
│   └── __tests__/
│       └── useDocumentForm.test.ts
│
├── useDocumentWorkflow/
│   ├── index.ts
│   ├── types.ts
│   ├── useDocumentWorkflow.ts
│   └── __tests__/
│       └── useDocumentWorkflow.test.ts
│
├── useResourceDetail/
│   ├── index.ts
│   ├── useResourceDetail.ts
│   └── __tests__/
│       └── useResourceDetail.test.ts
│
├── useResourceList/
│   ├── index.ts
│   ├── types.ts
│   ├── useResourceList.ts           # Enhanced version
│   └── __tests__/
│       └── useResourceList.test.ts
│
└── useLineItems/
    ├── index.ts
    ├── useLineItems.ts               # Combined with calculations
    └── __tests__/
        └── useLineItems.test.ts
```

---

## Migration Strategy

### Before (QuotationFormPage.vue - ~500 lines)

```vue
<script setup lang="ts">
// 50+ lines of imports
// 100+ lines of form setup
// 80+ lines of calculations
// 50+ lines of line item management
// 100+ lines of submit/error handling
// 50+ lines of watchers and lifecycle
</script>
```

### After (QuotationFormPage.vue - ~80 lines)

```vue
<script setup lang="ts">
import { useDocumentForm } from '@/composables/useDocumentForm'
import { useLineItems } from '@/composables/useLineItems'
import { quotationSchema } from '@/utils/validation'
import { DocumentFormLayout } from '@/components/document'

const formConfig = {
  documentType: 'quotation',
  schema: quotationSchema,
  defaultValues: { /* ... */ },
  listRoute: 'quotations',
  detailRoute: 'quotation-detail',
}

const { values, errors, isSubmitting, submit, setFieldValue } = useDocumentForm(formConfig, hooks)
const { items, totals, addItem, removeItem } = useLineItems({ /* ... */ })
</script>

<template>
  <DocumentFormLayout :is-submitting="isSubmitting" @submit="submit">
    <!-- Just the unique parts of this form -->
  </DocumentFormLayout>
</template>
```

---

## Checklist

- [ ] `useDocumentForm` composable
- [ ] `useDocumentWorkflow` composable
- [ ] `useResourceDetail` composable
- [ ] Enhanced `useResourceList` with states
- [ ] `useLineItems` with calculations integration
- [ ] Workflow configurations for each document type
- [ ] Tests for all composables
- [ ] Migration of at least 2 form pages as proof of concept

---

## Next Phase

Once Phase 3 is complete, proceed to [Phase 4: Component Architecture](./04-PHASE-COMPONENTS.md) to build the reusable UI components that work with these composables.
