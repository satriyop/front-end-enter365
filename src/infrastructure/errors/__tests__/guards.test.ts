/**
 * Error Guards & Utilities Tests
 *
 * Tests type guards, error message extraction, validation error
 * extraction, and error code/status code utilities.
 */

import { describe, it, expect } from 'vitest'
import { AxiosError, AxiosHeaders } from 'axios'
import {
  AppError,
  ValidationError,
  ApiError,
  NotFoundError,
  AuthenticationError,
  PermissionError,
  NetworkError,
  TimeoutError,
} from '../types'
import {
  isAppError,
  isValidationError,
  isApiError,
  isNotFoundError,
  isAuthenticationError,
  isPermissionError,
  isNetworkError,
  getErrorMessage,
  extractValidationErrors,
  flattenValidationErrors,
  getFirstValidationError,
  getErrorCode,
  getStatusCode,
} from '../guards'

// ─────────────────────────────────────────────────────────────
// Error Type Tests
// ─────────────────────────────────────────────────────────────

describe('Error Types', () => {
  describe('AppError', () => {
    it('creates with message and code', () => {
      const error = new AppError('Something failed', 'ERR_SOMETHING')

      expect(error.message).toBe('Something failed')
      expect(error.code).toBe('ERR_SOMETHING')
      expect(error.name).toBe('AppError')
      expect(error).toBeInstanceOf(Error)
    })

    it('includes context', () => {
      const error = new AppError('Fail', 'ERR', { userId: 42 })

      expect(error.context).toEqual({ userId: 42 })
    })

    it('has stack trace', () => {
      const error = new AppError('Fail', 'ERR')

      expect(error.stack).toBeDefined()
    })
  })

  describe('ValidationError', () => {
    it('creates from field errors', () => {
      const error = new ValidationError({
        name: ['Name is required'],
        email: ['Invalid email', 'Email already taken'],
      })

      expect(error.message).toBe('Validation failed')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.name).toBe('ValidationError')
    })

    it('getFieldError returns first error', () => {
      const error = new ValidationError({
        email: ['Invalid email', 'Email already taken'],
      })

      expect(error.getFieldError('email')).toBe('Invalid email')
    })

    it('getFieldError returns null for unknown field', () => {
      const error = new ValidationError({ name: ['Required'] })

      expect(error.getFieldError('email')).toBeNull()
    })

    it('getFieldErrors returns all errors', () => {
      const error = new ValidationError({
        email: ['Invalid email', 'Email already taken'],
      })

      expect(error.getFieldErrors('email')).toEqual(['Invalid email', 'Email already taken'])
    })

    it('getFieldErrors returns empty array for unknown field', () => {
      const error = new ValidationError({ name: ['Required'] })

      expect(error.getFieldErrors('email')).toEqual([])
    })

    it('getErrorFields returns all field names', () => {
      const error = new ValidationError({
        name: ['Required'],
        email: ['Invalid'],
      })

      expect(error.getErrorFields()).toEqual(['name', 'email'])
    })

    it('hasFieldError checks field existence', () => {
      const error = new ValidationError({
        name: ['Required'],
        email: [],
      })

      expect(error.hasFieldError('name')).toBe(true)
      expect(error.hasFieldError('email')).toBe(false)
      expect(error.hasFieldError('phone')).toBe(false)
    })
  })

  describe('ApiError', () => {
    it('creates with status code and endpoint', () => {
      const error = new ApiError('Not found', 404, '/api/users/99')

      expect(error.message).toBe('Not found')
      expect(error.statusCode).toBe(404)
      expect(error.endpoint).toBe('/api/users/99')
      expect(error.code).toBe('API_ERROR_404')
    })

    it('isClientError for 4xx', () => {
      expect(new ApiError('Bad', 400, '/api').isClientError()).toBe(true)
      expect(new ApiError('Not found', 404, '/api').isClientError()).toBe(true)
      expect(new ApiError('Unauth', 422, '/api').isClientError()).toBe(true)
      expect(new ApiError('Server', 500, '/api').isClientError()).toBe(false)
    })

    it('isServerError for 5xx', () => {
      expect(new ApiError('Server', 500, '/api').isServerError()).toBe(true)
      expect(new ApiError('Gateway', 502, '/api').isServerError()).toBe(true)
      expect(new ApiError('Not found', 404, '/api').isServerError()).toBe(false)
    })

    it('isStatus checks specific code', () => {
      const error = new ApiError('Not found', 404, '/api')

      expect(error.isStatus(404)).toBe(true)
      expect(error.isStatus(500)).toBe(false)
    })
  })

  describe('NotFoundError', () => {
    it('creates with resource and id', () => {
      const error = new NotFoundError('Quotation', 42)

      expect(error.message).toBe('Quotation not found: 42')
      expect(error.resource).toBe('Quotation')
      expect(error.id).toBe(42)
      expect(error.code).toBe('NOT_FOUND')
    })
  })

  describe('AuthenticationError', () => {
    it.each([
      ['invalid_credentials', 'Invalid email or password'],
      ['session_expired', 'Your session has expired. Please log in again.'],
      ['token_invalid', 'Authentication token is invalid'],
      ['unauthorized', 'You are not authorized to perform this action'],
    ] as const)('creates message for reason "%s"', (reason, expectedMessage) => {
      const error = new AuthenticationError(reason)

      expect(error.message).toBe(expectedMessage)
      expect(error.reason).toBe(reason)
      expect(error.code).toBe('AUTH_ERROR')
    })
  })

  describe('PermissionError', () => {
    it('creates with action and resource', () => {
      const error = new PermissionError('delete', 'invoice')

      expect(error.message).toBe('You do not have permission to delete invoice')
      expect(error.action).toBe('delete')
      expect(error.resource).toBe('invoice')
    })

    it('creates with action only', () => {
      const error = new PermissionError('export')

      expect(error.message).toBe('You do not have permission to export')
    })
  })

  describe('NetworkError', () => {
    it('creates with default message', () => {
      const error = new NetworkError()

      expect(error.message).toBe('Network error - please check your connection')
      expect(error.code).toBe('NETWORK_ERROR')
    })

    it('creates with custom message', () => {
      const error = new NetworkError('Server unreachable')

      expect(error.message).toBe('Server unreachable')
    })
  })

  describe('TimeoutError', () => {
    it('creates with operation and timeout', () => {
      const error = new TimeoutError('fetchQuotations', 5000)

      expect(error.message).toBe('Operation "fetchQuotations" timed out after 5000ms')
      expect(error.operation).toBe('fetchQuotations')
      expect(error.timeoutMs).toBe(5000)
      expect(error.code).toBe('TIMEOUT_ERROR')
    })
  })
})

