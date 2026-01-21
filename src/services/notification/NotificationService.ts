/**
 * Notification Service
 *
 * Manages notification strategies and provides a unified interface
 * for sending notifications through multiple channels.
 */

import { eventBus } from '@/infrastructure/events'
import { logger } from '@/infrastructure/logger'
import type { NotificationStrategy, NotificationPayload } from './types'

export class NotificationService {
  private strategies: NotificationStrategy[] = []

  /**
   * Add a notification strategy
   */
  addStrategy(strategy: NotificationStrategy): void {
    this.strategies.push(strategy)
    logger.debug('Notification strategy added', { name: strategy.name })
  }

  /**
   * Remove a notification strategy by name
   */
  removeStrategy(name: string): void {
    this.strategies = this.strategies.filter((s) => s.name !== name)
  }

  /**
   * Get all registered strategies
   */
  getStrategies(): NotificationStrategy[] {
    return [...this.strategies]
  }

  /**
   * Get available (enabled) strategies
   */
  getAvailableStrategies(): NotificationStrategy[] {
    return this.strategies.filter((s) => s.isAvailable())
  }

  /**
   * Send notification through all available strategies
   */
  async notify(payload: NotificationPayload): Promise<void> {
    const availableStrategies = this.getAvailableStrategies()

    if (availableStrategies.length === 0) {
      logger.warn('No notification strategies available', { payload })
      return
    }

    // Notify through all available strategies
    const results = await Promise.allSettled(
      availableStrategies.map((strategy) => strategy.notify(payload))
    )

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const strategy = availableStrategies[index]
        logger.error(
          'Notification strategy failed',
          result.reason,
          { strategy: strategy?.name ?? 'unknown' }
        )
      }
    })

    // Emit event
    eventBus.emit('user:action', {
      action: 'notification',
      target: `${payload.level}:${payload.title}`,
    })
  }

  // Convenience methods

  /**
   * Send an info notification
   */
  info(title: string, message: string): Promise<void> {
    return this.notify({ title, message, level: 'info' })
  }

  /**
   * Send a success notification
   */
  success(title: string, message: string): Promise<void> {
    return this.notify({ title, message, level: 'success' })
  }

  /**
   * Send a warning notification
   */
  warning(title: string, message: string): Promise<void> {
    return this.notify({ title, message, level: 'warning' })
  }

  /**
   * Send an error notification
   */
  error(title: string, message: string): Promise<void> {
    return this.notify({ title, message, level: 'error' })
  }
}

// Singleton instance
export const notificationService = new NotificationService()
