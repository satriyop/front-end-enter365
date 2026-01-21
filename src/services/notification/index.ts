/**
 * Notification Service
 *
 * Strategy pattern implementation for notifications.
 * Supports toast and browser notification strategies.
 */

// Types
export * from './types'

// Service
export { NotificationService, notificationService } from './NotificationService'

// Strategies
export { ToastStrategy } from './strategies/ToastStrategy'
export { BrowserNotificationStrategy } from './strategies/BrowserNotificationStrategy'

// Bootstrap: Register default strategies
import { notificationService } from './NotificationService'
import { ToastStrategy } from './strategies/ToastStrategy'
import { BrowserNotificationStrategy } from './strategies/BrowserNotificationStrategy'

// Toast is always available
const toastStrategy = new ToastStrategy()
notificationService.addStrategy(toastStrategy)

// Browser notifications (user must grant permission)
const browserStrategy = new BrowserNotificationStrategy()
notificationService.addStrategy(browserStrategy)

// Export the toast strategy instance for initialization
export { toastStrategy, browserStrategy }
