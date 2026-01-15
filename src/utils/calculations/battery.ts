import type { SelfConsumptionResult, BackupResult } from './types'

/**
 * Calculate self-consumption with and without battery
 *
 * @param dailyProduction - Daily solar production in kWh
 * @param batteryKwh - Battery capacity in kWh
 * @param roundTripEfficiency - Battery round-trip efficiency (e.g., 0.9 for 90%)
 * @param baseConsumption - Baseline self-consumption without battery (e.g., 0.3 for 30%)
 * @param maxConsumption - Maximum possible self-consumption (e.g., 0.85 for 85%)
 * @returns Self-consumption values as decimals (0-1)
 */
export function calculateSelfConsumption(
  dailyProduction: number,
  batteryKwh: number,
  roundTripEfficiency: number,
  baseConsumption: number,
  maxConsumption: number
): SelfConsumptionResult {
  if (dailyProduction <= 0) {
    return {
      without: baseConsumption,
      with: baseConsumption,
      increase: 0,
    }
  }

  // Without battery: baseline self-consumption
  const selfConsumptionWithoutBattery = baseConsumption

  // With battery: increases based on battery size relative to daily production
  const captureableExcess = dailyProduction * (1 - selfConsumptionWithoutBattery)
  const batteryCapture = Math.min(batteryKwh * roundTripEfficiency, captureableExcess)
  const additionalSelfConsumption = batteryCapture / dailyProduction
  const selfConsumptionWithBattery = Math.min(
    maxConsumption,
    selfConsumptionWithoutBattery + additionalSelfConsumption
  )

  const selfConsumptionIncrease = selfConsumptionWithBattery - selfConsumptionWithoutBattery

  return {
    without: selfConsumptionWithoutBattery,
    with: selfConsumptionWithBattery,
    increase: selfConsumptionIncrease,
  }
}

/**
 * Calculate backup power capability
 *
 * @param batteryKwh - Battery capacity in kWh
 * @param roundTripEfficiency - Battery round-trip efficiency (e.g., 0.9 for 90%)
 * @param dailyConsumption - Daily energy consumption in kWh
 * @param activeHours - Active usage hours per day (default: 10)
 * @returns Backup hours and days
 */
export function calculateBackupCapability(
  batteryKwh: number,
  roundTripEfficiency: number,
  dailyConsumption: number,
  activeHours: number = 10
): BackupResult {
  if (dailyConsumption <= 0 || activeHours <= 0) {
    return { hours: 0, days: 0 }
  }

  const avgHourlyConsumption = dailyConsumption / activeHours
  const usableCapacity = batteryKwh * roundTripEfficiency
  const backupHours = usableCapacity / avgHourlyConsumption
  const backupDays = backupHours / 24

  return {
    hours: Math.round(backupHours * 10) / 10,
    days: Math.round(backupDays * 10) / 10,
  }
}

/**
 * Calculate additional savings from battery
 *
 * @param annualProduction - Annual solar production in kWh
 * @param selfConsumptionIncrease - Increase in self-consumption (as decimal)
 * @param electricityRate - Electricity rate per kWh
 * @param degradationRate - Annual battery degradation percentage (e.g., 3 for 3%)
 * @param lifetimeYears - System lifetime in years
 * @returns Annual and lifetime additional savings
 */
export function calculateBatterySavings(
  annualProduction: number,
  selfConsumptionIncrease: number,
  electricityRate: number,
  degradationRate: number,
  lifetimeYears: number
): { annual: number; lifetime: number } {
  const additionalAnnualSavings = annualProduction * selfConsumptionIncrease * electricityRate

  // Lifetime degradation factor (simplified): accounts for battery degradation over time
  const lifetimeDegradationFactor = 1 - (degradationRate / 100 * lifetimeYears / 2)
  const additionalLifetimeSavings = additionalAnnualSavings * lifetimeYears * lifetimeDegradationFactor

  return {
    annual: Math.round(additionalAnnualSavings),
    lifetime: Math.round(additionalLifetimeSavings),
  }
}

/**
 * Get recommended battery capacity based on daily production
 *
 * @param dailyProduction - Daily solar production in kWh
 * @param recommendedRatio - Recommended battery ratio to daily production (e.g., 0.5)
 * @param availableCapacities - Available battery capacities in kWh
 * @returns Recommended capacity in kWh
 */
export function getRecommendedBatteryCapacity(
  dailyProduction: number,
  recommendedRatio: number,
  availableCapacities: number[] = [5, 10, 15, 20]
): number {
  const recommendedKwh = dailyProduction * recommendedRatio

  // Find the smallest capacity that meets the recommendation
  for (const capacity of availableCapacities.sort((a, b) => a - b)) {
    if (recommendedKwh <= capacity) {
      return capacity
    }
  }

  // Return largest available if recommendation exceeds all options
  return availableCapacities[availableCapacities.length - 1] || 20
}
