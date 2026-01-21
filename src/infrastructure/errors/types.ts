/**
 * Application Error Types
 *
 * Custom error classes for better error handling and type safety.
 */

/**
 * Base application error
 * All custom errors should extend this
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'AppError'

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

/**
 * Validation error with field-specific messages
 * Matches Laravel's validation error format
 */
export class ValidationError extends AppError {
  constructor(public readonly errors: Record<string, string[]>) {
    super('Validation failed', 'VALIDATION_ERROR', { errors })
    this.name = 'ValidationError'
  }

  /**
   * Get first error message for a field
   */
  getFieldError(field: string): string | null {
    return this.errors[field]?.[0] ?? null
  }

  /**
   * Get all error messages for a field
   */
  getFieldErrors(field: string): string[] {
    return this.errors[field] ?? []
  }

  /**
   * Get all fields with errors
   */
  getErrorFields(): string[] {
    return Object.keys(this.errors)
  }

  /**
   * Check if a field has errors
   */
  hasFieldError(field: string): boolean {
    const fieldErrors = this.errors[field]
    return fieldErrors !== undefined && fieldErrors.length > 0
  }
}

/**
 * API error with status code and response data
 */
export class ApiError extends AppError {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly endpoint: string,
    public readonly response?: unknown
  ) {
    super(message, `API_ERROR_${statusCode}`, { endpoint, statusCode, response })
    this.name = 'ApiError'
  }

  /**
   * Check if this is a client error (4xx)
   */
  isClientError(): boolean {
    return this.statusCode >= 400 && this.statusCode < 500
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode >= 500
  }

  /**
   * Check if this is a specific status code
   */
  isStatus(statusCode: number): boolean {
    return this.statusCode === statusCode
  }
}

/**
 * Resource not found error
 */
export class NotFoundError extends AppError {
  constructor(
    public readonly resource: string,
    public readonly id: string | number
  ) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND', { resource, id })
    this.name = 'NotFoundError'
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(
    public readonly reason:
      | 'invalid_credentials'
      | 'session_expired'
      | 'token_invalid'
      | 'unauthorized'
  ) {
    const messages: Record<string, string> = {
      invalid_credentials: 'Invalid email or password',
      session_expired: 'Your session has expired. Please log in again.',
      token_invalid: 'Authentication token is invalid',
      unauthorized: 'You are not authorized to perform this action',
    }

    super(messages[reason] || 'Authentication failed', 'AUTH_ERROR', { reason })
    this.name = 'AuthenticationError'
  }
}

/**
 * Permission/authorization error
 */
export class PermissionError extends AppError {
  constructor(
    public readonly action: string,
    public readonly resource?: string
  ) {
    const message = resource
      ? `You do not have permission to ${action} ${resource}`
      : `You do not have permission to ${action}`

    super(message, 'PERMISSION_ERROR', { action, resource })
    this.name = 'PermissionError'
  }
}

/**
 * Network error (no response from server)
 */
export class NetworkError extends AppError {
  constructor(message = 'Network error - please check your connection') {
    super(message, 'NETWORK_ERROR')
    this.name = 'NetworkError'
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends AppError {
  constructor(
    public readonly operation: string,
    public readonly timeoutMs: number
  ) {
    super(
      `Operation "${operation}" timed out after ${timeoutMs}ms`,
      'TIMEOUT_ERROR',
      { operation, timeoutMs }
    )
    this.name = 'TimeoutError'
  }
}
