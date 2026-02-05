/**
 * Test Data Factories
 *
 * Provides factory functions for creating test data.
 * Each factory generates realistic data with auto-incrementing IDs.
 */

export * from './contactFactory'
export * from './productFactory'
export * from './lineItemFactory'
// Re-export with renamed Status to avoid conflict
export type { Quotation, LabelValue, Status as QuotationStatus } from './quotationFactory'
export {
  createQuotation,
  createQuotations,
  createDraftQuotation,
  createSubmittedQuotation,
  createApprovedQuotation,
  createExpiredQuotation,
  resetQuotationFactory,
} from './quotationFactory'
export type { Invoice, Status as InvoiceStatus } from './invoiceFactory'
export {
  createInvoice,
  createInvoices,
  createDraftInvoice,
  createSentInvoice,
  createPartiallyPaidInvoice,
  createPaidInvoice,
  createOverdueInvoice,
  resetInvoiceFactory,
} from './invoiceFactory'

/**
 * Reset all factories to their initial state
 * Call this in beforeEach() to ensure consistent test data
 */
export function resetAllFactories(): void {
  const { resetContactFactory } = require('./contactFactory')
  const { resetProductFactory } = require('./productFactory')
  const { resetLineItemFactory } = require('./lineItemFactory')
  const { resetQuotationFactory } = require('./quotationFactory')
  const { resetInvoiceFactory } = require('./invoiceFactory')

  resetContactFactory()
  resetProductFactory()
  resetLineItemFactory()
  resetQuotationFactory()
  resetInvoiceFactory()
}
