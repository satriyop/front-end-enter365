<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatCurrency, formatNumber, formatPercent, formatDate, formatSolarOffset } from '@/utils/format'
import Button from '@/components/ui/Button.vue'
import PaybackChart from '@/components/charts/PaybackChart.vue'
import MonthlyBillChart from '@/components/charts/MonthlyBillChart.vue'
import { Check, X, Sun, Leaf, TrendingUp, Calendar, AlertCircle } from 'lucide-vue-next'

// Types
interface Proposal {
  id: number
  proposal_number: string
  status: string
  status_label: string
  contact: {
    name: string
    email?: string
    phone?: string
  }
  site_name: string
  site_address: string
  province: string
  city: string
  system_capacity_kwp: number
  annual_production_kwh: number
  monthly_production_kwh: number
  monthly_consumption_kwh: number
  electricity_rate: number
  solar_offset_percent: number
  system_cost: number
  payback_years: number
  roi_percent: number
  first_year_savings: number
  total_lifetime_savings: number
  co2_offset_tons: number
  trees_equivalent: number
  valid_until: string
  days_until_expiry: number | null
  is_expired: boolean
  can_accept: boolean
  can_reject: boolean
  financial_analysis?: {
    yearly_projections?: Array<{
      year: number
      savings: number
      cumulative_savings: number
    }>
  }
  environmental_impact?: {
    co2_offset_tons_per_year: number
    trees_equivalent: number
    cars_equivalent: number
  }
}

const route = useRoute()
const token = computed(() => route.params.token as string)

// State
const proposal = ref<Proposal | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const isSubmitting = ref(false)
const showRejectModal = ref(false)
const rejectReason = ref('')
const actionSuccess = ref<'accepted' | 'rejected' | null>(null)

// Chart data computed - Payback Chart
const paybackChartData = computed(() => {
  const projections = proposal.value?.financial_analysis?.yearly_projections
  const systemCost = proposal.value?.system_cost || 0

  if (!projections || projections.length === 0) {
    // Generate default 25-year projection if not available
    const firstYearSavings = proposal.value?.first_year_savings || 0
    let cumulative = -systemCost
    const data = []
    for (let i = 1; i <= 25; i++) {
      const savings = firstYearSavings * Math.pow(1.03, i - 1) // 3% yearly increase
      cumulative += savings
      data.push(cumulative)
    }
    return data
  }

  // Calculate cumulative cash flow starting from -investment
  let cumulative = -systemCost
  return projections.map((p) => {
    cumulative += p.savings
    return cumulative
  })
})

// Find the payback year
const paybackYearIndex = computed(() => {
  const cashFlow = paybackChartData.value
  for (let i = 0; i < cashFlow.length; i++) {
    const value = cashFlow[i]
    if (value !== undefined && value >= 0) {
      return i + 1
    }
  }
  return undefined
})

// Monthly Bill Chart Data
const monthlyBillBefore = computed(() => {
  const consumption = proposal.value?.monthly_consumption_kwh || 0
  const rate = proposal.value?.electricity_rate || 0
  return consumption * rate
})

const monthlyBillAfter = computed(() => {
  const consumption = proposal.value?.monthly_consumption_kwh || 0
  const production = proposal.value?.monthly_production_kwh || 0
  const rate = proposal.value?.electricity_rate || 0
  const remaining = Math.max(0, consumption - production)
  return remaining * rate
})

// Savings = what was actually saved from the bill (billBefore - billAfter)
// This ensures Green + Yellow = Original Bill in the chart
const monthlySavings = computed(() => {
  return monthlyBillBefore.value - monthlyBillAfter.value
})

// For chart: raw values
const monthlyProductionKwh = computed(() => proposal.value?.monthly_production_kwh || 0)
const electricityRate = computed(() => proposal.value?.electricity_rate || 0)

const solarOffsetFormatted = computed(() => formatSolarOffset(proposal.value?.solar_offset_percent))

// Fetch proposal
async function fetchProposal() {
  isLoading.value = true
  error.value = null

  try {
    const response = await fetch(`/api/v1/public/solar-proposals/${token.value}`)

    if (!response.ok) {
      if (response.status === 404) {
        error.value = 'Proposal tidak ditemukan.'
      } else if (response.status === 410) {
        error.value = 'Link proposal sudah kedaluwarsa.'
      } else {
        error.value = 'Terjadi kesalahan saat memuat proposal.'
      }
      return
    }

    const data = await response.json()
    proposal.value = data.data
  } catch (e) {
    error.value = 'Tidak dapat terhubung ke server.'
  } finally {
    isLoading.value = false
  }
}

