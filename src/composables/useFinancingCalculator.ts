import { computed, ref, type Ref, type ComputedRef } from 'vue'
import {
  calculateLoanPayment,
  calculateLeasePayment,
  type LeaseResult,
} from '@/utils/calculations'

export interface FinancingInputs {
  systemCost: number
  downPaymentPercent: number
  loanTermYears: number
  interestRate: number // Annual rate as percentage (e.g., 12 for 12%)
}

export interface FinancingResult {
  downPayment: number
  principal: number
  monthlyPayment: number
  totalPayments: number
  totalInterest: number
  totalCost: number
}

export type { LeaseResult }

export interface FinancingCalculatorSettings {
  defaultDownPayment: number
  defaultLoanTerm: number
  defaultInterestRate: number
  defaultLeaseTerm: number
  leaseResidualValue: number
  leaseMoneyFactor: number
  loanTermOptions: number[]
  downPaymentOptions: number[]
  interestRateOptions: number[]
  systemLifetimeYears: number
}

// Default settings (fallback if not provided)
const DEFAULT_FINANCING_SETTINGS: FinancingCalculatorSettings = {
  defaultDownPayment: 20,
  defaultLoanTerm: 5,
  defaultInterestRate: 12,
  defaultLeaseTerm: 7,
  leaseResidualValue: 10,
  leaseMoneyFactor: 0.003,
  loanTermOptions: [3, 5, 7, 10],
  downPaymentOptions: [0, 10, 20, 30],
  interestRateOptions: [8, 10, 12, 15],
  systemLifetimeYears: 25,
}

export function useFinancingCalculator(
  systemCost: Ref<number>,
  yearlyProjections: Ref<Array<{ year: number; savings: number }>>,
  settings?: Ref<FinancingCalculatorSettings> | ComputedRef<FinancingCalculatorSettings>
) {
  // Use provided settings or defaults
  const getSettings = () => settings?.value || DEFAULT_FINANCING_SETTINGS

  // Initialize with settings defaults
  const s = getSettings()

  // Financing options
  const financingType = ref<'cash' | 'loan' | 'lease'>('cash')
  const downPaymentPercent = ref(s.defaultDownPayment)
  const loanTermYears = ref(s.defaultLoanTerm)
  const interestRate = ref(s.defaultInterestRate)
  const leaseTermYears = ref(s.defaultLeaseTerm)

  // Loan calculations
  const loanResult = computed<FinancingResult>(() => {
    const cost = systemCost.value || 0
    const downPayment = cost * (downPaymentPercent.value / 100)
    const principal = cost - downPayment
    const monthlyPayment = calculateLoanPayment(principal, interestRate.value, loanTermYears.value)
    const totalPayments = monthlyPayment * loanTermYears.value * 12
    const totalInterest = totalPayments - principal

    return {
      downPayment: Math.round(downPayment),
      principal: Math.round(principal),
      monthlyPayment: Math.round(monthlyPayment),
      totalPayments: Math.round(totalPayments),
      totalInterest: Math.round(totalInterest),
      totalCost: Math.round(downPayment + totalPayments),
    }
  })

  // Lease calculations
  const leaseResult = computed<LeaseResult>(() => {
    const st = getSettings()
    return calculateLeasePayment(
      systemCost.value || 0,
      leaseTermYears.value,
      st.leaseResidualValue,
      st.leaseMoneyFactor
    )
  })

  // Effective ROI considering financing costs
  const totalLifetimeSavings = computed(() =>
    yearlyProjections.value.reduce((sum, p) => sum + p.savings, 0)
  )

  const cashROI = computed(() => {
    if (!systemCost.value) return 0
    return ((totalLifetimeSavings.value - systemCost.value) / systemCost.value) * 100
  })

  const loanROI = computed(() => {
    if (!loanResult.value.totalCost) return 0
    return ((totalLifetimeSavings.value - loanResult.value.totalCost) / loanResult.value.totalCost) * 100
  })

  const leaseROI = computed(() => {
    if (!leaseResult.value.totalCost) return 0
    return ((totalLifetimeSavings.value - leaseResult.value.totalCost) / leaseResult.value.totalCost) * 100
  })

  // Calculate payback period with financing
  const loanPaybackPeriod = computed(() => {
    const st = getSettings()
    if (!loanResult.value.monthlyPayment) return null

    let cumulative = 0
    const monthlyPayment = loanResult.value.monthlyPayment

    for (let year = 1; year <= st.systemLifetimeYears; year++) {
      const projection = yearlyProjections.value[year - 1]
      if (!projection) continue

      // During loan period, net savings = annual savings - annual payments
      const annualPayment = year <= loanTermYears.value ? monthlyPayment * 12 : 0
      const netSavings = projection.savings - annualPayment
      cumulative += netSavings

      // We need to recover down payment + any negative cash flow
      if (cumulative >= loanResult.value.downPayment) {
        const prevCumulative = cumulative - netSavings
        const needed = loanResult.value.downPayment - prevCumulative
        if (needed <= 0) return year - 1
        const fraction = netSavings > 0 ? needed / netSavings : 0
        return Math.round((year - 1 + fraction) * 10) / 10
      }
    }

    return null // Payback > system lifetime
  })

  // Preset options for UI (computed to react to settings changes)
  const loanTermOptions = computed(() =>
    getSettings().loanTermOptions.map((v) => ({ value: v, label: `${v} Years` }))
  )

  const downPaymentOptions = computed(() =>
    getSettings().downPaymentOptions.map((v) => ({ value: v, label: `${v}%` }))
  )

  const interestRateOptions = computed(() =>
    getSettings().interestRateOptions.map((v) => ({ value: v, label: `${v}%` }))
  )

  return {
    // State
    financingType,
    downPaymentPercent,
    loanTermYears,
    interestRate,
    leaseTermYears,

    // Results
    loanResult,
    leaseResult,

    // ROI comparisons
    cashROI,
    loanROI,
    leaseROI,
    loanPaybackPeriod,

    // Options
    loanTermOptions,
    downPaymentOptions,
    interestRateOptions,
  }
}
