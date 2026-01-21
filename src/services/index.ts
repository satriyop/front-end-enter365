/**
 * Services Module
 *
 * Domain services implementing business logic with Strategy Pattern.
 * These services are framework-agnostic and can be used outside Vue components.
 *
 * @example
 * ```typescript
 * // In a component
 * import { useCalculation, useStatus, createLineItemsService } from '@/services'
 *
 * const { totals } = useCalculation(items)
 * const { getVariant } = useStatus('invoice')
 * const lineItems = createLineItemsService([], { minItems: 1 })
 * ```
 */

// Calculation Service (Strategy Pattern)
export {
  // Service
  CalculationService,
  calculationService,
  type CalculationServiceOptions,
  // Composable
  useCalculation,
  type UseCalculationReturn,
  // Strategy Types
  type TaxStrategy,
  type DiscountStrategy,
  type RoundingStrategy,
  type CalculableLineItem,
  type LineItemCalculation,
  type DocumentTotals,
  // Tax Strategies
  PPNStrategy,
  InclusiveTaxStrategy,
  NoTaxStrategy,
  // Discount Strategies
  PercentDiscountStrategy,
  AmountDiscountStrategy,
  TieredDiscountStrategy,
  type DiscountTier,
  // Rounding Strategies
  StandardRoundingStrategy,
  RoundUpStrategy,
  IndonesianRoundingStrategy,
} from './calculation'

// Line Items Service
export {
  createLineItemsService,
  type LineItemsService,
  type BaseLineItem,
  type LineItemsConfig,
  type ValidationResult,
} from './line-items'

// Status Service
export {
  StatusService,
  statusService,
  useStatus,
  type UseStatusReturn,
  STATUS_REGISTRY,
  DEFAULT_STATUS_CONFIG,
  type StatusVariant,
  type StatusConfig,
  type StatusRegistry,
  type DocumentStatusRegistry,
  type DocumentType,
} from './status'
