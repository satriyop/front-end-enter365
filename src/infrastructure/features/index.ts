/**
 * Feature Flags Module
 *
 * Provides a feature flag system for safe, incremental rollouts.
 *
 * @example
 * ```ts
 * // Initialize (in main.ts)
 * import { featureFlags } from '@/infrastructure/features'
 * import { featureFlagsConfig } from '@/config/featureFlags'
 *
 * featureFlags.init(featureFlagsConfig, currentUserId)
 *
 * // Use in components
 * import { useFeatureFlag } from '@/infrastructure/features'
 *
 * const { isEnabled: useNewForm } = useFeatureFlag('page:quotation-form-v2')
 * ```
 */

export { featureFlags } from './FeatureFlags'
export { useFeatureFlag, useFeatureFlags, featureFlagComponent } from './useFeatureFlag'
export type { FeatureFlag, FeatureFlagsConfig, FeatureFlagName } from './types'
