import type { LeaseResult } from './types'

/**
 * Calculate monthly loan payment using standard amortization formula
 * Monthly Payment = P × [r(1+r)^n] / [(1+r)^n - 1]
 *
 * @param principal - Loan principal amount
 * @param annualRatePercent - Annual interest rate as percentage (e.g., 12 for 12%)
 * @param years - Loan term in years
 * @returns Monthly payment amount
 */
export function calculateLoanPayment(
  principal: number,
  annualRatePercent: number,
  years: number
): number {
  if (principal <= 0) return 0
  if (annualRatePercent <= 0) return principal / (years * 12)

  const monthlyRate = annualRatePercent / 100 / 12
  const numPayments = years * 12

  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)

  return payment
}

/**
 * Calculate lease payments based on residual value and money factor
 *
 * @param systemCost - Total system cost
 * @param leaseTerm - Lease term in years
 * @param residualPercent - Residual value as percentage (e.g., 10 for 10%)
 * @param moneyFactor - Money factor for finance charge calculation
 * @returns Lease payment details
 */
export function calculateLeasePayment(
  systemCost: number,
  leaseTerm: number,
  residualPercent: number,
  moneyFactor: number
): LeaseResult {
  if (systemCost <= 0 || leaseTerm <= 0) {
    return {
      monthlyLease: 0,
      totalLeasePayments: 0,
      buyoutPrice: 0,
      totalCost: 0,
    }
  }

  const residualValue = systemCost * (residualPercent / 100)
  const depreciation = (systemCost - residualValue) / (leaseTerm * 12)
  const financeCharge = (systemCost + residualValue) * moneyFactor
  const monthlyLease = depreciation + financeCharge
  const totalLeasePayments = monthlyLease * leaseTerm * 12

  return {
    monthlyLease: Math.round(monthlyLease),
    totalLeasePayments: Math.round(totalLeasePayments),
    buyoutPrice: Math.round(residualValue),
    totalCost: Math.round(totalLeasePayments + residualValue),
  }
}
