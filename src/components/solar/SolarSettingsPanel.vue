<script setup lang="ts">
import { ref, computed } from 'vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import { formatCurrency } from '@/utils/format'
import {
  Settings,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Save,
  Sun,
  Leaf,
  Battery,
  Banknote,
  Sparkles,
} from 'lucide-vue-next'
import {
  type SolarSettings,
  DEFAULT_SETTINGS,
} from '@/composables/useSolarSettings'

interface Props {
  modelValue: SolarSettings
  mode?: 'full' | 'compact'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'compact',
})

const emit = defineEmits<{
  'update:modelValue': [value: SolarSettings]
  'save': []
  'reset': []
}>()

const isExpanded = ref(false)
const activeCategory = ref<string | null>(null)

// Local copy for editing
const localSettings = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function toggleCategory(category: string) {
  activeCategory.value = activeCategory.value === category ? null : category
}

function updateCoreSetting<K extends keyof SolarSettings['core']>(
  key: K,
  value: SolarSettings['core'][K]
) {
  localSettings.value = {
    ...localSettings.value,
    core: { ...localSettings.value.core, [key]: value },
  }
}

function updateCarbonSetting<K extends keyof SolarSettings['carbon']>(
  key: K,
  value: SolarSettings['carbon'][K]
) {
  localSettings.value = {
    ...localSettings.value,
    carbon: { ...localSettings.value.carbon, [key]: value },
  }
}

function updateBatterySetting<K extends keyof SolarSettings['battery']>(
  key: K,
  value: SolarSettings['battery'][K]
) {
  localSettings.value = {
    ...localSettings.value,
    battery: { ...localSettings.value.battery, [key]: value },
  }
}

function updateBatteryPrice(capacity: number, price: number) {
  localSettings.value = {
    ...localSettings.value,
    battery: {
      ...localSettings.value.battery,
      batteryPrices: {
        ...localSettings.value.battery.batteryPrices,
        [capacity]: price,
      },
    },
  }
}

function updateFinancingSetting<K extends keyof SolarSettings['financing']>(
  key: K,
  value: SolarSettings['financing'][K]
) {
  localSettings.value = {
    ...localSettings.value,
    financing: { ...localSettings.value.financing, [key]: value },
  }
}

function updateScenarioSetting<K extends keyof SolarSettings['scenarios']>(
  key: K,
  value: SolarSettings['scenarios'][K]
) {
  localSettings.value = {
    ...localSettings.value,
    scenarios: { ...localSettings.value.scenarios, [key]: value },
  }
}

function resetToDefaults() {
  localSettings.value = { ...DEFAULT_SETTINGS }
  emit('reset')
}

function saveSettings() {
  emit('save')
}

const hasChanges = computed(() => {
  return JSON.stringify(props.modelValue) !== JSON.stringify(DEFAULT_SETTINGS)
})

const categories = [
  {
    id: 'core',
    label: 'Solar Core',
    icon: Sun,
    color: 'text-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    bgActive: 'bg-gradient-to-br from-orange-500 to-amber-500',
    count: 4,
    description: 'System lifetime, performance, and degradation',
  },
  {
    id: 'carbon',
    label: 'Carbon',
    icon: Leaf,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/30',
    bgActive: 'bg-gradient-to-br from-green-500 to-emerald-500',
    count: 2,
    description: 'Carbon credit pricing and emission factors',
  },
  {
    id: 'battery',
    label: 'Battery',
    icon: Battery,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    bgActive: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    count: 8,
    description: 'Storage efficiency and pricing tiers',
  },
  {
    id: 'financing',
    label: 'Financing',
    icon: Banknote,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    bgActive: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    count: 4,
    description: 'Loan and lease default parameters',
  },
  {
    id: 'scenarios',
    label: 'Scenarios',
    icon: Sparkles,
    color: 'text-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    bgActive: 'bg-gradient-to-br from-purple-500 to-pink-500',
    count: 7,
    description: 'What-if analysis preset configurations',
  },
]

// Current category computed
const currentCategory = computed(() => categories.find(c => c.id === activeCategory.value))
</script>

