<script setup lang="ts">
import { computed, ref, toRef } from 'vue'
import Card from '@/components/ui/Card.vue'
import Select from '@/components/ui/Select.vue'
import { formatCurrency, formatPercent } from '@/utils/format'
import { useFinancingCalculator, type FinancingCalculatorSettings } from '@/composables/useFinancingCalculator'
import {
  Banknote,
  CreditCard,
  FileText,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-vue-next'

interface Props {
  systemCost: number
  yearlyProjections: Array<{ year: number; savings: number }>
  settings?: FinancingCalculatorSettings
}

const props = defineProps<Props>()

// Convert props to refs for the composable
const systemCostRef = toRef(props, 'systemCost')
const yearlyProjectionsRef = toRef(props, 'yearlyProjections')

const isExpanded = ref(true)

// Only pass settings ref if settings prop is provided
const settingsRef = props.settings ? computed(() => props.settings!) : undefined

const {
  financingType,
  downPaymentPercent,
  loanTermYears,
  interestRate,
  loanResult,
  leaseResult,
  cashROI,
  loanROI,
  leaseROI,
  loanTermOptions,
  downPaymentOptions,
  interestRateOptions,
} = useFinancingCalculator(systemCostRef, yearlyProjectionsRef, settingsRef)

const financingTabs = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'loan', label: 'Loan', icon: CreditCard },
  { value: 'lease', label: 'Lease', icon: FileText },
]

// Options are now computed from settings via the composable

const currentROI = computed(() => {
  switch (financingType.value) {
    case 'loan':
      return loanROI.value
    case 'lease':
      return leaseROI.value
    default:
      return cashROI.value
  }
})

const currentTotalCost = computed(() => {
  switch (financingType.value) {
    case 'loan':
      return loanResult.value.totalCost
    case 'lease':
      return leaseResult.value.totalCost
    default:
      return props.systemCost
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
        <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <Banknote class="w-5 h-5" />
        </div>
        <div class="text-left">
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">Financing Options</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">Compare payment methods</p>
        </div>
      </div>
      <component
        :is="isExpanded ? ChevronUp : ChevronDown"
        class="w-5 h-5 text-slate-400"
      />
    </button>

    <!-- Expandable content -->
    <div v-show="isExpanded" class="border-t border-slate-200 dark:border-slate-700">
      <!-- Financing Type Tabs -->
      <div class="p-4 border-b border-slate-200 dark:border-slate-700">
        <div class="flex gap-2">
          <button
            v-for="tab in financingTabs"
            :key="tab.value"
            type="button"
            class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all"
            :class="
              financingType === tab.value
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            "
            @click="financingType = tab.value as 'cash' | 'loan' | 'lease'"
          >
            <component :is="tab.icon" class="w-4 h-4" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Cash Option -->
      <div v-if="financingType === 'cash'" class="p-4 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
              <DollarSign class="w-4 h-4" />
              Total Cost
            </div>
            <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(systemCost) }}
            </div>
          </div>
          <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div class="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm mb-1">
              <TrendingUp class="w-4 h-4" />
              25-Year ROI
            </div>
            <div class="text-2xl font-bold text-green-600 dark:text-green-400">
              {{ formatPercent(cashROI) }}
            </div>
          </div>
        </div>
        <p class="text-sm text-slate-500 dark:text-slate-400 text-center">
          Best ROI with no interest costs
        </p>
      </div>

      <!-- Loan Option -->
      <div v-if="financingType === 'loan'" class="p-4 space-y-4">
        <!-- Loan Parameters -->
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Down Payment
            </label>
            <Select
              v-model="downPaymentPercent"
              :options="downPaymentOptions"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Loan Term
            </label>
            <Select
              v-model="loanTermYears"
              :options="loanTermOptions"
              size="sm"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              Interest Rate
            </label>
            <Select
              v-model="interestRate"
              :options="interestRateOptions"
              size="sm"
            />
          </div>
        </div>

        <!-- Loan Results -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
            <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Down Payment</div>
            <div class="text-lg font-bold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(loanResult.downPayment) }}
            </div>
          </div>
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
            <div class="text-xs text-blue-600 dark:text-blue-400 mb-1">Monthly Payment</div>
            <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
              {{ formatCurrency(loanResult.monthlyPayment) }}
            </div>
          </div>
          <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
            <div class="text-xs text-amber-600 dark:text-amber-400 mb-1">Total Interest</div>
            <div class="text-lg font-bold text-amber-600 dark:text-amber-400">
              {{ formatCurrency(loanResult.totalInterest) }}
            </div>
          </div>
          <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
            <div class="text-xs text-green-600 dark:text-green-400 mb-1">25-Year ROI</div>
            <div class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ formatPercent(loanROI) }}
            </div>
          </div>
        </div>

        <!-- Total Cost Comparison -->
        <div class="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-600 dark:text-slate-400">Total Cost (Down + Payments)</span>
            <span class="font-bold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(loanResult.totalCost) }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs mt-1">
            <span class="text-slate-500 dark:text-slate-500">vs Cash Purchase</span>
            <span class="text-red-500">
              +{{ formatCurrency(loanResult.totalCost - systemCost) }} ({{ formatPercent((loanResult.totalInterest / systemCost) * 100) }})
            </span>
          </div>
        </div>
      </div>

      <!-- Lease Option -->
      <div v-if="financingType === 'lease'" class="p-4 space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
            <div class="text-xs text-blue-600 dark:text-blue-400 mb-1">Monthly Lease</div>
            <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
              {{ formatCurrency(leaseResult.monthlyLease) }}
            </div>
          </div>
          <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
            <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Lease Payments</div>
            <div class="text-lg font-bold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(leaseResult.totalLeasePayments) }}
            </div>
          </div>
          <div class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
            <div class="text-xs text-purple-600 dark:text-purple-400 mb-1">Buyout Price</div>
            <div class="text-lg font-bold text-purple-600 dark:text-purple-400">
              {{ formatCurrency(leaseResult.buyoutPrice) }}
            </div>
          </div>
          <div class="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
            <div class="text-xs text-green-600 dark:text-green-400 mb-1">25-Year ROI</div>
            <div class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ formatPercent(leaseROI) }}
            </div>
          </div>
        </div>

        <!-- Total Cost -->
        <div class="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-600 dark:text-slate-400">Total Cost (Lease + Buyout)</span>
            <span class="font-bold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(leaseResult.totalCost) }}
            </span>
          </div>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400 text-center">
          7-year lease with 10% residual value buyout option
        </p>
      </div>

      <!-- Summary Comparison Bar -->
      <div class="p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800 border-t border-slate-200 dark:border-slate-700">
        <div class="flex items-center justify-between">
          <div class="text-sm">
            <span class="text-slate-500 dark:text-slate-400">Selected: </span>
            <span class="font-semibold text-slate-900 dark:text-slate-100 capitalize">{{ financingType }}</span>
          </div>
          <div class="flex items-center gap-4 text-sm">
            <div>
              <span class="text-slate-500 dark:text-slate-400">Total: </span>
              <span class="font-bold text-slate-900 dark:text-slate-100">{{ formatCurrency(currentTotalCost) }}</span>
            </div>
            <div>
              <span class="text-slate-500 dark:text-slate-400">ROI: </span>
              <span class="font-bold text-green-600 dark:text-green-400">{{ formatPercent(currentROI) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>
