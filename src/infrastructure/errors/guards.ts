/**
 * Error Type Guards
 *
 * Type-safe functions for checking and handling different error types.
 */

import axios from 'axios'
import {
  AppError,
  ValidationError,
  ApiError,
  NotFoundError,
  AuthenticationError,
  PermissionError,
  NetworkError,
} from './types'

// ─────────────────────────────────────────────────────────────
// Type Guards
// ─────────────────────────────────────────────────────────────

/**
 * Check if error is an AppError (or subclass)
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

/**
 * Check if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError
}

/**
 * Check if error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/**
 * Check if error is a NotFoundError
 */
export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError
}

/**
 * Check if error is an AuthenticationError
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
  return error instanceof AuthenticationError
}

/**
 * Check if error is a PermissionError
 */
export function isPermissionError(error: unknown): error is PermissionError {
  return error instanceof PermissionError
}

/**
 * Check if error is a NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError
}

// ─────────────────────────────────────────────────────────────
// Error Message Extraction
// ─────────────────────────────────────────────────────────────

/**
 * Extract a user-friendly error message from any error
 *
 * @param error - Any error type
 * @param fallback - Fallback message if extraction fails
 */
export function getErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred'
): string {
  // AppError and subclasses
  if (isAppError(error)) {
    return error.message
  }

  // Axios error with response data
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    if (data?.message) return data.message
    if (error.message) return error.message
  }

  // Standard Error
  if (error instanceof Error) {
    return error.message
  }

  // Object with message property
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as Record<string, unknown>).message as string
  }

  // String error
  if (typeof error === 'string') {
    return error
  }

  return fallback
}

// ─────────────────────────────────────────────────────────────
// Validation Error Extraction
// ─────────────────────────────────────────────────────────────

/**
 * Extract validation errors from any error
 *
 * Handles:
 * - ValidationError instances
 * - Axios errors with Laravel validation response format
 * - Any object with errors property
 *
 * @returns Record of field names to error messages, or null if not a validation error
 */
export function extractValidationErrors(
  error: unknown
): Record<string, string[]> | null {
  // Our ValidationError class
  if (isValidationError(error)) {
    return error.errors
  }

  // Axios error with Laravel validation response
  if (axios.isAxiosError(error) && error.response?.status === 422) {
    const data = error.response.data as { errors?: Record<string, string[]> } | undefined
    if (data?.errors) {
      return data.errors
    }
  }

  // Custom error with validationErrors property (from api/client.ts)
  if (
    typeof error === 'object' &&
    error !== null &&
    'validationErrors' in error
  ) {
    return (error as Record<string, unknown>).validationErrors as Record<string, string[]>
  }

  // Generic object with errors property
  if (
    typeof error === 'object' &&
    error !== null &&
    'errors' in error &&
    typeof (error as Record<string, unknown>).errors === 'object'
  ) {
    return (error as Record<string, unknown>).errors as Record<string, string[]>
  }

  return null
}

/**
 * Convert validation errors to a flat list of error messages
 */
export function flattenValidationErrors(
  errors: Record<string, string[]>
): string[] {
  return Object.values(errors).flat()
}

/**
 * Get first validation error for a field, or first error overall
 */
export function getFirstValidationError(
  error: unknown,
  field?: string
): string | null {
  const errors = extractValidationErrors(error)
  if (!errors) return null

  if (field) {
    const fieldErrors = errors[field]
    if (fieldErrors && fieldErrors.length > 0) {
      return fieldErrors[0] ?? null
    }
  }

  // Return first error from any field
  const allErrors = flattenValidationErrors(errors)
  return allErrors[0] ?? null
}

// ─────────────────────────────────────────────────────────────
// Error Code Extraction
// ─────────────────────────────────────────────────────────────

/**
 * Get error code if available
 */
export function getErrorCode(error: unknown): string | null {
  if (isAppError(error)) {
    return error.code
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  ) {
    return (error as Record<string, unknown>).code as string
  }

  return null
}

/**
 * Get HTTP status code if available
 */
export function getStatusCode(error: unknown): number | null {
  if (isApiError(error)) {
    return error.statusCode
  }

  if (axios.isAxiosError(error) && error.response) {
    return error.response.status
  }

  return null
}
