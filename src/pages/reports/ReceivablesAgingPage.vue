<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useReceivablesAging } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const router = useRouter()

const asOfDate = ref(new Date().toISOString().split('T')[0])
const asOfDateRef = computed(() => asOfDate.value)

const { data: report, isLoading, error } = useReceivablesAging(asOfDateRef)

</script>

<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Receivables Aging</h1>
        <p class="text-slate-500">Laporan Umur Piutang - Outstanding invoices by age</p>
      </div>
      <Button variant="ghost" @click="router.push('/reports')">Back to Reports</Button>
    </div>

    <!-- Date Filter -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">As of Date</label>
          <Input v-model="asOfDate" type="date" class="w-40" />
        </div>
        <Button
          variant="secondary"
          size="sm"
          @click="asOfDate = new Date().toISOString().split('T')[0]"
        >
          Today
        </Button>
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
      <!-- Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card class="text-center">
          <div class="text-sm text-slate-500">Current</div>
          <div class="text-xl font-bold text-green-600">{{ formatCurrency(report.totals?.current || 0) }}</div>
        </Card>
        <Card class="text-center">
          <div class="text-sm text-slate-500">1-30 Days</div>
          <div class="text-xl font-bold text-yellow-600">{{ formatCurrency(report.totals?.days_1_30 || 0) }}</div>
        </Card>
        <Card class="text-center">
          <div class="text-sm text-slate-500">31-60 Days</div>
          <div class="text-xl font-bold text-orange-600">{{ formatCurrency(report.totals?.days_31_60 || 0) }}</div>
        </Card>
        <Card class="text-center">
          <div class="text-sm text-slate-500">61-90 Days</div>
          <div class="text-xl font-bold text-red-500">{{ formatCurrency(report.totals?.days_61_90 || 0) }}</div>
        </Card>
        <Card class="text-center">
          <div class="text-sm text-slate-500">Over 90 Days</div>
          <div class="text-xl font-bold text-red-700">{{ formatCurrency(report.totals?.over_90 || 0) }}</div>
        </Card>
      </div>

      <!-- Detail Table -->
      <Card>
        <div class="text-center border-b border-slate-200 pb-4 mb-4">
          <h2 class="text-xl font-semibold text-slate-900">{{ report.report_name }}</h2>
          <p class="text-slate-500">As of {{ report.as_of_date }}</p>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-slate-700">Customer</th>
                <th class="text-right px-4 py-3 font-medium text-green-700">Current</th>
                <th class="text-right px-4 py-3 font-medium text-yellow-700">1-30 Days</th>
                <th class="text-right px-4 py-3 font-medium text-orange-700">31-60 Days</th>
                <th class="text-right px-4 py-3 font-medium text-red-600">61-90 Days</th>
                <th class="text-right px-4 py-3 font-medium text-red-800">Over 90</th>
                <th class="text-right px-4 py-3 font-medium text-slate-900">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="contact in report.contacts" :key="contact.id" class="hover:bg-slate-50">
                <td class="px-4 py-3">
                  <RouterLink :to="`/contacts/${contact.id}`" class="text-primary-600 hover:underline font-medium">
                    {{ contact.name }}
                  </RouterLink>
                  <div class="text-xs text-slate-400">{{ contact.code }}</div>
                </td>
                <td class="text-right px-4 py-3 font-mono text-green-600">
                  {{ contact.current > 0 ? formatCurrency(contact.current) : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-yellow-600">
                  {{ contact.days_1_30 > 0 ? formatCurrency(contact.days_1_30) : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-orange-600">
                  {{ contact.days_31_60 > 0 ? formatCurrency(contact.days_31_60) : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-red-600">
                  {{ contact.days_61_90 > 0 ? formatCurrency(contact.days_61_90) : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono text-red-800">
                  {{ contact.over_90 > 0 ? formatCurrency(contact.over_90) : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono font-semibold">
                  {{ formatCurrency(contact.total) }}
                </td>
              </tr>
              <tr v-if="!report.contacts?.length">
                <td colspan="7" class="text-center py-8 text-slate-500">
                  No outstanding receivables
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-100 font-semibold">
              <tr>
                <td class="px-4 py-3">TOTAL</td>
                <td class="text-right px-4 py-3 font-mono text-green-700">{{ formatCurrency(report.totals?.current || 0) }}</td>
                <td class="text-right px-4 py-3 font-mono text-yellow-700">{{ formatCurrency(report.totals?.days_1_30 || 0) }}</td>
                <td class="text-right px-4 py-3 font-mono text-orange-700">{{ formatCurrency(report.totals?.days_31_60 || 0) }}</td>
                <td class="text-right px-4 py-3 font-mono text-red-600">{{ formatCurrency(report.totals?.days_61_90 || 0) }}</td>
                <td class="text-right px-4 py-3 font-mono text-red-800">{{ formatCurrency(report.totals?.over_90 || 0) }}</td>
                <td class="text-right px-4 py-3 font-mono">{{ formatCurrency(report.totals?.total || 0) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  </div>
</template>
