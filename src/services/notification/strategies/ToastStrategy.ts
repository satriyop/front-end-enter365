/**
 * Toast Notification Strategy
 *
 * Uses the app's toast system for in-app notifications.
 * Always available as the default notification method.
 */

import type { NotificationStrategy, NotificationPayload } from '../types'

// Import toast functions directly to avoid circular dependency with useToast
let toastFunctions: {
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
} | null = null

export class ToastStrategy implements NotificationStrategy {
  readonly name = 'Toast'

  isAvailable(): boolean {
    return true // Always available
  }

  /**
   * Set the toast functions (called during app initialization)
   */
  setToastFunctions(functions: typeof toastFunctions): void {
    toastFunctions = functions
  }

  async notify(payload: NotificationPayload): Promise<void> {
    if (!toastFunctions) {
      // Fallback to console if toast not initialized
      console.log(`[${payload.level.toUpperCase()}] ${payload.title}: ${payload.message}`)
      return
    }

    const message = payload.title ? `${payload.title}: ${payload.message}` : payload.message

    switch (payload.level) {
      case 'success':
        toastFunctions.success(message)
        break
      case 'warning':
        toastFunctions.warning(message)
        break
      case 'error':
        toastFunctions.error(message)
        break
      default:
        toastFunctions.info(message)
    }
  }
}
