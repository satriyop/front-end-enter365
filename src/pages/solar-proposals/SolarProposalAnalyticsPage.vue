<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
import { useSolarProposals, type SolarProposalFilters } from '@/api/useSolarProposals'
import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent, toNumber } from '@/utils/format'
import { Button, Card, Select, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import {
  Target,
  Clock,
  DollarSign,
  Zap,
  BarChart3,
  PieChart,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Send,
  FileText,
} from 'lucide-vue-next'

Chart.register(...registerables)

// ============================================
// Date Range Filter
// ============================================
const dateRange = ref('all')
const dateRangeOptions = [
  { value: 'all', label: 'All Time' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '1y', label: 'Last Year' },
]

const dateFilters = computed(() => {
  const now = new Date()
  const filters: SolarProposalFilters = { per_page: 500 } // Fetch all for analytics

  if (dateRange.value !== 'all') {
    const days = {
      '30d': 30,
      '90d': 90,
      '6m': 180,
      '1y': 365,
    }[dateRange.value] || 365

    const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    filters.date_from = fromDate.toISOString().split('T')[0]
  }

  return filters
})

// ============================================
// Fetch Data
// ============================================
const { data: proposalsData, isLoading } = useSolarProposals(dateFilters)

const proposals = computed(() => proposalsData.value?.data ?? [])

// ============================================
// Computed Analytics
// ============================================

// Status counts
const statusCounts = computed(() => {
  const counts = { draft: 0, sent: 0, accepted: 0, rejected: 0, expired: 0, converted: 0 }
  proposals.value.forEach((p) => {
    if (counts[p.status.value as keyof typeof counts] !== undefined) {
      counts[p.status.value as keyof typeof counts]++
    }
  })
  return counts
})

// Conversion metrics
const conversionMetrics = computed(() => {
  const sent = statusCounts.value.sent + statusCounts.value.accepted + statusCounts.value.rejected + statusCounts.value.converted
  const won = statusCounts.value.accepted + statusCounts.value.converted
  const lost = statusCounts.value.rejected

  return {
    sent,
    won,
    lost,
    pending: statusCounts.value.sent,
    conversionRate: sent > 0 ? (won / sent) * 100 : 0,
    lossRate: sent > 0 ? (lost / sent) * 100 : 0,
  }
})

// Financial metrics
  const financialMetrics = computed(() => {
  const validProposals = proposals.value.filter((p) => p.system_cost && toNumber(p.system_cost) > 0)
  const wonProposals = proposals.value.filter(
    (p) => (p.status.value === 'accepted' || p.status.value === 'converted') && p.system_cost
  )
  const totalValue = validProposals.reduce((sum, p) => sum + toNumber(p.system_cost), 0)
  const wonValue = wonProposals.reduce((sum, p) => sum + toNumber(p.system_cost), 0)
  const avgValue = validProposals.length > 0 ? totalValue / validProposals.length : 0
  const avgWonValue = wonProposals.length > 0 ? wonValue / wonProposals.length : 0

  return {
    totalValue,
    wonValue,
    avgValue,
    avgWonValue,
    totalCapacity: validProposals.reduce((sum, p) => sum + toNumber(p.system_capacity_kwp), 0),
    avgPayback: validProposals.length > 0
      ? validProposals.reduce((sum, p) => sum + toNumber(p.payback_years), 0) / validProposals.length
      : 0,
    avgRoi: validProposals.length > 0
      ? validProposals.reduce((sum, p) => sum + toNumber(p.roi_percent), 0) / validProposals.length
      : 0,
  }
})

// Monthly trends
const monthlyTrends = computed(() => {
  const months: Record<string, { created: number; sent: number; won: number; lost: number }> = {}

  proposals.value.forEach((p) => {
    const date = new Date(p.created_at!)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (!months[key]) {
      months[key] = { created: 0, sent: 0, won: 0, lost: 0 }
    }

    months[key].created++

    if (['sent', 'accepted', 'rejected', 'converted'].includes(p.status.value)) {
      months[key].sent++
    }
    if (p.status.value === 'accepted' || p.status.value === 'converted') {
      months[key].won++
    }
    if (p.status.value === 'rejected') {
      months[key].lost++
    }
  })

  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12) // Last 12 months
})

