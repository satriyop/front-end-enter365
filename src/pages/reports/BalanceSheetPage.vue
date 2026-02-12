<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBalanceSheet } from '@/api/useReports'
import { useExportBalanceSheet } from '@/api/useExports'
import { Button, Input, Card, Badge, ExportButton } from '@/components/ui'
import { formatCurrency, toLocalISODate } from '@/utils/format'

const router = useRouter()

const asOfDate = ref(toLocalISODate())
const asOfDateRef = computed(() => asOfDate.value)

const { data: report, isLoading, error } = useBalanceSheet(asOfDateRef)

const exportMutation = useExportBalanceSheet()

function handleExport() {
  exportMutation.mutate({ date: asOfDate.value || undefined })
}

function formatAmount(amount: number): string {
  const formatted = formatCurrency(Math.abs(amount))
  return amount < 0 ? `(${formatted})` : formatted
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Balance Sheet</h1>
        <p class="text-slate-500 dark:text-slate-400">Laporan Posisi Keuangan - Assets, liabilities, and equity</p>
      </div>
      <div class="flex gap-2">
        <ExportButton :show-format-options="false" :loading="exportMutation.isPending.value" @export="handleExport" />
        <Button variant="ghost" @click="router.push('/reports')">Back to Reports</Button>
      </div>
    </div>

    <!-- Date Filter -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">As of Date</label>
          <Input v-model="asOfDate" type="date" class="w-40" />
        </div>
        <div class="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            @click="asOfDate = toLocalISODate()"
          >
            Today
          </Button>
          <Button
            variant="secondary"
            size="sm"
            @click="() => {
              const now = new Date()
              asOfDate = toLocalISODate(new Date(now.getFullYear(), now.getMonth(), 0))
            }"
          >
            End of Last Month
          </Button>
          <Button
            variant="secondary"
            size="sm"
            @click="() => {
              const now = new Date()
              asOfDate = toLocalISODate(new Date(now.getFullYear() - 1, 11, 31))
            }"
          >
            End of Last Year
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
      <!-- Report Header -->
      <Card>
        <div class="text-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ report.report_name }}</h2>
          <p class="text-slate-500 dark:text-slate-400">As of {{ report.as_of_date }}</p>
          <Badge v-if="report.is_balanced" variant="success" class="mt-2">Balanced</Badge>
          <Badge v-else variant="destructive" class="mt-2">Not Balanced</Badge>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Assets Column -->
          <div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-blue-500 dark:border-blue-600">
              ASSETS
            </h3>
            <template v-if="report.assets?.length">
              <div v-for="section in report.assets" :key="section.name" class="mb-6">
                <div class="font-medium text-slate-700 dark:text-slate-300 mb-2 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                  {{ section.name }}
                </div>
                <div class="space-y-1 pl-4">
                  <div
                    v-for="account in section.accounts"
                    :key="account.id"
                    class="flex justify-between text-sm"
                  >
                    <span class="text-slate-600 dark:text-slate-400">{{ account.code }} - {{ account.name }}</span>
                    <span class="font-mono text-slate-900 dark:text-slate-100">{{ formatAmount(account.balance) }}</span>
                  </div>
                  <div class="flex justify-between font-medium border-t border-slate-100 dark:border-slate-700 pt-1 mt-2 text-slate-900 dark:text-slate-100">
                    <span>Subtotal</span>
                    <span class="font-mono">{{ formatAmount(section.total) }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div class="flex justify-between text-lg font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded border-t-2 border-blue-500 dark:border-blue-600">
              <span>TOTAL ASSETS</span>
              <span class="font-mono">{{ formatAmount(report.total_assets) }}</span>
            </div>
          </div>

          <!-- Liabilities & Equity Column -->
          <div>
            <!-- Liabilities -->
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-orange-500 dark:border-orange-600">
              LIABILITIES
            </h3>
            <template v-if="report.liabilities?.length">
              <div v-for="section in report.liabilities" :key="section.name" class="mb-6">
                <div class="font-medium text-slate-700 dark:text-slate-300 mb-2 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                  {{ section.name }}
                </div>
                <div class="space-y-1 pl-4">
                  <div
                    v-for="account in section.accounts"
                    :key="account.id"
                    class="flex justify-between text-sm"
                  >
                    <span class="text-slate-600 dark:text-slate-400">{{ account.code }} - {{ account.name }}</span>
                    <span class="font-mono text-slate-900 dark:text-slate-100">{{ formatAmount(account.balance) }}</span>
                  </div>
                  <div class="flex justify-between font-medium border-t border-slate-100 dark:border-slate-700 pt-1 mt-2 text-slate-900 dark:text-slate-100">
                    <span>Subtotal</span>
                    <span class="font-mono">{{ formatAmount(section.total) }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div class="flex justify-between font-semibold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 px-4 py-2 rounded mb-6">
              <span>Total Liabilities</span>
              <span class="font-mono">{{ formatAmount(report.total_liabilities) }}</span>
            </div>

            <!-- Equity -->
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 pb-2 border-b-2 border-green-500 dark:border-green-600">
              EQUITY
            </h3>
            <template v-if="report.equity?.length">
              <div v-for="section in report.equity" :key="section.name" class="mb-6">
                <div class="font-medium text-slate-700 dark:text-slate-300 mb-2 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                  {{ section.name }}
                </div>
                <div class="space-y-1 pl-4">
                  <div
                    v-for="account in section.accounts"
                    :key="account.id"
                    class="flex justify-between text-sm"
                  >
                    <span class="text-slate-600 dark:text-slate-400">{{ account.code }} - {{ account.name }}</span>
                    <span class="font-mono text-slate-900 dark:text-slate-100">{{ formatAmount(account.balance) }}</span>
                  </div>
                  <div class="flex justify-between font-medium border-t border-slate-100 dark:border-slate-700 pt-1 mt-2 text-slate-900 dark:text-slate-100">
                    <span>Subtotal</span>
                    <span class="font-mono">{{ formatAmount(section.total) }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div class="flex justify-between font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-4 py-2 rounded mb-6">
              <span>Total Equity</span>
              <span class="font-mono">{{ formatAmount(report.total_equity) }}</span>
            </div>

            <!-- Total Liabilities + Equity -->
            <div class="flex justify-between text-lg font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded border-t-2 border-slate-400 dark:border-slate-600">
              <span>TOTAL LIABILITIES & EQUITY</span>
              <span class="font-mono">{{ formatAmount(report.total_liabilities_equity) }}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>
