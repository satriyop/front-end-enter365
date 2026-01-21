/**
 * useDocumentWorkflow Module
 */

export { useDocumentWorkflow } from './useDocumentWorkflow'
export type {
  WorkflowAction,
  WorkflowConfig,
  WorkflowMutationHook,
  WorkflowReturn,
} from './types'

// Pre-configured workflows
export {
  quotationWorkflow,
  invoiceWorkflow,
  billWorkflow,
  purchaseOrderWorkflow,
  workOrderWorkflow,
  solarProposalWorkflow,
} from './workflows'
