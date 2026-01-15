<script setup lang="ts">
import { ref, watch, toRef, computed } from 'vue'
import Card from '@/components/ui/Card.vue'
import { formatCurrency, formatPercent, formatNumber } from '@/utils/format'
import { useBatteryCalculator, type BatteryCalculatorSettings } from '@/composables/useBatteryCalculator'
import {
  Battery,
  BatteryCharging,
  Zap,
  Sun,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Shield,
} from 'lucide-vue-next'

interface Props {
  systemCost: number
  annualProduction: number
  monthlyConsumption: number
  electricityRate: number
  yearlyProjections: Array<{ year: number; savings: number }>
  paybackPeriod: number | null
  settings?: BatteryCalculatorSettings
}

const props = defineProps<Props>()

// Convert props to refs for the composable
const systemCostRef = toRef(props, 'systemCost')
const annualProductionRef = toRef(props, 'annualProduction')
const monthlyConsumptionRef = toRef(props, 'monthlyConsumption')
const electricityRateRef = toRef(props, 'electricityRate')
const yearlyProjectionsRef = toRef(props, 'yearlyProjections')
const paybackPeriodRef = toRef(props, 'paybackPeriod')

const isExpanded = ref(false)

// Only pass settings ref if settings prop is provided
const settingsRef = props.settings ? computed(() => props.settings!) : undefined

const { config, result, capacityOptions, setCapacity, recommendation } = useBatteryCalculator(
  {
    systemCost: systemCostRef,
    annualProduction: annualProductionRef,
    monthlyConsumption: monthlyConsumptionRef,
    electricityRate: electricityRateRef,
    yearlyProjections: yearlyProjectionsRef,
    paybackPeriod: paybackPeriodRef,
  },
  settingsRef
)

// Apply recommendation on first expand
watch(isExpanded, (expanded) => {
  if (expanded && !config.value.enabled) {
    setCapacity(recommendation.value)
  }
})
</script>

<template>
  <Card class="overflow-hidden">
    <!-- Header with toggle -->
    <button
      type="button"
      class="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      @click="isExpanded = !isExpanded"
    >
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <BatteryCharging class="w-5 h-5" />
        </div>
        <div class="text-left">
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">Battery Storage</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">Add backup power & increase savings</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span
          v-if="config.enabled"
          class="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
        >
          {{ config.capacityKwh }} kWh
        </span>
        <component
          :is="isExpanded ? ChevronUp : ChevronDown"
          class="w-5 h-5 text-slate-400"
        />
      </div>
    </button>

    <!-- Expandable content -->
    <div v-show="isExpanded" class="border-t border-slate-200 dark:border-slate-700">
      <!-- Enable Toggle -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <label class="flex items-center justify-between cursor-pointer">
          <div class="flex items-center gap-3">
            <Battery class="w-5 h-5 text-slate-500" />
            <div>
              <span class="font-medium text-slate-900 dark:text-slate-100">Add Battery Storage</span>
              <p class="text-xs text-slate-500 dark:text-slate-400">Store excess solar for nighttime use</p>
            </div>
          </div>
          <div class="relative">
            <input
              v-model="config.enabled"
              type="checkbox"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500" />
          </div>
        </label>
      </div>

      <!-- Battery Configuration -->
      <div v-if="config.enabled" class="p-4 space-y-4">
        <!-- Capacity Selection -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">
              Battery Capacity
            </label>
            <div class="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Lightbulb class="w-3 h-3" />
              Recommended: {{ recommendation }} kWh
            </div>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="option in capacityOptions"
              :key="option.value"
              type="button"
              class="p-3 rounded-xl text-center transition-all"
              :class="
                config.capacityKwh === option.value
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              "
              @click="setCapacity(option.value)"
            >
              <div class="text-lg font-bold">{{ option.label }}</div>
              <div class="text-xs opacity-80">{{ formatCurrency(option.value * (option.price || 0)) }}</div>
            </button>
          </div>
        </div>

        <!-- Results Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <!-- Battery Cost -->
          <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div class="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-1">
              <Battery class="w-3 h-3" />
              Battery Cost
            </div>
            <div class="text-lg font-bold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(result.batteryCost) }}
            </div>
          </div>

          <!-- Backup Hours -->
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div class="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-1">
              <Shield class="w-3 h-3" />
              Backup Duration
            </div>
            <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
              {{ result.backupHours }} hrs
            </div>
          </div>

          <!-- Self Consumption -->
          <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
            <div class="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mb-1">
              <Sun class="w-3 h-3" />
              Self-Use Rate
            </div>
            <div class="text-lg font-bold text-amber-600 dark:text-amber-400">
              {{ formatPercent(result.selfConsumptionWithBattery) }}
            </div>
            <div class="text-xs text-amber-500">
              +{{ formatPercent(result.selfConsumptionIncrease) }}
            </div>
          </div>

          <!-- Additional Savings -->
          <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mb-1">
              <Zap class="w-3 h-3" />
              Extra Savings/yr
            </div>
            <div class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ formatCurrency(result.additionalAnnualSavings) }}
            </div>
          </div>
        </div>

        <!-- Impact Summary -->
        <div class="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <h4 class="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-3">
            System Impact with {{ config.capacityKwh }} kWh Battery
          </h4>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <!-- Total System Cost -->
            <div>
              <div class="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Total Investment</div>
              <div class="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                {{ formatCurrency(result.totalSystemCost) }}
              </div>
            </div>

            <!-- New Payback -->
            <div>
              <div class="text-xs text-emerald-600 dark:text-emerald-400 mb-1">New Payback</div>
              <div class="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                {{ result.newPaybackPeriod?.toFixed(1) || '>25' }} yrs
              </div>
              <div
                v-if="result.paybackDelta !== null"
                class="text-xs"
                :class="result.paybackDelta > 0 ? 'text-red-500' : 'text-green-500'"
              >
                {{ result.paybackDelta > 0 ? '+' : '' }}{{ result.paybackDelta.toFixed(1) }} yrs
              </div>
            </div>

            <!-- New ROI -->
            <div>
              <div class="text-xs text-emerald-600 dark:text-emerald-400 mb-1">New ROI</div>
              <div class="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                {{ formatPercent(result.newROI) }}
              </div>
              <div
                class="text-xs"
                :class="result.roiDelta >= 0 ? 'text-green-500' : 'text-red-500'"
              >
                {{ result.roiDelta >= 0 ? '+' : '' }}{{ formatPercent(result.roiDelta) }}
              </div>
            </div>

            <!-- 25-Year Extra Savings -->
            <div>
              <div class="text-xs text-emerald-600 dark:text-emerald-400 mb-1">25-Year Bonus</div>
              <div class="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                {{ formatCurrency(result.additionalLifetimeSavings) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Warning if oversized -->
        <div
          v-if="config.capacityKwh > recommendation * 1.5"
          class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-700"
        >
          <div class="flex items-start gap-2">
            <Lightbulb class="w-4 h-4 text-amber-500 mt-0.5" />
            <div class="text-sm text-amber-700 dark:text-amber-400">
              <strong>Oversized battery:</strong> A {{ recommendation }} kWh battery may be more cost-effective for your {{ formatNumber(annualProduction / 365) }} kWh/day production.
            </div>
          </div>
        </div>
      </div>

      <!-- Disabled state hint -->
      <div v-if="!config.enabled" class="p-4 text-center text-slate-500 dark:text-slate-400">
        <BatteryCharging class="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p class="text-sm">Enable battery storage to see impact analysis</p>
      </div>
    </div>
  </Card>
</template>
