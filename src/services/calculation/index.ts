/**
 * Calculation Service Module
 *
 * Provides document calculation functionality using the Strategy Pattern.
 */

// Main service
export {
  CalculationService,
  calculationService,
  type CalculationServiceOptions,
} from './CalculationService'

// Composable
export { useCalculation, type UseCalculationReturn } from './useCalculation'

// Strategies and types
export * from './strategies'
