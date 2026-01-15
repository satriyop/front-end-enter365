import { ref, computed, type Ref } from 'vue'

// ============================================
// Types
// ============================================

export interface CoreSettings {
  systemLifetimeYears: number
  defaultPerformanceRatio: number
  defaultTariffEscalation: number
  panelDegradationRate: number
  defaultRoofTilt: number
  panelEfficiencyKw: number
  roofSpacePerKwp: number
  proposalValidityDays: number
}

export interface CarbonSettings {
  carbonCreditPriceIdr: number
  co2EmissionFactor: number
}

export interface BatterySettings {
  batteryPrices: Record<number, number>
  batteryRoundTripEfficiency: number
  batterySelfConsumptionBase: number
  batterySelfConsumptionMax: number
  batteryDegradationRate: number
  batteryRecommendedRatio: number
}

export interface FinancingSettings {
  defaultDownPayment: number
  defaultLoanTerm: number
  defaultInterestRate: number
  defaultLeaseTerm: number
  leaseResidualValue: number
  leaseMoneyFactor: number
  loanTermOptions: number[]
  downPaymentOptions: number[]
  interestRateOptions: number[]
}

export interface ScenarioPreset {
  electricityRateChange: number
  consumptionChange: number
  systemDegradation: number
}

export interface ScenarioSettings {
  defaultDegradation: number
  optimisticScenario: ScenarioPreset
  pessimisticScenario: ScenarioPreset
  highGrowthScenario: ScenarioPreset
}

export interface SolarSettings {
  core: CoreSettings
  carbon: CarbonSettings
  battery: BatterySettings
  financing: FinancingSettings
  scenarios: ScenarioSettings
}

// ============================================
// Default Values
// ============================================

export const DEFAULT_CORE_SETTINGS: CoreSettings = {
  systemLifetimeYears: 25,
  defaultPerformanceRatio: 0.8,
  defaultTariffEscalation: 3,
  panelDegradationRate: 0.5,
  defaultRoofTilt: 10,
  panelEfficiencyKw: 0.55,
  roofSpacePerKwp: 6,
  proposalValidityDays: 30,
}

export const DEFAULT_CARBON_SETTINGS: CarbonSettings = {
  carbonCreditPriceIdr: 150000,
  co2EmissionFactor: 0.0007,
}

export const DEFAULT_BATTERY_SETTINGS: BatterySettings = {
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
}

export const DEFAULT_FINANCING_SETTINGS: FinancingSettings = {
  defaultDownPayment: 20,
  defaultLoanTerm: 5,
  defaultInterestRate: 12,
  defaultLeaseTerm: 7,
  leaseResidualValue: 10,
  leaseMoneyFactor: 0.003,
  loanTermOptions: [3, 5, 7, 10],
  downPaymentOptions: [0, 10, 20, 30],
  interestRateOptions: [8, 10, 12, 15],
}

export const DEFAULT_SCENARIO_SETTINGS: ScenarioSettings = {
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
}

export const DEFAULT_SETTINGS: SolarSettings = {
  core: DEFAULT_CORE_SETTINGS,
  carbon: DEFAULT_CARBON_SETTINGS,
  battery: DEFAULT_BATTERY_SETTINGS,
  financing: DEFAULT_FINANCING_SETTINGS,
  scenarios: DEFAULT_SCENARIO_SETTINGS,
}

// ============================================
// localStorage Key
// ============================================

const STORAGE_KEY = 'enter365:solar:settings'
const STORAGE_VERSION = 1

interface StoredSettings {
  version: number
  updatedAt: string
  settings: SolarSettings
}

// ============================================
// Helper Functions
// ============================================

function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target }
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key]
      const targetValue = target[key]
      if (
        sourceValue !== undefined &&
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue as Partial<typeof targetValue>)
      } else if (sourceValue !== undefined) {
        result[key] = sourceValue as T[Extract<keyof T, string>]
      }
    }
  }
  return result
}

function loadFromStorage(): SolarSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed: StoredSettings = JSON.parse(stored)
    if (parsed.version !== STORAGE_VERSION) {
      // Version mismatch - clear and use defaults
      localStorage.removeItem(STORAGE_KEY)
      return null
    }

    return parsed.settings
  } catch (error) {
    console.error('Failed to load solar settings:', error)
    return null
  }
}

