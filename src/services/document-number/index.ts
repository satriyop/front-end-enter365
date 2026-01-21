/**
 * Document Number Service
 *
 * Strategy pattern implementation for document number generation.
 * Supports different numbering schemes per document type.
 */

// Types
export * from './types'

// Service
export { DocumentNumberService, documentNumberService } from './DocumentNumberService'

// Strategies
export { SequentialStrategy } from './strategies/SequentialStrategy'
export { MonthlyResetStrategy } from './strategies/MonthlyResetStrategy'

// Bootstrap: Register default strategies and configure document types
import { documentNumberService } from './DocumentNumberService'
import { SequentialStrategy } from './strategies/SequentialStrategy'
import { MonthlyResetStrategy } from './strategies/MonthlyResetStrategy'

// Register strategies
documentNumberService.registerStrategy('sequential', new SequentialStrategy())
documentNumberService.registerStrategy('monthly', new MonthlyResetStrategy())

// Configure document types with their numbering schemes
documentNumberService.configureDocumentType('quotation', 'sequential', {
  prefix: 'QUO',
  yearFormat: 'YYYY',
  padding: 4,
})

documentNumberService.configureDocumentType('invoice', 'sequential', {
  prefix: 'INV',
  yearFormat: 'YYYY',
  padding: 4,
})

documentNumberService.configureDocumentType('bill', 'sequential', {
  prefix: 'BILL',
  yearFormat: 'YYYY',
  padding: 4,
})

documentNumberService.configureDocumentType('purchase_order', 'sequential', {
  prefix: 'PO',
  yearFormat: 'YYYY',
  padding: 4,
})

documentNumberService.configureDocumentType('delivery_order', 'monthly', {
  prefix: 'DO',
  padding: 4,
})

documentNumberService.configureDocumentType('work_order', 'sequential', {
  prefix: 'WO',
  yearFormat: 'YYYY',
  padding: 4,
})

documentNumberService.configureDocumentType('journal_entry', 'monthly', {
  prefix: 'JE',
  padding: 4,
})

documentNumberService.configureDocumentType('payment', 'monthly', {
  prefix: 'PAY',
  padding: 4,
})
