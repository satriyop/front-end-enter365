<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import Modal from '@/components/ui/Modal.vue'
import PaybackChart from '@/components/charts/PaybackChart.vue'
import MonthlyBillChart from '@/components/charts/MonthlyBillChart.vue'
import { useToast } from '@/components/ui/Toast/useToast'
import { formatCurrency, formatDate, formatNumber, formatPercent, formatSolarOffset } from '@/utils/format'
import { getErrorMessage } from '@/api/client'
import {
  useSolarProposal,
  useSendSolarProposal,
  useAcceptSolarProposal,
  useRejectSolarProposal,
  useConvertSolarToQuotation,
  useDeleteSolarProposal,
  useCalculateSolarProposal,
  downloadSolarProposalPdf,
  downloadSolarProposalExcel,
} from '@/api/useSolarProposals'

// Type interfaces for financial analysis (OpenAPI types these as unknown[])
interface YearlyProjection {
  year: number
  savings: number
  cumulative_savings: number
  electricity_rate: number
}

interface FinancialAnalysis {
  payback_period_years: number
  roi_percent: number
  npv: number
  irr_percent: number
  yearly_projections: YearlyProjection[]
}

interface EnvironmentalImpact {
  co2_offset_tons: number
  co2_lifetime_tons: number
  trees_equivalent: number
  cars_equivalent: number
}

const route = useRoute()
const router = useRouter()
const toast = useToast()

const proposalId = computed(() => Number(route.params.id))

const { data: proposal, isLoading, error } = useSolarProposal(proposalId)

// Mutations
const sendMutation = useSendSolarProposal()
const acceptMutation = useAcceptSolarProposal()
const rejectMutation = useRejectSolarProposal()
const convertMutation = useConvertSolarToQuotation()
const deleteMutation = useDeleteSolarProposal()
const calculateMutation = useCalculateSolarProposal()

// Modal states
const showRejectModal = ref(false)
const showDeleteConfirm = ref(false)
const rejectReason = ref('')
const isDownloadingPdf = ref(false)
const isDownloadingExcel = ref(false)

// Status-based action availability
const canEdit = computed(() => proposal.value?.can_edit)
const canSend = computed(() => proposal.value?.can_send)
const canAccept = computed(() => proposal.value?.can_accept)
const canReject = computed(() => proposal.value?.can_reject)
const canConvert = computed(() => proposal.value?.can_convert)
const canDelete = computed(() => proposal.value?.status === 'draft')

// Action handlers
async function handleSend() {
  try {
    await sendMutation.mutateAsync(proposalId.value)
    toast.success('Proposal sent to customer')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to send proposal'))
  }
}

async function handleAccept() {
  try {
    await acceptMutation.mutateAsync({ id: proposalId.value })
    toast.success('Proposal accepted')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to accept proposal'))
  }
}

async function handleReject() {
  try {
    await rejectMutation.mutateAsync({ id: proposalId.value, reason: rejectReason.value })
    showRejectModal.value = false
    rejectReason.value = ''
    toast.success('Proposal rejected')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to reject proposal'))
  }
}

async function handleConvert() {
  try {
    const result = await convertMutation.mutateAsync(proposalId.value)
    toast.success('Quotation created successfully')
    router.push(`/quotations/${result.quotation_id}`)
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to convert to quotation'))
  }
}

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(proposalId.value)
    toast.success('Proposal deleted')
    router.push('/solar-proposals')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to delete proposal'))
  }
  showDeleteConfirm.value = false
}

async function handleRecalculate() {
  try {
    await calculateMutation.mutateAsync(proposalId.value)
    toast.success('Calculations updated')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to recalculate'))
  }
}

async function handleDownloadPdf() {
  isDownloadingPdf.value = true
  try {
    await downloadSolarProposalPdf(proposalId.value, `${proposal.value?.proposal_number}.pdf`)
    toast.success('PDF downloaded')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to download PDF'))
  } finally {
    isDownloadingPdf.value = false
  }
}

async function handleDownloadExcel() {
  isDownloadingExcel.value = true
  try {
    await downloadSolarProposalExcel(proposalId.value, `${proposal.value?.proposal_number}.xlsx`)
    toast.success('Excel downloaded')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to download Excel'))
  } finally {
    isDownloadingExcel.value = false
  }
}

async function copyPublicUrl() {
  if (!proposal.value?.public_url) return
  try {
    await navigator.clipboard.writeText(proposal.value.public_url)
    toast.success('Link copied to clipboard')
  } catch {
    toast.error('Failed to copy link')
  }
}