// ─────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────

describe('Type Guards', () => {
  describe('isAppError', () => {
    it('returns true for AppError', () => {
      expect(isAppError(new AppError('test', 'ERR'))).toBe(true)
    })

    it('returns true for subclasses', () => {
      expect(isAppError(new ValidationError({ name: ['Required'] }))).toBe(true)
      expect(isAppError(new ApiError('fail', 500, '/api'))).toBe(true)
      expect(isAppError(new NotFoundError('User', 1))).toBe(true)
      expect(isAppError(new NetworkError())).toBe(true)
    })

    it('returns false for standard Error', () => {
      expect(isAppError(new Error('test'))).toBe(false)
    })

    it('returns false for non-errors', () => {
      expect(isAppError('string error')).toBe(false)
      expect(isAppError(null)).toBe(false)
      expect(isAppError(undefined)).toBe(false)
      expect(isAppError(42)).toBe(false)
    })
  })

  describe('isValidationError', () => {
    it('returns true for ValidationError', () => {
      expect(isValidationError(new ValidationError({ name: ['Required'] }))).toBe(true)
    })

    it('returns false for other AppErrors', () => {
      expect(isValidationError(new AppError('test', 'ERR'))).toBe(false)
      expect(isValidationError(new ApiError('fail', 422, '/api'))).toBe(false)
    })
  })

  describe('isApiError', () => {
    it('returns true for ApiError', () => {
      expect(isApiError(new ApiError('fail', 500, '/api'))).toBe(true)
    })

    it('returns false for other types', () => {
      expect(isApiError(new AppError('test', 'ERR'))).toBe(false)
    })
  })

  describe('isNotFoundError', () => {
    it('returns true for NotFoundError', () => {
      expect(isNotFoundError(new NotFoundError('User', 1))).toBe(true)
    })
  })

  describe('isAuthenticationError', () => {
    it('returns true for AuthenticationError', () => {
      expect(isAuthenticationError(new AuthenticationError('session_expired'))).toBe(true)
    })
  })

  describe('isPermissionError', () => {
    it('returns true for PermissionError', () => {
      expect(isPermissionError(new PermissionError('delete', 'invoice'))).toBe(true)
    })
  })

  describe('isNetworkError', () => {
    it('returns true for NetworkError', () => {
      expect(isNetworkError(new NetworkError())).toBe(true)
    })
  })
})

