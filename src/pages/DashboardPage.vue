<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDashboardSummary, useDashboardKPIs } from '@/api/useDashboard'
import { useProjects } from '@/api/useProjects'
import { formatCurrency } from '@/utils/format'
import { Card, Badge } from '@/components/ui'

const auth = useAuthStore()

// Fetch dashboard data
const { data: summary, isLoading: loadingSummary } = useDashboardSummary()
const { data: kpis, isLoading: loadingKPIs } = useDashboardKPIs()

// Fetch active projects
const projectFilters = computed(() => ({ status: 'in_progress', per_page: 5 }))
const { data: projectsData, isLoading: loadingProjects } = useProjects(projectFilters)

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
      type: 'danger',
      label: 'Overdue Bills',
      count: overduePayables,
      link: '/bills?status=overdue',
    })
  }

  return items
})

const isLoading = computed(() => loadingSummary.value || loadingKPIs.value)
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p class="text-slate-500">Welcome back, {{ auth.user?.name ?? 'User' }}</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="bg-white rounded-xl border border-slate-200 p-6"
      >
        <div class="flex items-center gap-3 mb-3">
          <span class="text-2xl">{{ stat.icon }}</span>
          <span class="text-sm font-medium text-slate-500">{{ stat.label }}</span>
        </div>
        <div v-if="isLoading" class="h-8 bg-slate-100 rounded animate-pulse" />
        <template v-else>
          <div class="text-2xl font-bold text-slate-900">
            {{ stat.isPercent ? `${stat.value.toFixed(1)}%` : formatCurrency(stat.value) }}
          </div>
          <div
            v-if="stat.trend"
            class="mt-1 text-sm"
            :class="stat.trendUp === true ? 'text-green-600' : stat.trendUp === false ? 'text-red-600' : 'text-slate-500'"
          >
            {{ stat.trend }}
          </div>
        </template>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Active Projects -->
      <Card class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-900">Active Projects</h2>
            <RouterLink to="/projects" class="text-sm text-primary-600 hover:text-primary-700">View all →</RouterLink>
          </div>
        </template>
        <div v-if="loadingProjects" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-16 bg-slate-100 rounded animate-pulse" />
        </div>
        <div v-else-if="!projectsData?.data?.length" class="text-slate-500 text-sm text-center py-8">
          No active projects
        </div>
        <div v-else class="divide-y divide-slate-100">
          <RouterLink
            v-for="project in projectsData.data"
            :key="project.id"
            :to="`/projects/${project.id}`"
            class="block py-3 hover:bg-slate-50 -mx-6 px-6 transition-colors"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium text-slate-900">{{ project.name }}</div>
                <div class="text-sm text-slate-500">{{ project.project_number }} • {{ project.contact?.name }}</div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-slate-900">{{ project.progress_percentage ?? 0 }}%</div>
                <div class="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary-500 rounded-full"
                    :style="{ width: `${project.progress_percentage ?? 0}%` }"
                  />
                </div>
              </div>
            </div>
          </RouterLink>
        </div>
      </Card>

      <!-- Requires Attention -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-slate-900">Requires Attention</h2>
            <Badge v-if="attentionItems.length > 0" variant="error">{{ attentionItems.length }}</Badge>
          </div>
        </template>
        <div v-if="isLoading" class="space-y-3">
          <div v-for="i in 2" :key="i" class="h-12 bg-slate-100 rounded animate-pulse" />
        </div>
        <div v-else-if="!attentionItems.length" class="text-slate-500 text-sm text-center py-8">
          All caught up!
        </div>
        <div v-else class="space-y-3">
          <RouterLink
            v-for="item in attentionItems"
            :key="item.label"
            :to="item.link"
            class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
            :class="{
              'bg-orange-50 border border-orange-200': item.type === 'warning',
              'bg-red-50 border border-red-200': item.type === 'danger',
            }"
          >
            <span
              class="font-medium"
              :class="{
                'text-orange-700': item.type === 'warning',
                'text-red-700': item.type === 'danger',
              }"
            >
              {{ item.label }}
            </span>
            <Badge
              :variant="item.type === 'warning' ? 'warning' : 'error'"
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
          <div class="text-sm text-slate-500 mb-1">Revenue MTD</div>
          <div class="text-xl font-bold text-slate-900">{{ formatCurrency(Number(kpis.revenue?.mtd) || 0) }}</div>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <div class="text-sm text-slate-500 mb-1">Days Sales Outstanding</div>
          <div class="text-xl font-bold text-slate-900">{{ kpis.dso ?? 0 }} days</div>
        </div>
      </Card>
      <Card>
        <div class="text-center">
          <div class="text-sm text-slate-500 mb-1">Active Projects</div>
          <div class="text-xl font-bold text-slate-900">{{ kpis.project_metrics?.active_count ?? 0 }}</div>
        </div>
      </Card>
    </div>
  </div>
</template>
