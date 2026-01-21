# Phase 9: Migration & Cleanup

## Overview

This final phase provides a safe, incremental migration strategy to move from the current codebase to the refactored architecture. We use feature flags, parallel implementations, and careful deprecation to minimize risk.

**Prerequisites:** Phases 1-8 substantially complete

**Deliverables:**
1. Feature flag system
2. Incremental migration strategy
3. Deprecation workflow
4. Documentation updates
5. Cleanup checklist

---

## 9.1 Feature Flag System

### Why Feature Flags?

- **Safe rollout:** Enable new code for testing without affecting all users
- **Quick rollback:** Disable problematic code instantly
- **A/B testing:** Compare old vs new implementations
- **Gradual migration:** Migrate one page/feature at a time

### Implementation

```typescript
// src/infrastructure/features/types.ts
export interface FeatureFlag {
  name: string
  description: string
  enabled: boolean
  rolloutPercentage?: number
  enabledForUsers?: number[]
}

export interface FeatureFlagsConfig {
  flags: Record<string, FeatureFlag>
}
```

```typescript
// src/infrastructure/features/FeatureFlags.ts
import { ref, computed, readonly } from 'vue'
import type { FeatureFlag, FeatureFlagsConfig } from './types'
import { logger } from '@/infrastructure/logger'

class FeatureFlagService {
  private flags = ref<Map<string, FeatureFlag>>(new Map())
  private userId: number | null = null

  /**
   * Initialize with configuration
   */
  init(config: FeatureFlagsConfig, userId?: number): void {
    this.userId = userId ?? null

    for (const [name, flag] of Object.entries(config.flags)) {
      this.flags.value.set(name, flag)
    }

    logger.info('Feature flags initialized', {
      count: this.flags.value.size,
      userId: this.userId,
    })
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(flagName: string): boolean {
    const flag = this.flags.value.get(flagName)

    if (!flag) {
      logger.warn('Unknown feature flag', { flagName })
      return false
    }

    // Check if disabled globally
    if (!flag.enabled) {
      return false
    }

    // Check user-specific enablement
    if (flag.enabledForUsers && this.userId) {
      if (flag.enabledForUsers.includes(this.userId)) {
        return true
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      // Simple hash-based rollout
      const hash = this.hashUserId(this.userId ?? 0, flagName)
      return hash < flag.rolloutPercentage
    }

    return flag.enabled
  }

  /**
   * Get all flags (for debugging)
   */
  getAllFlags(): Record<string, boolean> {
    const result: Record<string, boolean> = {}
    for (const [name] of this.flags.value) {
      result[name] = this.isEnabled(name)
    }
    return result
  }

  /**
   * Override a flag (for testing)
   */
  override(flagName: string, enabled: boolean): void {
    const flag = this.flags.value.get(flagName)
    if (flag) {
      this.flags.value.set(flagName, { ...flag, enabled })
    }
  }

  private hashUserId(userId: number, flagName: string): number {
    const str = `${userId}-${flagName}`
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i)
      hash = hash & hash
    }
    return Math.abs(hash % 100)
  }
}

export const featureFlags = new FeatureFlagService()
```

### Feature Flags Configuration

```typescript
// src/config/featureFlags.ts
import type { FeatureFlagsConfig } from '@/infrastructure/features/types'

export const featureFlagsConfig: FeatureFlagsConfig = {
  flags: {
    // Infrastructure
    'infra:event-bus': {
      name: 'Event Bus',
      description: 'Use new event bus for observability',
      enabled: true,
    },
    'infra:new-logger': {
      name: 'New Logger',
      description: 'Use structured logging service',
      enabled: true,
    },

    // Services
    'service:new-calculations': {
      name: 'New Calculation Service',
      description: 'Use refactored calculation service with strategies',
      enabled: false,
      rolloutPercentage: 10, // 10% rollout
    },
    'service:state-machine': {
      name: 'State Machine Workflows',
      description: 'Use state machine for document workflows',
      enabled: false,
    },

    // Components
    'component:line-items-table': {
      name: 'New Line Items Table',
      description: 'Use refactored LineItemsTable component',
      enabled: false,
    },
    'component:document-form-layout': {
      name: 'Document Form Layout',
      description: 'Use new DocumentFormLayout component',
      enabled: false,
    },

    // Pages
    'page:quotation-form-v2': {
      name: 'Quotation Form V2',
      description: 'Use refactored quotation form page',
      enabled: false,
      enabledForUsers: [1, 2], // Admin users only
    },
    'page:invoice-form-v2': {
      name: 'Invoice Form V2',
      description: 'Use refactored invoice form page',
      enabled: false,
    },

    // Features
    'feature:optimistic-updates': {
      name: 'Optimistic Updates',
      description: 'Enable optimistic UI updates',
      enabled: false,
    },
    'feature:prefetching': {
      name: 'Prefetching',
      description: 'Enable query prefetching',
      enabled: true,
    },
  },
}
```

