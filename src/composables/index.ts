/**
 * Composables Module
 *
 * Centralized exports for all application composables.
 * Each composable provides reusable, encapsulated logic for common patterns.
 *
 * @example
 * ```typescript
 * import {
 *   useDocumentForm,
 *   useDocumentWorkflow,
 *   useResourceList,
 *   useResourceDetail,
 *   useLineItems,
 * } from '@/composables'
 * ```
 */

// Document Form - unified form lifecycle management
export {
  useDocumentForm,
  type DocumentFormConfig,
  type DocumentFormHooks,
  type DocumentFormReturn,
} from './useDocumentForm'

// Document Workflow - status transitions and actions
export {
  useDocumentWorkflow,
  type WorkflowAction,
  type WorkflowConfig,
  type WorkflowMutationHook,
  type WorkflowReturn,
  // Pre-configured workflows
  quotationWorkflow,
  invoiceWorkflow,
  billWorkflow,
  purchaseOrderWorkflow,
  workOrderWorkflow,
  solarProposalWorkflow,
} from './useDocumentWorkflow'

// Resource List - list pages with filtering, pagination, bulk selection
export {
  useResourceList,
  type UseResourceListOptions,
  type UseResourceListReturn,
  type BaseFilters,
  type PaginationMeta,
  type PaginatedResponse,
  type DeleteConfirmation,
  type ResourceId,
} from './useResourceList'

// Resource Detail - detail pages with fetching and actions
export {
  useResourceDetail,
  type ResourceDetailConfig,
  type ResourceDetailHooks,
  type ResourceDetailReturn,
} from './useResourceDetail'

// Line Items - line items management with calculations
export {
  useLineItems,
  type UseLineItemsOptions,
  type UseLineItemsReturn,
} from './useLineItems'
