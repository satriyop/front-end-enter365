/**
 * Shared types for calculation utilities
 */

export interface YearlyProjection {
  year: number
  savings: number
}

export interface LeaseResult {
  monthlyLease: number
  totalLeasePayments: number
  buyoutPrice: number
  totalCost: number
}

export interface SelfConsumptionResult {
  /** Self-consumption without battery (as decimal 0-1) */
  without: number
  /** Self-consumption with battery (as decimal 0-1) */
  with: number
  /** Increase in self-consumption (as decimal 0-1) */
  increase: number
}

export interface BackupResult {
  /** Hours of backup power */
  hours: number
  /** Days of backup power */
  days: number
}

export interface PaybackResult {
  /** Payback period in years (null if never pays back) */
  period: number | null
  /** Cumulative savings at payback point */
  cumulativeAtPayback: number
}