### Vue Composable

```typescript
// src/infrastructure/features/useFeatureFlag.ts
import { computed } from 'vue'
import { featureFlags } from './FeatureFlags'

export function useFeatureFlag(flagName: string) {
  const isEnabled = computed(() => featureFlags.isEnabled(flagName))

  return {
    isEnabled,
    flagName,
  }
}

export function useFeatureFlags() {
  return {
    isEnabled: (flagName: string) => featureFlags.isEnabled(flagName),
    getAllFlags: () => featureFlags.getAllFlags(),
    override: (flagName: string, enabled: boolean) => featureFlags.override(flagName, enabled),
  }
}
```

### Usage in Components

```vue
<script setup lang="ts">
import { useFeatureFlag } from '@/infrastructure/features'

const { isEnabled: useNewForm } = useFeatureFlag('page:quotation-form-v2')
</script>

<template>
  <QuotationFormV2 v-if="useNewForm" />
  <QuotationFormLegacy v-else />
</template>
```

---

## 9.2 Incremental Migration Strategy

### Migration Order

```
Phase 1: Infrastructure (Foundation)
└── Event Bus, Logger, Error Types, Container
    └── Low risk, enables observability

Phase 2: Services
└── Calculation Service, Line Items Service, Status Service
    └── Can be tested in isolation

Phase 3: Composables
└── useDocumentForm, useLineItems, useDocumentWorkflow
    └── Higher-level abstractions

Phase 4: Components
└── LineItemsTable, DocumentFormLayout, DocumentDetailLayout
    └── Reusable UI components

Phase 5: Pages (one at a time)
└── QuotationFormPage → InvoiceFormPage → BillFormPage → ...
    └── Feature flagged, gradual rollout

Phase 6: Cleanup
└── Remove legacy code, update documentation
```

### Migration Checklist Template

```markdown
## Page Migration Checklist: [Page Name]

### Pre-Migration
- [ ] Identify all dependencies
- [ ] Create feature flag
- [ ] Set up parallel implementation file
- [ ] Write tests for new implementation

### Migration Steps
- [ ] Create V2 page component
- [ ] Migrate to useDocumentForm composable
- [ ] Migrate to useLineItems composable
- [ ] Use new LineItemsTable component
- [ ] Use DocumentFormLayout
- [ ] Verify all functionality works

### Testing
- [ ] Manual testing with feature flag enabled
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Performance acceptable

### Rollout
- [ ] Enable for test users (10% rollout)
- [ ] Monitor for errors
- [ ] Increase to 50% rollout
- [ ] Monitor for errors
- [ ] Enable for all users (100%)

### Cleanup
- [ ] Remove feature flag
- [ ] Remove legacy page component
- [ ] Update imports
- [ ] Update documentation
```

---

## 9.3 Parallel Implementation Pattern

### File Structure

```
src/pages/quotations/
├── QuotationFormPage.vue         # Legacy (keep until migration complete)
├── QuotationFormPageV2.vue       # New implementation
└── index.ts                      # Feature-flagged export
```

### Feature-Flagged Export