<template>
  <!-- Full mode: with Card wrapper and collapsible header -->
  <Card v-if="mode === 'full'" class="overflow-hidden">
    <!-- Header with toggle -->
    <button
      type="button"
      class="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 text-white">
          <Settings class="w-5 h-5" />
        </div>
        <div class="text-left">
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">Calculation Settings</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ hasChanges ? 'Custom values configured' : 'Using default values' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span
          v-if="hasChanges"
          class="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        >
          Modified
        </span>
        <component
          :is="isExpanded ? ChevronUp : ChevronDown"
          class="w-5 h-5 text-slate-400"
        />
      </div>
    </button>

    <!-- Expandable content -->
    <div v-show="isExpanded" class="border-t border-slate-200 dark:border-slate-700">
      <!-- Category Tabs -->
      <div class="flex flex-wrap gap-1 p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          :class="activeCategory === cat.id
            ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-slate-100'
            : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'"
          @click="toggleCategory(cat.id)"
        >
          <component :is="cat.icon" class="w-3.5 h-3.5" :class="cat.color" />
          {{ cat.label }}
        </button>
      </div>

      <!-- Core Settings -->
      <div v-show="activeCategory === 'core'" class="p-4 space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              System Lifetime (years)
            </label>
            <Input
              type="number"
              :model-value="localSettings.core.systemLifetimeYears"
              @update:model-value="updateCoreSetting('systemLifetimeYears', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Performance Ratio
            </label>
            <Input
              type="number"
              step="0.01"
              :model-value="localSettings.core.defaultPerformanceRatio"
              @update:model-value="updateCoreSetting('defaultPerformanceRatio', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Tariff Escalation (%)
            </label>
            <Input
              type="number"
              step="0.5"
              :model-value="localSettings.core.defaultTariffEscalation"
              @update:model-value="updateCoreSetting('defaultTariffEscalation', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Panel Degradation (%/yr)
            </label>
            <Input
              type="number"
              step="0.1"
              :model-value="localSettings.core.panelDegradationRate"
              @update:model-value="updateCoreSetting('panelDegradationRate', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Default Roof Tilt (°)
            </label>
            <Input
              type="number"
              :model-value="localSettings.core.defaultRoofTilt"
              @update:model-value="updateCoreSetting('defaultRoofTilt', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Panel Efficiency (kW)
            </label>
            <Input
              type="number"
              step="0.05"
              :model-value="localSettings.core.panelEfficiencyKw"
              @update:model-value="updateCoreSetting('panelEfficiencyKw', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Roof Space per kWp (m²)
            </label>
            <Input
              type="number"
              :model-value="localSettings.core.roofSpacePerKwp"
              @update:model-value="updateCoreSetting('roofSpacePerKwp', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Proposal Validity (days)
            </label>
            <Input
              type="number"
              :model-value="localSettings.core.proposalValidityDays"
              @update:model-value="updateCoreSetting('proposalValidityDays', Number($event))"
              size="sm"
            />
          </div>
        </div>
      </div>

      <!-- Carbon Settings -->
      <div v-show="activeCategory === 'carbon'" class="p-4 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Carbon Credit Price (Rp/ton)
            </label>
            <Input
              type="number"
              :model-value="localSettings.carbon.carbonCreditPriceIdr"
              @update:model-value="updateCarbonSetting('carbonCreditPriceIdr', Number($event))"
              size="sm"
            />
            <p class="text-xs text-slate-400 mt-1">Current: {{ formatCurrency(localSettings.carbon.carbonCreditPriceIdr) }}/ton</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              CO₂ Emission Factor (tons/kWh)
            </label>
            <Input
              type="number"
              step="0.0001"
              :model-value="localSettings.carbon.co2EmissionFactor"
              @update:model-value="updateCarbonSetting('co2EmissionFactor', Number($event))"
              size="sm"
            />
            <p class="text-xs text-slate-400 mt-1">Indonesia grid average: 0.0007</p>
          </div>
        </div>
      </div>

      <!-- Battery Settings -->
      <div v-show="activeCategory === 'battery'" class="p-4 space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Round-Trip Efficiency
            </label>
            <Input
              type="number"
              step="0.01"
              :model-value="localSettings.battery.batteryRoundTripEfficiency"
              @update:model-value="updateBatterySetting('batteryRoundTripEfficiency', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Base Self-Consumption
            </label>
            <Input
              type="number"
              step="0.01"
              :model-value="localSettings.battery.batterySelfConsumptionBase"
              @update:model-value="updateBatterySetting('batterySelfConsumptionBase', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Max Self-Consumption
            </label>
            <Input
              type="number"
              step="0.01"
              :model-value="localSettings.battery.batterySelfConsumptionMax"
              @update:model-value="updateBatterySetting('batterySelfConsumptionMax', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Battery Degradation (%/yr)
            </label>
            <Input
              type="number"
              step="0.5"
              :model-value="localSettings.battery.batteryDegradationRate"
              @update:model-value="updateBatterySetting('batteryDegradationRate', Number($event))"
              size="sm"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
            Battery Prices by Capacity (Rp/kWh)
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div v-for="capacity in [5, 10, 15, 20]" :key="capacity" class="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">{{ capacity }} kWh</div>
              <Input
                type="number"
                :model-value="localSettings.battery.batteryPrices[capacity]"
                @update:model-value="updateBatteryPrice(capacity, Number($event))"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Financing Settings -->
      <div v-show="activeCategory === 'financing'" class="p-4 space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Default Down Payment (%)
            </label>
            <Input
              type="number"
              :model-value="localSettings.financing.defaultDownPayment"
              @update:model-value="updateFinancingSetting('defaultDownPayment', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Default Loan Term (years)
            </label>
            <Input
              type="number"
              :model-value="localSettings.financing.defaultLoanTerm"
              @update:model-value="updateFinancingSetting('defaultLoanTerm', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Default Interest Rate (%)
            </label>
            <Input
              type="number"
              step="0.5"
              :model-value="localSettings.financing.defaultInterestRate"
              @update:model-value="updateFinancingSetting('defaultInterestRate', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Default Lease Term (years)
            </label>
            <Input
              type="number"
              :model-value="localSettings.financing.defaultLeaseTerm"
              @update:model-value="updateFinancingSetting('defaultLeaseTerm', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Lease Residual Value (%)
            </label>
            <Input
              type="number"
              :model-value="localSettings.financing.leaseResidualValue"
              @update:model-value="updateFinancingSetting('leaseResidualValue', Number($event))"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Lease Money Factor
            </label>
            <Input
              type="number"
              step="0.001"
              :model-value="localSettings.financing.leaseMoneyFactor"
              @update:model-value="updateFinancingSetting('leaseMoneyFactor', Number($event))"
              size="sm"
            />
          </div>
        </div>
      </div>

      <!-- Scenario Settings -->
      <div v-show="activeCategory === 'scenarios'" class="p-4 space-y-4">
        <div>
          <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            Default Degradation (%/year)
          </label>
          <Input
            type="number"
            step="0.1"
            :model-value="localSettings.scenarios.defaultDegradation"
            @update:model-value="updateScenarioSetting('defaultDegradation', Number($event))"
            size="sm"
            class="max-w-[200px]"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Optimistic -->
          <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div class="text-sm font-medium text-green-700 dark:text-green-400 mb-2">Optimistic Preset</div>
            <div class="space-y-2">
              <div>
                <label class="block text-xs text-green-600 dark:text-green-500">Electricity Rate Change (%)</label>
                <Input
                  type="number"
                  :model-value="localSettings.scenarios.optimisticScenario.electricityRateChange"
                  @update:model-value="updateScenarioSetting('optimisticScenario', { ...localSettings.scenarios.optimisticScenario, electricityRateChange: Number($event) })"
                  size="sm"
                />
              </div>
              <div>
                <label class="block text-xs text-green-600 dark:text-green-500">Consumption Change (%)</label>
                <Input
                  type="number"
                  :model-value="localSettings.scenarios.optimisticScenario.consumptionChange"
                  @update:model-value="updateScenarioSetting('optimisticScenario', { ...localSettings.scenarios.optimisticScenario, consumptionChange: Number($event) })"
                  size="sm"
                />
              </div>
              <div>
                <label class="block text-xs text-green-600 dark:text-green-500">Degradation (%/yr)</label>
                <Input
                  type="number"
                  step="0.1"
                  :model-value="localSettings.scenarios.optimisticScenario.systemDegradation"
                  @update:model-value="updateScenarioSetting('optimisticScenario', { ...localSettings.scenarios.optimisticScenario, systemDegradation: Number($event) })"
                  size="sm"
                />
              </div>
            </div>
          </div>

          <!-- Pessimistic -->
          <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div class="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">Conservative Preset</div>
            <div class="space-y-2">
              <div>
                <label class="block text-xs text-amber-600 dark:text-amber-500">Electricity Rate Change (%)</label>
                <Input
                  type="number"
                  :model-value="localSettings.scenarios.pessimisticScenario.electricityRateChange"
                  @update:model-value="updateScenarioSetting('pessimisticScenario', { ...localSettings.scenarios.pessimisticScenario, electricityRateChange: Number($event) })"
                  size="sm"
                />
              </div>
              <div>
                <label class="block text-xs text-amber-600 dark:text-amber-500">Consumption Change (%)</label>
                <Input
                  type="number"
                  :model-value="localSettings.scenarios.pessimisticScenario.consumptionChange"
                  @update:model-value="updateScenarioSetting('pessimisticScenario', { ...localSettings.scenarios.pessimisticScenario, consumptionChange: Number($event) })"
                  size="sm"
                />
              </div>
              <div>
                <label class="block text-xs text-amber-600 dark:text-amber-500">Degradation (%/yr)</label>
                <Input
                  type="number"
                  step="0.1"
                  :model-value="localSettings.scenarios.pessimisticScenario.systemDegradation"
                  @update:model-value="updateScenarioSetting('pessimisticScenario', { ...localSettings.scenarios.pessimisticScenario, systemDegradation: Number($event) })"
                  size="sm"
                />
              </div>
            </div>
          </div>

          <!-- High Growth -->
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div class="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">High Growth Preset</div>
            <div class="space-y-2">
              <div>
                <label class="block text-xs text-blue-600 dark:text-blue-500">Electricity Rate Change (%)</label>
                <Input
                  type="number"
                  :model-value="localSettings.scenarios.highGrowthScenario.electricityRateChange"
                  @update:model-value="updateScenarioSetting('highGrowthScenario', { ...localSettings.scenarios.highGrowthScenario, electricityRateChange: Number($event) })"
                  size="sm"
                />
              </div>
              <div>
                <label class="block text-xs text-blue-600 dark:text-blue-500">Consumption Change (%)</label>
                <Input
                  type="number"
                  :model-value="localSettings.scenarios.highGrowthScenario.consumptionChange"
                  @update:model-value="updateScenarioSetting('highGrowthScenario', { ...localSettings.scenarios.highGrowthScenario, consumptionChange: Number($event) })"
                  size="sm"
                />
              </div>
              <div>
                <label class="block text-xs text-blue-600 dark:text-blue-500">Degradation (%/yr)</label>
                <Input
                  type="number"
                  step="0.1"
                  :model-value="localSettings.scenarios.highGrowthScenario.systemDegradation"
                  @update:model-value="updateScenarioSetting('highGrowthScenario', { ...localSettings.scenarios.highGrowthScenario, systemDegradation: Number($event) })"
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No category selected -->
      <div v-show="!activeCategory" class="p-6 text-center text-slate-500 dark:text-slate-400">
        <Settings class="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p class="text-sm">Select a category above to view and edit settings</p>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          :disabled="!hasChanges"
          @click="resetToDefaults"
        >
          <RotateCcw class="w-4 h-4" />
          Reset to Defaults
        </Button>
        <Button
          type="button"
          size="sm"
          @click="saveSettings"
        >
          <Save class="w-4 h-4" />
          Save as My Defaults
        </Button>
      </div>
    </div>
  </Card>

  <!-- Compact mode: Professional sidebar-based settings panel -->
  <div v-else class="flex flex-col sm:flex-row min-h-[480px] -m-6">
    <!-- Sidebar Navigation -->
    <div class="sm:w-56 flex-shrink-0 bg-slate-50 dark:bg-slate-900/50 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-700">
      <div class="p-4 border-b border-slate-200 dark:border-slate-700">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 dark:from-slate-500 dark:to-slate-700 flex items-center justify-center">
            <Settings class="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Settings</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">Calculation parameters</p>
          </div>
        </div>
      </div>

      <!-- Category Navigation -->
      <nav class="p-2 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-x-visible">
        <button
          v-for="cat in categories"
          :key="cat.id"
          type="button"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 whitespace-nowrap"
          :class="activeCategory === cat.id
            ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
            : 'hover:bg-white/60 dark:hover:bg-slate-800/60'"
          @click="activeCategory = cat.id"
        >
          <div
            class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            :class="activeCategory === cat.id ? cat.bgActive : cat.bg"
          >
            <component :is="cat.icon" class="w-4 h-4" :class="activeCategory === cat.id ? 'text-white' : cat.color" />
          </div>
          <div class="hidden sm:block">
            <div class="text-sm font-medium" :class="activeCategory === cat.id ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'">
              {{ cat.label }}
            </div>
            <div class="text-xs text-slate-400 dark:text-slate-500">{{ cat.count }} settings</div>
          </div>
        </button>
      </nav>

      <!-- Modified indicator -->
      <div v-if="hasChanges" class="mx-4 my-3 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span class="text-xs font-medium text-amber-700 dark:text-amber-400">Unsaved changes</span>
        </div>
      </div>
    </div>

    <!-- Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Content Header -->
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center"
            :class="currentCategory?.bgActive"
          >
            <component :is="currentCategory?.icon" class="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ currentCategory?.label }}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ currentCategory?.description }}</p>
          </div>
        </div>
      </div>

      <!-- Settings Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Core Settings -->
        <div v-show="activeCategory === 'core'" class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">System Lifetime</span>
                <span class="text-xs text-slate-400">years</span>
              </label>
              <Input
                type="number"
                :model-value="localSettings.core.systemLifetimeYears"
                @update:model-value="updateCoreSetting('systemLifetimeYears', Number($event))"
              />
              <p class="text-xs text-slate-400">Project ROI calculation period</p>
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Performance Ratio</span>
                <span class="text-xs text-slate-400">0-1</span>
              </label>
              <Input
                type="number"
                step="0.01"
                :model-value="localSettings.core.defaultPerformanceRatio"
                @update:model-value="updateCoreSetting('defaultPerformanceRatio', Number($event))"
              />
              <p class="text-xs text-slate-400">System efficiency factor</p>
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Tariff Escalation</span>
                <span class="text-xs text-slate-400">% per year</span>
              </label>
              <Input
                type="number"
                step="0.5"
                :model-value="localSettings.core.defaultTariffEscalation"
                @update:model-value="updateCoreSetting('defaultTariffEscalation', Number($event))"
              />
              <p class="text-xs text-slate-400">Annual electricity rate increase</p>
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Panel Degradation</span>
                <span class="text-xs text-slate-400">% per year</span>
              </label>
              <Input
                type="number"
                step="0.1"
                :model-value="localSettings.core.panelDegradationRate"
                @update:model-value="updateCoreSetting('panelDegradationRate', Number($event))"
              />
              <p class="text-xs text-slate-400">Annual output reduction</p>
            </div>
          </div>
        </div>

        <!-- Carbon Settings -->
        <div v-show="activeCategory === 'carbon'" class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Carbon Credit Price</span>
                <span class="text-xs text-slate-400">Rp/ton</span>
              </label>
              <Input
                type="number"
                :model-value="localSettings.carbon.carbonCreditPriceIdr"
                @update:model-value="updateCarbonSetting('carbonCreditPriceIdr', Number($event))"
              />
              <p class="text-xs text-slate-400">{{ formatCurrency(localSettings.carbon.carbonCreditPriceIdr) }} per ton CO₂</p>
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">CO₂ Emission Factor</span>
                <span class="text-xs text-slate-400">tons/kWh</span>
              </label>
              <Input
                type="number"
                step="0.0001"
                :model-value="localSettings.carbon.co2EmissionFactor"
                @update:model-value="updateCarbonSetting('co2EmissionFactor', Number($event))"
              />
              <p class="text-xs text-slate-400">Indonesia grid average: 0.0007</p>
            </div>
          </div>
        </div>

        <!-- Battery Settings -->
        <div v-show="activeCategory === 'battery'" class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Round-Trip Efficiency</span>
                <span class="text-xs text-slate-400">0-1</span>
              </label>
              <Input
                type="number"
                step="0.01"
                :model-value="localSettings.battery.batteryRoundTripEfficiency"
                @update:model-value="updateBatterySetting('batteryRoundTripEfficiency', Number($event))"
              />
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Battery Degradation</span>
                <span class="text-xs text-slate-400">% per year</span>
              </label>
              <Input
                type="number"
                step="0.5"
                :model-value="localSettings.battery.batteryDegradationRate"
                @update:model-value="updateBatterySetting('batteryDegradationRate', Number($event))"
              />
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Base Self-Consumption</span>
                <span class="text-xs text-slate-400">0-1</span>
              </label>
              <Input
                type="number"
                step="0.01"
                :model-value="localSettings.battery.batterySelfConsumptionBase"
                @update:model-value="updateBatterySetting('batterySelfConsumptionBase', Number($event))"
              />
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Max Self-Consumption</span>
                <span class="text-xs text-slate-400">0-1</span>
              </label>
              <Input
                type="number"
                step="0.01"
                :model-value="localSettings.battery.batterySelfConsumptionMax"
                @update:model-value="updateBatterySetting('batterySelfConsumptionMax', Number($event))"
              />
            </div>
          </div>

          <div class="pt-4 border-t border-slate-200 dark:border-slate-700">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Battery Pricing Tiers
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div v-for="capacity in [5, 10, 15, 20]" :key="capacity" class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div class="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">{{ capacity }} kWh</div>
                <Input
                  type="number"
                  :model-value="localSettings.battery.batteryPrices[capacity]"
                  @update:model-value="updateBatteryPrice(capacity, Number($event))"
                  size="sm"
                />
                <div class="text-xs text-slate-400 mt-1">Rp/kWh</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Financing Settings -->
        <div v-show="activeCategory === 'financing'" class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Down Payment</span>
                <span class="text-xs text-slate-400">%</span>
              </label>
              <Input
                type="number"
                :model-value="localSettings.financing.defaultDownPayment"
                @update:model-value="updateFinancingSetting('defaultDownPayment', Number($event))"
              />
              <p class="text-xs text-slate-400">Default down payment percentage</p>
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Loan Term</span>
                <span class="text-xs text-slate-400">years</span>
              </label>
              <Input
                type="number"
                :model-value="localSettings.financing.defaultLoanTerm"
                @update:model-value="updateFinancingSetting('defaultLoanTerm', Number($event))"
              />
              <p class="text-xs text-slate-400">Default financing duration</p>
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Interest Rate</span>
                <span class="text-xs text-slate-400">% APR</span>
              </label>
              <Input
                type="number"
                step="0.5"
                :model-value="localSettings.financing.defaultInterestRate"
                @update:model-value="updateFinancingSetting('defaultInterestRate', Number($event))"
              />
              <p class="text-xs text-slate-400">Annual percentage rate</p>
            </div>
            <div class="space-y-1.5">
              <label class="flex items-center justify-between">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Lease Term</span>
                <span class="text-xs text-slate-400">years</span>
              </label>
              <Input
                type="number"
                :model-value="localSettings.financing.defaultLeaseTerm"
                @update:model-value="updateFinancingSetting('defaultLeaseTerm', Number($event))"
              />
              <p class="text-xs text-slate-400">Default lease duration</p>
            </div>
          </div>
        </div>

        <!-- Scenario Settings -->
        <div v-show="activeCategory === 'scenarios'" class="space-y-6">
          <div class="max-w-sm space-y-1.5">
            <label class="flex items-center justify-between">
              <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Default Degradation</span>
              <span class="text-xs text-slate-400">% per year</span>
            </label>
            <Input
              type="number"
              step="0.1"
              :model-value="localSettings.scenarios.defaultDegradation"
              @update:model-value="updateScenarioSetting('defaultDegradation', Number($event))"
            />
            <p class="text-xs text-slate-400">Base scenario degradation rate</p>
          </div>

          <div class="pt-4 border-t border-slate-200 dark:border-slate-700">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Scenario Presets
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Optimistic -->
              <div class="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-2 h-2 rounded-full bg-green-500" />
                  <span class="text-sm font-semibold text-green-700 dark:text-green-400">Optimistic</span>
                </div>
                <div class="space-y-2">
                  <div>
                    <label class="text-xs text-green-600 dark:text-green-500">Rate Change (%)</label>
                    <Input
                      type="number"
                      size="sm"
                      :model-value="localSettings.scenarios.optimisticScenario.electricityRateChange"
                      @update:model-value="updateScenarioSetting('optimisticScenario', { ...localSettings.scenarios.optimisticScenario, electricityRateChange: Number($event) })"
                    />
                  </div>
                  <div>
                    <label class="text-xs text-green-600 dark:text-green-500">Degradation (%/yr)</label>
                    <Input
                      type="number"
                      step="0.1"
                      size="sm"
                      :model-value="localSettings.scenarios.optimisticScenario.systemDegradation"
                      @update:model-value="updateScenarioSetting('optimisticScenario', { ...localSettings.scenarios.optimisticScenario, systemDegradation: Number($event) })"
                    />
                  </div>
                </div>
              </div>

              <!-- Conservative -->
              <div class="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-2 h-2 rounded-full bg-amber-500" />
                  <span class="text-sm font-semibold text-amber-700 dark:text-amber-400">Conservative</span>
                </div>
                <div class="space-y-2">
                  <div>
                    <label class="text-xs text-amber-600 dark:text-amber-500">Rate Change (%)</label>
                    <Input
                      type="number"
                      size="sm"
                      :model-value="localSettings.scenarios.pessimisticScenario.electricityRateChange"
                      @update:model-value="updateScenarioSetting('pessimisticScenario', { ...localSettings.scenarios.pessimisticScenario, electricityRateChange: Number($event) })"
                    />
                  </div>
                  <div>
                    <label class="text-xs text-amber-600 dark:text-amber-500">Degradation (%/yr)</label>
                    <Input
                      type="number"
                      step="0.1"
                      size="sm"
                      :model-value="localSettings.scenarios.pessimisticScenario.systemDegradation"
                      @update:model-value="updateScenarioSetting('pessimisticScenario', { ...localSettings.scenarios.pessimisticScenario, systemDegradation: Number($event) })"
                    />
                  </div>
                </div>
              </div>

              <!-- High Growth -->
              <div class="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-2 h-2 rounded-full bg-blue-500" />
                  <span class="text-sm font-semibold text-blue-700 dark:text-blue-400">High Growth</span>
                </div>
                <div class="space-y-2">
                  <div>
                    <label class="text-xs text-blue-600 dark:text-blue-500">Rate Change (%)</label>
                    <Input
                      type="number"
                      size="sm"
                      :model-value="localSettings.scenarios.highGrowthScenario.electricityRateChange"
                      @update:model-value="updateScenarioSetting('highGrowthScenario', { ...localSettings.scenarios.highGrowthScenario, electricityRateChange: Number($event) })"
                    />
                  </div>
                  <div>
                    <label class="text-xs text-blue-600 dark:text-blue-500">Degradation (%/yr)</label>
                    <Input
                      type="number"
                      step="0.1"
                      size="sm"
                      :model-value="localSettings.scenarios.highGrowthScenario.systemDegradation"
                      @update:model-value="updateScenarioSetting('highGrowthScenario', { ...localSettings.scenarios.highGrowthScenario, systemDegradation: Number($event) })"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          :disabled="!hasChanges"
          @click="resetToDefaults"
        >
          <RotateCcw class="w-4 h-4" />
          Reset to Defaults
        </Button>
        <Button
          type="button"
          size="sm"
          @click="saveSettings"
        >
          <Save class="w-4 h-4" />
          Save as Defaults
        </Button>
      </div>
    </div>
  </div>
</template>
