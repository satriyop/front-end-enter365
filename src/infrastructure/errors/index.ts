/**
 * Error Handling Module
 *
 * Custom error types and type guards for consistent error handling.
 *
 * @example
 * ```ts
 * import {
 *   ValidationError,
 *   isValidationError,
 *   extractValidationErrors,
 *   getErrorMessage,
 * } from '@/infrastructure/errors'
 *
 * try {
 *   await api.post('/quotations', data)
 * } catch (error) {
 *   if (isValidationError(error)) {
 *     // Handle validation errors
 *     const errors = error.errors
 *   } else {
 *     // Show generic error message
 *     toast.error(getErrorMessage(error))
 *   }
 * }
 * ```
 */

// Error Types
export {
  AppError,
  ValidationError,
  ApiError,
  NotFoundError,
  AuthenticationError,
  PermissionError,
  NetworkError,
  TimeoutError,
} from './types'

// Type Guards
export {
  isAppError,
  isValidationError,
  isApiError,
  isNotFoundError,
  isAuthenticationError,
  isPermissionError,
  isNetworkError,
} from './guards'

// Error Message Utilities
export {
  getErrorMessage,
  extractValidationErrors,
  flattenValidationErrors,
  getFirstValidationError,
  getErrorCode,
  getStatusCode,
} from './guards'
