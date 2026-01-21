/**
 * useDocumentForm Composable
 *
 * Unified composable for document form pages that handles:
 * - Create vs Edit mode detection from route
 * - Form initialization with VeeValidate + Zod
 * - Data fetching for edit mode
 * - Form submission (create/update)
 * - Server validation error handling
 * - Loading states
 * - Navigation after save
 *
 * @example
 * ```typescript
 * const { values, errors, isSubmitting, submit } = useDocumentForm(
 *   {
 *     documentType: 'quotation',
 *     schema: quotationSchema,
 *     defaultValues: { contact_id: null, items: [] },
 *     listRoute: 'quotations',
 *     detailRoute: 'quotation-detail',
 *   },
 *   {
 *     useFetch: useQuotation,
 *     useCreate: useCreateQuotation,
 *     useUpdate: useUpdateQuotation,
 *   }
 * )
 * ```
 */

import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { eventBus } from '@/infrastructure/events'
import { logger } from '@/infrastructure/logger'
import { extractValidationErrors } from '@/infrastructure/errors'
import type {
  DocumentFormConfig,
  DocumentFormHooks,
  DocumentFormReturn,
} from './types'

export function useDocumentForm<
  TForm extends Record<string, unknown>,
  TResponse extends { id: number },
  TCreate = TForm,
  TUpdate = Partial<TForm>,
>(
  config: DocumentFormConfig<TForm>,
  hooks: DocumentFormHooks<TForm, TResponse, TCreate, TUpdate>
): DocumentFormReturn<TForm, TResponse> {
  const route = useRoute()
  const router = useRouter()

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

  const formLogger = logger.child({ context: `form:${documentType}` })

  // ─────────────────────────────────────────────────────────────
  // Mode Detection
  // ─────────────────────────────────────────────────────────────

  const documentId = computed(() => {
    const id = route.params[idParam]
    if (Array.isArray(id)) return id[0] ? Number(id[0]) : null
    return id ? Number(id) : null
  })

  const isEditMode = computed(() => documentId.value !== null)
  const isCreateMode = computed(() => !isEditMode.value)

  // ─────────────────────────────────────────────────────────────
  // Form Setup
  // ─────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm({
    validationSchema: toTypedSchema(schema),
    initialValues: defaultValues as any,
  })

  const values = computed(() => form.values as TForm)

  const errors = computed(() => {
    const result: Record<string, string> = {}
    Object.entries(form.errors.value).forEach(([key, value]) => {
      if (value) result[key] = value as string
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

  // Setup fetch hook if in edit mode
  if (hooks.useFetch && documentId.value !== null) {
    const fetchHook = hooks.useFetch(documentId.value)

    // Sync loading state
    watch(
      () => fetchHook.isLoading.value,
      (loading) => {
        isLoadingData.value = loading
      },
      { immediate: true }
    )

    // Sync error state
    watch(
      () => fetchHook.error.value,
      (error) => {
        dataError.value = error
      },
      { immediate: true }
    )

    // Populate form when data is fetched
    watch(
      () => fetchHook.data.value,
      (data) => {
        if (data) {
          existingData.value = data as TResponse

          // Transform if needed, otherwise use directly
          const formData = hooks.transformFetch
            ? hooks.transformFetch(data as TResponse)
            : (data as unknown as TForm)

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form.setValues(formData as any)
          formLogger.debug('Populated form with existing data', { id: documentId.value })
        }
      },
      { immediate: true }
    )
  }

  // ─────────────────────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────────────────────

  const createMutation = hooks.useCreate()
  const updateMutation = hooks.useUpdate()

  const isSubmitting = computed(
    () => createMutation.isPending.value || updateMutation.isPending.value
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
      eventBus.emit('form:validation-failed', {
        formName: documentType,
        errors: Object.keys(errors.value),
      })
      formLogger.warn('Form validation failed', { errors: errors.value })
      return
    }

    const formData = form.values as TForm

    try {
      let result: TResponse

      if (isEditMode.value && documentId.value !== null) {
        // Transform data if needed
        const updateData = hooks.transformUpdate
          ? hooks.transformUpdate(formData)
          : (formData as unknown as TUpdate)

        result = await updateMutation.mutateAsync({
          id: documentId.value,
          ...updateData,
        } as { id: number } & TUpdate)

        eventBus.emit('document:updated', {
          documentType,
          id: result.id,
          changes: Object.keys(formData),
        })

        formLogger.info('Document updated', { id: result.id })
      } else {
        // Transform data if needed
        const createData = hooks.transformCreate
          ? hooks.transformCreate(formData)
          : (formData as unknown as TCreate)

        result = await createMutation.mutateAsync(createData)

        eventBus.emit('document:created', {
          documentType,
          id: result.id,
        })

        formLogger.info('Document created', { id: result.id })
      }

      eventBus.emit('form:submitted', { formName: documentType, success: true })

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
      formLogger.error('Form submission failed', error as Error)

      // Handle validation errors from server
      const validationErrors = extractValidationErrors(error)
      if (validationErrors) {
        setServerErrors(validationErrors)
      }

      eventBus.emit('form:submitted', { formName: documentType, success: false })
    }
  }

  function reset(): void {
    if (isEditMode.value && existingData.value) {
      const formData = hooks.transformFetch
        ? hooks.transformFetch(existingData.value)
        : (existingData.value as unknown as TForm)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.setValues(formData as any)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form.resetForm({ values: defaultValues as any })
    }
    submitError.value = null
  }

  function setFieldValue<K extends keyof TForm>(field: K, value: TForm[K]): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setFieldValue(field as any, value)
  }

  function setFieldError(field: keyof TForm, error: string): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setFieldError(field as any, error)
  }

  function setServerErrors(fieldErrors: Record<string, string[]>): void {
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      const firstMessage = messages[0]
      if (firstMessage) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.setFieldError(field as any, firstMessage)
      }
    })
  }

  return {
    // Mode
    isEditMode,
    isCreateMode,
    documentId,

    // Form - cast to expected type for API compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form: form as any,
    values,
    errors,
    isValid,
    isDirty,

    // Data fetching
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    existingData: existingData as any,
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