function shareViaWhatsApp() {
  if (!proposal.value) return

  const p = proposal.value
  const contactName = p.contact?.name || 'Bapak/Ibu'
  const publicUrl = p.public_url || `${window.location.origin}/solar-proposals/${p.id}`

  // Format currency for WhatsApp message
  const formatRp = (value: number | null | undefined) => {
    if (!value) return 'Rp 0'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const message = `Halo *${contactName}*,

Terima kasih atas kesempatan untuk mengajukan proposal PLTS.

📋 *Proposal ${p.proposal_number}*
☀️ Kapasitas: *${p.system_capacity_kwp} kWp*
💰 Investasi: *${formatRp(p.system_cost)}*
⏱️ Balik Modal: *${p.payback_years?.toFixed(1) || '-'} tahun*
📈 ROI 25 Tahun: *${p.roi_percent?.toFixed(0) || '-'}%*

Silakan lihat detail proposal di link berikut:
🔗 ${publicUrl}

Proposal berlaku hingga *${formatDate(p.valid_until)}*.

Jika ada pertanyaan, silakan hubungi kami.

Terima kasih 🙏
_Enter365 - Solar Energy Solutions_`

  const encodedMessage = encodeURIComponent(message)
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
}

// Status badge styles
function getStatusClass(status: string) {
  const classes: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
    sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    expired: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
    converted: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }
  return classes[status] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
}

// Cast financial_analysis and environmental_impact to proper types
const financialAnalysis = computed(() =>
  proposal.value?.financial_analysis as FinancialAnalysis | undefined
)
const environmentalImpact = computed(() =>
  proposal.value?.environmental_impact as EnvironmentalImpact | undefined
)

// Payback Chart Data - Cumulative cash flow (negative until payback, then positive)
const paybackChartData = computed(() => {
  const projections = financialAnalysis.value?.yearly_projections || []
  const systemCost = proposal.value?.system_cost || 0

  // Calculate cumulative cash flow starting from -investment
  let cumulative = -systemCost
  return projections.map((p) => {
    cumulative += p.savings
    return cumulative
  })
})

// Find the payback year (where cumulative crosses from negative to positive)
const paybackYearIndex = computed(() => {
  const cashFlow = paybackChartData.value
  for (let i = 0; i < cashFlow.length; i++) {
    const value = cashFlow[i]
    if (value !== undefined && value >= 0) {
      return i + 1 // Year is 1-indexed
    }
  }
  return undefined // No payback within projection period
})

// Monthly Bill Chart Data
const monthlyBillBefore = computed(() => {
  // Monthly electricity bill before solar = consumption × rate
  const consumption = proposal.value?.monthly_consumption_kwh || 0
  const rate = proposal.value?.electricity_rate || 0
  return consumption * rate
})

