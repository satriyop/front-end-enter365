/**
 * Feature Flags Types
 *
 * Type definitions for the feature flag system.
 */

export interface FeatureFlag {
  /** Internal name of the feature flag */
  name: string
  /** Human-readable description */
  description: string
  /** Whether the feature is enabled globally */
  enabled: boolean
  /** Percentage of users to roll out to (0-100) */
  rolloutPercentage?: number
  /** Specific user IDs to enable for (overrides rollout percentage) */
  enabledForUsers?: number[]
}

export interface FeatureFlagsConfig {
  /** Map of flag name to flag configuration */
  flags: Record<string, FeatureFlag>
}

export type FeatureFlagName =
  // Infrastructure
  | 'infra:event-bus'
  | 'infra:new-logger'
  | 'infra:performance-monitoring'
  // Services
  | 'service:new-calculations'
  | 'service:state-machine'
  | 'service:pricing-service'
  // Components
  | 'component:line-items-table'
  | 'component:document-form-layout'
  | 'component:virtual-list'
  // Pages
  | 'page:quotation-form-v2'
  | 'page:invoice-form-v2'
  | 'page:bill-form-v2'
  // Features
  | 'feature:optimistic-updates'
  | 'feature:prefetching'
  | 'feature:query-caching'
