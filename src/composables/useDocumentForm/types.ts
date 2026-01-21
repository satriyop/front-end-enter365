/**
 * useDocumentForm Types
 */

import type { ComputedRef, Ref } from 'vue'
import type { ZodSchema } from 'zod'
import type { FormContext } from 'vee-validate'

/**
 * Configuration for document form
 */
export interface DocumentFormConfig<TForm> {
  /** Document type for events and logging */
  documentType: string

  /** Zod validation schema */
  schema: ZodSchema<TForm>

  /** Default values for new document */
  defaultValues: TForm

  /** Route param name for ID (default: 'id') */
  idParam?: string

  /** Route name for list page (for navigation) */
  listRoute?: string

  /** Route name for detail page (for navigation after create) */
  detailRoute?: string

  /** Whether to redirect after create (default: true) */
  redirectAfterCreate?: boolean

  /** Whether to stay on page after save (default: false) */
  stayOnPageAfterSave?: boolean
}

/**
 * Hooks configuration for document form
 */
export interface DocumentFormHooks<TForm, TResponse, TCreate, TUpdate> {
  /** Hook to fetch existing document for edit mode */
  useFetch?: (id: number) => {
    data: Ref<TResponse | undefined>
    isLoading: Ref<boolean>
    error: Ref<Error | null>
  }

  /** Hook to create new document */
  useCreate: () => {
    mutateAsync: (data: TCreate) => Promise<TResponse>
    isPending: Ref<boolean>
  }

  /** Hook to update existing document */
  useUpdate: () => {
    mutateAsync: (data: { id: number } & TUpdate) => Promise<TResponse>
    isPending: Ref<boolean>
  }

  /** Transform form data before create */
  transformCreate?: (data: TForm) => TCreate

  /** Transform form data before update */
  transformUpdate?: (data: TForm) => TUpdate

  /** Transform fetched data to form data */
  transformFetch?: (data: TResponse) => TForm
}

/**
 * Return type for useDocumentForm
 */
export interface DocumentFormReturn<TForm extends Record<string, unknown>, TResponse> {
  // Mode detection
  /** Whether in edit mode (has ID in route) */
  isEditMode: ComputedRef<boolean>
  /** Whether in create mode (no ID in route) */
  isCreateMode: ComputedRef<boolean>
  /** Document ID from route (null for create mode) */
  documentId: ComputedRef<number | null>

  // Form state
  /** VeeValidate form context */
  form: FormContext<TForm>
  /** Current form values */
  values: ComputedRef<TForm>
  /** Current validation errors (field -> message) */
  errors: ComputedRef<Record<string, string>>
  /** Whether form is valid */
  isValid: ComputedRef<boolean>
  /** Whether form has been modified */
  isDirty: ComputedRef<boolean>

  // Data fetching (edit mode)
  /** Fetched document data */
  existingData: Ref<TResponse | null>
  /** Whether fetching data */
  isLoadingData: ComputedRef<boolean>
  /** Fetch error */
  dataError: ComputedRef<Error | null>

  // Submission
  /** Whether submitting form */
  isSubmitting: ComputedRef<boolean>
  /** Submission error */
  submitError: ComputedRef<Error | null>
  /** Submit form */
  submit: () => Promise<void>
  /** Reset form to initial/fetched values */
  reset: () => void

  // Utilities
  /** Set a single field value */
  setFieldValue: <K extends keyof TForm>(field: K, value: TForm[K]) => void
  /** Set a field error */
  setFieldError: (field: keyof TForm, error: string) => void
  /** Set multiple server validation errors */
  setServerErrors: (errors: Record<string, string[]>) => void
}
