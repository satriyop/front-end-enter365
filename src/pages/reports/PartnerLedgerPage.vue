<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePartnerLedger } from '@/api/useReports'
import { useExportPartnerLedger } from '@/api/useExports'
import { Button, Input, Card, ExportButton } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-vue-next'

const router = useRouter()

const startDate = ref('')
const endDate = ref('')
const contactId = ref('')

const startDateComputed = computed(() => startDate.value || undefined)
const endDateComputed = computed(() => endDate.value || undefined)
const contactIdComputed = computed(() => contactId.value || undefined)

const { data: report, isLoading, isError, error } = usePartnerLedger(
  startDateComputed,
  endDateComputed,
  contactIdComputed,
)

const expandedPartners = ref(new Set<number>())

function togglePartner(partnerId: number) {
  if (expandedPartners.value.has(partnerId)) {
    expandedPartners.value.delete(partnerId)
  } else {
    expandedPartners.value.add(partnerId)
  }
}

function isExpanded(partnerId: number) {
  return expandedPartners.value.has(partnerId)
}

function setThisMonth() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  startDate.value = `${year}-${month}-01`
  const lastDay = new Date(year, now.getMonth() + 1, 0).getDate()
  endDate.value = `${year}-${month}-${String(lastDay).padStart(2, '0')}`
}

function setYearToDate() {
  const now = new Date()
  const year = now.getFullYear()
  startDate.value = `${year}-01-01`
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  endDate.value = `${year}-${month}-${day}`
}

const exportMutation = useExportPartnerLedger()

function handleExport() {
  exportMutation.mutate({
    start_date: startDate.value || undefined,
    end_date: endDate.value || undefined,
    contact_id: contactId.value || undefined,
  })
}
</script>

<template>
  <div class="container max-w-5xl mx-auto py-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" @click="router.push('/reports')">
            <ArrowLeft class="h-4 w-4 mr-1" />
            Back to Reports
          </Button>
        </div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Partner Ledger
        </h1>
        <p class="text-slate-500 dark:text-slate-400 mt-1">
          Buku Besar Partner — journal lines grouped by contact
        </p>
      </div>
      <ExportButton :show-format-options="false" :loading="exportMutation.isPending.value" @export="handleExport" />
    </div>

    <Card class="p-6">
      <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Filters
      </h2>
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-[160px]">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
          <Input v-model="startDate" type="date" />
        </div>
        <div class="flex-1 min-w-[160px]">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Date</label>
          <Input v-model="endDate" type="date" />
        </div>
        <div class="flex-1 min-w-[160px]">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Partner ID</label>
          <Input v-model="contactId" type="number" min="1" placeholder="All partners" />
        </div>
        <div class="flex gap-2">
          <Button variant="outline" @click="setThisMonth">This Month</Button>
          <Button variant="outline" @click="setYearToDate">Year to Date</Button>
        </div>
      </div>
    </Card>

    <Card v-if="isLoading" class="p-12">
      <div class="text-center text-slate-500 dark:text-slate-400">Loading report...</div>
    </Card>

    <Card v-else-if="isError" class="p-12">
      <div class="text-center text-destructive">{{ error?.message || 'Failed to load report' }}</div>
    </Card>

    <template v-else-if="report">
      <Card class="p-6">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {{ report.report_name }}
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {{ formatDate(report.start_date) }} - {{ formatDate(report.end_date) }}
        </p>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Debit {{ formatCurrency(report.total_debit) }} · Credit {{ formatCurrency(report.total_credit) }}
        </p>
      </Card>

      <div v-if="report.partners.length === 0" class="text-center text-slate-500 dark:text-slate-400 py-8">
        No partner-tagged journal lines in this range.
      </div>

      <div class="space-y-4">
        <Card
          v-for="partner in report.partners"
          :key="partner.id"
          class="overflow-hidden"
        >
          <button
            class="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            @click="togglePartner(partner.id)"
          >
            <div class="flex items-center gap-3">
              <component
                :is="isExpanded(partner.id) ? ChevronDown : ChevronRight"
                class="h-5 w-5 text-slate-400"
              />
              <div class="text-left">
                <div class="font-semibold text-slate-900 dark:text-slate-100">
                  {{ partner.name }}
                </div>
                <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Opening: {{ formatCurrency(partner.opening_balance) }}
                </div>
              </div>
            </div>
            <div class="text-sm text-right text-slate-500 dark:text-slate-400">
              Closing {{ formatCurrency(partner.closing_balance) }}
            </div>
          </button>

          <div v-if="isExpanded(partner.id)" class="border-t border-border">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Date</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Journal</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Account</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Description</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Debit</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Credit</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">Balance</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  <tr
                    v-for="entry in partner.entries"
                    :key="entry.id"
                    class="hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">{{ formatDate(entry.date) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">{{ entry.journal || entry.entry_number }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">{{ entry.account_code }}</td>
                    <td class="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">{{ entry.description }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100">{{ entry.debit ? formatCurrency(entry.debit) : '-' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100">{{ entry.credit ? formatCurrency(entry.credit) : '-' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(entry.balance) }}</td>
                  </tr>
                  <tr class="bg-slate-50 dark:bg-slate-800/50 font-semibold">
                    <td colspan="6" class="px-6 py-4 text-sm text-slate-900 dark:text-slate-100">Closing Balance</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900 dark:text-slate-100">{{ formatCurrency(partner.closing_balance) }}</td>
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
