<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardSummary, useDashboardReceivables, useDashboardPayables } from '@/api/useDashboard'
import { useInvoices, type Invoice, type InvoiceFilters } from '@/api/useInvoices'
import { useBills, type Bill, type BillFilters } from '@/api/useBills'
import { useResourceList } from '@/composables/useResourceList'
import { formatCurrency, formatDate, daysRemaining, toNumber } from '@/utils/format'
import {
  Badge,
  Button,
  Pagination,
  StatCard,
  ResponsiveTable,
  type ResponsiveColumn,
} from '@/components/ui'
import { FileWarning, TrendingDown, TrendingUp, Eye, CheckCircle } from 'lucide-vue-next'

const router = useRouter()

// ─────────────────────────────────────────────
// Dashboard Data
// ─────────────────────────────────────────────

const { data: summary, isLoading: summaryLoading } = useDashboardSummary()
const { data: receivables, isLoading: receivablesLoading } = useDashboardReceivables()
const { data: payables, isLoading: payablesLoading } = useDashboardPayables()

// ─────────────────────────────────────────────
// Tab State
// ─────────────────────────────────────────────

const activeTab = ref<'invoices' | 'bills'>('invoices')

// ─────────────────────────────────────────────
// Invoice Resource List
// ─────────────────────────────────────────────

const {
  items: invoices,
  pagination: invoicePagination,
  isLoading: invoicesLoading,
  isEmpty: invoicesEmpty,
  error: invoicesError,
  goToPage: invoiceGoToPage,
} = useResourceList<Invoice, InvoiceFilters>({
  useListHook: useInvoices,
  initialFilters: {
    page: 1,
    per_page: 20,
    status: 'overdue',
  },
})

// ─────────────────────────────────────────────
// Bill Resource List
// ─────────────────────────────────────────────

const {
  items: bills,
  pagination: billPagination,
  isLoading: billsLoading,
  isEmpty: billsEmpty,
  error: billsError,
  goToPage: billGoToPage,
} = useResourceList<Bill, BillFilters>({
  useListHook: useBills,
  initialFilters: {
    page: 1,
    per_page: 20,
    status: 'overdue',
  },
})

// ─────────────────────────────────────────────
// Table Columns
// ─────────────────────────────────────────────

const invoiceColumns: ResponsiveColumn[] = [
  { key: 'invoice_number', label: 'Invoice #', mobilePriority: 1 },
  { key: 'contact.name', label: 'Customer', mobilePriority: 2 },
  { key: 'invoice_date', label: 'Invoice Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'due_date', label: 'Due Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'total_amount', label: 'Total', align: 'right', showInMobile: false, format: (v) => formatCurrency(v as number) },
  { key: 'outstanding_amount', label: 'Outstanding', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(v as number) },
  { key: 'days_overdue', label: 'Days Overdue', align: 'right', mobilePriority: 4 },
]

