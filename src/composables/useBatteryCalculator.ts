import { computed, ref, type Ref, type ComputedRef } from 'vue'
import {
  calculateSelfConsumption,
  calculateBackupCapability,
  getRecommendedBatteryCapacity,
} from '@/utils/calculations'

export interface BatteryConfig {
  enabled: boolean
  capacityKwh: number
  pricePerKwh: number // IDR per kWh capacity
}

export interface BatteryResult {
  // Costs
  batteryCost: number
  totalSystemCost: number

  // Performance
  selfConsumptionWithoutBattery: number // baseline %
  selfConsumptionWithBattery: number
  selfConsumptionIncrease: number

  // Savings impact
  additionalAnnualSavings: number
  additionalLifetimeSavings: number

  // Backup capability
  backupHours: number
  backupDays: number

  // ROI impact
  newPaybackPeriod: number | null
  paybackDelta: number | null
  newROI: number
  roiDelta: number
}

export interface BatteryCalculatorSettings {
  batteryPrices: Record<number, number>
  batteryRoundTripEfficiency: number
  batterySelfConsumptionBase: number
  batterySelfConsumptionMax: number
  batteryDegradationRate: number
  batteryRecommendedRatio: number
  systemLifetimeYears: number
}

// Default settings (fallback if not provided)
const DEFAULT_BATTERY_SETTINGS: BatteryCalculatorSettings = {
  batteryPrices: {
    5: 18000000,
    10: 16000000,
    15: 15000000,
    20: 14000000,
  },
  batteryRoundTripEfficiency: 0.9,
  batterySelfConsumptionBase: 0.3,
  batterySelfConsumptionMax: 0.85,
  batteryDegradationRate: 3,
  batteryRecommendedRatio: 0.5,
  systemLifetimeYears: 25,
}

