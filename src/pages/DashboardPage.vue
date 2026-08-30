<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/auth'
import { useFeaturesStore } from '@/stores/features'
import { useDashboardSummary, useDashboardKPIs } from '@/api/useDashboard'
import { api } from '@/api/client'
import { formatCurrency } from '@/utils/format'
import { Card, Badge, useToast } from '@/components/ui'
import { BarChart, DoughnutChart } from '@/components/charts'

const auth = useAuthStore()
const features = useFeaturesStore()
const route = useRoute()
const router = useRouter()
const toast = useToast()

/** Human labels for product packs (backend feature modules) */
const PACK_LABELS: Record<string, string> = {
  solar_proposals: 'Solar Proposals',
  electrical_panel: 'Electrical Panel Tools',
  projects: 'Projects',
  manufacturing: 'Manufacturing',
  bom: 'BOM / Bill of Materials',
  work_orders: 'Work Orders',
  material_requisitions: 'Material Requisitions',
  mrp: 'MRP',
  subcontracting: 'Subcontracting',
  budgeting: 'Budgets',
  bank_reconciliation: 'Bank Reconciliation',
  recurring: 'Recurring Templates',
  quotations: 'Quotations',
  delivery_orders: 'Delivery Orders',
  sales_returns: 'Sales Returns',
  purchase_orders: 'Purchase Orders',
  goods_receipt_notes: 'Goods Receipt',
  purchase_returns: 'Purchase Returns',
  inventory: 'Inventory',
  stock_opname: 'Stock Opname',
  products: 'Products',
  warehouses: 'Warehouses',
  down_payments: 'Down Payments',
}

onMounted(() => {
  const pack = route.query.pack_disabled
  if (typeof pack !== 'string' || !pack) {
    return
  }

  const label = PACK_LABELS[pack] ?? pack
  toast.warning({
    title: 'Modul tidak aktif',
    message: `${label} dimatikan di konfigurasi produk (FEATURE_PRESET / pack). Nyalakan di .env bila diperlukan.`,
    duration: 8000,
  })

  // Clear query so refresh does not re-toast
  const nextQuery = { ...route.query }
  delete nextQuery.pack_disabled
  router.replace({ path: route.path, query: nextQuery })
})

// Fetch dashboard data
const { data: summary, isLoading: loadingSummary } = useDashboardSummary()
const { data: kpis, isLoading: loadingKPIs } = useDashboardKPIs()

// Projects pack is off for general company — skip the API call
const projectsEnabled = computed(() => features.enabled('projects'))
const { data: projectsData, isLoading: loadingProjects } = useQuery({
  queryKey: ['projects', 'dashboard-active'],
  queryFn: async () => {
    const response = await api.get('/projects', {
      params: { status: 'in_progress', per_page: 5 },
    })
    return response.data as { data: Array<Record<string, unknown>> }
  },
  enabled: projectsEnabled,
})

const activeProjects = computed(() => {
  const rows = projectsData.value?.data ?? []
  return rows.map((row) => {
    const contact = row.contact as { name?: string } | undefined
    return {
      id: Number(row.id),
      name: String(row.name ?? ''),
      projectNumber: typeof row.project_number === 'string' ? row.project_number : '',
      contactName: contact?.name ?? '',
      progress: Number(row.progress_percentage ?? 0),
    }
  })
})

// Computed stats from API data
const stats = computed(() => {
  const cashPosition = Number(summary.value?.cash_position?.total) || 0
  const receivables = Number(summary.value?.receivables?.outstanding) || 0
  const receivablesCount = Number(summary.value?.receivables?.outstanding_count) || 0
  const payables = Number(summary.value?.payables?.outstanding) || 0
  const payablesCount = Number(summary.value?.payables?.outstanding_count) || 0
  const grossMargin = kpis.value?.gross_margin?.current ?? 0

  return [
    {
      label: 'Cash Balance',
      value: cashPosition,
      icon: '💰',
      trend: null,
      trendUp: null,
    },
    {
      label: 'Receivables',
      value: receivables,
      icon: '📈',
      trend: `${receivablesCount} invoices`,
      trendUp: null,
    },
    {
      label: 'Payables',
      value: payables,
      icon: '📉',
      trend: `${payablesCount} bills`,
      trendUp: null,
    },
    {
      label: 'Gross Margin',
      value: grossMargin,
      icon: '📊',
      trend: kpis.value?.gross_margin?.change ? `${kpis.value.gross_margin.change > 0 ? '+' : ''}${kpis.value.gross_margin.change.toFixed(1)}%` : null,
      trendUp: kpis.value?.gross_margin?.change ? kpis.value.gross_margin.change > 0 : null,
      isPercent: true,
    },
  ]
})

// Alerts/attention items
const attentionItems = computed(() => {
  const items: Array<{ type: string; label: string; count: number; link: string }> = []

  const overdueReceivables = Number(summary.value?.receivables?.overdue_count) || 0
  const overduePayables = Number(summary.value?.payables?.overdue_count) || 0

  if (overdueReceivables > 0) {
    items.push({
      type: 'warning',
      label: 'Overdue Invoices',
      count: overdueReceivables,
      link: '/invoices?status=overdue',
    })
  }

  if (overduePayables > 0) {
    items.push({
      type: 'destructive',
      label: 'Overdue Bills',
      count: overduePayables,
      link: '/bills?status=overdue',
    })
  }

  return items
})

const isLoading = computed(() => loadingSummary.value || loadingKPIs.value)

