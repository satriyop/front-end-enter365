/**
 * Toast notification composable
 * Provides a simple API for showing toast notifications
 */

import { ref, inject, provide, type InjectionKey } from 'vue'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  variant: ToastVariant
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ToastOptions {
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContext {
  toasts: ReturnType<typeof ref<Toast[]>>
  add: (variant: ToastVariant, options: ToastOptions) => string
  remove: (id: string) => void
  success: (options: ToastOptions | string) => string
  error: (options: ToastOptions | string) => string
  warning: (options: ToastOptions | string) => string
  info: (options: ToastOptions | string) => string
}

const TOAST_KEY: InjectionKey<ToastContext> = Symbol('toast')

/**
 * Default toast duration in milliseconds
 */
const DEFAULT_DURATION = 5000

/**
 * Generate a unique ID for each toast
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Create the toast context (used by ToastProvider)
 */
export function createToastContext(): ToastContext {
  const toasts = ref<Toast[]>([])

  function add(variant: ToastVariant, options: ToastOptions): string {
    const id = generateId()
    const toast: Toast = {
      id,
      variant,
      title: options.title,
      message: options.message,
      duration: options.duration ?? DEFAULT_DURATION,
      action: options.action,
    }

    toasts.value = [...toasts.value, toast]

    // Auto-remove after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        remove(id)
      }, toast.duration)
    }

    return id
  }

  function remove(id: string): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function normalizeOptions(options: ToastOptions | string): ToastOptions {
    return typeof options === 'string' ? { message: options } : options
  }

  function success(options: ToastOptions | string): string {
    return add('success', normalizeOptions(options))
  }

  function error(options: ToastOptions | string): string {
    return add('error', normalizeOptions(options))
  }

  function warning(options: ToastOptions | string): string {
    return add('warning', normalizeOptions(options))
  }

  function info(options: ToastOptions | string): string {
    return add('info', normalizeOptions(options))
  }

  return {
    toasts,
    add,
    remove,
    success,
    error,
    warning,
    info,
  }
}

/**
 * Provide toast context to the component tree
 */
export function provideToast(context: ToastContext): void {
  provide(TOAST_KEY, context)
}

/**
 * Use toast notifications in any component
 *
 * @example
 * ```ts
 * const toast = useToast()
 *
 * // Simple message
 * toast.success('Data saved successfully!')
 *
 * // With options
 * toast.error({
 *   title: 'Error',
 *   message: 'Failed to save data',
 *   action: {
 *     label: 'Retry',
 *     onClick: () => saveData()
 *   }
 * })
 * ```
 */
export function useToast(): Omit<ToastContext, 'toasts'> {
  const context = inject(TOAST_KEY)

  if (!context) {
    throw new Error('useToast() must be used within a ToastProvider')
  }

  return {
    add: context.add,
    remove: context.remove,
    success: context.success,
    error: context.error,
    warning: context.warning,
    info: context.info,
  }
}

/**
 * Internal hook for ToastProvider to access all context including toasts
 */
export function useToastContext(): ToastContext {
  const context = inject(TOAST_KEY)

  if (!context) {
    throw new Error('useToastContext() must be used within a ToastProvider')
  }

  return context
}
