<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useIncomeStatement } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const router = useRouter()

// Date filter state
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

const startDateRef = computed(() => startDate.value)
const endDateRef = computed(() => endDate.value)

const { data: report, isLoading, error } = useIncomeStatement(startDateRef, endDateRef)

function formatAmount(amount: number): string {
  const formatted = formatCurrency(Math.abs(amount))
  return amount < 0 ? `(${formatted})` : formatted
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Income Statement</h1>
        <p class="text-slate-500">Laporan Laba Rugi - Revenue and expenses for the period</p>
      </div>
      <Button variant="ghost" @click="router.push('/reports')">Back to Reports</Button>
    </div>

    <!-- Date Filter -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
          <Input v-model="startDate" type="date" class="w-40" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">End Date</label>
          <Input v-model="endDate" type="date" class="w-40" />
        </div>
        <div class="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            @click="() => {
              const now = new Date()
              startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
              endDate = now.toISOString().split('T')[0]
            }"
          >
            This Month
          </Button>
          <Button
            variant="secondary"
            size="sm"
            @click="() => {
              const now = new Date()
              startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
              endDate = now.toISOString().split('T')[0]
            }"
          >
            Year to Date
          </Button>
        </div>
      </div>
    </Card>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-slate-500">Loading report...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-500">Failed to load report</div>
    </div>

    <!-- Report Content -->
    <div v-else-if="report" class="space-y-6">
      <!-- Report Header -->
      <Card>
        <div class="text-center border-b border-slate-200 pb-4 mb-4">
          <h2 class="text-xl font-semibold text-slate-900">{{ report.report_name }}</h2>
          <p class="text-slate-500">
            Period: {{ report.period?.start_date || startDate }} to {{ report.period?.end_date || endDate }}
          </p>
        </div>

        <!-- Revenue Section -->
        <div class="mb-6">
          <h3 class="text-lg font-medium text-slate-900 mb-3 border-b border-slate-200 pb-2">Revenue</h3>
          <template v-if="report.revenue?.length">
            <div v-for="section in report.revenue" :key="section.name" class="mb-4">
              <div class="font-medium text-slate-700 mb-2">{{ section.name }}</div>
              <div class="space-y-1 pl-4">
                <div
                  v-for="account in section.accounts"
                  :key="account.id"
                  class="flex justify-between text-sm"
                >
                  <span class="text-slate-600">{{ account.code }} - {{ account.name }}</span>
                  <span class="font-mono">{{ formatAmount(account.balance) }}</span>
                </div>
                <div class="flex justify-between font-medium border-t border-slate-100 pt-1 mt-2">
                  <span>Total {{ section.name }}</span>
                  <span class="font-mono">{{ formatAmount(section.total) }}</span>
                </div>
              </div>
            </div>
          </template>
          <div class="flex justify-between text-lg font-semibold text-green-700 bg-green-50 px-4 py-2 rounded">
            <span>Total Revenue</span>
            <span class="font-mono">{{ formatAmount(report.total_revenue) }}</span>
          </div>
        </div>

        <!-- Expenses Section -->
        <div class="mb-6">
          <h3 class="text-lg font-medium text-slate-900 mb-3 border-b border-slate-200 pb-2">Expenses</h3>
          <template v-if="report.expenses?.length">
            <div v-for="section in report.expenses" :key="section.name" class="mb-4">
              <div class="font-medium text-slate-700 mb-2">{{ section.name }}</div>
              <div class="space-y-1 pl-4">
                <div
                  v-for="account in section.accounts"
                  :key="account.id"
                  class="flex justify-between text-sm"
                >
                  <span class="text-slate-600">{{ account.code }} - {{ account.name }}</span>
                  <span class="font-mono">{{ formatAmount(account.balance) }}</span>
                </div>
                <div class="flex justify-between font-medium border-t border-slate-100 pt-1 mt-2">
                  <span>Total {{ section.name }}</span>
                  <span class="font-mono">{{ formatAmount(section.total) }}</span>
                </div>
              </div>
            </div>
          </template>
          <div class="flex justify-between text-lg font-semibold text-red-700 bg-red-50 px-4 py-2 rounded">
            <span>Total Expenses</span>
            <span class="font-mono">{{ formatAmount(report.total_expenses) }}</span>
          </div>
        </div>

        <!-- Net Income -->
        <div class="border-t-2 border-slate-300 pt-4">
          <div
            class="flex justify-between text-xl font-bold px-4 py-3 rounded"
            :class="report.net_income >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
          >
            <span>Net Income</span>
            <span class="font-mono">{{ formatAmount(report.net_income) }}</span>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
