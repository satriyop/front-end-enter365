/**
 * Feature Flag Composables
 *
 * Vue composables for using feature flags in components.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useFeatureFlag } from '@/infrastructure'
 *
 * const { isEnabled: useNewForm } = useFeatureFlag('page:quotation-form-v2')
 * </script>
 *
 * <template>
 *   <NewQuotationForm v-if="useNewForm" />
 *   <LegacyQuotationForm v-else />
 * </template>
 * ```
 */

import { computed, type ComputedRef } from 'vue'
import { featureFlags } from './FeatureFlags'
import type { FeatureFlagName } from './types'

/**
 * Check if a specific feature flag is enabled
 */
export function useFeatureFlag(flagName: FeatureFlagName | string): {
  /** Whether the feature is enabled */
  isEnabled: ComputedRef<boolean>
  /** The flag name for reference */
  flagName: string
} {
  const isEnabled = computed(() => featureFlags.isEnabled(flagName))

  return {
    isEnabled,
    flagName,
  }
}

/**
 * Access to all feature flag operations
 */
export function useFeatureFlags(): {
  /** Check if a feature is enabled */
  isEnabled: (flagName: FeatureFlagName | string) => boolean
  /** Get all flags with their current states */
  getAllFlags: () => Record<string, boolean>
  /** Override a flag value (for testing/admin) */
  override: (flagName: FeatureFlagName | string, enabled: boolean) => void
  /** Check if feature flags have been initialized */
  isInitialized: () => boolean
} {
  return {
    isEnabled: (flagName) => featureFlags.isEnabled(flagName),
    getAllFlags: () => featureFlags.getAllFlags(),
    override: (flagName, enabled) => featureFlags.override(flagName, enabled),
    isInitialized: () => featureFlags.isInitialized(),
  }
}

/**
 * Conditional component loader based on feature flag
 *
 * @example
 * ```ts
 * const QuotationForm = featureFlagComponent(
 *   'page:quotation-form-v2',
 *   () => import('./QuotationFormV2.vue'),
 *   () => import('./QuotationForm.vue')
 * )
 * ```
 */
export function featureFlagComponent<T>(
  flagName: FeatureFlagName | string,
  newComponent: () => Promise<T>,
  legacyComponent: () => Promise<T>
): () => Promise<T> {
  return () => {
    if (featureFlags.isEnabled(flagName)) {
      return newComponent()
    }
    return legacyComponent()
  }
}