export function useBatteryCalculator(
  inputs: {
    systemCost: Ref<number>
    annualProduction: Ref<number>
    monthlyConsumption: Ref<number>
    electricityRate: Ref<number>
    yearlyProjections: Ref<Array<{ year: number; savings: number }>>
    paybackPeriod: Ref<number | null>
  },
  settings?: Ref<BatteryCalculatorSettings> | ComputedRef<BatteryCalculatorSettings>
) {
  // Use provided settings or defaults
  const getSettings = () => settings?.value || DEFAULT_BATTERY_SETTINGS

  // Battery configuration
  const config = ref<BatteryConfig>({
    enabled: false,
    capacityKwh: 10,
    pricePerKwh: getSettings().batteryPrices[10] || 16000000,
  })

  // Available capacity options (computed to react to settings changes)
  const capacityOptions = computed(() => {
    const prices = getSettings().batteryPrices
    return [
      { value: 5, label: '5 kWh', price: prices[5] },
      { value: 10, label: '10 kWh', price: prices[10] },
      { value: 15, label: '15 kWh', price: prices[15] },
      { value: 20, label: '20 kWh', price: prices[20] },
    ]
  })

  // Update price when capacity changes
  function setCapacity(kWh: number) {
    const prices = getSettings().batteryPrices
    config.value.capacityKwh = kWh
    config.value.pricePerKwh = prices[kWh] || 15000000
  }

  // Battery calculations
  const result = computed<BatteryResult>(() => {
    const s = getSettings()
    const batteryKwh = config.value.capacityKwh
    const pricePerKwh = config.value.pricePerKwh
    const annualProd = inputs.annualProduction.value || 0
    const monthlyConsumption = inputs.monthlyConsumption.value || 0
    const rate = inputs.electricityRate.value || 0
    const solarCost = inputs.systemCost.value || 0

    // Battery cost
    const batteryCost = batteryKwh * pricePerKwh
    const totalSystemCost = solarCost + batteryCost

    // Daily production
    const dailyProduction = annualProd / 365

    // Self-consumption calculation using pure function
    const selfConsumption = calculateSelfConsumption(
      dailyProduction,
      batteryKwh,
      s.batteryRoundTripEfficiency,
      s.batterySelfConsumptionBase,
      s.batterySelfConsumptionMax
    )
    const selfConsumptionWithoutBattery = selfConsumption.without
    const selfConsumptionWithBattery = selfConsumption.with
    const selfConsumptionIncrease = selfConsumption.increase

    // Additional savings from increased self-consumption
    const additionalAnnualSavings = annualProd * selfConsumptionIncrease * rate
    // Lifetime degradation factor (simplified): ~90% of total over lifetime
    const lifetimeDegradationFactor = 1 - (s.batteryDegradationRate / 100 * s.systemLifetimeYears / 2)
    const additionalLifetimeSavings = additionalAnnualSavings * s.systemLifetimeYears * lifetimeDegradationFactor

    // Backup capability using pure function
    const dailyConsumption = monthlyConsumption * 12 / 365
    const backup = calculateBackupCapability(
      batteryKwh,
      s.batteryRoundTripEfficiency,
      dailyConsumption,
      10 // 10 active hours per day
    )
    const backupHours = backup.hours
    const backupDays = backup.days

    // ROI calculations with battery
    const baseLifetimeSavings = inputs.yearlyProjections.value.reduce((sum, p) => sum + p.savings, 0)
    const totalLifetimeSavingsWithBattery = baseLifetimeSavings + additionalLifetimeSavings

    // Calculate new payback period
    let newPaybackPeriod: number | null = null
    let cumulative = 0
    const annualBatterySavings = additionalAnnualSavings
    const batteryDegradationFactor = 1 - (s.batteryDegradationRate / 100)

    for (let year = 1; year <= s.systemLifetimeYears; year++) {
      const projection = inputs.yearlyProjections.value[year - 1]
      if (!projection) continue

      // Battery degrades each year
      const yearSavings = projection.savings + annualBatterySavings * Math.pow(batteryDegradationFactor, year - 1)
      cumulative += yearSavings

      if (cumulative >= totalSystemCost && newPaybackPeriod === null) {
        const prevCumulative = cumulative - yearSavings
        const fraction = yearSavings > 0 ? (totalSystemCost - prevCumulative) / yearSavings : 0
        newPaybackPeriod = Math.round((year - 1 + fraction) * 10) / 10
      }
    }

    const basePayback = inputs.paybackPeriod.value
    const paybackDelta = basePayback !== null && newPaybackPeriod !== null
      ? newPaybackPeriod - basePayback
      : null

    // ROI
    const baseROI = solarCost > 0 ? ((baseLifetimeSavings - solarCost) / solarCost) * 100 : 0
    const newROI = totalSystemCost > 0
      ? ((totalLifetimeSavingsWithBattery - totalSystemCost) / totalSystemCost) * 100
      : 0
    const roiDelta = newROI - baseROI

    return {
      batteryCost,
      totalSystemCost,
      selfConsumptionWithoutBattery: selfConsumptionWithoutBattery * 100,
      selfConsumptionWithBattery: selfConsumptionWithBattery * 100,
      selfConsumptionIncrease: selfConsumptionIncrease * 100,
      additionalAnnualSavings: Math.round(additionalAnnualSavings),
      additionalLifetimeSavings: Math.round(additionalLifetimeSavings),
      backupHours: Math.round(backupHours * 10) / 10,
      backupDays: Math.round(backupDays * 10) / 10,
      newPaybackPeriod,
      paybackDelta,
      newROI,
      roiDelta,
    }
  })

  // Recommendation based on system size using pure function
  const recommendation = computed(() => {
    const s = getSettings()
    const dailyProduction = (inputs.annualProduction.value || 0) / 365
    return getRecommendedBatteryCapacity(
      dailyProduction,
      s.batteryRecommendedRatio,
      [5, 10, 15, 20]
    )
  })

  return {
    config,
    result,
    capacityOptions,
    setCapacity,
    recommendation,
  }
}
