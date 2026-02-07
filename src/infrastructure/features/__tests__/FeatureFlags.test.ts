/**
 * FeatureFlags Tests
 *
 * Tests the FeatureFlagService: initialization, isEnabled logic,
 * percentage rollouts, user-specific enablement, overrides, and reset.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { FeatureFlagsConfig, FeatureFlag } from '../types'

// We need a fresh instance for each test, but the module exports a singleton.
// We'll import the module and use its methods, resetting state via init().

import { featureFlags } from '../FeatureFlags'

function createFlag(overrides: Partial<FeatureFlag> = {}): FeatureFlag {
  return {
    name: 'test-flag',
    description: 'Test flag',
    enabled: true,
    ...overrides,
  }
}

function createConfig(flags: Record<string, FeatureFlag>): FeatureFlagsConfig {
  return { flags }
}

describe('FeatureFlagService', () => {
  const baseConfig = createConfig({
    'feature:enabled': createFlag({ name: 'feature:enabled', enabled: true }),
    'feature:disabled': createFlag({ name: 'feature:disabled', enabled: false }),
    'feature:rollout-50': createFlag({
      name: 'feature:rollout-50',
      enabled: true,
      rolloutPercentage: 50,
    }),
    'feature:rollout-100': createFlag({
      name: 'feature:rollout-100',
      enabled: true,
      rolloutPercentage: 100,
    }),
    'feature:rollout-0': createFlag({
      name: 'feature:rollout-0',
      enabled: true,
      rolloutPercentage: 0,
    }),
    'feature:user-specific': createFlag({
      name: 'feature:user-specific',
      enabled: true,
      rolloutPercentage: 0, // disabled for all except whitelisted users
      enabledForUsers: [42, 99],
    }),
    'feature:user-and-rollout': createFlag({
      name: 'feature:user-and-rollout',
      enabled: true,
      rolloutPercentage: 10,
      enabledForUsers: [1],
    }),
  })

  beforeEach(() => {
    featureFlags.init(baseConfig, 1)
  })

  describe('initialization', () => {
    it('marks as initialized after init()', () => {
      expect(featureFlags.isInitialized()).toBe(true)
    })

    it('loads all flags', () => {
      const all = featureFlags.getAllFlags()

      expect(Object.keys(all)).toHaveLength(7)
    })
  })

  describe('isEnabled', () => {
    it('returns true for enabled flag', () => {
      expect(featureFlags.isEnabled('feature:enabled')).toBe(true)
    })

    it('returns false for disabled flag', () => {
      expect(featureFlags.isEnabled('feature:disabled')).toBe(false)
    })

    it('returns false for unknown flag', () => {
      expect(featureFlags.isEnabled('feature:nonexistent')).toBe(false)
    })
  })

  describe('percentage rollouts', () => {
    it('returns true for 100% rollout', () => {
      expect(featureFlags.isEnabled('feature:rollout-100')).toBe(true)
    })

    it('returns false for 0% rollout', () => {
      expect(featureFlags.isEnabled('feature:rollout-0')).toBe(false)
    })

    it('is deterministic for same user and flag', () => {
      featureFlags.init(baseConfig, 42)

      const result1 = featureFlags.isEnabled('feature:rollout-50')
      const result2 = featureFlags.isEnabled('feature:rollout-50')

      expect(result1).toBe(result2)
    })

    it('may differ for different users', () => {
      // Test with many user IDs to ensure the hash produces both outcomes
      const results = new Set<boolean>()

      for (let userId = 1; userId <= 100; userId++) {
        featureFlags.init(baseConfig, userId)
        results.add(featureFlags.isEnabled('feature:rollout-50'))
      }

      // With 50% rollout and 100 users, we should get both true and false
      expect(results.size).toBe(2)
    })
  })

  describe('user-specific enablement', () => {
    it('enables for whitelisted user even when rollout is 0%', () => {
      featureFlags.init(baseConfig, 42)

      expect(featureFlags.isEnabled('feature:user-specific')).toBe(true)
    })

    it('enables for another whitelisted user', () => {
      featureFlags.init(baseConfig, 99)

      expect(featureFlags.isEnabled('feature:user-specific')).toBe(true)
    })

    it('remains disabled for non-whitelisted user', () => {
      featureFlags.init(baseConfig, 1)

      expect(featureFlags.isEnabled('feature:user-specific')).toBe(false)
    })

    it('user-specific takes priority over rollout percentage', () => {
      // User 1 is whitelisted, rollout is only 10%
      featureFlags.init(baseConfig, 1)

      expect(featureFlags.isEnabled('feature:user-and-rollout')).toBe(true)
    })

    it('enabled: false is a global kill switch (overrides user whitelist)', () => {
      const config = createConfig({
        'feature:killed': createFlag({
          name: 'feature:killed',
          enabled: false,
          enabledForUsers: [1, 42],
        }),
      })
      featureFlags.init(config, 42)

      expect(featureFlags.isEnabled('feature:killed')).toBe(false)
    })
  })

  describe('setUserId', () => {
    it('changes the active user', () => {
      featureFlags.init(baseConfig, 1)
      expect(featureFlags.isEnabled('feature:user-specific')).toBe(false)

      featureFlags.setUserId(42)
      expect(featureFlags.isEnabled('feature:user-specific')).toBe(true)
    })

    it('handles null user', () => {
      featureFlags.setUserId(null)

      // User-specific features should not be enabled for null user
      expect(featureFlags.isEnabled('feature:user-specific')).toBe(false)
    })
  })

  describe('getFlag', () => {
    it('returns flag configuration', () => {
      const flag = featureFlags.getFlag('feature:enabled')

      expect(flag).toBeDefined()
      expect(flag!.name).toBe('feature:enabled')
      expect(flag!.enabled).toBe(true)
    })

    it('returns undefined for unknown flag', () => {
      expect(featureFlags.getFlag('feature:nonexistent')).toBeUndefined()
    })
  })

  describe('getAllFlags', () => {
    it('returns all flags with their enabled state', () => {
      const flags = featureFlags.getAllFlags()

      expect(flags['feature:enabled']).toBe(true)
      expect(flags['feature:disabled']).toBe(false)
    })
  })

  describe('override', () => {
    it('overrides a flag value', () => {
      expect(featureFlags.isEnabled('feature:disabled')).toBe(false)

      featureFlags.override('feature:disabled', true)

      expect(featureFlags.isEnabled('feature:disabled')).toBe(true)
    })

    it('can disable an enabled flag', () => {
      expect(featureFlags.isEnabled('feature:enabled')).toBe(true)

      featureFlags.override('feature:enabled', false)

      expect(featureFlags.isEnabled('feature:enabled')).toBe(false)
    })

    it('does nothing for unknown flag', () => {
      // Should not throw
      featureFlags.override('feature:nonexistent', true)

      expect(featureFlags.isEnabled('feature:nonexistent')).toBe(false)
    })
  })

  describe('reset', () => {
    it('resets flag to original config value', () => {
      featureFlags.override('feature:disabled', true)
      expect(featureFlags.isEnabled('feature:disabled')).toBe(true)

      featureFlags.reset('feature:disabled', baseConfig)

      expect(featureFlags.isEnabled('feature:disabled')).toBe(false)
    })

    it('does nothing for unknown flag in config', () => {
      // Should not throw
      featureFlags.reset('feature:nonexistent', baseConfig)
    })
  })
})
