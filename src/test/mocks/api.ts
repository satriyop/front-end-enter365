/**
 * API Mock Utilities
 *
 * Helpers for mocking API responses in tests.
 */

import { vi } from 'vitest'
import type { QueryClient } from '@tanstack/vue-query'

/**
 * Create a mock QueryClient for testing
 */
export function createMockQueryClient(): QueryClient {
  return {
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    setQueryData: vi.fn(),
    getQueryData: vi.fn(),
    prefetchQuery: vi.fn().mockResolvedValue(undefined),
    cancelQueries: vi.fn().mockResolvedValue(undefined),
    removeQueries: vi.fn(),
    clear: vi.fn(),
    getQueryCache: vi.fn(() => ({
      find: vi.fn(),
      findAll: vi.fn(() => []),
    })),
    getMutationCache: vi.fn(() => ({
      find: vi.fn(),
      findAll: vi.fn(() => []),
    })),
    defaultQueryOptions: vi.fn(() => ({})),
    setDefaultOptions: vi.fn(),
    getDefaultOptions: vi.fn(() => ({})),
  } as unknown as QueryClient
}

/**
 * Mock a successful API response
 */
export function mockApiSuccess<T>(data: T) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }
}

/**
 * Mock an API error response
 */
export function mockApiError(
  status: number,
  message: string,
  errors?: Record<string, string[]>
) {
  const error = new Error(message) as Error & {
    response: {
      status: number
      data: { message: string; errors?: Record<string, string[]> }
    }
  }
  error.response = {
    status,
    data: {
      message,
      errors,
    },
  }
  return error
}

/**
 * Mock a validation error (422)
 */
export function mockValidationError(errors: Record<string, string[]>) {
  return mockApiError(422, 'The given data was invalid.', errors)
}

/**
 * Mock a not found error (404)
 */
export function mockNotFoundError(message = 'Resource not found') {
  return mockApiError(404, message)
}

/**
 * Mock an unauthorized error (401)
 */
export function mockUnauthorizedError(message = 'Unauthenticated') {
  return mockApiError(401, message)
}

/**
 * Mock a forbidden error (403)
 */
export function mockForbiddenError(message = 'Forbidden') {
  return mockApiError(403, message)
}

/**
 * Mock a paginated API response
 */
export function mockPaginatedResponse<T>(
  data: T[],
  options: {
    page?: number
    perPage?: number
    total?: number
  } = {}
) {
  const { page = 1, perPage = 10, total = data.length } = options
  const lastPage = Math.ceil(total / perPage)

  return {
    data,
    meta: {
      current_page: page,
      from: (page - 1) * perPage + 1,
      last_page: lastPage,
      per_page: perPage,
      to: Math.min(page * perPage, total),
      total,
    },
    links: {
      first: `?page=1`,
      last: `?page=${lastPage}`,
      prev: page > 1 ? `?page=${page - 1}` : null,
      next: page < lastPage ? `?page=${page + 1}` : null,
    },
  }
}

/**
 * Create a mock mutation result
 */
export function createMockMutation<TData>() {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined as TData),
    isPending: { value: false },
    isError: { value: false },
    isSuccess: { value: false },
    error: { value: null },
    data: { value: undefined },
    reset: vi.fn(),
  }
}

/**
 * Create a mock query result
 */
export function createMockQuery<TData>(data?: TData) {
  return {
    data: { value: data },
    isLoading: { value: false },
    isPending: { value: false },
    isError: { value: false },
    isSuccess: { value: !!data },
    error: { value: null },
    refetch: vi.fn(),
    isFetching: { value: false },
  }
}

/**
 * Create a loading query result
 */
export function createLoadingQuery<TData>() {
  return {
    data: { value: undefined as TData | undefined },
    isLoading: { value: true },
    isPending: { value: true },
    isError: { value: false },
    isSuccess: { value: false },
    error: { value: null },
    refetch: vi.fn(),
    isFetching: { value: true },
  }
}

/**
 * Create an error query result
 */
export function createErrorQuery<TData>(error: Error) {
  return {
    data: { value: undefined as TData | undefined },
    isLoading: { value: false },
    isPending: { value: false },
    isError: { value: true },
    isSuccess: { value: false },
    error: { value: error },
    refetch: vi.fn(),
    isFetching: { value: false },
  }
}
