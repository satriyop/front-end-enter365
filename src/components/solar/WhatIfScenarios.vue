<script setup lang="ts">
import { ref, toRef, computed } from 'vue'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import { formatCurrency, formatPercent } from '@/utils/format'
import { useScenarioCalculator, type ScenarioCalculatorSettings } from '@/composables/useScenarioCalculator'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  RotateCcw,
  Zap,
  Battery,
  ChevronDown,
  ChevronUp,
  Sun,
} from 'lucide-vue-next'

interface Props {
  annualProduction: number
  electricityRate: number
  tariffEscalation: number
  systemCost: number
  settings?: ScenarioCalculatorSettings
}

const props = defineProps<Props>()

// Convert props to refs for the composable
const annualProductionRef = toRef(props, 'annualProduction')
const electricityRateRef = toRef(props, 'electricityRate')
const tariffEscalationRef = toRef(props, 'tariffEscalation')
const systemCostRef = toRef(props, 'systemCost')

const isExpanded = ref(false)

// Only pass settings ref if settings prop is provided
const settingsRef = props.settings ? computed(() => props.settings!) : undefined

const { params, comparison, resetParams, presets } = useScenarioCalculator(
  {
    annualProduction: annualProductionRef,
    electricityRate: electricityRateRef,
    tariffEscalation: tariffEscalationRef,
    systemCost: systemCostRef,
  },
  settingsRef
)

function getTrendIcon(value: number) {
  if (value > 0) return TrendingUp
  if (value < 0) return TrendingDown
  return Minus
}

function getTrendClass(value: number, inverse = false) {
  if (value > 0) return inverse ? 'text-red-500' : 'text-green-500'
  if (value < 0) return inverse ? 'text-green-500' : 'text-red-500'
  return 'text-slate-400'
}