```typescript
// src/pages/quotations/index.ts
import { featureFlags } from '@/infrastructure/features'

export const QuotationFormPage = featureFlags.isEnabled('page:quotation-form-v2')
  ? () => import('./QuotationFormPageV2.vue')
  : () => import('./QuotationFormPage.vue')

export const QuotationListPage = () => import('./QuotationListPage.vue')
export const QuotationDetailPage = () => import('./QuotationDetailPage.vue')
```

### Router Integration

```typescript
// src/router/modules/sales.ts
import { QuotationFormPage } from '@/pages/quotations'

const routes = [
  {
    path: 'quotations/new',
    name: 'quotation-new',
    component: QuotationFormPage, // Automatically uses V2 if flag enabled
  },
]
```

---

## 9.4 Deprecation Workflow

### Deprecation Notice Pattern

```typescript
// src/utils/deprecation.ts
import { logger } from '@/infrastructure/logger'

const deprecationWarnings = new Set<string>()

export function deprecationWarning(
  oldName: string,
  newName: string,
  removeIn: string
): void {
  const key = `${oldName}->${newName}`

  // Only warn once per session
  if (deprecationWarnings.has(key)) return
  deprecationWarnings.add(key)

  logger.warn(`DEPRECATED: ${oldName} is deprecated. Use ${newName} instead. Will be removed in ${removeIn}.`)

  if (import.meta.env.DEV) {
    console.warn(
      `%c DEPRECATED %c ${oldName} → ${newName} (remove in ${removeIn})`,
      'background: orange; color: white; padding: 2px 4px; border-radius: 2px;',
      ''
    )
  }
}
```

### Usage

```typescript
// Old composable that wraps new one
export function useQuotationCalculations() {
  deprecationWarning(
    'useQuotationCalculations',
    'useCalculation from @/services/calculation',
    'v2.0.0'
  )

  // Delegate to new implementation
  return useCalculation(/* ... */)
}
```

### Deprecation Timeline

| Version | Action |
|---------|--------|
| v1.5.0 | Add deprecation warnings |
| v1.6.0 | Increase warning frequency |
| v1.7.0 | Log usage metrics |
| v2.0.0 | Remove deprecated code |

---

## 9.5 Documentation Updates

### Required Documentation

1. **Migration Guide**
   - How to migrate a page to new architecture
   - Common pitfalls and solutions
   - Before/after examples

2. **Architecture Decision Records (ADRs)**
   - Why we chose custom state machine over XState
   - Why we use strategy pattern for calculations
   - Why we built custom event bus

3. **Component Documentation**
   - Storybook or similar for new components
   - Props, events, slots documentation
   - Usage examples

4. **API Documentation**
   - Service interfaces
   - Composable return types
   - Event catalog

### Documentation Template

```markdown
# [Component/Service Name]

## Overview
Brief description of what this does.

## Installation
```typescript
import { something } from '@/path'
```

## Basic Usage
```vue
<template>
  <!-- Example -->
</template>
```

## Props / Options
| Name | Type | Default | Description |
|------|------|---------|-------------|
| prop1 | string | - | Description |

## Events
| Name | Payload | Description |
|------|---------|-------------|
| change | `{ value: T }` | Emitted when value changes |

## Examples

### Example 1: Basic
```vue
<!-- Code -->
```

### Example 2: Advanced
```vue
<!-- Code -->
```

## Migration from Legacy
If migrating from the old implementation:
1. Step 1
2. Step 2
3. Step 3
```

---

## 9.6 Cleanup Checklist

### Code Cleanup

```markdown
## Final Cleanup Checklist

### Remove Legacy Code
- [ ] Remove all `*Legacy.vue` components
- [ ] Remove all `*V1.ts` files
- [ ] Remove feature flags for completed migrations
- [ ] Remove deprecation warnings for removed code

### Remove Unused Dependencies
- [ ] Run `npm prune`
- [ ] Remove unused imports
- [ ] Check for orphaned files

### Update Imports
- [ ] Update barrel exports
- [ ] Remove aliased imports to legacy code
- [ ] Update documentation links

### Verify Build
- [ ] TypeScript compiles without errors
- [ ] ESLint passes
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Bundle size acceptable

### Final Testing
- [ ] Full regression test
- [ ] Performance benchmark
- [ ] Accessibility audit
```

