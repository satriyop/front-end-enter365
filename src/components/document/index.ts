/**
 * Document Components
 *
 * Reusable components for document pages (forms, details, lists).
 * These components work with the composables from @/composables.
 *
 * @example
 * ```typescript
 * import {
 *   DocumentFormLayout,
 *   DocumentDetailLayout,
 *   ListPageContainer,
 *   LineItemsTable,
 *   TotalsSummary,
 * } from '@/components/document'
 * ```
 */

export { default as DocumentFormLayout } from './DocumentFormLayout.vue'
export { default as DocumentDetailLayout } from './DocumentDetailLayout.vue'
export { default as ListPageContainer } from './ListPageContainer.vue'
export { default as LineItemsTable } from './LineItemsTable.vue'
export { default as TotalsSummary } from './TotalsSummary.vue'
export { default as WorkflowActions } from './WorkflowActions.vue'

// Types
export type { WorkflowAction } from './WorkflowActions.vue'