// ─────────────────────────────────────────────────────────────
// getErrorMessage
// ─────────────────────────────────────────────────────────────

describe('getErrorMessage', () => {
  it('extracts message from AppError', () => {
    expect(getErrorMessage(new AppError('App failed', 'ERR'))).toBe('App failed')
  })

  it('extracts message from ValidationError', () => {
    expect(getErrorMessage(new ValidationError({ name: ['Required'] }))).toBe('Validation failed')
  })

  it('extracts message from standard Error', () => {
    expect(getErrorMessage(new Error('Standard error'))).toBe('Standard error')
  })

  it('extracts message from Axios error with response data', () => {
    const error = new AxiosError(
      'Request failed',
      '422',
      undefined,
      undefined,
      {
        data: { message: 'Server validation failed' },
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    )

    expect(getErrorMessage(error)).toBe('Server validation failed')
  })

  it('falls back to Axios error message when no response data', () => {
    const error = new AxiosError('Network Error')

    expect(getErrorMessage(error)).toBe('Network Error')
  })

  it('extracts from object with message property', () => {
    expect(getErrorMessage({ message: 'Object error' })).toBe('Object error')
  })

  it('handles string errors', () => {
    expect(getErrorMessage('Something went wrong')).toBe('Something went wrong')
  })

  it('returns fallback for unknown types', () => {
    expect(getErrorMessage(42)).toBe('An unexpected error occurred')
    expect(getErrorMessage(null)).toBe('An unexpected error occurred')
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred')
  })

  it('accepts custom fallback', () => {
    expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback')
  })
})

// ─────────────────────────────────────────────────────────────
// extractValidationErrors
// ─────────────────────────────────────────────────────────────

describe('extractValidationErrors', () => {
  it('extracts from ValidationError instance', () => {
    const error = new ValidationError({
      name: ['Required'],
      email: ['Invalid email'],
    })

    const result = extractValidationErrors(error)

    expect(result).toEqual({
      name: ['Required'],
      email: ['Invalid email'],
    })
  })

  it('extracts from Axios 422 response (Laravel format)', () => {
    const error = new AxiosError(
      'Validation failed',
      '422',
      undefined,
      undefined,
      {
        data: {
          message: 'The given data was invalid.',
          errors: {
            name: ['The name field is required.'],
            'items.0.quantity': ['Quantity must be at least 1'],
          },
        },
        status: 422,
        statusText: 'Unprocessable Entity',
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    )

    const result = extractValidationErrors(error)

    expect(result).toEqual({
      name: ['The name field is required.'],
      'items.0.quantity': ['Quantity must be at least 1'],
    })
  })

  it('returns null for non-422 Axios error', () => {
    const error = new AxiosError(
      'Server error',
      '500',
      undefined,
      undefined,
      {
        data: { message: 'Internal server error' },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    )

    expect(extractValidationErrors(error)).toBeNull()
  })

  it('extracts from object with validationErrors property', () => {
    const error = {
      validationErrors: {
        name: ['Name required'],
      },
    }

    expect(extractValidationErrors(error)).toEqual({
      name: ['Name required'],
    })
  })

  it('extracts from generic object with errors property', () => {
    const error = {
      errors: {
        email: ['Email taken'],
      },
    }

    expect(extractValidationErrors(error)).toEqual({
      email: ['Email taken'],
    })
  })

  it('returns null for standard Error', () => {
    expect(extractValidationErrors(new Error('fail'))).toBeNull()
  })

  it('returns null for string', () => {
    expect(extractValidationErrors('error')).toBeNull()
  })

  it('returns null for null/undefined', () => {
    expect(extractValidationErrors(null)).toBeNull()
    expect(extractValidationErrors(undefined)).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────
// flattenValidationErrors
// ─────────────────────────────────────────────────────────────

describe('flattenValidationErrors', () => {
  it('flattens errors into a single array', () => {
    const result = flattenValidationErrors({
      name: ['Required'],
      email: ['Invalid email', 'Email taken'],
    })

    expect(result).toEqual(['Required', 'Invalid email', 'Email taken'])
  })

  it('returns empty array for no errors', () => {
    expect(flattenValidationErrors({})).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────
// getFirstValidationError
// ─────────────────────────────────────────────────────────────

describe('getFirstValidationError', () => {
  it('returns first error for a specific field', () => {
    const error = new ValidationError({
      name: ['Required', 'Too short'],
      email: ['Invalid'],
    })

    expect(getFirstValidationError(error, 'name')).toBe('Required')
  })

  it('falls through to first error from any field when specified field not found', () => {
    const error = new ValidationError({
      name: ['Required'],
    })

    // When field is specified but not found, it returns first from any field
    expect(getFirstValidationError(error, 'email')).toBe('Required')
  })

  it('returns first error from any field when no field specified', () => {
    const error = new ValidationError({
      name: ['Name required'],
      email: ['Email invalid'],
    })

    expect(getFirstValidationError(error)).toBe('Name required')
  })

  it('returns null for non-validation error', () => {
    expect(getFirstValidationError(new Error('fail'))).toBeNull()
  })

  it('returns null for null', () => {
    expect(getFirstValidationError(null)).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────
// getErrorCode / getStatusCode
// ─────────────────────────────────────────────────────────────

describe('getErrorCode', () => {
  it('returns code from AppError', () => {
    expect(getErrorCode(new AppError('fail', 'ERR_CODE'))).toBe('ERR_CODE')
  })

  it('returns code from ValidationError', () => {
    expect(getErrorCode(new ValidationError({ name: ['Required'] }))).toBe('VALIDATION_ERROR')
  })

  it('returns code from object with code property', () => {
    expect(getErrorCode({ code: 'CUSTOM_CODE' })).toBe('CUSTOM_CODE')
  })

  it('returns null for standard Error', () => {
    expect(getErrorCode(new Error('fail'))).toBeNull()
  })

  it('returns null for non-objects', () => {
    expect(getErrorCode('error')).toBeNull()
    expect(getErrorCode(null)).toBeNull()
  })
})

describe('getStatusCode', () => {
  it('returns status code from ApiError', () => {
    expect(getStatusCode(new ApiError('fail', 404, '/api'))).toBe(404)
  })

  it('returns status code from Axios error', () => {
    const error = new AxiosError(
      'Not found',
      '404',
      undefined,
      undefined,
      {
        data: {},
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    )

    expect(getStatusCode(error)).toBe(404)
  })

  it('returns null for Axios error without response', () => {
    const error = new AxiosError('Network Error')

    expect(getStatusCode(error)).toBeNull()
  })

  it('returns null for standard Error', () => {
    expect(getStatusCode(new Error('fail'))).toBeNull()
  })

  it('returns null for non-errors', () => {
    expect(getStatusCode(null)).toBeNull()
    expect(getStatusCode('error')).toBeNull()
  })
})