const billColumns: ResponsiveColumn[] = [
  { key: 'bill_number', label: 'Bill #', mobilePriority: 1 },
  { key: 'contact.name', label: 'Vendor', mobilePriority: 2 },
  { key: 'bill_date', label: 'Bill Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'due_date', label: 'Due Date', showInMobile: false, format: (v) => formatDate(v as string) },
  { key: 'total_amount', label: 'Total', align: 'right', showInMobile: false, format: (v) => formatCurrency(v as number) },
  { key: 'outstanding_amount', label: 'Outstanding', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(v as number) },
  { key: 'days_overdue', label: 'Days Overdue', align: 'right', mobilePriority: 4 },
]

// ─────────────────────────────────────────────
// Aging Breakdown
// ─────────────────────────────────────────────

interface AgingBucket {
  label: string
  key: string
  color: string
  barColor: string
}

const agingBuckets: AgingBucket[] = [
  { label: 'Current', key: 'current', color: 'text-green-600', barColor: 'bg-green-500' },
  { label: '1-30 Days', key: '1_30_days', color: 'text-yellow-600', barColor: 'bg-yellow-500' },
  { label: '31-60 Days', key: '31_60_days', color: 'text-orange-600', barColor: 'bg-orange-500' },
  { label: '61-90 Days', key: '61_90_days', color: 'text-red-500', barColor: 'bg-red-500' },
  { label: 'Over 90 Days', key: 'over_90_days', color: 'text-red-700', barColor: 'bg-red-700' },
]

function getAgingValues(aging: Record<string, string> | undefined) {
  if (!aging) return agingBuckets.map(() => 0)
  return agingBuckets.map((b) => toNumber(aging[b.key as keyof typeof aging]))
}

function getMaxAging(values: number[]): number {
  return Math.max(...values, 1)
}

const receivablesAgingValues = computed(() => getAgingValues(receivables.value?.aging))
const payablesAgingValues = computed(() => getAgingValues(payables.value?.aging))
const receivablesMax = computed(() => getMaxAging(receivablesAgingValues.value))
const payablesMax = computed(() => getMaxAging(payablesAgingValues.value))

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getDaysOverdue(dueDate: string): number {
  const { days, isOverdue } = daysRemaining(dueDate)
  return isOverdue ? days : 0
}

function getDaysOverdueClass(days: number): string {
  if (days > 90) return 'text-red-700 dark:text-red-400 font-bold'
  if (days > 60) return 'text-red-600 dark:text-red-400 font-semibold'
  if (days > 30) return 'text-orange-600 dark:text-orange-400 font-medium'
  return 'text-yellow-600 dark:text-yellow-400'
}
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Overdue Management</h1>
      <p class="text-slate-500 dark:text-slate-400">Manajemen Piutang & Hutang Jatuh Tempo</p>
    </div>

    <!-- Summary StatCards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Overdue Invoices"
        :value="summaryLoading ? '...' : String(summary?.receivables?.overdue_count ?? 0)"
        :icon="FileWarning"
        :alert="Number(summary?.receivables?.overdue_count ?? 0) > 0"
      />
      <StatCard
        label="Overdue Amount (AR)"
        :value="summaryLoading ? '...' : formatCurrency(summary?.receivables?.overdue)"
        :icon="TrendingDown"
      />
      <StatCard
        label="Overdue Bills"
        :value="summaryLoading ? '...' : String(summary?.payables?.overdue_count ?? 0)"
        :icon="FileWarning"
        :alert="Number(summary?.payables?.overdue_count ?? 0) > 0"
      />
      <StatCard
        label="Overdue Amount (AP)"
        :value="summaryLoading ? '...' : formatCurrency(summary?.payables?.overdue)"
        :icon="TrendingUp"
      />
    </div>

    <!-- Aging Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Receivables Aging -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Receivables Aging</h2>
        <div v-if="receivablesLoading" class="text-sm text-slate-500 dark:text-slate-400">Loading...</div>
        <div v-else class="space-y-3">
          <div
            v-for="(bucket, index) in agingBuckets"
            :key="bucket.key"
            class="flex items-center gap-3"
          >
            <span class="text-xs text-slate-600 dark:text-slate-400 w-24 shrink-0">{{ bucket.label }}</span>
            <div class="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                :class="[bucket.barColor, 'h-full rounded-full transition-all duration-500']"
                :style="{ width: `${((receivablesAgingValues[index] ?? 0) / receivablesMax) * 100}%` }"
              />
            </div>
            <span :class="[bucket.color, 'text-sm font-mono w-32 text-right shrink-0']">
              {{ formatCurrency(receivablesAgingValues[index] ?? 0) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Payables Aging -->
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Payables Aging</h2>
        <div v-if="payablesLoading" class="text-sm text-slate-500 dark:text-slate-400">Loading...</div>
        <div v-else class="space-y-3">
          <div
            v-for="(bucket, index) in agingBuckets"
            :key="bucket.key"
            class="flex items-center gap-3"
          >
            <span class="text-xs text-slate-600 dark:text-slate-400 w-24 shrink-0">{{ bucket.label }}</span>
            <div class="flex-1 h-5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                :class="[bucket.barColor, 'h-full rounded-full transition-all duration-500']"
                :style="{ width: `${((payablesAgingValues[index] ?? 0) / payablesMax) * 100}%` }"
              />
            </div>
            <span :class="[bucket.color, 'text-sm font-mono w-32 text-right shrink-0']">
              {{ formatCurrency(payablesAgingValues[index] ?? 0) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabbed Detail Tables -->
    <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <!-- Tab Buttons -->
      <div class="flex border-b border-slate-200 dark:border-slate-700">
        <button
          :class="[
            'px-6 py-3 text-sm font-medium transition-colors',
            activeTab === 'invoices'
              ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
          ]"
          @click="activeTab = 'invoices'"
        >
          Overdue Invoices
          <Badge v-if="summary?.receivables?.overdue_count" status="overdue" class="ml-2">
            {{ summary.receivables.overdue_count }}
          </Badge>
        </button>
        <button
          :class="[
            'px-6 py-3 text-sm font-medium transition-colors',
            activeTab === 'bills'
              ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-600 dark:border-orange-400'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300',
          ]"
          @click="activeTab = 'bills'"
        >
          Overdue Bills
          <Badge v-if="summary?.payables?.overdue_count" status="overdue" class="ml-2">
            {{ summary.payables.overdue_count }}
          </Badge>
        </button>
      </div>

      <!-- Invoice Tab Content -->
      <div v-show="activeTab === 'invoices'">
        <!-- Error -->
        <div v-if="invoicesError" class="p-8 text-center">
          <p class="text-red-500">Failed to load overdue invoices</p>
        </div>

        <!-- Loading -->
        <div v-else-if="invoicesLoading" class="p-8 text-center">
          <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading...</span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="invoicesEmpty" class="p-8 text-center">
          <CheckCircle class="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p class="text-slate-700 dark:text-slate-300 font-medium">No overdue invoices</p>
          <p class="text-sm text-slate-500 dark:text-slate-400">All invoices are up to date</p>
        </div>

        <!-- Table -->
        <div v-else>
          <ResponsiveTable
            :items="invoices"
            :columns="invoiceColumns"
            :loading="invoicesLoading"
            title-field="invoice_number"
            subtitle-field="contact.name"
            @row-click="(item) => router.push(`/invoices/${item.id}`)"
          >
            <template #cell-invoice_number="{ item }">
              <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 font-medium">
                {{ item.invoice_number }}
              </span>
            </template>

            <template #cell-contact\.name="{ item }">
              <span class="text-slate-900 dark:text-slate-100">{{ item.contact?.name }}</span>
            </template>

            <template #cell-outstanding_amount="{ item }">
              <span class="text-orange-600 dark:text-orange-400 font-medium">
                {{ formatCurrency(item.outstanding_amount) }}
              </span>
            </template>

            <template #cell-days_overdue="{ item }">
              <span :class="getDaysOverdueClass(getDaysOverdue(item.due_date))">
                {{ getDaysOverdue(item.due_date) }} days
              </span>
            </template>

            <template #actions="{ item }">
              <RouterLink :to="`/invoices/${item.id}`">
                <Button variant="ghost" size="xs">
                  <Eye class="w-4 h-4" />
                </Button>
              </RouterLink>
            </template>
          </ResponsiveTable>

          <div v-if="invoicePagination" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <Pagination
              :current-page="invoicePagination.current_page"
              :total-pages="invoicePagination.last_page"
              :total="invoicePagination.total"
              :per-page="invoicePagination.per_page"
              @page-change="invoiceGoToPage"
            />
          </div>
        </div>
      </div>

      <!-- Bill Tab Content -->
      <div v-show="activeTab === 'bills'">
        <!-- Error -->
        <div v-if="billsError" class="p-8 text-center">
          <p class="text-red-500">Failed to load overdue bills</p>
        </div>

        <!-- Loading -->
        <div v-else-if="billsLoading" class="p-8 text-center">
          <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading...</span>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="billsEmpty" class="p-8 text-center">
          <CheckCircle class="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p class="text-slate-700 dark:text-slate-300 font-medium">No overdue bills</p>
          <p class="text-sm text-slate-500 dark:text-slate-400">All bills are up to date</p>
        </div>

        <!-- Table -->
        <div v-else>
          <ResponsiveTable
            :items="bills"
            :columns="billColumns"
            :loading="billsLoading"
            title-field="bill_number"
            subtitle-field="contact.name"
            @row-click="(item) => router.push(`/bills/${item.id}`)"
          >
            <template #cell-bill_number="{ item }">
              <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 font-medium">
                {{ item.bill_number }}
              </span>
            </template>

            <template #cell-contact\.name="{ item }">
              <span class="text-slate-900 dark:text-slate-100">{{ item.contact?.name }}</span>
            </template>

            <template #cell-outstanding_amount="{ item }">
              <span class="text-orange-600 dark:text-orange-400 font-medium">
                {{ formatCurrency(item.outstanding_amount) }}
              </span>
            </template>

            <template #cell-days_overdue="{ item }">
              <span :class="getDaysOverdueClass(getDaysOverdue(item.due_date))">
                {{ getDaysOverdue(item.due_date) }} days
              </span>
            </template>

            <template #actions="{ item }">
              <RouterLink :to="`/bills/${item.id}`">
                <Button variant="ghost" size="xs">
                  <Eye class="w-4 h-4" />
                </Button>
              </RouterLink>
            </template>
          </ResponsiveTable>

          <div v-if="billPagination" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <Pagination
              :current-page="billPagination.current_page"
              :total-pages="billPagination.last_page"
              :total="billPagination.total"
              :per-page="billPagination.per_page"
              @page-change="billGoToPage"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
