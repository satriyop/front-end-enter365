<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCashFlow } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency, toLocalISODate } from '@/utils/format'

const router = useRouter()

const startDate = ref(toLocalISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
const endDate = ref(toLocalISODate())

const startDateRef = computed(() => startDate.value)
const endDateRef = computed(() => endDate.value)

const { data: report, isLoading, error } = useCashFlow(startDateRef, endDateRef)

function formatAmount(amount: number): string {
  const formatted = formatCurrency(Math.abs(amount))
  return amount < 0 ? `(${formatted})` : formatted
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Cash Flow Statement</h1>
        <p class="text-slate-500 dark:text-slate-400">Laporan Arus Kas - Cash movements by activity</p>
      </div>
      <Button variant="ghost" @click="router.push('/reports')">Back to Reports</Button>
    </div>

    <!-- Date Filter -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
          <Input v-model="startDate" type="date" class="w-40" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
          <Input v-model="endDate" type="date" class="w-40" />
        </div>
        <div class="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            @click="() => {
              const now = new Date()
              startDate = toLocalISODate(new Date(now.getFullYear(), now.getMonth(), 1))
              endDate = toLocalISODate(now)
            }"
          >
            This Month
          </Button>
          <Button
            variant="secondary"
            size="sm"
            @click="() => {
              const now = new Date()
              startDate = toLocalISODate(new Date(now.getFullYear(), 0, 1))
              endDate = toLocalISODate(now)
            }"
          >
            Year to Date
          </Button>
        </div>
      </div>
    </Card>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading report...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-500 dark:text-red-400">Failed to load report</div>
    </div>

    <!-- Report Content -->
    <div v-else-if="report" class="space-y-6">
      <Card>
        <div class="text-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-6">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ report.report_name }}</h2>
          <p class="text-slate-500 dark:text-slate-400">
            Period: {{ report.period?.start }} to {{ report.period?.end }}
          </p>
        </div>

        <!-- Opening Balance -->
        <div class="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded mb-6">
          <span class="font-medium text-slate-700 dark:text-slate-300">Opening Cash Balance</span>
          <span class="font-mono text-lg text-slate-900 dark:text-slate-100">{{ formatCurrency(report.opening_balance || 0) }}</span>
        </div>

        <!-- Operating Activities -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-3 pb-2 border-b border-blue-200 dark:border-blue-800">
            Cash Flows from Operating Activities
          </h3>
          <div class="space-y-2 pl-4">
            <div
              v-for="item in report.operating_activities?.items"
              :key="item.description"
              class="flex justify-between text-sm"
            >
              <span class="text-slate-600 dark:text-slate-400">{{ item.description }}</span>
              <span class="font-mono" :class="item.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ formatAmount(item.amount) }}
              </span>
            </div>
            <div class="flex justify-between font-semibold border-t border-slate-200 dark:border-slate-700 pt-2 mt-3 text-slate-900 dark:text-slate-100">
              <span>Net Cash from Operating Activities</span>
              <span class="font-mono" :class="(report.operating_activities?.total || 0) >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
                {{ formatAmount(report.operating_activities?.total || 0) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Investing Activities -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-3 pb-2 border-b border-purple-200 dark:border-purple-800">
            Cash Flows from Investing Activities
          </h3>
          <div class="space-y-2 pl-4">
            <div
              v-for="item in report.investing_activities?.items"
              :key="item.description"
              class="flex justify-between text-sm"
            >
              <span class="text-slate-600 dark:text-slate-400">{{ item.description }}</span>
              <span class="font-mono" :class="item.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ formatAmount(item.amount) }}
              </span>
            </div>
            <div v-if="!report.investing_activities?.items?.length" class="text-sm text-slate-400 dark:text-slate-500 italic">
              No investing activities
            </div>
            <div class="flex justify-between font-semibold border-t border-slate-200 dark:border-slate-700 pt-2 mt-3 text-slate-900 dark:text-slate-100">
              <span>Net Cash from Investing Activities</span>
              <span class="font-mono" :class="(report.investing_activities?.total || 0) >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
                {{ formatAmount(report.investing_activities?.total || 0) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Financing Activities -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-3 pb-2 border-b border-orange-200 dark:border-orange-800">
            Cash Flows from Financing Activities
          </h3>
          <div class="space-y-2 pl-4">
            <div
              v-for="item in report.financing_activities?.items"
              :key="item.description"
              class="flex justify-between text-sm"
            >
              <span class="text-slate-600 dark:text-slate-400">{{ item.description }}</span>
              <span class="font-mono" :class="item.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ formatAmount(item.amount) }}
              </span>
            </div>
            <div v-if="!report.financing_activities?.items?.length" class="text-sm text-slate-400 dark:text-slate-500 italic">
              No financing activities
            </div>
            <div class="flex justify-between font-semibold border-t border-slate-200 dark:border-slate-700 pt-2 mt-3 text-slate-900 dark:text-slate-100">
              <span>Net Cash from Financing Activities</span>
              <span class="font-mono" :class="(report.financing_activities?.total || 0) >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
                {{ formatAmount(report.financing_activities?.total || 0) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Net Change & Closing Balance -->
        <div class="border-t-2 border-slate-300 dark:border-slate-600 pt-4 space-y-3">
          <div class="flex justify-between items-center px-4 py-2">
            <span class="font-semibold text-slate-700 dark:text-slate-300">Net Change in Cash</span>
            <span
              class="font-mono text-lg font-bold"
              :class="(report.net_cash_change || 0) >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'"
            >
              {{ formatAmount(report.net_cash_change || 0) }}
            </span>
          </div>
          <div
            class="flex justify-between items-center px-4 py-3 rounded"
            :class="(report.closing_balance || 0) >= 0 ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'"
          >
            <span class="font-bold text-slate-900 dark:text-slate-100">Closing Cash Balance</span>
            <span class="font-mono text-xl font-bold text-slate-900 dark:text-slate-100">{{ formatCurrency(report.closing_balance || 0) }}</span>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
