<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTaxInvoiceList } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

// Date range state
const startDate = ref('')
const endDate = ref('')

// Computed refs for the hook
const startDateRef = computed(() => startDate.value)
const endDateRef = computed(() => endDate.value)

// Fetch report data
const { data: report, isLoading, error } = useTaxInvoiceList(startDateRef, endDateRef)

// Quick date range buttons
const setThisMonth = () => {
  const now = new Date()
  startDate.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  endDate.value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
}

const setLastMonth = () => {
  const now = new Date()
  startDate.value = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
  endDate.value = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
}

const setThisYear = () => {
  const now = new Date()
  startDate.value = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
  endDate.value = new Date(now.getFullYear(), 11, 31).toISOString().slice(0, 10)
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="sm" @click="router.push('/reports')">
            <ArrowLeft class="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>
        <h1 class="text-3xl font-bold text-foreground">Tax Invoice List</h1>
        <p class="text-muted-foreground">Daftar Faktur Pajak Keluaran</p>
      </div>
    </div>

    <!-- Date Range Filter -->
    <Card class="p-4">
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">Start Date</label>
            <Input v-model="startDate" type="date" />
          </div>
          <div>
            <label class="block text-sm font-medium text-foreground mb-2">End Date</label>
            <Input v-model="endDate" type="date" />
          </div>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" size="sm" @click="setThisMonth">This Month</Button>
          <Button variant="outline" size="sm" @click="setLastMonth">Last Month</Button>
          <Button variant="outline" size="sm" @click="setThisYear">This Year</Button>
        </div>
      </div>
    </Card>

    <!-- Loading State -->
    <Card v-if="isLoading" class="p-8">
      <div class="text-center text-muted-foreground">Loading report...</div>
    </Card>

    <!-- Error State -->
    <Card v-else-if="error" class="p-8">
      <div class="text-center text-destructive">Failed to load report</div>
    </Card>

    <!-- Report Content -->
    <Card v-else-if="report" class="p-6">
      <!-- Report Header -->
      <div class="text-center mb-6 pb-4 border-b border-border">
        <h2 class="text-2xl font-bold text-foreground">{{ report.report_name }}</h2>
        <p class="text-muted-foreground mt-1">
          Period: {{ formatDate(report.period.start) }} - {{ formatDate(report.period.end) }}
        </p>
      </div>

      <!-- Table -->
      <div v-if="report.items.length > 0" class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border">
              <th class="text-left py-3 px-4 text-sm font-semibold text-foreground">Date</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-foreground">Invoice Number</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-foreground">Buyer Name</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-foreground">NPWP</th>
              <th class="text-left py-3 px-4 text-sm font-semibold text-foreground">Address</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-foreground">DPP</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-foreground">PPN</th>
              <th class="text-right py-3 px-4 text-sm font-semibold text-foreground">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in report.items"
              :key="item.id"
              class="border-b border-border hover:bg-muted/50 dark:hover:bg-muted/20"
            >
              <td class="py-3 px-4 text-sm text-foreground">{{ formatDate(item.date) }}</td>
              <td class="py-3 px-4 text-sm text-foreground">{{ item.invoice_number }}</td>
              <td class="py-3 px-4 text-sm text-foreground">{{ item.buyer_name }}</td>
              <td class="py-3 px-4 text-sm text-foreground">{{ item.npwp }}</td>
              <td class="py-3 px-4 text-sm text-foreground max-w-48 truncate">{{ item.address }}</td>
              <td class="py-3 px-4 text-sm text-foreground text-right">{{ formatCurrency(item.dpp) }}</td>
              <td class="py-3 px-4 text-sm text-foreground text-right">{{ formatCurrency(item.ppn) }}</td>
              <td class="py-3 px-4 text-sm text-foreground text-right">{{ formatCurrency(item.total) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-border bg-muted/50 dark:bg-muted/20">
              <td colspan="5" class="py-3 px-4 text-sm font-semibold text-foreground text-right">Total:</td>
              <td class="py-3 px-4 text-sm font-bold text-foreground text-right">{{ formatCurrency(report.total_dpp) }}</td>
              <td class="py-3 px-4 text-sm font-bold text-foreground text-right">{{ formatCurrency(report.total_ppn) }}</td>
              <td class="py-3 px-4 text-sm font-bold text-foreground text-right">{{ formatCurrency(report.total) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12 text-muted-foreground">
        No tax invoices found for the selected period
      </div>
    </Card>

    <!-- No Data State (no date range selected) -->
    <Card v-else class="p-8">
      <div class="text-center text-muted-foreground">
        Please select a date range to view the report
      </div>
    </Card>
  </div>
</template>
