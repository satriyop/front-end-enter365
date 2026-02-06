<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBankReconciliationReport } from '@/api/useReports'
import { useAccountsLookup } from '@/api/useAccounts'
import { Button, Input, Card, Select, Badge } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

const accountId = ref<number | undefined>(undefined)
const asOfDate = ref('')

const asOfDateRef = computed(() => asOfDate.value || undefined)

const { data: report, isPending, isError, error } = useBankReconciliationReport(
  accountId as any,
  asOfDateRef
)

// Fetch bank/cash accounts for the selector
const { data: accounts } = useAccountsLookup('asset')

const accountOptions = computed(() => [
  { value: '', label: 'Select Account' },
  ...(accounts.value?.map(a => ({
    value: String(a.id),
    label: `${a.code} - ${a.name}`,
  })) ?? []),
])

function onAccountChange(val: string | number | null) {
  accountId.value = val ? Number(val) : undefined
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Bank Reconciliation Report</h1>
        <p class="text-muted-foreground mt-1">Laporan Rekonsiliasi Bank</p>
      </div>
      <Button variant="outline" @click="router.push('/reports')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Reports
      </Button>
    </div>

    <!-- Filters -->
    <Card>
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Filter</h3>
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[250px]">
            <label class="block text-sm font-medium text-foreground mb-2">Account</label>
            <Select
              :model-value="accountId ? String(accountId) : ''"
              :options="accountOptions"
              @update:model-value="onAccountChange"
            />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-foreground mb-2">As Of Date</label>
            <Input v-model="asOfDate" type="date" />
          </div>
        </div>
      </div>
    </Card>

    <!-- No account selected -->
    <Card v-if="!accountId" class="p-6">
      <div class="text-center py-8 text-muted-foreground">
        Select a bank account above to view the reconciliation report
      </div>
    </Card>

    <!-- Loading -->
    <div v-else-if="isPending" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="text-muted-foreground mt-4">Loading reconciliation data...</p>
    </div>

    <!-- Error -->
    <Card v-else-if="isError" class="p-6">
      <div class="text-center text-destructive">
        <p class="font-semibold">Error loading report</p>
        <p class="text-sm mt-2">{{ error?.message || 'Unknown error' }}</p>
      </div>
    </Card>

    <!-- Report Content -->
    <template v-else-if="report">
      <!-- Account Info & Status -->
      <Card class="p-6">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-foreground">{{ report.account.code }} - {{ report.account.name }}</h3>
            <p class="text-sm text-muted-foreground">As of {{ formatDate(report.as_of_date) }}</p>
          </div>
          <Badge :status="report.is_reconciled ? 'approved' : 'draft'">
            {{ report.is_reconciled ? 'Reconciled' : 'Not Reconciled' }}
          </Badge>
        </div>
      </Card>

      <!-- Balance Summary -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card class="p-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.book_balance) }}</div>
            <div class="text-sm text-muted-foreground mt-2">Book Balance</div>
          </div>
        </Card>
        <Card class="p-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.bank_balance) }}</div>
            <div class="text-sm text-muted-foreground mt-2">Bank Balance</div>
          </div>
        </Card>
        <Card class="p-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-foreground">{{ formatCurrency(report.adjusted_book_balance) }}</div>
            <div class="text-sm text-muted-foreground mt-2">Adjusted Book</div>
          </div>
        </Card>
        <Card class="p-6" :class="report.difference === 0 ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'">
          <div class="text-center">
            <div class="text-2xl font-bold" :class="report.difference === 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive dark:text-red-400'">
              {{ formatCurrency(report.difference) }}
            </div>
            <div class="text-sm text-muted-foreground mt-2">Difference</div>
          </div>
        </Card>
      </div>

      <!-- Adjustments to Book -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">
            Adjustments to Book
            <span class="text-sm font-normal text-muted-foreground ml-2">{{ formatCurrency(report.adjustments_to_book.total) }}</span>
          </h3>
          <div v-if="report.adjustments_to_book.items.length === 0" class="text-center py-4 text-muted-foreground">
            No adjustments
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">Date</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Description</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Type</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in report.adjustments_to_book.items"
                  :key="item.id"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td class="py-3 text-sm text-foreground">{{ formatDate(item.date) }}</td>
                  <td class="py-3 text-sm text-foreground">{{ item.description }}</td>
                  <td class="py-3 text-sm text-muted-foreground">{{ item.type }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <!-- Adjustments to Bank -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">
            Adjustments to Bank
            <span class="text-sm font-normal text-muted-foreground ml-2">{{ formatCurrency(report.adjustments_to_bank.total) }}</span>
          </h3>
          <div v-if="report.adjustments_to_bank.items.length === 0" class="text-center py-4 text-muted-foreground">
            No adjustments
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">Date</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Number</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Description</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Type</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in report.adjustments_to_bank.items"
                  :key="item.id"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <td class="py-3 text-sm text-foreground">{{ formatDate(item.date) }}</td>
                  <td class="py-3 font-mono text-sm text-foreground">{{ item.number }}</td>
                  <td class="py-3 text-sm text-foreground">{{ item.description || '-' }}</td>
                  <td class="py-3 text-sm text-muted-foreground">{{ item.type }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(item.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <!-- Reconciliation Summary -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">Reconciliation Summary</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="text-center">
              <div class="text-2xl font-bold text-foreground">{{ report.reconciliation_summary.total }}</div>
              <div class="text-sm text-muted-foreground">Total Transactions</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ report.reconciliation_summary.reconciled }}</div>
              <div class="text-sm text-muted-foreground">Reconciled</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ report.reconciliation_summary.matched }}</div>
              <div class="text-sm text-muted-foreground">Matched</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ report.reconciliation_summary.unmatched }}</div>
              <div class="text-sm text-muted-foreground">Unmatched</div>
            </div>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>
