/**
 * Browser Notification Strategy
 *
 * Uses the Web Notification API for system-level notifications.
 * Requires user permission to function.
 */

import type { NotificationStrategy, NotificationPayload } from '../types'

export class BrowserNotificationStrategy implements NotificationStrategy {
  readonly name = 'Browser Notification'

  isAvailable(): boolean {
    return 'Notification' in window && Notification.permission === 'granted'
  }

  /**
   * Check if browser notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied'
    }
    return Notification.permission
  }

  /**
   * Request permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch {
      return false
    }
  }

  async notify(payload: NotificationPayload): Promise<void> {
    if (!this.isAvailable()) {
      return
    }

    const iconMap: Record<string, string> = {
      info: '/icons/info.png',
      success: '/icons/success.png',
      warning: '/icons/warning.png',
      error: '/icons/error.png',
    }

    const notification = new Notification(payload.title, {
      body: payload.message,
      icon: iconMap[payload.level] ?? '/logo.png',
      tag: `${payload.level}-${Date.now()}`,
      requireInteraction: payload.level === 'error',
    })

    // Handle click action
    if (payload.action) {
      notification.onclick = () => {
        payload.action!.onClick()
        notification.close()
        window.focus()
      }
    }

    // Auto-close after duration (if specified and not persistent)
    if (payload.duration && payload.duration > 0) {
      setTimeout(() => notification.close(), payload.duration)
    }
  }
}