function saveToStorage(settings: SolarSettings): boolean {
  try {
    const data: StoredSettings = {
      version: STORAGE_VERSION,
      updatedAt: new Date().toISOString(),
      settings,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Failed to save solar settings:', error)
    return false
  }
}

// ============================================
// Composable
// ============================================

/**
 * Central composable for managing solar calculation settings.
 *
 * @param overrides - Optional ref for per-proposal overrides
 * @returns Settings and management functions
 *
 * @example
 * // Global settings only
 * const { settings, saveGlobalSettings } = useSolarSettings()
 *
 * @example
 * // With per-proposal overrides
 * const overrides = ref<Partial<SolarSettings>>({})
 * const { mergedSettings } = useSolarSettings(overrides)
 */
export function useSolarSettings(overrides?: Ref<Partial<SolarSettings>>) {
  // Load global settings from localStorage or use defaults
  const globalSettings = ref<SolarSettings>(
    loadFromStorage() || { ...DEFAULT_SETTINGS }
  )

  // Merged settings (global + overrides)
  const mergedSettings = computed<SolarSettings>(() => {
    if (!overrides?.value || Object.keys(overrides.value).length === 0) {
      return globalSettings.value
    }
    return deepMerge(globalSettings.value, overrides.value)
  })

  // Individual category computed refs for convenience
  const coreSettings = computed(() => mergedSettings.value.core)
  const carbonSettings = computed(() => mergedSettings.value.carbon)
  const batterySettings = computed(() => mergedSettings.value.battery)
  const financingSettings = computed(() => mergedSettings.value.financing)
  const scenarioSettings = computed(() => mergedSettings.value.scenarios)

  /**
   * Save current global settings to localStorage
   */
  function saveGlobalSettings(newSettings?: Partial<SolarSettings>): boolean {
    if (newSettings) {
      globalSettings.value = deepMerge(globalSettings.value, newSettings)
    }
    return saveToStorage(globalSettings.value)
  }

  /**
   * Update a specific category
   */
  function updateCategory<K extends keyof SolarSettings>(
    category: K,
    values: Partial<SolarSettings[K]>
  ) {
    const current = globalSettings.value[category]
    globalSettings.value = {
      ...globalSettings.value,
      [category]: { ...current, ...values },
    }
  }

  /**
   * Reset a specific category to defaults
   */
  function resetCategory(category: keyof SolarSettings) {
    globalSettings.value = {
      ...globalSettings.value,
      [category]: { ...DEFAULT_SETTINGS[category] },
    }
    saveToStorage(globalSettings.value)
  }

  /**
   * Reset all settings to defaults
   */
  function resetAllToDefaults() {
    globalSettings.value = { ...DEFAULT_SETTINGS }
    saveToStorage(globalSettings.value)
  }

  /**
   * Check if settings differ from defaults
   */
  const hasCustomSettings = computed(() => {
    return JSON.stringify(globalSettings.value) !== JSON.stringify(DEFAULT_SETTINGS)
  })

  /**
   * Get default value for a specific setting
   */
  function getDefault<K extends keyof SolarSettings>(
    category: K,
    key: keyof SolarSettings[K]
  ): SolarSettings[K][typeof key] {
    return DEFAULT_SETTINGS[category][key]
  }

  return {
    // Settings
    globalSettings,
    mergedSettings,

    // Category shortcuts
    coreSettings,
    carbonSettings,
    batterySettings,
    financingSettings,
    scenarioSettings,

    // Actions
    saveGlobalSettings,
    updateCategory,
    resetCategory,
    resetAllToDefaults,

    // Utils
    hasCustomSettings,
    getDefault,

    // Constants
    DEFAULT_SETTINGS,
  }
}

/**
 * Create a settings object for a specific category from the merged settings
 * Useful for passing to child composables
 */
export function extractBatterySettings(settings: SolarSettings): BatterySettings & Pick<CoreSettings, 'systemLifetimeYears'> {
  return {
    ...settings.battery,
    systemLifetimeYears: settings.core.systemLifetimeYears,
  }
}

export function extractFinancingSettings(settings: SolarSettings): FinancingSettings {
  return settings.financing
}

export function extractScenarioSettings(settings: SolarSettings): ScenarioSettings & Pick<CoreSettings, 'systemLifetimeYears'> {
  return {
    ...settings.scenarios,
    systemLifetimeYears: settings.core.systemLifetimeYears,
  }
}