// Province distribution
const provinceDistribution = computed(() => {
  const provinces: Record<string, { total: number; won: number; value: number }> = {}

  proposals.value.forEach((p) => {
    const province = p.province || 'Unknown'
    if (!provinces[province]) {
      provinces[province] = { total: 0, won: 0, value: 0 }
    }

    provinces[province].total++
    provinces[province].value += toNumber(p.system_cost)

    if (p.status?.value === 'accepted' || p.status?.value === 'converted') {
      provinces[province].won++
    }
  })

  return Object.entries(provinces)
    .map(([name, data]) => ({
      name,
      ...data,
      winRate: data.total > 0 ? (data.won / data.total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
})

// System size distribution
const sizeDistribution = computed(() => {
  const brackets = [
    { label: '< 5 kWp', min: 0, max: 5 },
    { label: '5-10 kWp', min: 5, max: 10 },
    { label: '10-20 kWp', min: 10, max: 20 },
    { label: '20-50 kWp', min: 20, max: 50 },
    { label: '50-100 kWp', min: 50, max: 100 },
    { label: '> 100 kWp', min: 100, max: Infinity },
  ]

  return brackets.map((bracket) => {
    const inBracket = proposals.value.filter((p) => {
      const size = toNumber(p.system_capacity_kwp)
      return size >= bracket.min && size < bracket.max
    })

    const won = inBracket.filter((p) => p.status.value === 'accepted' || p.status.value === 'converted')

    return {
      ...bracket,
      count: inBracket.length,
      won: won.length,
      value: inBracket.reduce((sum, p) => sum + toNumber(p.system_cost), 0),
      winRate: inBracket.length > 0 ? (won.length / inBracket.length) * 100 : 0,
    }
  })
})

// Table columns for size distribution
const sizeColumns: ResponsiveColumn[] = [
  { key: 'label', label: 'Size Bracket', mobilePriority: 1 },
  { key: 'count', label: 'Proposals', align: 'right', showInMobile: false },
  { key: 'won', label: 'Won', align: 'right', showInMobile: false },
  { key: 'winRate', label: 'Win Rate', align: 'right', mobilePriority: 2 },
  { key: 'value', label: 'Total Value', align: 'right', mobilePriority: 3 },
]

// Table columns for province distribution
const provinceColumns: ResponsiveColumn[] = [
  { key: 'name', label: 'Province', mobilePriority: 1 },
  { key: 'total', label: 'Proposals', align: 'right', showInMobile: false },
  { key: 'won', label: 'Won', align: 'right', showInMobile: false },
  { key: 'winRate', label: 'Win Rate', align: 'right', mobilePriority: 2 },
  { key: 'value', label: 'Total Value', align: 'right', mobilePriority: 3 },
]

// ============================================
// Charts
// ============================================
const trendChartRef = ref<HTMLCanvasElement | null>(null)
const funnelChartRef = ref<HTMLCanvasElement | null>(null)
const provinceChartRef = ref<HTMLCanvasElement | null>(null)
const sizeChartRef = ref<HTMLCanvasElement | null>(null)

let trendChart: Chart | null = null
let funnelChart: Chart | null = null
let provinceChart: Chart | null = null
let sizeChart: Chart | null = null

function initCharts() {
  // Trend Chart
  if (trendChartRef.value && monthlyTrends.value.length > 0) {
    if (trendChart) trendChart.destroy()

    const labels = monthlyTrends.value.map(([month]) => {
      const parts = month.split('-')
      const year = parseInt(parts[0] || '2024', 10)
      const m = parseInt(parts[1] || '1', 10)
      return new Date(year, m - 1).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      })
    })

    trendChart = new Chart(trendChartRef.value, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Created',
            data: monthlyTrends.value.map(([, d]) => d.created),
            borderColor: '#64748b',
            backgroundColor: 'rgba(100, 116, 139, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Won',
            data: monthlyTrends.value.map(([, d]) => d.won),
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Lost',
            data: monthlyTrends.value.map(([, d]) => d.lost),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
          },
        },
      },
    })
  }

  // Funnel Chart (Horizontal Bar)
  if (funnelChartRef.value) {
    if (funnelChart) funnelChart.destroy()

    funnelChart = new Chart(funnelChartRef.value, {
      type: 'bar',
      data: {
        labels: ['Draft', 'Sent', 'Pending Response', 'Won', 'Lost'],
        datasets: [
          {
            label: 'Proposals',
            data: [
              statusCounts.value.draft,
              conversionMetrics.value.sent,
              conversionMetrics.value.pending,
              conversionMetrics.value.won,
              conversionMetrics.value.lost,
            ],
            backgroundColor: [
              'rgba(100, 116, 139, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(251, 191, 36, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(239, 68, 68, 0.8)',
            ],
            borderRadius: 6,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { beginAtZero: true },
        },
      },
    })
  }

  // Province Chart (Bar)
  if (provinceChartRef.value && provinceDistribution.value.length > 0) {
    if (provinceChart) provinceChart.destroy()

    provinceChart = new Chart(provinceChartRef.value, {
      type: 'bar',
      data: {
        labels: provinceDistribution.value.map((p) => p.name),
        datasets: [
          {
            label: 'Total Proposals',
            data: provinceDistribution.value.map((p) => p.total),
            backgroundColor: 'rgba(249, 115, 22, 0.8)',
            borderRadius: 6,
          },
          {
            label: 'Won',
            data: provinceDistribution.value.map((p) => p.won),
            backgroundColor: 'rgba(34, 197, 94, 0.8)',
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
        },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
        },
      },
    })
  }

  // Size Distribution Chart (Doughnut)
  if (sizeChartRef.value) {
    if (sizeChart) sizeChart.destroy()

    sizeChart = new Chart(sizeChartRef.value, {
      type: 'doughnut',
      data: {
        labels: sizeDistribution.value.map((s) => s.label),
        datasets: [
          {
            data: sizeDistribution.value.map((s) => s.count),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(34, 197, 94, 0.8)',
              'rgba(251, 191, 36, 0.8)',
              'rgba(249, 115, 22, 0.8)',
              'rgba(168, 85, 247, 0.8)',
              'rgba(236, 72, 153, 0.8)',
            ],
            borderWidth: 2,
            borderColor: '#ffffff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
        },
      },
    })
  }
}

