import axios, { type AxiosError } from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Token refresh state
let isRefreshing = false
let refreshSubscribers: ((token: string) => void)[] = []

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

export function shouldSkipTokenRefresh(url: string | undefined): boolean {
  if (!url) {
    return false
  }
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout')
}

// Request interceptor: add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor: handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (shouldSkipTokenRefresh(originalRequest.url)) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Wait for token refresh
        return new Promise(resolve => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const response = await api.post<{ token: string }>('/auth/refresh')
        const newToken = response.data.token
        localStorage.setItem('token', newToken)
        onTokenRefreshed(newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Helper to extract error message from any error
export function isNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false
  }
  // Any HTTP response means the server answered — never "jaringan putus".
  if (error.response) {
    return false
  }
  const code = error.code ?? ''
  return code === 'ERR_NETWORK'
    || code === 'ECONNABORTED'
    || code === 'ETIMEDOUT'
    || error.message === 'Network Error'
}

export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (!error) return fallback

  // Axios error with response
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { 
      message?: string; 
      errors?: Record<string, string[]>;
      success?: boolean;
      context?: Record<string, unknown>;
    } | undefined
    
    // Check for validation errors (422)
    if (error.response?.status === 422 && data?.errors) {
      const firstError = Object.values(data.errors)[0]?.[0]
      return firstError || data.message || 'Data tidak valid.'
    }

    if (error.response?.status === 409) {
      return data?.message || 'Operasi tidak diizinkan.'
    }

    if (error.response?.status === 500) {
      return data?.message && !data.message.includes('SQLSTATE')
        ? data.message
        : 'Terjadi kesalahan di server. Coba lagi.'
    }

    if (data?.message) return data.message
    if (error.message && error.message !== 'Network Error') return error.message
    if (!error.response) return fallback
  }

  // Error with message property
  if (error instanceof Error) {
    return error.message
  }

  // Object with message
  if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
    return (error as any).message
  }

  return fallback
}

// Type helper for API responses
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

/**
 * Gold Standard OpenAPI Type Utilities
 * Extract types from OpenAPI paths safely, handling optional request bodies.
 */
export type ApiRequest<
  T extends { requestBody?: any },
  M extends 'application/json' | 'multipart/form-data' = 'application/json'
> = T['requestBody'] extends { content: { [K in M]: any } }
  ? T['requestBody']['content'][M]
  : T['requestBody'] extends { content: { [K in M]?: any } }
  ? NonNullable<T['requestBody']['content'][M]>
  : never

export type ApiResponse<T extends { responses: any }> =
  T['responses'][200]['content']['application/json'] extends { data: any }
    ? T['responses'][200]['content']['application/json']['data']
    : T['responses'][201]['content']['application/json'] extends { data: any }
    ? T['responses'][201]['content']['application/json']['data']
    : T['responses'][200]['content']['application/json']
