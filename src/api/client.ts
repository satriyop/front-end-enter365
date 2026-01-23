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
      // Don't retry login or refresh endpoints
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
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

    // Handle validation errors (422)
    if (error.response?.status === 422) {
      const data = error.response.data as { errors?: Record<string, string[]>; message?: string }
      const validationError = {
        ...error,
        validationErrors: data.errors,
        message: data.message || 'Validation failed',
      }
      return Promise.reject(validationError)
    }

    return Promise.reject(error)
  }
)

// Helper to extract error message from any error
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (!error) return fallback

  // Axios error with response
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined
    
    // Check for specific server error (500)
    if (error.response?.status === 500) {
      return data?.message || 'Server Error: Something went wrong on the server.'
    }

    if (data?.message) return data.message
    if (error.message) return error.message
  }

  // Error with message property
  if (error instanceof Error) {
    return error.message
  }

  // Object with message
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
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
