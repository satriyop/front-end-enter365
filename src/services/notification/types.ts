/**
 * Notification Service Types
 *
 * Defines interfaces for the notification strategy pattern.
 */

/**
 * Notification severity levels
 */
export type NotificationLevel = 'info' | 'success' | 'warning' | 'error'

/**
 * Notification payload
 */
export interface NotificationPayload {
  /** Notification title */
  title: string
  /** Notification message */
  message: string
  /** Severity level */
  level: NotificationLevel
  /** Optional action button */
  action?: {
    label: string
    onClick: () => void
  }
  /** Duration in milliseconds (0 = persistent) */
  duration?: number
}

/**
 * Notification strategy interface
 */
export interface NotificationStrategy {
  /** Strategy name */
  readonly name: string
  /** Check if strategy is available */
  isAvailable(): boolean
  /** Send a notification */
  notify(payload: NotificationPayload): Promise<void>
}

/**
 * Browser notification permission status
 */
export type NotificationPermission = 'default' | 'granted' | 'denied'
