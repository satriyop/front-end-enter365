import axios from 'axios'
import { ref } from 'vue'

/**
 * Public Solar Calculator API - No authentication required
 */
const publicApi = axios.create({
  baseURL: '/api/v1/public/solar-calculator',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Types for the calculator
export interface PlnTariff {
  category_code: string
  category_name: string
  customer_type: string
  power_va_min: number
  power_va_max: number | null
  rate_per_kwh: number
}

export interface CalculatorInput {
  monthly_bill: number
  pln_power_va?: number
  pln_category?: string
  target_savings?: number
  price_per_kwp?: number
}

export interface CalculatorResult {
  input: {
    monthly_bill: number
    target_savings: number
    pln_tariff: {
      code: string
      name: string
      rate_per_kwh: number
    }
    peak_sun_hours: number
  }
  recommendation: {
    capacity_kwp: number
    estimated_panels: number
    roof_area_m2: number
  }
  production: {
    monthly_kwh: number
    annual_kwh: number
  }
  savings: {
    monthly_bill_before: number
    monthly_bill_after: number
    monthly_savings: number
    annual_savings: number
    solar_offset_percent: number
  }
  financial: {
    investment_cost: number
    price_per_kwp: number
    payback_years: number | null
    roi_percent: number
    lifetime_savings: number
    npv: number
  }
  environmental: {
    co2_offset_tons_per_year: number
    trees_equivalent: number
    co2_lifetime_tons: number
  }
}

export function usePublicSolarCalculator() {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const result = ref<CalculatorResult | null>(null)
  const tariffs = ref<PlnTariff[]>([])

  /**
   * Calculate solar system recommendation
   */
  async function calculate(input: CalculatorInput): Promise<CalculatorResult | null> {
    loading.value = true
    error.value = null

    try {
      const response = await publicApi.post<{ data: CalculatorResult }>('/calculate', input)
      result.value = response.data.data
      return result.value
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined
        error.value = data?.message || 'Gagal menghitung. Silakan coba lagi.'
      } else {
        error.value = 'Terjadi kesalahan. Silakan coba lagi.'
      }
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch PLN tariffs
   */
  async function fetchTariffs(): Promise<PlnTariff[]> {
    try {
      const response = await publicApi.get<{
        data: { tariffs: PlnTariff[]; grouped: Record<string, PlnTariff[]> }
      }>('/tariffs')
      tariffs.value = response.data.data.tariffs
      return tariffs.value
    } catch (err) {
      console.error('Failed to fetch tariffs:', err)
      return []
    }
  }

  return {
    // State
    loading,
    error,
    result,
    tariffs,

    // Methods
    calculate,
    fetchTariffs,
  }
}
