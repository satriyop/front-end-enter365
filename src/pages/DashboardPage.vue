<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/format'

const auth = useAuthStore()

// Mock data - replace with real API hooks later
const stats = [
  { label: 'Cash Balance', value: 1245678000, icon: '💰', trend: '+12%', trendUp: true },
  { label: 'Receivables', value: 892500000, icon: '📈', trend: '32 invoices', trendUp: null },
  { label: 'Payables', value: 456200000, icon: '📉', trend: '18 bills', trendUp: null },
  { label: 'Margin MTD', value: 23.4, icon: '📊', trend: '+2.1%', trendUp: true, isPercent: true },
]
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
        <div class="text-2xl font-bold text-slate-900">
          {{ stat.isPercent ? `${stat.value}%` : formatCurrency(stat.value) }}
        </div>
        <div
          v-if="stat.trend"
          class="mt-1 text-sm"
          :class="stat.trendUp === true ? 'text-green-600' : stat.trendUp === false ? 'text-red-600' : 'text-slate-500'"
        >
          {{ stat.trend }}
        </div>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Active Projects -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 class="font-semibold text-slate-900">Active Projects</h2>
          <a href="/projects" class="text-sm text-primary-600 hover:text-primary-700">View all →</a>
        </div>
        <div class="p-6">
          <div class="text-slate-500 text-sm text-center py-8">
            Connect to API to show projects
          </div>
        </div>
      </div>

      <!-- Requires Attention -->
      <div class="bg-white rounded-xl border border-slate-200">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 class="font-semibold text-slate-900">Requires Attention</h2>
          <span class="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">5</span>
        </div>
        <div class="p-6">
          <div class="text-slate-500 text-sm text-center py-8">
            Connect to API to show alerts
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
