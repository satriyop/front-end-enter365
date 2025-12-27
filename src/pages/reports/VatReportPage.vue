<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePpnSummary, usePpnMonthly } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const router = useRouter()

// View mode: summary or monthly
const viewMode = ref<'summary' | 'monthly'>('summary')

// Summary view dates
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

// Monthly view year
const year = ref(new Date().getFullYear())

const startDateRef = computed(() => startDate.value)
const endDateRef = computed(() => endDate.value)
const yearRef = computed(() => year.value)

const { data: summaryReport, isLoading: loadingSummary } = usePpnSummary(startDateRef, endDateRef)
const { data: monthlyReport, isLoading: loadingMonthly } = usePpnMonthly(yearRef)

const isLoading = computed(() => viewMode.value === 'summary' ? loadingSummary.value : loadingMonthly.value)

function formatAmount(amount: number): string {
  const formatted = formatCurrency(Math.abs(amount))
  return amount < 0 ? `(${formatted})` : formatted
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">VAT Report</h1>
        <p class="text-slate-500">Laporan PPN - Input and output VAT summary</p>
      </div>
      <Button variant="ghost" @click="router.push('/reports')">Back to Reports</Button>
    </div>

    <!-- View Mode Toggle -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="flex gap-2">
          <Button
            :variant="viewMode === 'summary' ? 'primary' : 'secondary'"
            size="sm"
            @click="viewMode = 'summary'"
          >
            Period Summary
          </Button>
          <Button
            :variant="viewMode === 'monthly' ? 'primary' : 'secondary'"
            size="sm"
            @click="viewMode = 'monthly'"
          >
            Monthly Breakdown
          </Button>
        </div>

        <!-- Summary View Filters -->
        <template v-if="viewMode === 'summary'">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
            <Input v-model="startDate" type="date" class="w-40" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">End Date</label>
            <Input v-model="endDate" type="date" class="w-40" />
          </div>
          <Button
            variant="secondary"
            size="sm"
            @click="() => {
              const now = new Date()
              startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
              endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
            }"
          >
            This Month
          </Button>
        </template>

        <!-- Monthly View Filters -->
        <template v-else>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Year</label>
            <Input v-model.number="year" type="number" class="w-28" :min="2020" :max="2030" />
          </div>
          <Button
            variant="secondary"
            size="sm"
            @click="year = new Date().getFullYear()"
          >
            This Year
          </Button>
        </template>
      </div>
    </Card>

    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-slate-500">Loading report...</div>
    </div>

    <!-- Summary View -->
    <div v-else-if="viewMode === 'summary' && summaryReport" class="space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card class="text-center">
          <div class="text-sm text-slate-500 mb-1">Output VAT (PPN Keluaran)</div>
          <div class="text-2xl font-bold text-red-600">{{ formatCurrency(summaryReport.output_tax || 0) }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ summaryReport.output_count || 0 }} invoices</div>
        </Card>
        <Card class="text-center">
          <div class="text-sm text-slate-500 mb-1">Input VAT (PPN Masukan)</div>
          <div class="text-2xl font-bold text-green-600">{{ formatCurrency(summaryReport.input_tax || 0) }}</div>
          <div class="text-xs text-slate-400 mt-1">{{ summaryReport.input_count || 0 }} bills</div>
        </Card>
        <Card
          class="text-center"
          :class="(summaryReport.net_vat || 0) >= 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'"
        >
          <div class="text-sm text-slate-500 mb-1">Net VAT Payable</div>
          <div
            class="text-2xl font-bold"
            :class="(summaryReport.net_vat || 0) >= 0 ? 'text-red-700' : 'text-green-700'"
          >
            {{ formatAmount(summaryReport.net_vat || 0) }}
          </div>
          <div class="text-xs mt-1" :class="(summaryReport.net_vat || 0) >= 0 ? 'text-red-500' : 'text-green-500'">
            {{ (summaryReport.net_vat || 0) >= 0 ? 'To Pay' : 'Refundable' }}
          </div>
        </Card>
      </div>

      <Card>
        <div class="text-center border-b border-slate-200 pb-4 mb-4">
          <h2 class="text-xl font-semibold text-slate-900">{{ summaryReport.report_name }}</h2>
          <p class="text-slate-500">
            Period: {{ summaryReport.period?.start }} to {{ summaryReport.period?.end }}
          </p>
        </div>

        <div class="space-y-4">
          <div class="flex justify-between items-center p-4 bg-slate-50 rounded">
            <div>
              <div class="font-medium">Output VAT (Sales)</div>
              <div class="text-sm text-slate-500">PPN Keluaran - VAT collected from customers</div>
            </div>
            <div class="text-right">
              <div class="text-xl font-mono font-semibold text-red-600">
                {{ formatCurrency(summaryReport.output_tax || 0) }}
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center p-4 bg-slate-50 rounded">
            <div>
              <div class="font-medium">Input VAT (Purchases)</div>
              <div class="text-sm text-slate-500">PPN Masukan - VAT paid to suppliers</div>
            </div>
            <div class="text-right">
              <div class="text-xl font-mono font-semibold text-green-600">
                ({{ formatCurrency(summaryReport.input_tax || 0) }})
              </div>
            </div>
          </div>

          <div
            class="flex justify-between items-center p-4 rounded border-2"
            :class="(summaryReport.net_vat || 0) >= 0 ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'"
          >
            <div>
              <div class="font-semibold">Net VAT</div>
              <div class="text-sm text-slate-500">
                {{ (summaryReport.net_vat || 0) >= 0 ? 'Amount to pay to tax authority' : 'Amount refundable / carry forward' }}
              </div>
            </div>
            <div class="text-right">
              <div
                class="text-2xl font-mono font-bold"
                :class="(summaryReport.net_vat || 0) >= 0 ? 'text-red-700' : 'text-green-700'"
              >
                {{ formatAmount(summaryReport.net_vat || 0) }}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>

    <!-- Monthly View -->
    <div v-else-if="viewMode === 'monthly' && monthlyReport" class="space-y-6">
      <Card>
        <div class="text-center border-b border-slate-200 pb-4 mb-4">
          <h2 class="text-xl font-semibold text-slate-900">{{ monthlyReport.report_name }}</h2>
          <p class="text-slate-500">Monthly VAT breakdown for {{ monthlyReport.year }}</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-slate-700">Month</th>
                <th class="text-right px-4 py-3 font-medium text-red-600">Output VAT</th>
                <th class="text-right px-4 py-3 font-medium text-green-600">Input VAT</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700">Net VAT</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="month in monthlyReport.months"
                :key="month.month"
                class="hover:bg-slate-50"
              >
                <td class="px-4 py-3 font-medium">{{ month.month_name }}</td>
                <td class="text-right px-4 py-3 font-mono text-red-600">
                  {{ month.output > 0 ? formatCurrency(month.output) : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-green-600">
                  {{ month.input > 0 ? formatCurrency(month.input) : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono font-semibold" :class="month.net >= 0 ? 'text-red-700' : 'text-green-700'">
                  {{ formatAmount(month.net) }}
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-100 font-semibold">
              <tr>
                <td class="px-4 py-3">TOTAL</td>
                <td class="text-right px-4 py-3 font-mono text-red-700">{{ formatCurrency(monthlyReport.total_output) }}</td>
                <td class="text-right px-4 py-3 font-mono text-green-700">{{ formatCurrency(monthlyReport.total_input) }}</td>
                <td class="text-right px-4 py-3 font-mono" :class="monthlyReport.total_net >= 0 ? 'text-red-700' : 'text-green-700'">
                  {{ formatAmount(monthlyReport.total_net) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  </div>
</template>
