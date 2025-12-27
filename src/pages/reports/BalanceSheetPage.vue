<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBalanceSheet } from '@/api/useReports'
import { Button, Input, Card, Badge } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const router = useRouter()

const asOfDate = ref(new Date().toISOString().split('T')[0])
const asOfDateRef = computed(() => asOfDate.value)

const { data: report, isLoading, error } = useBalanceSheet(asOfDateRef)

function formatAmount(amount: number): string {
  const formatted = formatCurrency(Math.abs(amount))
  return amount < 0 ? `(${formatted})` : formatted
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Balance Sheet</h1>
        <p class="text-slate-500">Laporan Posisi Keuangan - Assets, liabilities, and equity</p>
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
          <Button
            variant="secondary"
            size="sm"
            @click="() => {
              const now = new Date()
              asOfDate = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0]
            }"
          >
            End of Last Year
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
          <p class="text-slate-500">As of {{ report.as_of_date }}</p>
          <Badge v-if="report.is_balanced" variant="success" class="mt-2">Balanced</Badge>
          <Badge v-else variant="error" class="mt-2">Not Balanced</Badge>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Assets Column -->
          <div>
            <h3 class="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b-2 border-blue-500">
              ASSETS
            </h3>
            <template v-if="report.assets?.length">
              <div v-for="section in report.assets" :key="section.name" class="mb-6">
                <div class="font-medium text-slate-700 mb-2 bg-slate-50 px-2 py-1 rounded">
                  {{ section.name }}
                </div>
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
                    <span>Subtotal</span>
                    <span class="font-mono">{{ formatAmount(section.total) }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div class="flex justify-between text-lg font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded border-t-2 border-blue-500">
              <span>TOTAL ASSETS</span>
              <span class="font-mono">{{ formatAmount(report.total_assets) }}</span>
            </div>
          </div>

          <!-- Liabilities & Equity Column -->
          <div>
            <!-- Liabilities -->
            <h3 class="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b-2 border-orange-500">
              LIABILITIES
            </h3>
            <template v-if="report.liabilities?.length">
              <div v-for="section in report.liabilities" :key="section.name" class="mb-6">
                <div class="font-medium text-slate-700 mb-2 bg-slate-50 px-2 py-1 rounded">
                  {{ section.name }}
                </div>
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
                    <span>Subtotal</span>
                    <span class="font-mono">{{ formatAmount(section.total) }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div class="flex justify-between font-semibold text-orange-700 bg-orange-50 px-4 py-2 rounded mb-6">
              <span>Total Liabilities</span>
              <span class="font-mono">{{ formatAmount(report.total_liabilities) }}</span>
            </div>

            <!-- Equity -->
            <h3 class="text-lg font-semibold text-slate-900 mb-4 pb-2 border-b-2 border-green-500">
              EQUITY
            </h3>
            <template v-if="report.equity?.length">
              <div v-for="section in report.equity" :key="section.name" class="mb-6">
                <div class="font-medium text-slate-700 mb-2 bg-slate-50 px-2 py-1 rounded">
                  {{ section.name }}
                </div>
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
                    <span>Subtotal</span>
                    <span class="font-mono">{{ formatAmount(section.total) }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div class="flex justify-between font-semibold text-green-700 bg-green-50 px-4 py-2 rounded mb-6">
              <span>Total Equity</span>
              <span class="font-mono">{{ formatAmount(report.total_equity) }}</span>
            </div>

            <!-- Total Liabilities + Equity -->
            <div class="flex justify-between text-lg font-bold text-slate-900 bg-slate-100 px-4 py-2 rounded border-t-2 border-slate-400">
              <span>TOTAL LIABILITIES & EQUITY</span>
              <span class="font-mono">{{ formatAmount(report.total_liabilities_equity) }}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