async function acceptProposal() {
  if (!proposal.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    const response = await fetch(`/api/v1/public/solar-proposals/${token.value}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.ok) {
      actionSuccess.value = 'accepted'
      const data = await response.json()
      proposal.value = data.data
    } else {
      const data = await response.json()
      alert(data.message || 'Gagal menerima proposal.')
    }
  } catch (e) {
    alert('Tidak dapat terhubung ke server.')
  } finally {
    isSubmitting.value = false
  }
}

async function rejectProposal() {
  if (!proposal.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    const response = await fetch(`/api/v1/public/solar-proposals/${token.value}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: rejectReason.value }),
    })

    if (response.ok) {
      actionSuccess.value = 'rejected'
      showRejectModal.value = false
      const data = await response.json()
      proposal.value = data.data
    } else {
      const data = await response.json()
      alert(data.message || 'Gagal menolak proposal.')
    }
  } catch (e) {
    alert('Tidak dapat terhubung ke server.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchProposal()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-slate-900 dark:to-slate-800">
    <!-- Header -->
    <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 py-4">
      <div class="max-w-4xl mx-auto px-4 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-xl font-bold text-slate-900 dark:text-slate-100">Enter365</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">Solar Proposal</p>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="isLoading" class="max-w-4xl mx-auto px-4 py-16 text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 dark:border-orange-400 mx-auto mb-4" />
      <p class="text-slate-600 dark:text-slate-400">Memuat proposal...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-4xl mx-auto px-4 py-16 text-center">
      <AlertCircle class="w-16 h-16 text-red-400 dark:text-red-500 mx-auto mb-4" />
      <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Oops!</h2>
      <p class="text-slate-600 dark:text-slate-400">{{ error }}</p>
    </div>

    <!-- Success Message -->
    <div v-else-if="actionSuccess" class="max-w-4xl mx-auto px-4 py-16 text-center">
      <div
        class="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
        :class="actionSuccess === 'accepted' ? 'bg-green-100' : 'bg-red-100'"
      >
        <Check v-if="actionSuccess === 'accepted'" class="w-10 h-10 text-green-600 dark:text-green-400" />
        <X v-else class="w-10 h-10 text-red-600 dark:text-red-400" />
      </div>
      <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
        {{ actionSuccess === 'accepted' ? 'Proposal Diterima!' : 'Proposal Ditolak' }}
      </h2>
      <p class="text-slate-600 dark:text-slate-400 mb-8">
        {{
          actionSuccess === 'accepted'
            ? 'Terima kasih! Tim kami akan segera menghubungi Anda untuk langkah selanjutnya.'
            : 'Proposal telah ditolak. Terima kasih atas pertimbangan Anda.'
        }}
      </p>
    </div>

    <!-- Proposal Content -->
    <main v-else-if="proposal" class="max-w-4xl mx-auto px-4 py-8">
      <!-- Proposal Header -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div class="text-center mb-6">
          <span
            class="inline-flex px-3 py-1 rounded-full text-sm font-medium mb-4"
            :class="{
              'bg-blue-100 text-blue-700': proposal.status.value === 'sent',
              'bg-green-100 text-green-700': proposal.status.value === 'accepted',
              'bg-red-100 text-red-700': proposal.status.value === 'rejected',
              'bg-slate-100 text-slate-700': proposal.status.value === 'expired',
            }"
          >
            {{ proposal.status_label }}
          </span>
          <h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{{ proposal.proposal_number }}</h2>
          <p class="text-slate-600 dark:text-slate-400">Untuk {{ proposal.contact.name }}</p>
        </div>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-slate-500 dark:text-slate-400">Lokasi</span>
            <p class="font-medium text-slate-900 dark:text-slate-100">{{ proposal.site_name }}</p>
            <p class="text-slate-600 dark:text-slate-400">{{ proposal.city }}, {{ proposal.province }}</p>
          </div>
          <div class="text-right">
            <span class="text-slate-500 dark:text-slate-400">Berlaku Hingga</span>
            <p class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(proposal.valid_until) }}</p>
            <p
              v-if="proposal.days_until_expiry !== null"
              class="text-sm"
              :class="proposal.days_until_expiry <= 7 ? 'text-red-600' : 'text-slate-600'"
            >
              {{ proposal.days_until_expiry }} hari lagi
            </p>
          </div>
        </div>
      </div>

      <!-- System Overview -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div class="flex items-center gap-2 mb-4">
          <Sun class="w-5 h-5 text-orange-500" />
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">Sistem Solar</h3>
        </div>

        <div class="grid grid-cols-2 gap-3 md:gap-4">
          <div class="text-center p-3 md:p-4 bg-orange-50 rounded-xl">
            <div class="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">{{ proposal.system_capacity_kwp }}</div>
            <div class="text-xs sm:text-sm text-slate-600">kWp Kapasitas</div>
          </div>
          <div class="text-center p-3 md:p-4 bg-amber-50 rounded-xl">
            <div class="text-lg sm:text-xl md:text-2xl font-bold text-amber-600">
              {{ formatNumber(proposal.annual_production_kwh) }}
            </div>
            <div class="text-xs sm:text-sm text-slate-600">kWh/tahun</div>
          </div>
          <div class="text-center p-3 md:p-4 rounded-xl" :class="solarOffsetFormatted.isSurplus ? 'bg-emerald-50' : 'bg-green-50'">
            <div class="text-lg sm:text-xl md:text-2xl font-bold" :class="solarOffsetFormatted.isSurplus ? 'text-emerald-600' : 'text-green-600'">{{ solarOffsetFormatted.value }}</div>
            <div class="text-xs sm:text-sm text-slate-600">{{ solarOffsetFormatted.label }}</div>
          </div>
          <div class="text-center p-3 md:p-4 bg-blue-50 rounded-xl">
            <div class="text-base sm:text-lg md:text-xl font-bold text-blue-600 break-words">
              {{ formatCurrency(proposal.system_cost) }}
            </div>
            <div class="text-xs sm:text-sm text-slate-600">Investasi</div>
          </div>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div class="flex items-center gap-2 mb-4">
          <TrendingUp class="w-5 h-5 text-green-500" />
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">Analisis Finansial</h3>
        </div>

        <div class="grid grid-cols-2 gap-3 md:gap-4 mb-6">
          <div class="p-3 md:p-4 border border-slate-200 rounded-xl bg-slate-50">
            <div class="text-lg sm:text-xl md:text-2xl font-bold text-slate-900">{{ proposal.payback_years?.toFixed(1) }}</div>
            <div class="text-xs sm:text-sm text-slate-600">Tahun Balik Modal</div>
          </div>
          <div class="p-3 md:p-4 border border-green-200 rounded-xl bg-green-50">
            <div class="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{{ formatPercent(proposal.roi_percent) }}</div>
            <div class="text-xs sm:text-sm text-slate-600">ROI 25 Tahun</div>
          </div>
          <div class="p-3 md:p-4 border border-slate-200 rounded-xl bg-slate-50">
            <div class="text-base sm:text-lg md:text-xl font-bold text-slate-900 break-words">
              {{ formatCurrency(proposal.first_year_savings) }}
            </div>
            <div class="text-xs sm:text-sm text-slate-600">Hemat Tahun 1</div>
          </div>
          <div class="p-3 md:p-4 border border-green-200 rounded-xl bg-green-50">
            <div class="text-base sm:text-lg md:text-xl font-bold text-green-600 break-words">
              {{ formatCurrency(proposal.total_lifetime_savings) }}
            </div>
            <div class="text-xs sm:text-sm text-slate-600">Total Hemat 25 Thn</div>
          </div>
        </div>

        <!-- Payback Period Chart -->
        <div class="border-t border-slate-200 pt-6">
          <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-medium text-slate-700">Periode Balik Modal</h4>
            <span v-if="paybackYearIndex" class="text-sm font-medium text-orange-600">
              Break-even: Tahun {{ paybackYearIndex }}
            </span>
          </div>
          <PaybackChart
            v-if="paybackChartData.length"
            :cumulative-cash-flow="paybackChartData"
            :payback-year="paybackYearIndex"
            :height="280"
          />
          <div class="flex justify-center gap-4 text-xs text-slate-500 mt-3">
            <span class="flex items-center gap-1">
              <span class="w-3 h-3 rounded bg-red-500"></span> Masa Pengembalian
            </span>
            <span class="flex items-center gap-1">
              <span class="w-3 h-3 rounded bg-green-500"></span> Keuntungan Bersih
            </span>
          </div>
        </div>
      </div>

      <!-- Monthly Bill Comparison -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div class="flex items-center gap-2 mb-4">
          <TrendingUp class="w-5 h-5 text-green-500" />
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">Perbandingan Tagihan Listrik</h3>
        </div>
        <p class="text-sm text-slate-600 mb-4">
          Ilustrasi tagihan bulanan sebelum dan sesudah pemasangan solar
        </p>
        <MonthlyBillChart
          v-if="monthlyBillBefore > 0"
          :bill-before="monthlyBillBefore"
          :bill-after="monthlyBillAfter"
          :monthly-production-kwh="monthlyProductionKwh"
          :electricity-rate="electricityRate"
          :height="250"
        />
        <div class="grid grid-cols-3 gap-2 mt-4 text-center text-xs sm:text-sm">
          <div class="p-2 bg-yellow-50 rounded-lg">
            <div class="font-bold text-yellow-700">{{ formatCurrency(monthlyBillBefore) }}</div>
            <div class="text-slate-500">Sebelum/bln</div>
          </div>
          <div class="p-2 bg-green-50 rounded-lg">
            <div class="font-bold text-green-600">{{ formatCurrency(monthlyBillAfter) }}</div>
            <div class="text-slate-500">Sesudah/bln</div>
          </div>
          <div class="p-2 bg-emerald-50 rounded-lg">
            <div class="font-bold text-emerald-600">{{ formatCurrency(monthlySavings) }}</div>
            <div class="text-slate-500">Hemat/bln</div>
          </div>
        </div>
      </div>

      <!-- Environmental Impact -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div class="flex items-center gap-2 mb-4">
          <Leaf class="w-5 h-5 text-green-500" />
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">Dampak Lingkungan</h3>
        </div>

        <p class="text-sm text-slate-600 mb-4">
          Dengan menggunakan energi surya, Anda berkontribusi pada lingkungan yang lebih bersih
        </p>

        <div class="grid grid-cols-2 gap-3 md:gap-4">
          <div class="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <div class="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{{ proposal.co2_offset_tons?.toFixed(1) }}</div>
            <div class="text-xs sm:text-sm text-slate-600">Ton CO₂/tahun dikurangi</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <div class="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{{ formatNumber(proposal.trees_equivalent) }}</div>
            <div class="text-xs sm:text-sm text-slate-600">Pohon setara ditanam</div>
          </div>
        </div>

        <!-- 25 Year Impact -->
        <div class="mt-4 p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200">
          <div class="text-center">
            <div class="text-xs text-green-700 mb-1">Dalam 25 Tahun</div>
            <div class="text-xl sm:text-2xl font-bold text-green-700">
              {{ ((proposal.co2_offset_tons || 0) * 25).toFixed(0) }} Ton CO₂
            </div>
            <div class="text-xs text-green-600 mt-1">karbon dioksida yang tidak dilepaskan ke atmosfer</div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        v-if="proposal.status.value === 'sent' && !proposal.is_expired"
        class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6"
      >
        <div class="flex items-center gap-2 mb-4">
          <Calendar class="w-5 h-5 text-slate-500" />
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">Keputusan Anda</h3>
        </div>

        <p class="text-slate-600 dark:text-slate-400 mb-6">
          Silakan tinjau proposal di atas dan berikan keputusan Anda. Proposal ini berlaku hingga
          <strong class="text-slate-900 dark:text-slate-100">{{ formatDate(proposal.valid_until) }}</strong
          >.
        </p>

        <div class="flex flex-col sm:flex-row gap-3">
          <Button
            class="flex-1 justify-center"
            :disabled="isSubmitting || !proposal.can_accept"
            @click="acceptProposal"
          >
            <Check class="w-4 h-4" />
            Terima Proposal
          </Button>
          <Button
            variant="outline"
            class="flex-1 justify-center text-red-600 border-red-300 hover:bg-red-50"
            :disabled="isSubmitting || !proposal.can_reject"
            @click="showRejectModal = true"
          >
            <X class="w-4 h-4" />
            Tolak Proposal
          </Button>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
      <p>Powered by Enter365</p>
    </footer>

    <!-- Reject Modal -->
    <Teleport to="body">
      <div
        v-if="showRejectModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Tolak Proposal</h3>
          <p class="text-slate-600 dark:text-slate-400 mb-4">
            Apakah Anda yakin ingin menolak proposal ini? Anda dapat memberikan alasan penolakan (opsional).
          </p>
          <textarea
            v-model="rejectReason"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
            rows="3"
            placeholder="Alasan penolakan (opsional)..."
          />
          <div class="flex gap-3">
            <Button
              variant="outline"
              class="flex-1"
              :disabled="isSubmitting"
              @click="showRejectModal = false"
            >
              Batal
            </Button>
            <Button
              class="flex-1 bg-red-600 hover:bg-red-700"
              :disabled="isSubmitting"
              @click="rejectProposal"
            >
              Tolak Proposal
            </Button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
