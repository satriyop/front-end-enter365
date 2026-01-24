import { useForm, useField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { type ZodSchema, type z } from 'zod'
import { computed } from 'vue'

/**
 * Create a validated form with Zod schema
 *
 * @example
 * const { form, handleSubmit, isValid } = useValidatedForm(contactSchema, {
 *   initialValues: { name: '', email: '' }
 * })
 */
export function useValidatedForm<T extends ZodSchema>(
  schema: T,
  options?: {
    initialValues?: Partial<z.infer<T>>
    validateOnMount?: boolean
  }
) {
  const typedSchema = toTypedSchema(schema)

  const form = useForm<z.infer<T>>({
    validationSchema: typedSchema,
    initialValues: options?.initialValues as z.infer<T>,
    validateOnMount: options?.validateOnMount ?? false,
  })

  return {
    form,
    // Form state
    values: form.values,
    errors: form.errors,
    isSubmitting: form.isSubmitting,
    isValid: computed(() => form.meta.value.valid),
    isDirty: computed(() => form.meta.value.dirty),

    // Form actions
    handleSubmit: form.handleSubmit,
    resetForm: form.resetForm,
    setValues: form.setValues,
    setFieldValue: form.setFieldValue,
    setFieldError: form.setFieldError,
    setErrors: form.setErrors,
    validate: form.validate,
    validateField: form.validateField,
  }
}

/**
 * Create a single validated field
 */
export function useValidatedField<T>(
  name: string,
  schema?: ZodSchema,
  options?: {
    initialValue?: T
    validateOnValueUpdate?: boolean
  }
) {
  const rules = schema ? toTypedSchema(schema) : undefined

  const field = useField<T>(name, rules, {
    initialValue: options?.initialValue,
    validateOnValueUpdate: options?.validateOnValueUpdate ?? true,
  })

  return {
    value: field.value,
    errorMessage: field.errorMessage,
    errors: field.errors,
    meta: field.meta,
    handleBlur: field.handleBlur,
    handleChange: field.handleChange,
    validate: field.validate,
    resetField: field.resetField,
    setValue: field.setValue,
  }
}

/**
 * Merge server validation errors into form
 * Useful after API returns validation errors
 */
export function setServerErrors(
  form: { setErrors: (errors: Record<string, string | undefined>) => void },
  errors: Record<string, string[]>
) {
  const formattedErrors: Record<string, string | undefined> = {}

  for (const [field, messages] of Object.entries(errors)) {
    if (messages.length > 0) {
      // Handle array dot notation (e.g. items.0.description)
      // VeeValidate handles this correctly when set as a string key
      formattedErrors[field] = messages[0]
    }
  }

  form.setErrors(formattedErrors)
}

/**
 * Type helper for form refs
 */
export type ValidatedFormReturn<T extends ZodSchema> = ReturnType<typeof useValidatedForm<T>>
