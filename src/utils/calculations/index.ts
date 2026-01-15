/**
 * Pure calculation utilities for solar system analysis
 *
 * These functions are framework-agnostic and can be easily tested.
 * They are used by Vue composables but have no Vue dependencies.
 */

// Types
export type {
  YearlyProjection,
  LeaseResult,
  SelfConsumptionResult,
  BackupResult,
  PaybackResult,
} from './types'

// Loan calculations
export { calculateLoanPayment, calculateLeasePayment } from './loan'

// Projection calculations
export {
  generateProjections,
  calculatePaybackPeriod,
  calculateROI,
  sumProjectionSavings,
} from './projections'

// Battery calculations
export {
  calculateSelfConsumption,
  calculateBackupCapability,
  calculateBatterySavings,
  getRecommendedBatteryCapacity,
} from './battery'