### Files to Delete After Migration

```
# Legacy files to remove after migration complete

# Old composables
src/composables/useQuotationForm.ts  # Replaced by useDocumentForm
src/composables/useInvoiceForm.ts    # Replaced by useDocumentForm
src/composables/useBillForm.ts       # Replaced by useDocumentForm

# Old utilities
src/utils/calculateTotals.ts         # Replaced by CalculationService
src/utils/getStatusColor.ts          # Replaced by StatusService

# Old components
src/components/QuotationLineItems.vue  # Replaced by LineItemsTable
src/components/InvoiceLineItems.vue    # Replaced by LineItemsTable

# Legacy page versions
src/pages/quotations/QuotationFormPage.vue  # Keep V2, remove original
```

---

## 9.7 Rollback Plan

### If Something Goes Wrong

1. **Feature Flag Rollback**
   ```typescript
   // Disable problematic feature instantly
   featureFlags.override('page:quotation-form-v2', false)
   ```

2. **Git Revert**
   ```bash
   # If merge was recent
   git revert <commit-hash>
   ```

3. **Environment Variable Override**
   ```typescript
   // .env
   VITE_DISABLE_NEW_FEATURES=true
   ```

4. **Monitoring Alerts**
   - Set up Sentry alerts for increased error rates
   - Monitor performance metrics
   - Track user feedback

### Rollback Criteria

Rollback if:
- Error rate increases > 5%
- P95 latency increases > 50%
- Critical functionality broken
- Data integrity issues

---

## 9.8 Success Metrics

### Code Quality Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Lines of code in form pages | ~500 avg | ~100 avg |
| Code duplication (%) | ~40% | < 10% |
| TypeScript coverage | Partial | 100% |
| `as any` occurrences | ~50 | 0 |

### Test Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Test coverage (%) | ~5% | > 70% |
| Unit tests | ~20 | > 200 |
| Component tests | ~5 | > 50 |
| Integration tests | 0 | > 20 |

### Performance Metrics

| Metric | Before | Target |
|--------|--------|--------|
| Initial bundle size | ? | < 150 KB |
| LCP | ? | < 2.5s |
| TTI | ? | < 3s |

### Developer Experience

| Metric | Before | Target |
|--------|--------|--------|
| Time to add new form page | 4+ hours | < 1 hour |
| Time to understand form code | 30+ min | < 10 min |
| Onboarding time for new devs | ? | 50% reduction |

---

## 9.9 Final Checklist

```markdown
## Migration Complete Checklist

### Architecture
- [ ] Event bus operational and logging events
- [ ] All services using DI container
- [ ] State machines for all document workflows
- [ ] Strategy pattern for calculations, exports

### Code Quality
- [ ] No `as any` in codebase
- [ ] All code uses new composables
- [ ] All pages use new layouts
- [ ] All line items use LineItemsTable

### Testing
- [ ] > 70% test coverage
- [ ] All critical paths tested
- [ ] E2E tests for key workflows

### Performance
- [ ] Bundle size targets met
- [ ] Core Web Vitals green
- [ ] No performance regressions

### Documentation
- [ ] Architecture docs updated
- [ ] Component docs complete
- [ ] Migration guide complete
- [ ] ADRs documented

### Cleanup
- [ ] All legacy code removed
- [ ] All feature flags removed
- [ ] All deprecation warnings removed
- [ ] Dependencies pruned
```

---

## Summary

This 9-phase refactoring plan transforms Enter365's frontend from a functional but duplicative codebase into a **clean, testable, extensible** application. Key achievements:

1. **SOLID Principles:** Single responsibility services, open for extension via strategies
2. **Strategy Pattern:** Pluggable calculations, exports, notifications
3. **State Machine:** Formal document workflow management
4. **Event-Driven:** Full observability with event bus
5. **Dependency Injection:** Testable, mockable services
6. **~70% code reduction** in form pages
7. **>70% test coverage**
8. **Modern bundle optimization**

The incremental migration strategy with feature flags ensures safe rollout with easy rollback capability.

---

*Plan completed. Ready for implementation.*
