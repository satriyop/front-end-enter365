/**
 * useValidatedForm Tests
 *
 * Tests the VeeValidate + Zod form wrapper composable.
 * Requires a component context for VeeValidate's useForm.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { z } from 'zod'
import { useValidatedForm, useValidatedField, setServerErrors } from '../useValidatedForm'

// Simple schema for testing
const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  age: z.number().min(0).optional(),
})

function withValidatedForm(
  schema = testSchema,
  options?: { initialValues?: Record<string, unknown>; validateOnMount?: boolean },
) {
  let result!: ReturnType<typeof useValidatedForm>

  const wrapper = mount(
    defineComponent({
      setup() {
        result = useValidatedForm(schema, options)
        return {}
      },
      template: '<div />',
    }),
  )

  return { result, wrapper }
}

describe('useValidatedForm', () => {
  describe('initialization', () => {
    it('creates a form with values', () => {
      const { result } = withValidatedForm()
      expect(result.values).toBeDefined()
    })

    it('accepts initial values', () => {
      const { result } = withValidatedForm(testSchema, {
        initialValues: { name: 'John', email: 'john@example.com' },
      })

      expect(result.values.name).toBe('John')
      expect(result.values.email).toBe('john@example.com')
    })

    it('starts as not dirty', () => {
      const { result } = withValidatedForm()
      expect(result.isDirty.value).toBe(false)
    })

    it('starts as not submitting', () => {
      const { result } = withValidatedForm()
      expect(result.isSubmitting.value).toBe(false)
    })
  })

  describe('validation', () => {
    it('fails validation for empty required field', async () => {
      const { result } = withValidatedForm(testSchema, {
        initialValues: { name: '' },
      })

      const { valid } = await result.validate()
      expect(valid).toBe(false)
    })

    it('passes validation with valid data', async () => {
      const { result } = withValidatedForm(testSchema, {
        initialValues: { name: 'John' },
      })

      const { valid } = await result.validate()
      expect(valid).toBe(true)
    })

    it('defaults validateOnMount to false', () => {
      const { result } = withValidatedForm(testSchema, {
        initialValues: { name: '' },
      })

      // Without validateOnMount, errors should be empty initially
      expect(Object.keys(result.errors.value)).toHaveLength(0)
    })
  })

  describe('setFieldValue', () => {
    it('updates a field value', async () => {
      const { result } = withValidatedForm(testSchema, {
        initialValues: { name: '' },
      })

      result.setFieldValue('name', 'Updated')
      await nextTick()

      expect(result.values.name).toBe('Updated')
    })
  })

  describe('setFieldError', () => {
    it('sets an error on a field', async () => {
      const { result } = withValidatedForm()

      result.setFieldError('name', 'Custom error')
      await nextTick()

      expect(result.errors.value.name).toBe('Custom error')
    })
  })

  describe('resetForm', () => {
    it('resets to initial values', async () => {
      const { result } = withValidatedForm(testSchema, {
        initialValues: { name: 'Original' },
      })

      result.setFieldValue('name', 'Changed')
      await nextTick()
      expect(result.values.name).toBe('Changed')

      result.resetForm()
      await nextTick()
      expect(result.values.name).toBe('Original')
    })
  })

  describe('handleSubmit', () => {
    it('calls callback with values when valid', async () => {
      const { result } = withValidatedForm(testSchema, {
        initialValues: { name: 'Valid' },
      })

      let submittedValues: unknown = null
      const onSubmit = result.handleSubmit((values) => {
        submittedValues = values
      })

      await onSubmit()
      expect(submittedValues).toEqual(expect.objectContaining({ name: 'Valid' }))
    })

    it('does not call callback when invalid', async () => {
      const { result } = withValidatedForm(testSchema, {
        initialValues: { name: '' },
      })

      let called = false
      const onSubmit = result.handleSubmit(() => {
        called = true
      })

      await onSubmit()
      expect(called).toBe(false)
    })
  })
})

describe('useValidatedField', () => {
  it('creates a field with initial value', () => {
    let result!: ReturnType<typeof useValidatedField>

    mount(
      defineComponent({
        setup() {
          result = useValidatedField<string>('name', undefined, {
            initialValue: 'Hello',
          })
          return {}
        },
        template: '<div />',
      }),
    )

    expect(result.value.value).toBe('Hello')
  })

  it('exposes validation utilities', () => {
    let result!: ReturnType<typeof useValidatedField>

    mount(
      defineComponent({
        setup() {
          result = useValidatedField<string>('email')
          return {}
        },
        template: '<div />',
      }),
    )

    expect(result.validate).toBeDefined()
    expect(result.resetField).toBeDefined()
    expect(result.handleBlur).toBeDefined()
  })
})

describe('setServerErrors', () => {
  it('maps server errors to form errors', () => {
    const mockSetErrors = { setErrors: vi.fn() }

    setServerErrors(mockSetErrors, {
      name: ['Name is required'],
      email: ['Email is invalid', 'Email domain not allowed'],
    })

    expect(mockSetErrors.setErrors).toHaveBeenCalledWith({
      name: 'Name is required',
      email: 'Email is invalid', // Takes first message only
    })
  })

  it('skips fields with empty messages array', () => {
    const mockSetErrors = { setErrors: vi.fn() }

    setServerErrors(mockSetErrors, {
      name: ['Required'],
      email: [],
    })

    expect(mockSetErrors.setErrors).toHaveBeenCalledWith({
      name: 'Required',
    })
  })

  it('handles dot notation fields (items.0.description)', () => {
    const mockSetErrors = { setErrors: vi.fn() }

    setServerErrors(mockSetErrors, {
      'items.0.description': ['Description is required'],
    })

    expect(mockSetErrors.setErrors).toHaveBeenCalledWith({
      'items.0.description': 'Description is required',
    })
  })
})
