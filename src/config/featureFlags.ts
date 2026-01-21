/**
 * Feature Flags Configuration
 *
 * Central configuration for all feature flags in the application.
 * Modify this file to enable/disable features or adjust rollout percentages.
 *
 * Flag naming convention:
 * - infra:*      - Infrastructure features (logging, events, etc.)
 * - service:*    - Service layer features
 * - component:*  - UI component features
 * - page:*       - Page-level features (usually V2 migrations)
 * - feature:*    - Cross-cutting features
 */

import type { FeatureFlagsConfig } from '@/infrastructure/features/types'

export const featureFlagsConfig: FeatureFlagsConfig = {
  flags: {
    // ─────────────────────────────────────────────────────────────────
    // Infrastructure Features
    // ─────────────────────────────────────────────────────────────────
    'infra:event-bus': {
      name: 'Event Bus',
      description: 'Use event bus for cross-component communication and observability',
      enabled: true,
    },
    'infra:new-logger': {
      name: 'Structured Logger',
      description: 'Use structured logging service with transports',
      enabled: true,
    },
    'infra:performance-monitoring': {
      name: 'Performance Monitoring',
      description: 'Enable performance tracking and metrics collection',
      enabled: true,
    },

    // ─────────────────────────────────────────────────────────────────
    // Service Layer Features
    // ─────────────────────────────────────────────────────────────────
    'service:new-calculations': {
      name: 'Calculation Service',
      description: 'Use refactored calculation service with strategy pattern',
      enabled: true,
    },
    'service:state-machine': {
      name: 'State Machine Workflows',
      description: 'Use state machine for document workflow management',
      enabled: true,
    },
    'service:pricing-service': {
      name: 'Pricing Service',
      description: 'Use new pricing service for price calculations',
      enabled: true,
    },

    // ─────────────────────────────────────────────────────────────────
    // Component Features
    // ─────────────────────────────────────────────────────────────────
    'component:line-items-table': {
      name: 'Line Items Table',
      description: 'Use refactored LineItemsTable component',
      enabled: true,
    },
    'component:document-form-layout': {
      name: 'Document Form Layout',
      description: 'Use new DocumentFormLayout component',
      enabled: true,
    },
    'component:virtual-list': {
      name: 'Virtual List',
      description: 'Use virtual scrolling for large lists',
      enabled: true,
    },

    // ─────────────────────────────────────────────────────────────────
    // Page Migrations (V2)
    // Enable these gradually as pages are migrated
    // ─────────────────────────────────────────────────────────────────
    'page:quotation-form-v2': {
      name: 'Quotation Form V2',
      description: 'Use refactored quotation form page',
      enabled: false, // Enable when migration is ready
      enabledForUsers: [], // Add test user IDs for early testing
    },
    'page:invoice-form-v2': {
      name: 'Invoice Form V2',
      description: 'Use refactored invoice form page',
      enabled: false,
      enabledForUsers: [],
    },
    'page:bill-form-v2': {
      name: 'Bill Form V2',
      description: 'Use refactored bill form page',
      enabled: false,
      enabledForUsers: [],
    },

    // ─────────────────────────────────────────────────────────────────
    // Cross-Cutting Features
    // ─────────────────────────────────────────────────────────────────
    'feature:optimistic-updates': {
      name: 'Optimistic Updates',
      description: 'Enable optimistic UI updates for mutations',
      enabled: false, // Enable after thorough testing
    },
    'feature:prefetching': {
      name: 'Query Prefetching',
      description: 'Prefetch data on hover and route navigation',
      enabled: true,
    },
    'feature:query-caching': {
      name: 'Query Caching',
      description: 'Enable TanStack Query caching with optimized settings',
      enabled: true,
    },
  },
}
