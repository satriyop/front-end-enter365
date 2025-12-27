<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTrialBalance } from '@/api/useReports'
import { Button, Input, Card, Badge } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const router = useRouter()

const asOfDate = ref(new Date().toISOString().split('T')[0])
const asOfDateRef = computed(() => asOfDate.value)

const { data: report, isLoading, error } = useTrialBalance(asOfDateRef)

function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    asset: 'Asset',
    liability: 'Liability',
    equity: 'Equity',
    revenue: 'Revenue',
    expense: 'Expense',
  }
  return labels[type] || type
}

function getAccountTypeColor(type: string): string {
  const colors: Record<string, string> = {
    asset: 'text-blue-600',
    liability: 'text-orange-600',
    equity: 'text-green-600',
    revenue: 'text-emerald-600',
    expense: 'text-red-600',
  }
  return colors[type] || 'text-slate-600'
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Trial Balance</h1>
        <p class="text-slate-500">Neraca Saldo - Summary of all account balances</p>
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
        <div class="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            @click="asOfDate = new Date().toISOString().split('T')[0]"
          >
            Today
          </Button>
          <Button
            variant="secondary"
            size="sm"
            @click="() => {
              const now = new Date()
              asOfDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
            }"
          >
            End of Last Month
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
        <div class="text-center border-b border-slate-200 pb-4 mb-4">
          <h2 class="text-xl font-semibold text-slate-900">{{ report.report_name }}</h2>
          <p class="text-slate-500">As of {{ report.as_of_date }}</p>
          <Badge v-if="report.is_balanced" variant="success" class="mt-2">Balanced</Badge>
          <Badge v-else variant="error" class="mt-2">Not Balanced - Difference: {{ formatCurrency(Math.abs(report.total_debit - report.total_credit)) }}</Badge>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="text-left px-4 py-3 font-medium text-slate-700">Code</th>
                <th class="text-left px-4 py-3 font-medium text-slate-700">Account Name</th>
                <th class="text-left px-4 py-3 font-medium text-slate-700">Type</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700">Debit</th>
                <th class="text-right px-4 py-3 font-medium text-slate-700">Credit</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr
                v-for="account in report.accounts"
                :key="account.id"
                class="hover:bg-slate-50"
              >
                <td class="px-4 py-3 font-mono text-slate-600">{{ account.code }}</td>
                <td class="px-4 py-3 font-medium">{{ account.name }}</td>
                <td class="px-4 py-3">
                  <span :class="getAccountTypeColor(account.type)" class="text-xs font-medium uppercase">
                    {{ getAccountTypeLabel(account.type) }}
                  </span>
                </td>
                <td class="text-right px-4 py-3 font-mono">
                  {{ account.debit_balance > 0 ? formatCurrency(account.debit_balance) : '-' }}
                </td>
                <td class="text-right px-4 py-3 font-mono">
                  {{ account.credit_balance > 0 ? formatCurrency(account.credit_balance) : '-' }}
                </td>
              </tr>
              <tr v-if="!report.accounts?.length">
                <td colspan="5" class="text-center py-8 text-slate-500">
                  No accounts found
                </td>
              </tr>
            </tbody>
            <tfoot class="bg-slate-100 font-semibold">
              <tr>
                <td colspan="3" class="px-4 py-3">TOTAL</td>
                <td class="text-right px-4 py-3 font-mono">{{ formatCurrency(report.total_debit) }}</td>
                <td class="text-right px-4 py-3 font-mono">{{ formatCurrency(report.total_credit) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  </div>
</template>