const presetButtons = [
  { key: 'optimistic', label: 'Optimistic', color: 'text-green-500' },
  { key: 'pessimistic', label: 'Conservative', color: 'text-amber-500' },
  { key: 'highGrowth', label: 'High Growth', color: 'text-blue-500' },
]
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
        <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <Sparkles class="w-5 h-5" />
        </div>
        <div class="text-left">
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">What-If Analysis</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">Explore different scenarios</p>
        </div>
      </div>
      <component
        :is="isExpanded ? ChevronUp : ChevronDown"
        class="w-5 h-5 text-slate-400"
      />
    </button>

    <!-- Expandable content -->
    <div v-show="isExpanded" class="border-t border-slate-200 dark:border-slate-700">
      <!-- Preset Buttons -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs font-medium text-slate-500 dark:text-slate-400">Presets:</span>
          <Button
            v-for="preset in presetButtons"
            :key="preset.key"
            size="xs"
            variant="outline"
            @click="presets[preset.key as keyof typeof presets]()"
          >
            <span :class="preset.color">{{ preset.label }}</span>
          </Button>
          <Button size="xs" variant="ghost" @click="resetParams">
            <RotateCcw class="w-3 h-3" />
            Reset
          </Button>
        </div>
      </div>

      <!-- Sliders -->
      <div class="p-4 space-y-5">
        <!-- Electricity Rate Change -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Zap class="w-4 h-4 text-amber-500" />
              Electricity Rate Change
            </label>
            <span
              class="text-sm font-bold"
              :class="getTrendClass(params.electricityRateChange)"
            >
              {{ params.electricityRateChange > 0 ? '+' : '' }}{{ params.electricityRateChange }}%
            </span>
          </div>
          <input
            v-model.number="params.electricityRateChange"
            type="range"
            min="-20"
            max="30"
            step="5"
            class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div class="flex justify-between text-xs text-slate-400 mt-1">
            <span>-20%</span>
            <span>0%</span>
            <span>+30%</span>
          </div>
        </div>

        <!-- Production/Consumption Change -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Sun class="w-4 h-4 text-orange-500" />
              Production Adjustment
            </label>
            <span
              class="text-sm font-bold"
              :class="getTrendClass(params.consumptionChange)"
            >
              {{ params.consumptionChange > 0 ? '+' : '' }}{{ params.consumptionChange }}%
            </span>
          </div>
          <input
            v-model.number="params.consumptionChange"
            type="range"
            min="-30"
            max="30"
            step="5"
            class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div class="flex justify-between text-xs text-slate-400 mt-1">
            <span>-30%</span>
            <span>0%</span>
            <span>+30%</span>
          </div>
        </div>

        <!-- System Degradation -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              <Battery class="w-4 h-4 text-blue-500" />
              Annual Degradation
            </label>
            <span class="text-sm font-bold text-slate-600 dark:text-slate-400">
              {{ params.systemDegradation }}%/year
            </span>
          </div>
          <input
            v-model.number="params.systemDegradation"
            type="range"
            min="0.3"
            max="1.5"
            step="0.1"
            class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <div class="flex justify-between text-xs text-slate-400 mt-1">
            <span>0.3% (best)</span>
            <span>0.5% (typical)</span>
            <span>1.5% (worst)</span>
          </div>
        </div>
      </div>

      <!-- Results Comparison -->
      <div class="p-4 bg-gradient-to-r from-slate-50 to-purple-50 dark:from-slate-800/50 dark:to-purple-900/20 border-t border-slate-200 dark:border-slate-700">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <!-- Annual Savings -->
          <div class="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Annual Savings</div>
            <div class="text-lg font-bold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(comparison.scenario.annualSavings) }}
            </div>
            <div
              class="flex items-center gap-1 text-xs mt-1"
              :class="getTrendClass(comparison.changes.annualSavingsPercent)"
            >
              <component :is="getTrendIcon(comparison.changes.annualSavingsPercent)" class="w-3 h-3" />
              {{ comparison.changes.annualSavingsPercent > 0 ? '+' : '' }}{{ formatPercent(comparison.changes.annualSavingsPercent) }}
            </div>
          </div>

          <!-- Total Savings -->
          <div class="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">25-Year Savings</div>
            <div class="text-lg font-bold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(comparison.scenario.totalLifetimeSavings) }}
            </div>
            <div
              class="flex items-center gap-1 text-xs mt-1"
              :class="getTrendClass(comparison.changes.totalSavingsPercent)"
            >
              <component :is="getTrendIcon(comparison.changes.totalSavingsPercent)" class="w-3 h-3" />
              {{ comparison.changes.totalSavingsPercent > 0 ? '+' : '' }}{{ formatPercent(comparison.changes.totalSavingsPercent) }}
            </div>
          </div>

          <!-- Payback Period -->
          <div class="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Payback Period</div>
            <div class="text-lg font-bold text-slate-900 dark:text-slate-100">
              {{ comparison.scenario.paybackPeriod?.toFixed(1) || '>25' }} yrs
            </div>
            <div
              v-if="comparison.changes.paybackDelta !== null"
              class="flex items-center gap-1 text-xs mt-1"
              :class="getTrendClass(comparison.changes.paybackDelta, true)"
            >
              <component :is="getTrendIcon(-comparison.changes.paybackDelta)" class="w-3 h-3" />
              {{ comparison.changes.paybackDelta > 0 ? '+' : '' }}{{ comparison.changes.paybackDelta.toFixed(1) }} yrs
            </div>
          </div>

          <!-- ROI -->
          <div class="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">ROI</div>
            <div class="text-lg font-bold text-slate-900 dark:text-slate-100">
              {{ formatPercent(comparison.scenario.roi) }}
            </div>
            <div
              class="flex items-center gap-1 text-xs mt-1"
              :class="getTrendClass(comparison.changes.roiDelta)"
            >
              <component :is="getTrendIcon(comparison.changes.roiDelta)" class="w-3 h-3" />
              {{ comparison.changes.roiDelta > 0 ? '+' : '' }}{{ formatPercent(comparison.changes.roiDelta) }}
            </div>
          </div>
        </div>

        <!-- Base vs Scenario Legend -->
        <div class="mt-3 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div class="flex items-center gap-1">
            <div class="w-2 h-2 rounded-full bg-slate-400" />
            Base: {{ formatCurrency(comparison.base.totalLifetimeSavings) }}
          </div>
          <div class="flex items-center gap-1">
            <div class="w-2 h-2 rounded-full bg-purple-500" />
            Scenario: {{ formatCurrency(comparison.scenario.totalLifetimeSavings) }}
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>
