import { computed, ref, type Ref, type ComputedRef } from 'vue'
import {
  generateProjections,
  calculatePaybackPeriod,
  sumProjectionSavings,
} from '@/utils/calculations'

export interface ScenarioParams {
  electricityRateChange: number // -20 to +30 (percentage)
  consumptionChange: number // -30 to +50 (percentage)
  systemDegradation: number // 0.3 to 1.5 (annual % degradation)
}

export interface ScenarioResult {
  annualSavings: number
  totalLifetimeSavings: number
  paybackPeriod: number | null
  roi: number
}

export interface ScenarioComparison {
  base: ScenarioResult
  scenario: ScenarioResult
  changes: {
    annualSavings: number
    annualSavingsPercent: number
    totalSavings: number
    totalSavingsPercent: number
    paybackDelta: number | null
    roiDelta: number
  }
}

export interface ScenarioPreset {
  electricityRateChange: number
  consumptionChange: number
  systemDegradation: number
}

export interface ScenarioCalculatorSettings {
  defaultDegradation: number
  optimisticScenario: ScenarioPreset
  pessimisticScenario: ScenarioPreset
  highGrowthScenario: ScenarioPreset
  systemLifetimeYears: number
}

// Default settings (fallback if not provided)
const DEFAULT_SCENARIO_SETTINGS: ScenarioCalculatorSettings = {
  defaultDegradation: 0.5,
  optimisticScenario: {
    electricityRateChange: 10,
    consumptionChange: 0,
    systemDegradation: 0.3,
  },
  pessimisticScenario: {
    electricityRateChange: -5,
    consumptionChange: -10,
    systemDegradation: 1.0,
  },
  highGrowthScenario: {
    electricityRateChange: 20,
    consumptionChange: 15,
    systemDegradation: 0.5,
  },
  systemLifetimeYears: 25,
}

export function useScenarioCalculator(
  baseInputs: {
    annualProduction: Ref<number>
    electricityRate: Ref<number>
    tariffEscalation: Ref<number>
    systemCost: Ref<number>
  },
  settings?: Ref<ScenarioCalculatorSettings> | ComputedRef<ScenarioCalculatorSettings>
) {
  // Use provided settings or defaults
  const getSettings = () => settings?.value || DEFAULT_SCENARIO_SETTINGS

  // Initialize with settings defaults
  const s = getSettings()

  // Scenario parameters with defaults from settings
  const params = ref<ScenarioParams>({
    electricityRateChange: 0,
    consumptionChange: 0,
    systemDegradation: s.defaultDegradation,
  })

  // Base case results
  const baseResult = computed<ScenarioResult>(() => {
    const st = getSettings()
    const production = baseInputs.annualProduction.value || 0
    const rate = baseInputs.electricityRate.value || 0
    const escalation = baseInputs.tariffEscalation.value || 3
    const cost = baseInputs.systemCost.value || 0

    const projections = generateProjections(
      production,
      rate,
      escalation,
      st.defaultDegradation,
      st.systemLifetimeYears
    )
    const totalSavings = sumProjectionSavings(projections)
    const payback = calculatePaybackPeriod(projections, cost)
    const roi = cost > 0 ? ((totalSavings - cost) / cost) * 100 : 0

    return {
      annualSavings: projections[0]?.savings || 0,
      totalLifetimeSavings: totalSavings,
      paybackPeriod: payback,
      roi,
    }
  })

  // Scenario results with adjusted parameters
  const scenarioResult = computed<ScenarioResult>(() => {
    const st = getSettings()
    const production = baseInputs.annualProduction.value || 0
    const baseRate = baseInputs.electricityRate.value || 0
    const escalation = baseInputs.tariffEscalation.value || 3
    const cost = baseInputs.systemCost.value || 0

    // Apply scenario adjustments
    const adjustedRate = baseRate * (1 + params.value.electricityRateChange / 100)
    const adjustedProduction = production * (1 + params.value.consumptionChange / 100)
    const degradation = params.value.systemDegradation

    const projections = generateProjections(
      adjustedProduction,
      adjustedRate,
      escalation,
      degradation,
      st.systemLifetimeYears
    )
    const totalSavings = sumProjectionSavings(projections)
    const payback = calculatePaybackPeriod(projections, cost)
    const roi = cost > 0 ? ((totalSavings - cost) / cost) * 100 : 0

    return {
      annualSavings: projections[0]?.savings || 0,
      totalLifetimeSavings: totalSavings,
      paybackPeriod: payback,
      roi,
    }
  })

  // Comparison between base and scenario
  const comparison = computed<ScenarioComparison>(() => {
    const base = baseResult.value
    const scenario = scenarioResult.value

    return {
      base,
      scenario,
      changes: {
        annualSavings: scenario.annualSavings - base.annualSavings,
        annualSavingsPercent:
          base.annualSavings > 0
            ? ((scenario.annualSavings - base.annualSavings) / base.annualSavings) * 100
            : 0,
        totalSavings: scenario.totalLifetimeSavings - base.totalLifetimeSavings,
        totalSavingsPercent:
          base.totalLifetimeSavings > 0
            ? ((scenario.totalLifetimeSavings - base.totalLifetimeSavings) /
                base.totalLifetimeSavings) *
              100
            : 0,
        paybackDelta:
          base.paybackPeriod !== null && scenario.paybackPeriod !== null
            ? scenario.paybackPeriod - base.paybackPeriod
            : null,
        roiDelta: scenario.roi - base.roi,
      },
    }
  })

  // Reset to defaults
  function resetParams() {
    const st = getSettings()
    params.value = {
      electricityRateChange: 0,
      consumptionChange: 0,
      systemDegradation: st.defaultDegradation,
    }
  }

  // Preset scenarios (computed to react to settings changes)
  const presets = {
    optimistic: () => {
      const st = getSettings()
      params.value = { ...st.optimisticScenario }
    },
    pessimistic: () => {
      const st = getSettings()
      params.value = { ...st.pessimisticScenario }
    },
    highGrowth: () => {
      const st = getSettings()
      params.value = { ...st.highGrowthScenario }
    },
  }

  return {
    params,
    baseResult,
    scenarioResult,
    comparison,
    resetParams,
    presets,
  }
}