const monthlyBillAfter = computed(() => {
  // After solar: only pay for what's not covered by solar
  const consumption = proposal.value?.monthly_consumption_kwh || 0
  const production = proposal.value?.monthly_production_kwh || 0
  const rate = proposal.value?.electricity_rate || 0

  // Remaining bill = (consumption - production) × rate, minimum 0
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
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500">
      {{ getErrorMessage(error, 'Failed to load proposal') }}
    </div>

    <!-- Content -->
    <template v-else-if="proposal">
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/solar-proposals" class="hover:text-slate-700 dark:hover:text-slate-300">Solar Proposals</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ proposal.proposal_number }}</span>
      </div>

      <!-- Header -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ proposal.proposal_number }}
              </h1>
              <span
                class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(proposal.status)"
              >
                {{ proposal.status_label }}
              </span>
            </div>
            <p class="text-slate-500 dark:text-slate-400">{{ proposal.contact?.name }} - {{ proposal.site_name }}</p>
            <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Valid until {{ formatDate(proposal.valid_until) }}
              <span v-if="proposal.is_expired" class="text-red-500 ml-2">(Expired)</span>
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <!-- Download PDF -->
            <Button
              variant="ghost"
              size="sm"
              :loading="isDownloadingPdf"
              @click="handleDownloadPdf"
            >
              PDF
            </Button>

            <!-- Download Excel -->
            <Button
              variant="ghost"
              size="sm"
              :loading="isDownloadingExcel"
              class="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              @click="handleDownloadExcel"
            >
              <svg class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                <path d="M8 12h2v2H8v-2zm0 3h2v2H8v-2zm3-3h2v2h-2v-2zm0 3h2v2h-2v-2zm3-3h2v2h-2v-2zm0 3h2v2h-2v-2z"/>
              </svg>
              Excel
            </Button>

            <!-- WhatsApp Share -->
            <Button
              variant="ghost"
              size="sm"
              class="text-green-600 hover:text-green-700 hover:bg-green-50"
              @click="shareViaWhatsApp"
            >
              <svg class="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </Button>

            <!-- Recalculate -->
            <Button
              v-if="canEdit"
              variant="ghost"
              size="sm"
              :loading="calculateMutation.isPending.value"
              @click="handleRecalculate"
            >
              Recalculate
            </Button>

            <!-- Edit (draft only) -->
            <RouterLink v-if="canEdit" :to="`/solar-proposals/${proposalId}/edit`">
              <Button variant="secondary" size="sm">Edit</Button>
            </RouterLink>

            <!-- Send -->
            <Button
              v-if="canSend"
             
              size="sm"
              :loading="sendMutation.isPending.value"
              @click="handleSend"
            >
              Send to Customer
            </Button>

            <!-- Accept -->
            <Button
              v-if="canAccept"
              variant="success"
              size="sm"
              :loading="acceptMutation.isPending.value"
              @click="handleAccept"
            >
              Accept
            </Button>

            <!-- Reject -->
            <Button
              v-if="canReject"
              variant="destructive"
              size="sm"
              @click="showRejectModal = true"
            >
              Reject
            </Button>

            <!-- Convert to Quotation -->
            <Button
              v-if="canConvert"
             
              size="sm"
              :loading="convertMutation.isPending.value"
              @click="handleConvert"
            >
              Convert to Quotation
            </Button>

            <!-- Delete -->
            <Button
              v-if="canDelete"
              variant="ghost"
              size="sm"
              @click="showDeleteConfirm = true"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- System Overview -->
          <Card>
            <template #header>
              <h2 class="text-lg font-medium text-slate-900 dark:text-slate-100">System Overview</h2>
            </template>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <div class="text-sm text-slate-500 dark:text-slate-400">System Capacity</div>
                <div class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ proposal.system_capacity_kwp }} kWp</div>
              </div>
              <div>
                <div class="text-sm text-slate-500 dark:text-slate-400">Annual Production</div>
                <div class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ formatNumber(proposal.annual_production_kwh || 0) }} kWh</div>
              </div>
              <div>
                <div class="text-sm text-slate-500 dark:text-slate-400">Monthly Production</div>
                <div class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ formatNumber(proposal.monthly_production_kwh || 0) }} kWh</div>
              </div>
              <div>
                <div class="text-sm text-slate-500 dark:text-slate-400">{{ formatSolarOffset(proposal.solar_offset_percent).label }}</div>
                <div class="text-xl font-bold" :class="formatSolarOffset(proposal.solar_offset_percent).isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-green-600 dark:text-green-400'">
                  {{ formatSolarOffset(proposal.solar_offset_percent).value }}
                </div>
              </div>
            </div>

            <!-- Investment - Featured Row -->
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div class="flex items-center justify-between">
                <div class="text-sm text-slate-500 dark:text-slate-400">Total Investment</div>
                <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {{ proposal.system_cost ? formatCurrency(proposal.system_cost) : 'Not set' }}
                </div>
              </div>
            </div>
          </Card>

          <!-- Financial Summary -->
          <Card v-if="proposal.financial_analysis">
            <template #header>
              <h2 class="text-lg font-medium text-slate-900 dark:text-slate-100">Financial Summary</h2>
            </template>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
              <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div class="text-sm text-green-600 dark:text-green-400">First Year Savings</div>
                <div class="text-lg font-bold text-green-700 dark:text-green-300">{{ formatCurrency(proposal.first_year_savings) }}</div>
              </div>
              <div class="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div class="text-sm text-orange-600 dark:text-orange-400">Payback Period</div>
                <div class="text-xl font-bold text-orange-700 dark:text-orange-300">{{ proposal.payback_years?.toFixed(1) }} years</div>
              </div>
              <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div class="text-sm text-blue-600 dark:text-blue-400">ROI</div>
                <div class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ formatPercent(proposal.roi_percent || 0) }}</div>
              </div>
              <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div class="text-sm text-purple-600 dark:text-purple-400">NPV</div>
                <div class="text-lg font-bold text-purple-700 dark:text-purple-300">{{ formatCurrency(proposal.npv) }}</div>
              </div>
              <div class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div class="text-sm text-indigo-600 dark:text-indigo-400">IRR</div>
                <div class="text-xl font-bold text-indigo-700 dark:text-indigo-300">{{ formatPercent(proposal.irr_percent || 0) }}</div>
              </div>
              <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div class="text-sm text-emerald-600 dark:text-emerald-400">25-Year Savings</div>
                <div class="text-lg font-bold text-emerald-700 dark:text-emerald-300">{{ formatCurrency(proposal.total_lifetime_savings) }}</div>
              </div>
            </div>

            <!-- Charts -->
            <div class="space-y-6 pt-6 border-t dark:border-slate-700">
              <!-- Payback Period Chart -->
              <div>
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300">Payback Period</h4>
                  <span v-if="paybackYearIndex" class="text-sm font-medium text-orange-600 dark:text-orange-400">
                    Break-even: Year {{ paybackYearIndex }}
                  </span>
                </div>
                <PaybackChart
                  v-if="paybackChartData.length"
                  :cumulative-cash-flow="paybackChartData"
                  :payback-year="paybackYearIndex"
                  :height="280"
                />
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                  <span class="inline-block w-3 h-3 rounded bg-red-500 mr-1"></span> Masa Pengembalian
                  <span class="inline-block w-3 h-3 rounded bg-green-500 ml-3 mr-1"></span> Keuntungan Bersih
                </p>
              </div>

              <!-- Monthly Bill Comparison Chart -->
              <div>
                <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Perbandingan Tagihan Bulanan</h4>
                <MonthlyBillChart
                  v-if="monthlyBillBefore > 0"
                  :bill-before="monthlyBillBefore"
                  :bill-after="monthlyBillAfter"
                  :monthly-production-kwh="monthlyProductionKwh"
                  :electricity-rate="electricityRate"
                  :height="250"
                />
                <div class="flex justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 mt-2">
                  <span>
                    Sebelum: <strong class="text-slate-700 dark:text-slate-300">{{ formatCurrency(monthlyBillBefore) }}/bln</strong>
                  </span>
                  <span>
                    Sesudah: <strong class="text-green-600 dark:text-green-400">{{ formatCurrency(monthlyBillAfter) }}/bln</strong>
                  </span>
                  <span>
                    Hemat: <strong class="text-green-600 dark:text-green-400">{{ formatCurrency(monthlySavings) }}/bln</strong>
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <!-- Environmental Impact -->
          <Card v-if="proposal.environmental_impact">
            <template #header>
              <h2 class="text-lg font-medium text-slate-900 dark:text-slate-100">Environmental Impact</h2>
            </template>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div class="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div class="text-3xl mb-2">🌱</div>
                <div class="text-xl font-bold text-green-700 dark:text-green-300">{{ proposal.co2_offset_tons?.toFixed(1) }}</div>
                <div class="text-sm text-green-600 dark:text-green-400">Tons CO2/Year</div>
              </div>
              <div class="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div class="text-3xl mb-2">🌳</div>
                <div class="text-xl font-bold text-emerald-700 dark:text-emerald-300">{{ proposal.trees_equivalent }}</div>
                <div class="text-sm text-emerald-600 dark:text-emerald-400">Trees Equivalent</div>
              </div>
              <div class="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <div class="text-3xl mb-2">🚗</div>
                <div class="text-xl font-bold text-teal-700 dark:text-teal-300">{{ proposal.cars_equivalent }}</div>
                <div class="text-sm text-teal-600 dark:text-teal-400">Cars Off Road</div>
              </div>
              <div class="text-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                <div class="text-3xl mb-2">🌍</div>
                <div class="text-xl font-bold text-cyan-700 dark:text-cyan-300">{{ environmentalImpact?.co2_lifetime_tons?.toFixed(0) }}</div>
                <div class="text-sm text-cyan-600 dark:text-cyan-400">Lifetime Tons CO2</div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Right Column: Info Cards -->
        <div class="space-y-6">
          <!-- Site Information -->
          <Card>
            <template #header>
              <h3 class="font-medium text-slate-900 dark:text-slate-100">Site Information</h3>
            </template>

            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Site Name</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ proposal.site_name }}</dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Address</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ proposal.site_address }}</dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Location</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ proposal.city }}, {{ proposal.province }}</dd>
              </div>
              <div v-if="proposal.roof_area_m2">
                <dt class="text-slate-500 dark:text-slate-400">Roof Area</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ proposal.roof_area_m2 }} m²</dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Roof Type</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100 capitalize">{{ proposal.roof_type_label }}</dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Orientation</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100 capitalize">{{ proposal.roof_orientation_label }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Electricity Profile -->
          <Card>
            <template #header>
              <h3 class="font-medium text-slate-900 dark:text-slate-100">Electricity Profile</h3>
            </template>

            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Monthly Consumption</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatNumber(proposal.monthly_consumption_kwh || 0) }} kWh</dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">PLN Tariff</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ proposal.pln_tariff_category }}</dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Electricity Rate</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(proposal.electricity_rate) }}/kWh</dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Tariff Escalation</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ proposal.tariff_escalation_percent }}%/year</dd>
              </div>
            </dl>
          </Card>

          <!-- Solar Data -->
          <Card>
            <template #header>
              <h3 class="font-medium text-slate-900 dark:text-slate-100">Solar Data</h3>
            </template>

            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Peak Sun Hours</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ proposal.peak_sun_hours }} h/day</dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Solar Irradiance</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ proposal.solar_irradiance }} kWh/m²/day</dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Performance Ratio</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatPercent((proposal.performance_ratio || 0) * 100, 0) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- BOM / System Selection -->
          <Card>
            <template #header>
              <h3 class="font-medium text-slate-900 dark:text-slate-100">System Selection</h3>
            </template>

            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Variant Group</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ proposal.variant_group?.name || 'Not selected' }}
                </dd>
              </div>
              <div>
                <dt class="text-slate-500 dark:text-slate-400">Selected BOM</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ proposal.selected_bom?.name || 'Auto (lowest cost)' }}
                </dd>
              </div>
              <div v-if="proposal.system_cost">
                <dt class="text-slate-500 dark:text-slate-400">System Cost</dt>
                <dd class="font-medium text-orange-600 dark:text-orange-400">{{ formatCurrency(proposal.system_cost) }}</dd>
              </div>
            </dl>

            <!-- Available BOMs from variant group -->
            <div v-if="proposal.variant_group?.active_boms?.length" class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Available Options</div>
              <div class="space-y-2">
                <div
                  v-for="bom in proposal.variant_group.active_boms"
                  :key="bom.id"
                  class="flex items-center justify-between p-2 rounded-lg text-sm"
                  :class="proposal.selected_bom_id === bom.id ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800' : 'bg-slate-50 dark:bg-slate-800'"
                >
                  <div>
                    <span class="font-medium text-slate-900 dark:text-slate-100">{{ bom.name }}</span>
                    <span v-if="proposal.selected_bom_id === bom.id" class="ml-2 text-xs text-orange-600 dark:text-orange-400">(Selected)</span>
                  </div>
                  <span class="font-medium text-slate-700 dark:text-slate-300">{{ formatCurrency(bom.total_cost) }}</span>
                </div>
              </div>
            </div>

            <div v-else-if="!proposal.variant_group_id" class="text-sm text-slate-500 dark:text-slate-400 italic">
              No variant group attached. Edit proposal to select one.
            </div>
          </Card>

          <!-- Public Link (after sent) -->
          <Card v-if="proposal.public_url && proposal.status !== 'draft'">
            <template #header>
              <h3 class="font-medium text-slate-900 dark:text-slate-100">Customer Link</h3>
            </template>

            <div class="space-y-3">
              <p class="text-sm text-slate-600 dark:text-slate-400">
                Share this link with your customer to view and respond to the proposal:
              </p>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  :value="proposal.public_url"
                  readonly
                  class="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  @click="copyPublicUrl"
                >
                  Copy
                </Button>
              </div>
              <a
                :href="proposal.public_url"
                target="_blank"
                class="text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 inline-flex items-center gap-1"
              >
                Open in new tab →
              </a>
            </div>
          </Card>

          <!-- Notes -->
          <Card v-if="proposal.notes">
            <template #header>
              <h3 class="font-medium text-slate-900 dark:text-slate-100">Notes</h3>
            </template>

            <p class="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap">{{ proposal.notes }}</p>
          </Card>
        </div>
      </div>
    </template>

    <!-- Reject Modal -->
    <Modal v-model:open="showRejectModal" title="Reject Proposal">
      <div class="space-y-4">
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Are you sure you want to reject this proposal? Please provide a reason.
        </p>
        <textarea
          v-model="rejectReason"
          rows="3"
          class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Reason for rejection..."
        />
      </div>

      <template #footer>
        <Button variant="ghost" @click="showRejectModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="rejectMutation.isPending.value"
          @click="handleReject"
        >
          Reject Proposal
        </Button>
      </template>
    </Modal>

    <!-- Delete Confirmation -->
    <Modal v-model:open="showDeleteConfirm" title="Delete Proposal">
      <p class="text-sm text-slate-600 dark:text-slate-400">
        Are you sure you want to delete this proposal? This action cannot be undone.
      </p>

      <template #footer>
        <Button variant="ghost" @click="showDeleteConfirm = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="deleteMutation.isPending.value"
          @click="handleDelete"
        >
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
