/**
 * Test Data Factories
 *
 * Provides factory functions for creating test data.
 * Each factory generates realistic data with auto-incrementing IDs.
 */

export * from './contactFactory'
export * from './productFactory'
export * from './lineItemFactory'
export * from './quotationFactory'
export * from './invoiceFactory'

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