onMounted(() => {
  setTimeout(initCharts, 100)
})

watch([proposals, dateRange], () => {
  setTimeout(initCharts, 100)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <Button as="router-link" to="/solar-proposals" variant="ghost" size="icon">
          <ArrowLeft class="w-5 h-5" />
        </Button>
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Proposal Analytics</h1>
          <p class="text-slate-500 dark:text-slate-400">Track performance and conversion metrics</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <Calendar class="w-4 h-4 text-slate-400" />
        <Select v-model="dateRange" :options="dateRangeOptions" class="w-40" />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-20">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
        <p class="text-slate-500 dark:text-slate-400">Loading analytics...</p>
      </div>
    </div>

    <template v-else>
      <!-- KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Conversion Rate -->
        <Card class="p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Conversion Rate</p>
              <p class="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {{ formatPercent(conversionMetrics.conversionRate) }}
              </p>
              <p class="text-xs text-slate-400 mt-1">
                {{ conversionMetrics.won }} won of {{ conversionMetrics.sent }} sent
              </p>
            </div>
            <div class="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <Target class="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <!-- Average Deal Value -->
        <Card class="p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Deal Value</p>
              <p class="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {{ formatCurrencyCompact(financialMetrics.avgValue) }}
              </p>
              <p class="text-xs text-slate-400 mt-1">
                Won avg: {{ formatCurrencyCompact(financialMetrics.avgWonValue) }}
              </p>
            </div>
            <div class="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              <DollarSign class="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <!-- Average Payback -->
        <Card class="p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Avg. Payback Period</p>
              <p class="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {{ financialMetrics.avgPayback.toFixed(1) }} yrs
              </p>
              <p class="text-xs text-slate-400 mt-1">
                Avg ROI: {{ formatPercent(financialMetrics.avgRoi) }}
              </p>
            </div>
            <div class="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Clock class="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        <!-- Total Capacity -->
        <Card class="p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Capacity</p>
              <p class="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {{ formatNumber(financialMetrics.totalCapacity) }} kWp
              </p>
              <p class="text-xs text-slate-400 mt-1">
                {{ proposals.length }} proposals
              </p>
            </div>
            <div class="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <Zap class="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      <!-- Pipeline Value Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Total Pipeline Value -->
        <Card class="p-5 border-l-4 border-l-slate-400">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
              <FileText class="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Total Pipeline</p>
              <p class="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {{ formatCurrency(financialMetrics.totalValue) }}
              </p>
            </div>
          </div>
        </Card>

        <!-- Won Value -->
        <Card class="p-5 border-l-4 border-l-green-500">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 class="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Won Value</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ formatCurrency(financialMetrics.wonValue) }}
              </p>
            </div>
          </div>
        </Card>

        <!-- Pending Response -->
        <Card class="p-5 border-l-4 border-l-amber-500">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Send class="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Awaiting Response</p>
              <p class="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {{ conversionMetrics.pending }} proposals
              </p>
            </div>
          </div>
        </Card>
      </div>

      <!-- Charts Row 1 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Monthly Trends -->
        <Card class="p-6">
          <div class="flex items-center gap-2 mb-4">
            <BarChart3 class="w-5 h-5 text-slate-400" />
            <h3 class="font-semibold text-slate-900 dark:text-slate-100">Monthly Trends</h3>
          </div>
          <div class="h-64">
            <canvas ref="trendChartRef" />
          </div>
        </Card>

        <!-- Sales Funnel -->
        <Card class="p-6">
          <div class="flex items-center gap-2 mb-4">
            <PieChart class="w-5 h-5 text-slate-400" />
            <h3 class="font-semibold text-slate-900 dark:text-slate-100">Sales Funnel</h3>
          </div>
          <div class="h-64">
            <canvas ref="funnelChartRef" />
          </div>
        </Card>
      </div>

      <!-- Charts Row 2 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Province Distribution -->
        <Card class="p-6">
          <div class="flex items-center gap-2 mb-4">
            <BarChart3 class="w-5 h-5 text-slate-400" />
            <h3 class="font-semibold text-slate-900 dark:text-slate-100">By Province</h3>
          </div>
          <div class="h-64">
            <canvas ref="provinceChartRef" />
          </div>
        </Card>

        <!-- System Size Distribution -->
        <Card class="p-6">
          <div class="flex items-center gap-2 mb-4">
            <PieChart class="w-5 h-5 text-slate-400" />
            <h3 class="font-semibold text-slate-900 dark:text-slate-100">System Size Distribution</h3>
          </div>
          <div class="h-64">
            <canvas ref="sizeChartRef" />
          </div>
        </Card>
      </div>

      <!-- Win Rate by Size Table -->
      <Card class="overflow-hidden">
        <div class="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">Win Rate by System Size</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze which system sizes have the highest conversion rates
          </p>
        </div>
        <ResponsiveTable
          :items="sizeDistribution"
          :columns="sizeColumns"
          title-field="label"
        >
          <!-- Custom cell: Size Bracket -->
          <template #cell-label="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.label }}</span>
          </template>

          <!-- Custom cell: Won -->
          <template #cell-won="{ item }">
            <span class="text-green-600 dark:text-green-400">{{ item.won }}</span>
          </template>

          <!-- Custom cell: Win Rate -->
          <template #cell-winRate="{ item }">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="
                item.winRate >= 50
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : item.winRate >= 25
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              "
            >
              {{ formatPercent(item.winRate) }}
            </span>
          </template>

          <!-- Custom cell: Total Value -->
          <template #cell-value="{ item }">
            <span class="text-slate-600 dark:text-slate-300">{{ formatCurrencyCompact(item.value) }}</span>
          </template>

          <!-- Mobile title slot -->
          <template #mobile-title="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.label }}</span>
          </template>

          <!-- Mobile status slot -->
          <template #mobile-status="{ item }">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="
                item.winRate >= 50
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : item.winRate >= 25
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              "
            >
              {{ formatPercent(item.winRate) }}
            </span>
          </template>
        </ResponsiveTable>
      </Card>

      <!-- Province Performance Table -->
      <Card class="overflow-hidden">
        <div class="p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 class="font-semibold text-slate-900 dark:text-slate-100">Province Performance</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Top performing provinces by proposal volume and win rate
          </p>
        </div>
        <ResponsiveTable
          :items="provinceDistribution"
          :columns="provinceColumns"
          title-field="name"
        >
          <!-- Custom cell: Province -->
          <template #cell-name="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</span>
          </template>

          <!-- Custom cell: Won -->
          <template #cell-won="{ item }">
            <span class="text-green-600 dark:text-green-400">{{ item.won }}</span>
          </template>

          <!-- Custom cell: Win Rate -->
          <template #cell-winRate="{ item }">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="
                item.winRate >= 50
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : item.winRate >= 25
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              "
            >
              {{ formatPercent(item.winRate) }}
            </span>
          </template>

          <!-- Custom cell: Total Value -->
          <template #cell-value="{ item }">
            <span class="text-slate-600 dark:text-slate-300">{{ formatCurrencyCompact(item.value) }}</span>
          </template>

          <!-- Mobile title slot -->
          <template #mobile-title="{ item }">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.name }}</span>
          </template>

          <!-- Mobile status slot -->
          <template #mobile-status="{ item }">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="
                item.winRate >= 50
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : item.winRate >= 25
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              "
            >
              {{ formatPercent(item.winRate) }}
            </span>
          </template>
        </ResponsiveTable>
      </Card>
    </template>
  </div>
</template>
