/**
 * Workflow Machine Exports
 *
 * All document workflow state machines.
 */

// Quotation
export {
  quotationMachineConfig,
  createQuotationMachine,
  type QuotationContext,
  type QuotationEvent,
} from './quotationMachine'

// Invoice
export {
  invoiceMachineConfig,
  createInvoiceMachine,
  getPaymentTargetState,
  type InvoiceContext,
  type InvoiceEvent,
} from './invoiceMachine'

// Purchase Order
export {
  purchaseOrderMachineConfig,
  createPurchaseOrderMachine,
  type PurchaseOrderContext,
  type PurchaseOrderEvent,
} from './purchaseOrderMachine'
