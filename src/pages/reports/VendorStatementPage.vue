<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useContactAging } from '@/api/useReports'
import { useContactsLookup } from '@/api/useContacts'
import { Button, Card, Input, Select } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'

const router = useRouter()

const contactId = ref<number | undefined>(undefined)
const asOfDate = ref(new Date().toISOString().split('T')[0])

const contactIdRef = computed(() => contactId.value)
const asOfDateRef = computed(() => asOfDate.value)

const { data: vendors, isLoading: loadingVendors } = useContactsLookup('supplier')
const { data: report, isLoading, error } = useContactAging(contactIdRef, asOfDateRef)

const vendorOptions = computed(() => [
  { value: '', label: loadingVendors.value ? 'Loading...' : 'Select a vendor' },
  ...(vendors.value?.map(c => ({
    value: String(c.id),
    label: `${c.code} - ${c.name}`
  })) ?? [])
])

function handleVendorChange(value: string | number | null) {
  contactId.value = value ? Number(value) : undefined
}

function setToday() {
  asOfDate.value = new Date().toISOString().split('T')[0]
}
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Vendor Statement</h1>
        <p class="text-slate-500 dark:text-slate-400">Laporan Vendor - Transaction history by vendor</p>
      </div>
      <Button variant="ghost" @click="router.push('/reports')">Back to Reports</Button>
    </div>

    <!-- Filters -->
    <Card class="mb-6">
      <div class="flex flex-wrap items-end gap-4">
        <div class="flex-1 min-w-64">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vendor</label>
          <Select
            :model-value="contactId ? String(contactId) : ''"
            :options="vendorOptions"
            @update:model-value="handleVendorChange"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">As of Date</label>
          <Input v-model="asOfDate" type="date" class="w-40" />
        </div>
        <Button variant="secondary" size="sm" @click="setToday">Today</Button>
      </div>
    </Card>

    <!-- No Vendor Selected -->
    <Card v-if="!contactId" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-4 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p class="text-lg font-medium">Select a Vendor</p>
        <p class="text-sm">Choose a vendor from the dropdown to view their statement</p>
      </div>
    </Card>

    <!-- Loading -->
    <div v-else-if="isLoading" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading statement...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12">
      <div class="text-red-500">Failed to load statement</div>
    </div>

    <!-- Report Content -->
    <div v-else-if="report" class="space-y-6">
      <!-- Vendor Info -->
      <Card>
        <div class="text-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-4">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">{{ report.contact.name }}</h2>
          <p class="text-slate-500 dark:text-slate-400 font-mono">{{ report.contact.code }}</p>
          <p class="text-sm text-slate-400 dark:text-slate-500 mt-1">As of {{ formatDate(report.as_of_date) }}</p>
        </div>

        <!-- Payables Summary -->
        <div v-if="report.payables" class="space-y-4">
          <h3 class="font-medium text-slate-900 dark:text-slate-100">Outstanding Payables</h3>

          <!-- Aging Buckets -->
          <div class="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div class="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-center">
              <div class="text-xs text-slate-500 dark:text-slate-400">Current</div>
              <div class="text-lg font-bold text-green-600 dark:text-green-400">
                {{ formatCurrency(report.payables.totals?.current || 0) }}
              </div>
            </div>
            <div class="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-center">
              <div class="text-xs text-slate-500 dark:text-slate-400">1-30 Days</div>
              <div class="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {{ formatCurrency(report.payables.totals?.days_1_30 || 0) }}
              </div>
            </div>
            <div class="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-center">
              <div class="text-xs text-slate-500 dark:text-slate-400">31-60 Days</div>
              <div class="text-lg font-bold text-orange-600 dark:text-orange-400">
                {{ formatCurrency(report.payables.totals?.days_31_60 || 0) }}
              </div>
            </div>
            <div class="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-center">
              <div class="text-xs text-slate-500 dark:text-slate-400">61-90 Days</div>
              <div class="text-lg font-bold text-red-500">
                {{ formatCurrency(report.payables.totals?.days_61_90 || 0) }}
              </div>
            </div>
            <div class="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg text-center">
              <div class="text-xs text-slate-500 dark:text-slate-400">Over 90</div>
              <div class="text-lg font-bold text-red-700 dark:text-red-400">
                {{ formatCurrency(report.payables.totals?.over_90 || 0) }}
              </div>
            </div>
            <div class="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-center border-2 border-slate-300 dark:border-slate-600">
              <div class="text-xs text-slate-500 dark:text-slate-400">Total</div>
              <div class="text-lg font-bold text-slate-900 dark:text-slate-100">
                {{ formatCurrency(report.payables.totals?.total || 0) }}
              </div>
            </div>
          </div>

          <!-- Bill Detail Table -->
          <div v-if="report.payables.bills?.length" class="overflow-x-auto mt-4">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th class="text-left px-4 py-2 font-medium text-slate-700 dark:text-slate-300">Bill #</th>
                  <th class="text-left px-4 py-2 font-medium text-slate-700 dark:text-slate-300">Date</th>
                  <th class="text-left px-4 py-2 font-medium text-slate-700 dark:text-slate-300">Due Date</th>
                  <th class="text-right px-4 py-2 font-medium text-slate-700 dark:text-slate-300">Total</th>
                  <th class="text-right px-4 py-2 font-medium text-slate-700 dark:text-slate-300">Paid</th>
                  <th class="text-right px-4 py-2 font-medium text-slate-700 dark:text-slate-300">Balance</th>
                  <th class="text-center px-4 py-2 font-medium text-slate-700 dark:text-slate-300">Age</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr v-for="bill in report.payables.bills" :key="bill.id" class="hover:bg-slate-50 dark:hover:bg-slate-800">
                  <td class="px-4 py-2">
                    <RouterLink :to="`/bills/${bill.id}`" class="text-primary-600 dark:text-primary-400 hover:underline">
                      {{ bill.bill_number }}
                    </RouterLink>
                  </td>
                  <td class="px-4 py-2 text-slate-600 dark:text-slate-400">{{ formatDate(bill.date) }}</td>
                  <td class="px-4 py-2 text-slate-600 dark:text-slate-400">{{ formatDate(bill.due_date) }}</td>
                  <td class="text-right px-4 py-2 font-mono">{{ formatCurrency(bill.total) }}</td>
                  <td class="text-right px-4 py-2 font-mono text-green-600 dark:text-green-400">{{ formatCurrency(bill.paid) }}</td>
                  <td class="text-right px-4 py-2 font-mono font-semibold">{{ formatCurrency(bill.balance) }}</td>
                  <td class="text-center px-4 py-2">
                    <span
                      class="px-2 py-0.5 text-xs rounded-full"
                      :class="{
                        'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400': bill.days_overdue <= 0,
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400': bill.days_overdue > 0 && bill.days_overdue <= 30,
                        'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400': bill.days_overdue > 30 && bill.days_overdue <= 60,
                        'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400': bill.days_overdue > 60,
                      }"
                    >
                      {{ bill.days_overdue <= 0 ? 'Current' : `${bill.days_overdue}d` }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center py-6 text-slate-500 dark:text-slate-400">
            No outstanding bills
          </div>
        </div>
      </Card>

      <!-- Quick Actions -->
      <div class="flex flex-wrap gap-2">
        <RouterLink v-if="contactId" :to="`/contacts/${contactId}`">
          <Button variant="secondary" size="sm">View Vendor Details</Button>
        </RouterLink>
        <RouterLink :to="`/bills?contact_id=${contactId}`">
          <Button variant="secondary" size="sm">View All Bills</Button>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
