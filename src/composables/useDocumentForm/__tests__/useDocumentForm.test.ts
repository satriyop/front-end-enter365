/**
 * useDocumentForm Tests
 *
 * Tests the unified document form orchestrator.
 * Mocks vue-router, infrastructure (events, logger, errors),
 * and verifies create/edit mode, submission, and navigation.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref, nextTick } from 'vue'
import { z } from 'zod'
import { useDocumentForm } from '../useDocumentForm'
import type { DocumentFormConfig, DocumentFormHooks } from '../types'

// ─────────────────────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────────────────────

// Mock vue-router
const mockRoute = ref({
  params: {} as Record<string, string>,
})

const mockRouterPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute.value,
  useRouter: () => ({ push: mockRouterPush }),
}))

// Mock infrastructure
const mockEventBusEmit = vi.fn()
vi.mock('@/infrastructure/events', () => ({
  eventBus: { emit: (...args: unknown[]) => mockEventBusEmit(...args) },
}))

vi.mock('@/infrastructure/logger', () => ({
  logger: {
    child: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}))

vi.mock('@/infrastructure/errors', () => ({
  extractValidationErrors: vi.fn(() => null),
}))

// ─────────────────────────────────────────────────────────────
// Test Schema & Helpers
// ─────────────────────────────────────────────────────────────

const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
})

type TestForm = z.infer<typeof testSchema>
type TestResponse = { id: number; name: string }

const defaultValues: TestForm = { name: '', description: '' }

function createMockHooks(overrides: Partial<DocumentFormHooks<TestForm, TestResponse, TestForm, Partial<TestForm>>> = {}) {
  const mockMutateAsyncCreate = vi.fn().mockResolvedValue({ id: 42, name: 'Created' })
  const mockMutateAsyncUpdate = vi.fn().mockResolvedValue({ id: 1, name: 'Updated' })

  return {
    hooks: {
      useCreate: () => ({
        mutateAsync: mockMutateAsyncCreate,
        isPending: ref(false),
      }),
      useUpdate: () => ({
        mutateAsync: mockMutateAsyncUpdate,
        isPending: ref(false),
      }),
      ...overrides,
    } as DocumentFormHooks<TestForm, TestResponse, TestForm, Partial<TestForm>>,
    mockMutateAsyncCreate,
    mockMutateAsyncUpdate,
  }
}

function withDocumentForm(
  configOverrides: Partial<DocumentFormConfig<TestForm>> = {},
  hookOverrides: Partial<DocumentFormHooks<TestForm, TestResponse, TestForm, Partial<TestForm>>> = {},
) {
  const config: DocumentFormConfig<TestForm> = {
    documentType: 'test-doc',
    schema: testSchema,
    defaultValues,
    listRoute: 'test-list',
    detailRoute: 'test-detail',
    ...configOverrides,
  }

  const { hooks, mockMutateAsyncCreate, mockMutateAsyncUpdate } = createMockHooks(hookOverrides)

  let result!: ReturnType<typeof useDocumentForm>

  const wrapper = mount(
    defineComponent({
      setup() {
        result = useDocumentForm(config, hooks)
        return {}
      },
      template: '<div />',
    }),
  )

  return { result, wrapper, mockMutateAsyncCreate, mockMutateAsyncUpdate }
}

// ─────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────

describe('useDocumentForm', () => {
  beforeEach(() => {
    mockRoute.value = { params: {} }
    vi.clearAllMocks()
  })

  describe('mode detection', () => {
    it('detects create mode when no id param', () => {
      mockRoute.value = { params: {} }
      const { result } = withDocumentForm()

      expect(result.isCreateMode.value).toBe(true)
      expect(result.isEditMode.value).toBe(false)
      expect(result.documentId.value).toBeNull()
    })

    it('detects edit mode when id param present', () => {
      mockRoute.value = { params: { id: '42' } }
      const { result } = withDocumentForm()

      expect(result.isEditMode.value).toBe(true)
      expect(result.isCreateMode.value).toBe(false)
      expect(result.documentId.value).toBe(42)
    })

    it('uses custom idParam', () => {
      mockRoute.value = { params: { quotationId: '7' } }
      const { result } = withDocumentForm({ idParam: 'quotationId' })

      expect(result.documentId.value).toBe(7)
      expect(result.isEditMode.value).toBe(true)
    })
  })

  describe('form state', () => {
    it('exposes form values', () => {
      const { result } = withDocumentForm()

      expect(result.values.value).toEqual(
        expect.objectContaining({ name: '', description: '' }),
      )
    })

    it('starts with empty errors', () => {
      const { result } = withDocumentForm()
      expect(result.errors.value).toEqual({})
    })

    it('starts as not submitting', () => {
      const { result } = withDocumentForm()
      expect(result.isSubmitting.value).toBe(false)
    })

    it('starts as not dirty', () => {
      const { result } = withDocumentForm()
      expect(result.isDirty.value).toBe(false)
    })
  })

  describe('setFieldValue', () => {
    it('sets a field value', async () => {
      const { result } = withDocumentForm()

      result.setFieldValue('name', 'Test Value')
      await nextTick()

      expect(result.values.value.name).toBe('Test Value')
    })
  })

  describe('setFieldError', () => {
    it('sets a field error', async () => {
      const { result } = withDocumentForm()

      result.setFieldError('name', 'Server says this is wrong')
      await nextTick()

      expect(result.errors.value.name).toBe('Server says this is wrong')
    })
  })

  describe('setServerErrors', () => {
    it('maps multiple server errors to form fields', async () => {
      const { result } = withDocumentForm()

      result.setServerErrors({
        name: ['Name already taken'],
        description: ['Too long'],
      })
      await nextTick()

      expect(result.errors.value.name).toBe('Name already taken')
      expect(result.errors.value.description).toBe('Too long')
    })

    it('takes only first message per field', async () => {
      const { result } = withDocumentForm()

      result.setServerErrors({
        name: ['Error 1', 'Error 2'],
      })
      await nextTick()

      expect(result.errors.value.name).toBe('Error 1')
    })
  })

  describe('submit (create mode)', () => {
    it('calls create mutation with form data', async () => {
      mockRoute.value = { params: {} }
      const { result, mockMutateAsyncCreate } = withDocumentForm()

      result.setFieldValue('name', 'New Document')
      await nextTick()

      await result.submit()

      expect(mockMutateAsyncCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Document' }),
      )
    })

    it('navigates to detail page after create', async () => {
      mockRoute.value = { params: {} }
      const { result } = withDocumentForm()

      result.setFieldValue('name', 'Navigate Test')
      await nextTick()
      await result.submit()

      expect(mockRouterPush).toHaveBeenCalledWith({
        name: 'test-detail',
        params: { id: 42 },
      })
    })

    it('does not navigate when stayOnPageAfterSave is true', async () => {
      mockRoute.value = { params: {} }
      const { result } = withDocumentForm({ stayOnPageAfterSave: true })

      result.setFieldValue('name', 'Stay Here')
      await nextTick()
      await result.submit()

      expect(mockRouterPush).not.toHaveBeenCalled()
    })

    it('emits document:created event', async () => {
      mockRoute.value = { params: {} }
      const { result } = withDocumentForm()

      result.setFieldValue('name', 'Event Test')
      await nextTick()
      await result.submit()

      expect(mockEventBusEmit).toHaveBeenCalledWith('document:created', {
        documentType: 'test-doc',
        id: 42,
      })
    })

    it('emits form:submitted success event', async () => {
      mockRoute.value = { params: {} }
      const { result } = withDocumentForm()

      result.setFieldValue('name', 'Success')
      await nextTick()
      await result.submit()

      expect(mockEventBusEmit).toHaveBeenCalledWith('form:submitted', {
        formName: 'test-doc',
        success: true,
      })
    })

    it('uses transformCreate when provided', async () => {
      mockRoute.value = { params: {} }
      const transformCreate = vi.fn((data: TestForm) => ({
        ...data,
        name: data.name.toUpperCase(),
      }))

      const { result, mockMutateAsyncCreate } = withDocumentForm({}, { transformCreate })

      result.setFieldValue('name', 'lowercase')
      await nextTick()
      await result.submit()

      expect(transformCreate).toHaveBeenCalled()
      expect(mockMutateAsyncCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'LOWERCASE' }),
      )
    })
  })

  describe('submit (edit mode)', () => {
    it('calls update mutation with id and form data', async () => {
      mockRoute.value = { params: { id: '99' } }
      const { result, mockMutateAsyncUpdate } = withDocumentForm()

      result.setFieldValue('name', 'Updated Doc')
      await nextTick()
      await result.submit()

      expect(mockMutateAsyncUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ id: 99, name: 'Updated Doc' }),
      )
    })

    it('emits document:updated event', async () => {
      mockRoute.value = { params: { id: '5' } }
      const { result } = withDocumentForm()

      result.setFieldValue('name', 'Updated')
      await nextTick()
      await result.submit()

      expect(mockEventBusEmit).toHaveBeenCalledWith('document:updated', expect.objectContaining({
        documentType: 'test-doc',
        id: expect.any(Number),
      }))
    })
  })

  describe('submit validation failure', () => {
    it('does not call mutation when form is invalid', async () => {
      mockRoute.value = { params: {} }
      const { result, mockMutateAsyncCreate } = withDocumentForm()

      // name is empty → invalid
      await result.submit()

      expect(mockMutateAsyncCreate).not.toHaveBeenCalled()
    })

    it('emits form:validation-failed event', async () => {
      mockRoute.value = { params: {} }
      const { result } = withDocumentForm()

      await result.submit()

      expect(mockEventBusEmit).toHaveBeenCalledWith('form:validation-failed', expect.objectContaining({
        formName: 'test-doc',
      }))
    })
  })

  describe('submit error handling', () => {
    it('captures submit error', async () => {
      mockRoute.value = { params: {} }
      const error = new Error('Network error')
      const { result } = withDocumentForm({}, {
        useCreate: () => ({
          mutateAsync: vi.fn().mockRejectedValue(error),
          isPending: ref(false),
        }),
      })

      result.setFieldValue('name', 'Will Fail')
      await nextTick()
      await result.submit()

      expect(result.submitError.value).toBe(error)
    })

    it('emits form:submitted failure event on error', async () => {
      mockRoute.value = { params: {} }
      const { result } = withDocumentForm({}, {
        useCreate: () => ({
          mutateAsync: vi.fn().mockRejectedValue(new Error('fail')),
          isPending: ref(false),
        }),
      })

      result.setFieldValue('name', 'Error')
      await nextTick()
      await result.submit()

      expect(mockEventBusEmit).toHaveBeenCalledWith('form:submitted', {
        formName: 'test-doc',
        success: false,
      })
    })

    it('clears previous error on new submit', async () => {
      mockRoute.value = { params: {} }
      const mutateAsync = vi.fn()
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({ id: 1, name: 'OK' })

      const { result } = withDocumentForm({}, {
        useCreate: () => ({
          mutateAsync,
          isPending: ref(false),
        }),
      })

      result.setFieldValue('name', 'Retry')
      await nextTick()

      // First submit fails
      await result.submit()
      expect(result.submitError.value).toBeTruthy()

      // Second submit succeeds
      await result.submit()
      expect(result.submitError.value).toBeNull()
    })
  })

  describe('reset', () => {
    it('resets to default values in create mode', async () => {
      mockRoute.value = { params: {} }
      const { result } = withDocumentForm()

      result.setFieldValue('name', 'Changed')
      await nextTick()

      result.reset()
      await nextTick()

      expect(result.values.value.name).toBe('')
    })

    it('clears submit error on reset', async () => {
      mockRoute.value = { params: {} }
      const { result } = withDocumentForm({}, {
        useCreate: () => ({
          mutateAsync: vi.fn().mockRejectedValue(new Error('fail')),
          isPending: ref(false),
        }),
      })

      result.setFieldValue('name', 'Error')
      await nextTick()
      await result.submit()
      expect(result.submitError.value).toBeTruthy()

      result.reset()
      expect(result.submitError.value).toBeNull()
    })
  })

  describe('data fetching (edit mode)', () => {
    it('populates form from fetched data', async () => {
      mockRoute.value = { params: { id: '10' } }

      const fetchData = ref<TestResponse | undefined>(undefined)
      const { result } = withDocumentForm({}, {
        useFetch: () => ({
          data: fetchData,
          isLoading: ref(false),
          error: ref(null),
        }),
      })

      // Simulate data arrival
      fetchData.value = { id: 10, name: 'Fetched Doc' }
      await nextTick()
      await flushPromises()

      expect(result.existingData.value).toEqual({ id: 10, name: 'Fetched Doc' })
    })

    it('uses transformFetch when provided', async () => {
      mockRoute.value = { params: { id: '10' } }

      const fetchData = ref<TestResponse | undefined>(undefined)
      const transformFetch = vi.fn((data: TestResponse) => ({
        name: `Transformed: ${data.name}`,
        description: '',
      }))

      const { result } = withDocumentForm({}, {
        useFetch: () => ({
          data: fetchData,
          isLoading: ref(false),
          error: ref(null),
        }),
        transformFetch,
      })

      fetchData.value = { id: 10, name: 'Original' }
      await nextTick()
      await flushPromises()

      expect(transformFetch).toHaveBeenCalledWith({ id: 10, name: 'Original' })
    })

    it('syncs loading state', async () => {
      mockRoute.value = { params: { id: '10' } }

      const isLoading = ref(true)
      const { result } = withDocumentForm({}, {
        useFetch: () => ({
          data: ref(undefined),
          isLoading,
          error: ref(null),
        }),
      })

      expect(result.isLoadingData.value).toBe(true)

      isLoading.value = false
      await nextTick()

      expect(result.isLoadingData.value).toBe(false)
    })

    it('syncs error state', async () => {
      mockRoute.value = { params: { id: '10' } }

      const fetchError = ref<Error | null>(new Error('Not found'))
      const { result } = withDocumentForm({}, {
        useFetch: () => ({
          data: ref(undefined),
          isLoading: ref(false),
          error: fetchError,
        }),
      })

      expect(result.dataError.value?.message).toBe('Not found')
    })
  })

  describe('navigation after save', () => {
    it('navigates to list route when no detail route and redirectAfterCreate is false', async () => {
      mockRoute.value = { params: {} }
      const { result } = withDocumentForm({
        redirectAfterCreate: false,
        listRoute: 'test-list',
        detailRoute: undefined,
      })

      result.setFieldValue('name', 'Go to list')
      await nextTick()
      await result.submit()

      expect(mockRouterPush).toHaveBeenCalledWith({ name: 'test-list' })
    })
  })
})
