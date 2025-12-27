<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCashFlow } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const router = useRouter()

const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

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
        <h1 class="text-2xl font-semibold text-slate-900">Cash Flow Statement</h1>
        <p class="text-slate-500">Laporan Arus Kas - Cash movements by activity</p>
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
      <Card>
        <div class="text-center border-b border-slate-200 pb-4 mb-6">
          <h2 class="text-xl font-semibold text-slate-900">{{ report.report_name }}</h2>
          <p class="text-slate-500">
            Period: {{ report.period?.start }} to {{ report.period?.end }}
          </p>
        </div>

        <!-- Opening Balance -->
        <div class="flex justify-between items-center px-4 py-3 bg-slate-50 rounded mb-6">
          <span class="font-medium text-slate-700">Opening Cash Balance</span>
          <span class="font-mono text-lg">{{ formatCurrency(report.opening_balance || 0) }}</span>
        </div>

        <!-- Operating Activities -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-blue-700 mb-3 pb-2 border-b border-blue-200">
            Cash Flows from Operating Activities
          </h3>
          <div class="space-y-2 pl-4">
            <div
              v-for="item in report.operating_activities?.items"
              :key="item.description"
              class="flex justify-between text-sm"
            >
              <span class="text-slate-600">{{ item.description }}</span>
              <span class="font-mono" :class="item.amount >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatAmount(item.amount) }}
              </span>
            </div>
            <div class="flex justify-between font-semibold border-t border-slate-200 pt-2 mt-3">
              <span>Net Cash from Operating Activities</span>
              <span class="font-mono" :class="(report.operating_activities?.total || 0) >= 0 ? 'text-green-700' : 'text-red-700'">
                {{ formatAmount(report.operating_activities?.total || 0) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Investing Activities -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-purple-700 mb-3 pb-2 border-b border-purple-200">
            Cash Flows from Investing Activities
          </h3>
          <div class="space-y-2 pl-4">
            <div
              v-for="item in report.investing_activities?.items"
              :key="item.description"
              class="flex justify-between text-sm"
            >
              <span class="text-slate-600">{{ item.description }}</span>
              <span class="font-mono" :class="item.amount >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatAmount(item.amount) }}
              </span>
            </div>
            <div v-if="!report.investing_activities?.items?.length" class="text-sm text-slate-400 italic">
              No investing activities
            </div>
            <div class="flex justify-between font-semibold border-t border-slate-200 pt-2 mt-3">
              <span>Net Cash from Investing Activities</span>
              <span class="font-mono" :class="(report.investing_activities?.total || 0) >= 0 ? 'text-green-700' : 'text-red-700'">
                {{ formatAmount(report.investing_activities?.total || 0) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Financing Activities -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-orange-700 mb-3 pb-2 border-b border-orange-200">
            Cash Flows from Financing Activities
          </h3>
          <div class="space-y-2 pl-4">
            <div
              v-for="item in report.financing_activities?.items"
              :key="item.description"
              class="flex justify-between text-sm"
            >
              <span class="text-slate-600">{{ item.description }}</span>
              <span class="font-mono" :class="item.amount >= 0 ? 'text-green-600' : 'text-red-600'">
                {{ formatAmount(item.amount) }}
              </span>
            </div>
            <div v-if="!report.financing_activities?.items?.length" class="text-sm text-slate-400 italic">
              No financing activities
            </div>
            <div class="flex justify-between font-semibold border-t border-slate-200 pt-2 mt-3">
              <span>Net Cash from Financing Activities</span>
              <span class="font-mono" :class="(report.financing_activities?.total || 0) >= 0 ? 'text-green-700' : 'text-red-700'">
                {{ formatAmount(report.financing_activities?.total || 0) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Net Change & Closing Balance -->
        <div class="border-t-2 border-slate-300 pt-4 space-y-3">
          <div class="flex justify-between items-center px-4 py-2">
            <span class="font-semibold text-slate-700">Net Change in Cash</span>
            <span
              class="font-mono text-lg font-bold"
              :class="(report.net_cash_change || 0) >= 0 ? 'text-green-700' : 'text-red-700'"
            >
              {{ formatAmount(report.net_cash_change || 0) }}
            </span>
          </div>
          <div
            class="flex justify-between items-center px-4 py-3 rounded"
            :class="(report.closing_balance || 0) >= 0 ? 'bg-green-50' : 'bg-red-50'"
          >
            <span class="font-bold text-slate-900">Closing Cash Balance</span>
            <span class="font-mono text-xl font-bold">{{ formatCurrency(report.closing_balance || 0) }}</span>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
