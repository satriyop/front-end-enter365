<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">Input Tax List</h1>
        <p class="text-muted-foreground">Daftar Pajak Masukan</p>
      </div>
      <Button variant="ghost" @click="router.push('/reports')">Back to Reports</Button>
    </div>

    <!-- Filter Card -->
    <Card>
      <div class="p-6 space-y-4">
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <Input
              v-model="startDate"
              type="date"
              class="w-full"
            />
          </div>

          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <Input
              v-model="endDate"
              type="date"
              class="w-full"
            />
          </div>

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
      </div>
    </Card>

    <!-- Loading State -->
    <Card v-if="isLoading">
      <div class="p-12 text-center">
        <div class="text-muted-foreground">Loading report...</div>
      </div>
    </Card>

    <!-- Error State -->
    <Card v-else-if="error">
      <div class="p-12 text-center">
        <div class="text-destructive">Failed to load report</div>
      </div>
    </Card>

    <!-- Report Card -->
    <Card v-else-if="report">
      <div class="p-6">
        <!-- Report Header -->
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">
            {{ report.report_name }}
          </h2>
          <p class="text-sm text-muted-foreground">
            {{ formatDate(report.period.start) }} - {{ formatDate(report.period.end) }}
          </p>
        </div>

        <!-- Empty State -->
        <div v-if="!report.items || report.items.length === 0" class="py-12 text-center text-muted-foreground">
          No input tax items found
        </div>

        <!-- Report Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-border">
                <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Date
                </th>
                <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Vendor Invoice No
                </th>
                <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Internal No
                </th>
                <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Vendor Name
                </th>
                <th class="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  NPWP
                </th>
                <th class="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  DPP
                </th>
                <th class="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  PPN
                </th>
                <th class="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in report.items"
                :key="item.id"
                class="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <td class="py-3 px-4 text-slate-900 dark:text-slate-100">
                  {{ formatDate(item.date) }}
                </td>
                <td class="py-3 px-4 text-slate-900 dark:text-slate-100">
                  {{ item.vendor_invoice_number }}
                </td>
                <td class="py-3 px-4 text-slate-900 dark:text-slate-100">
                  {{ item.internal_number }}
                </td>
                <td class="py-3 px-4 text-slate-900 dark:text-slate-100">
                  {{ item.vendor_name }}
                </td>
                <td class="py-3 px-4 text-slate-900 dark:text-slate-100">
                  {{ item.npwp }}
                </td>
                <td class="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(item.dpp) }}
                </td>
                <td class="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(item.ppn) }}
                </td>
                <td class="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(item.total) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="border-t-2 border-slate-900 dark:border-slate-100 font-bold">
                <td class="py-3 px-4 text-slate-900 dark:text-slate-100" colspan="5">
                  TOTAL
                </td>
                <td class="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(report.total_dpp) }}
                </td>
                <td class="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(report.total_ppn) }}
                </td>
                <td class="py-3 px-4 text-right font-mono text-slate-900 dark:text-slate-100">
                  {{ formatCurrency(report.total) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInputTaxList } from '@/api/useReports'
import { Button, Input, Card } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'

const router = useRouter()

// Date range state
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
const endDate = ref(new Date().toISOString().slice(0, 10))

// Computed refs for query
const startDateRef = computed(() => startDate.value)
const endDateRef = computed(() => endDate.value)

// Fetch report data
const { data: report, isLoading, error } = useInputTaxList(startDateRef, endDateRef)

// Quick date range filters
function setThisMonth() {
  const now = new Date()
  startDate.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  endDate.value = new Date().toISOString().slice(0, 10)
}

function setYearToDate() {
  const now = new Date()
  startDate.value = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
  endDate.value = new Date().toISOString().slice(0, 10)
}
</script>
