/**
 * Feature Flags Service
 *
 * Manages feature flags for safe, incremental rollouts.
 * Supports global toggles, percentage-based rollouts, and user-specific enablement.
 *
 * @example
 * ```ts
 * import { featureFlags } from '@/infrastructure'
 *
 * // Initialize with configuration
 * featureFlags.init(config, userId)
 *
 * // Check if feature is enabled
 * if (featureFlags.isEnabled('page:quotation-form-v2')) {
 *   // Use new implementation
 * }
 * ```
 */

import { ref } from 'vue'
import type { FeatureFlag, FeatureFlagsConfig, FeatureFlagName } from './types'
import { logger } from '../logger'

class FeatureFlagService {
  private flags = ref<Map<string, FeatureFlag>>(new Map())
  private userId: number | null = null
  private initialized = false

  /**
   * Initialize with configuration
   */
  init(config: FeatureFlagsConfig, userId?: number): void {
    this.userId = userId ?? null

    for (const [name, flag] of Object.entries(config.flags)) {
      this.flags.value.set(name, flag)
    }

    this.initialized = true

    logger.info('Feature flags initialized', {
      count: this.flags.value.size,
      userId: this.userId,
    })
  }

  /**
   * Update the current user ID (e.g., after login)
   */
  setUserId(userId: number | null): void {
    this.userId = userId
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flagName: FeatureFlagName | string): boolean {
    const flag = this.flags.value.get(flagName)

    if (!flag) {
      if (this.initialized) {
        logger.warn('Unknown feature flag', { flagName })
      }
      return false
    }

    // Check if disabled globally
    if (!flag.enabled) {
      return false
    }

    // Check user-specific enablement (takes priority over rollout)
    if (flag.enabledForUsers && this.userId !== null) {
      if (flag.enabledForUsers.includes(this.userId)) {
        return true
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(this.userId ?? 0, flagName)
      return hash < flag.rolloutPercentage
    }

    return flag.enabled
  }

  /**
   * Get all flags with their current enabled state
   */
  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {}
    for (const [name] of this.flags.value) {
      result[name] = this.isEnabled(name)
    }
    return result
  }

  /**
   * Get the raw flag configuration
   */
  getFlag(flagName: FeatureFlagName | string): FeatureFlag | undefined {
    return this.flags.value.get(flagName)
  }

  /**
   * Override a flag value (useful for testing or admin overrides)
   */
  override(flagName: FeatureFlagName | string, enabled: boolean): void {
    const flag = this.flags.value.get(flagName)
    if (flag) {
      this.flags.value.set(flagName, { ...flag, enabled })
      logger.info('Feature flag overridden', { flagName, enabled })
    } else {
      logger.warn('Cannot override unknown flag', { flagName })
    }
  }

  /**
   * Reset a flag to its original value from config
   */
  reset(flagName: FeatureFlagName | string, config: FeatureFlagsConfig): void {
    const originalFlag = config.flags[flagName]
    if (originalFlag) {
      this.flags.value.set(flagName, originalFlag)
      logger.info('Feature flag reset', { flagName })
    }
  }

  /**
   * Check if flags have been initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Generate a deterministic hash for percentage rollouts
   * Ensures the same user always gets the same result for a given flag
   */
  private hashUserId(userId: number, flagName: string): number {
    const str = `${userId}-${flagName}`
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash % 100)
  }
}

/**
 * Singleton feature flag service instance
 */
export const featureFlags = new FeatureFlagService()