// Monthly comparison chart data
const monthlyChartData = computed(() => {
  const monthly = (summary.value?.monthly_comparison || []) as Array<{ label: string; revenue: number; expenses: number }>
  return {
    labels: monthly.map((m) => m.label),
    datasets: [
      {
        label: 'Revenue',
        data: monthly.map((m) => Number(m.revenue) || 0),
        backgroundColor: '#22c55e',
      },
      {
        label: 'Expenses',
        data: monthly.map((m) => Number(m.expenses) || 0),
        backgroundColor: '#ef4444',
      },
    ],
  }
})

// Cash position breakdown
const cashBreakdownData = computed(() => {
  const accounts = summary.value?.cash_position?.accounts || []
  return {
    labels: accounts.map((a: any) => a.name),
    data: accounts.map((a: any) => Math.abs(Number(a.balance) || 0)),
  }
})
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Dashboard</h1>
      <p class="text-slate-500 dark:text-slate-400">Welcome back, {{ auth.user?.name ?? 'User' }}</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6"
      >
        <div class="flex items-center gap-3 mb-3">
          <span class="text-2xl">{{ stat.icon }}</span>
          <span class="text-sm font-medium text-slate-500 dark:text-slate-400">{{ stat.label }}</span>
        </div>
        <div v-if="isLoading" class="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <template v-else>
          <div class="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ stat.isPercent ? `${stat.value.toFixed(1)}%` : formatCurrency(stat.value) }}
          </div>
          <div
            v-if="stat.trend"
            class="mt-1 text-sm"
            :class="stat.trendUp === true ? 'text-green-600 dark:text-green-400' : stat.trendUp === false ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'"
          >
            {{ stat.trend }}
          </div>
        </template>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Active Projects (only when projects pack is on) -->
      <Card v-if="projectsEnabled" class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Active Projects</h2>
            <RouterLink to="/projects" class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">View all →</RouterLink>
          </div>
        </template>
        <div v-if="loadingProjects" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div v-else-if="!activeProjects.length" class="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
          No active projects
        </div>
        <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
          <RouterLink
            v-for="project in activeProjects"
            :key="project.id"
            :to="`/projects/${project.id}`"
            class="block py-3 hover:bg-slate-50 dark:hover:bg-slate-800 -mx-6 px-6 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-slate-900 dark:text-slate-100">{{ project.name }}</div>
                <div class="text-sm text-slate-500 dark:text-slate-400">
                  {{ project.projectNumber }}
                  •
                  {{ project.contactName }}
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ project.progress }}%</div>
                <div class="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary-500 rounded-full"
                    :style="{ width: project.progress + '%' }"
                  />
                </div>
              </div>
            </div>
          </RouterLink>
        </div>
      </Card>

      <!-- When projects pack off, expand attention card -->
      <Card v-else class="lg:col-span-2">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Welcome</h2>
        </template>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          Mode perusahaan umum: fokus, Purchasing, Inventory, dan Accounting aktif.
          Pack Solar / Manufacturing / Projects bisa dinyalakan lewat
          <code class="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">FEATURE_PRESET</code>
          di server.
        </p>
      </Card>

      <!-- Requires Attention -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100">Requires Attention</h2>
            <Badge v-if="attentionItems.length > 0" variant="destructive">{{ attentionItems.length }}</Badge>
          </div>
        </template>
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 2" :key="i" class="h-12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div v-else-if="!attentionItems.length" class="text-slate-500 dark:text-slate-400 text-sm text-center py-8">
          All caught up!
        </div>
        <div v-else class="space-y-3">
          <RouterLink
            v-for="item in attentionItems"
            :key="item.label"
            :to="item.link"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            :class="{
              'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800': item.type === 'warning',
              'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800': item.type === 'destructive',
            }"
          >
            <span
              class="font-medium"
              :class="{
                'text-orange-700 dark:text-orange-400': item.type === 'warning',
                'text-red-700 dark:text-red-400': item.type === 'destructive',
              }"
            >
              {{ item.label }}
            </span>
            <Badge
              :variant="item.type === 'warning' ? 'warning' : 'destructive'"
            >
              {{ item.count }}
            </Badge>
          </RouterLink>
        </div>
      </Card>
    </div>

    <!-- Quick KPIs -->
    <div v-if="kpis" class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <div class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Revenue MTD</div>
          <div class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ formatCurrency(Number(kpis.revenue?.mtd) || 0) }}</div>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Days Sales Outstanding</div>
          <div class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ kpis.dso ?? 0 }} days</div>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Active Projects</div>
          <div class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ kpis.project_metrics?.active_count ?? 0 }}</div>
        </div>
      </Card>
    </div>

    <!-- Charts Section -->
    <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Monthly Revenue vs Expenses -->
      <Card v-if="monthlyChartData.labels.length > 0">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Revenue vs Expenses (6 Months)</h2>
        </template>
        <div v-if="isLoading" class="h-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <BarChart
          v-else
          :labels="monthlyChartData.labels"
          :datasets="monthlyChartData.datasets"
          :height="280"
        />
      </Card>

      <!-- Cash Breakdown -->
      <Card v-if="cashBreakdownData.labels.length > 0">
        <template #header>
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Cash Position by Account</h2>
        </template>
        <div v-if="isLoading" class="h-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <DoughnutChart
          v-else
          :labels="cashBreakdownData.labels"
          :data="cashBreakdownData.data"
          :height="280"
        />
      </Card>
    </div>
  </div>
</template>
