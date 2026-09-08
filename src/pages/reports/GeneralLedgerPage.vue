<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneralLedger } from '@/api/useReports'
import { useExportGeneralLedger } from '@/api/useExports'
import { useJournalsLookup, journalTypeLabel } from '@/api/useJournals'
import { useAnalyticAccountsLookup } from '@/api/useAnalyticAccounts'
import { Button, Input, Card, ExportButton, Select } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-vue-next'

const router = useRouter()

// Date range filters
const startDate = ref('')
const endDate = ref('')
const journalId = ref('')
const analyticAccountId = ref('')
const postedOnly = ref(true)

const { data: journals } = useJournalsLookup()
const { data: analyticAccounts } = useAnalyticAccountsLookup()
const journalOptions = computed(() => {
  const options = [{ value: '', label: 'All Journals' }]
  if (!journals.value) return options
  return options.concat(journals.value.map((journal) => ({
    value: String(journal.id),
    label: `${journal.name} (${journalTypeLabel(journal.type)})`,
  })))
})

// Computed refs for the hook
const startDateComputed = computed(() => startDate.value)
const endDateComputed = computed(() => endDate.value)
const journalIdComputed = computed(() => journalId.value || undefined)
const analyticAccountIdComputed = computed(() => analyticAccountId.value || undefined)
const postedOnlyComputed = computed(() => postedOnly.value)

const analyticOptions = computed(() => {
  const options = [{ value: '', label: 'All analytics' }]
  if (!analyticAccounts.value) return options
  return options.concat(analyticAccounts.value.map((account) => ({
    value: String(account.id),
    label: `${account.code} · ${account.name}`,
  })))
})

const { data: report, isLoading, isError, error } = useGeneralLedger(
  startDateComputed,
  endDateComputed,
  journalIdComputed,
  analyticAccountIdComputed,
  postedOnlyComputed
)

// Expanded accounts tracking
const expandedAccounts = ref(new Set<number>())

function toggleAccount(accountId: number) {
  if (expandedAccounts.value.has(accountId)) {
    expandedAccounts.value.delete(accountId)
  } else {
    expandedAccounts.value.add(accountId)
  }
}

function isExpanded(accountId: number) {
  return expandedAccounts.value.has(accountId)
}

// Quick date range buttons
function setThisMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  startDate.value = `${year}-${month}-01`

  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
  endDate.value = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
}

const exportMutation = useExportGeneralLedger()

function handleExport(format: 'excel' | 'csv' | 'pdf' = 'csv') {
  exportMutation.mutate({
    start_date: startDate.value || undefined,
    end_date: endDate.value || undefined,
    journal_id: journalId.value || undefined,
    analytic_account_id: analyticAccountId.value || undefined,
    format,
    posted_only: postedOnly.value,
  })
}

function setYearToDate() {
  const now = new Date()
  const year = now.getFullYear()
  startDate.value = `${year}-01-01`

  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  endDate.value = `${year}-${month}-${day}`
}
</script>

<template>
  <div class="container max-w-5xl mx-auto py-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="sm"
            @click="router.push('/reports')"
          >
            <ArrowLeft class="h-4 w-4 mr-1" />
            Back to Reports
          </Button>
        </div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">
          General Ledger
        </h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">
          Buku Besar - Detailed account transactions
        </p>
      </div>
      <ExportButton :loading="exportMutation.isPending.value" @export="handleExport" />
    </div>

    <!-- Filter Card -->
    <Card class="p-6">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Date Range
      </h2>
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Start Date
          </label>
          <Input
            v-model="startDate"
            type="date"
          />
        </div>
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            End Date
          </label>
          <Input
            v-model="endDate"
            type="date"
          />
        </div>
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Journal
          </label>
          <Select v-model="journalId" :options="journalOptions" placeholder="All Journals" />
        </div>
        <div class="flex-1 min-w-[160px]">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Analytic
          </label>
          <Select v-model="analyticAccountId" :options="analyticOptions" placeholder="All analytics" />
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 pb-2">
          <input v-model="postedOnly" type="checkbox" data-testid="gl-posted-only" />
          Posted Entries
        </label>
        <div class="flex gap-2">
          <Button
            variant="outline"
            @click="setThisMonth"
          >
            This Month
          </Button>
          <Button
            variant="outline"
            @click="setYearToDate"
          >
            Year to Date
          </Button>
        </div>
      </div>
    </Card>

    <!-- Loading State -->
    <Card v-if="isLoading" class="p-12">
      <div class="text-center text-slate-500 dark:text-slate-400">
        Loading report...
      </div>
    </Card>

    <!-- Error State -->
    <Card v-else-if="isError" class="p-12">
      <div class="text-center text-destructive">
        {{ error?.message || 'Failed to load report' }}
      </div>
    </Card>

    <!-- Report Content -->
    <template v-else-if="report">
      <!-- Report Header -->
      <Card class="p-6">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {{ report.report_name }}
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {{ formatDate(report.start_date) }} - {{ formatDate(report.end_date) }}
        </p>
      </Card>

      <!-- Accounts -->
      <div class="space-y-4">
        <Card
          v-for="account in report.accounts"
          :key="account.id"
          class="overflow-hidden"
        >
          <!-- Account Header (Clickable) -->
          <button
            class="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            @click="toggleAccount(account.id)"
          >
            <div class="flex items-center gap-3">
              <component
                :is="isExpanded(account.id) ? ChevronDown : ChevronRight"
                class="h-5 w-5 text-slate-400"
              />
              <div class="text-left">
                <div class="font-semibold text-slate-900 dark:text-slate-100">
                  {{ account.code }} - {{ account.name }}
                </div>
                <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Opening Balance: {{ formatCurrency(account.opening_balance) }}
                </div>
              </div>
            </div>
          </button>

          <!-- Entries Table (Expandable) -->
          <div v-if="isExpanded(account.id)" class="border-t border-border">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Reference
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Debit
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Credit
                    </th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  <tr
                    v-for="(entry, idx) in account.entries"
                    :key="idx"
                    class="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {{ formatDate(entry.date) }}
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      {{ entry.description }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {{ entry.reference }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100">
                      {{ entry.debit ? formatCurrency(entry.debit) : '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100">
                      {{ entry.credit ? formatCurrency(entry.credit) : '-' }}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900 dark:text-slate-100">
                      {{ formatCurrency(entry.balance) }}
                    </td>
                  </tr>

                  <!-- Closing Balance Row -->
                  <tr class="bg-slate-50 dark:bg-slate-800/50 font-semibold">
                    <td colspan="5" class="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">
                      Closing Balance
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100">
                      {{ formatCurrency(account.closing_balance) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </template>
  </div>
</template>
