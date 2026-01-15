import type { YearlyProjection } from './types'

/**
 * Generate year-by-year savings projections with escalation and degradation
 *
 * @param annualProduction - Initial annual production in kWh
 * @param electricityRate - Electricity rate per kWh
 * @param tariffEscalation - Annual tariff escalation percentage (e.g., 3 for 3%)
 * @param degradationRate - Annual system degradation percentage (e.g., 0.5 for 0.5%)
 * @param years - Number of years to project
 * @returns Array of yearly projections
 */
export function generateProjections(
  annualProduction: number,
  electricityRate: number,
  tariffEscalation: number,
  degradationRate: number,
  years: number
): YearlyProjection[] {
  const projections: YearlyProjection[] = []
  let currentRate = electricityRate
  let currentProduction = annualProduction
  const escalationFactor = 1 + tariffEscalation / 100
  const degradationFactor = 1 - degradationRate / 100

  for (let year = 1; year <= years; year++) {
    projections.push({
      year,
      savings: Math.round(currentProduction * currentRate),
    })
    currentRate *= escalationFactor
    currentProduction *= degradationFactor
  }

  return projections
}

/**
 * Calculate payback period from projections
 * Uses linear interpolation for fractional years
 *
 * @param projections - Array of yearly projections with savings
 * @param totalCost - Total system cost to recover
 * @returns Payback period in years (null if cost is never recovered)
 */
export function calculatePaybackPeriod(
  projections: Array<{ savings: number }>,
  totalCost: number
): number | null {
  if (totalCost <= 0) return 0
  if (projections.length === 0) return null

  let cumulative = 0

  for (let i = 0; i < projections.length; i++) {
    const projection = projections[i]
    if (!projection) continue

    cumulative += projection.savings

    if (cumulative >= totalCost) {
      const prevCumulative = cumulative - projection.savings
      const fraction = projection.savings > 0
        ? (totalCost - prevCumulative) / projection.savings
        : 0
      return Math.round((i + fraction) * 10) / 10
    }
  }

  return null // Cost never recovered within projection period
}

/**
 * Calculate ROI (Return on Investment) percentage
 *
 * @param totalSavings - Total lifetime savings
 * @param totalCost - Total system cost
 * @returns ROI as percentage
 */
export function calculateROI(totalSavings: number, totalCost: number): number {
  if (totalCost <= 0) return 0
  return ((totalSavings - totalCost) / totalCost) * 100
}

/**
 * Sum total savings from projections
 *
 * @param projections - Array of yearly projections
 * @returns Total savings
 */
export function sumProjectionSavings(projections: Array<{ savings: number }>): number {
  return projections.reduce((sum, p) => sum + p.savings, 0)
}
