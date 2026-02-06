<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSubcontractorDetail } from '@/api/useReports'
import { Button, Input, Card, Badge } from '@/components/ui'
import { formatCurrency, formatPercent, formatDate } from '@/utils/format'
import { ArrowLeft, Mail, Phone } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const contactId = computed(() => Number(route.params.id))

const startDate = ref('')
const endDate = ref('')

const startDateRef = computed(() => startDate.value || undefined)
const endDateRef = computed(() => endDate.value || undefined)

const { data: report, isPending, isError, error } = useSubcontractorDetail(contactId, startDateRef, endDateRef)

function setQuickRange(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  startDate.value = start.toISOString().slice(0, 10)
  endDate.value = end.toISOString().slice(0, 10)
}

function setThisMonth() {
  const now = new Date()
  startDate.value = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  endDate.value = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
}

function setLastMonth() {
  const now = new Date()
  startDate.value = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
  endDate.value = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
}

// Map WO status to Badge status prop
const woStatusMap: Record<string, string> = {
  draft: 'draft',
  assigned: 'pending',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
}

const invoiceStatusMap: Record<string, string> = {
  draft: 'draft',
  submitted: 'submitted',
  approved: 'approved',
  rejected: 'rejected',
  converted: 'converted',
}
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">
          {{ report?.subcontractor.name ?? 'Subcontractor Detail' }}
        </h1>
        <p class="text-muted-foreground mt-1">Laporan Detail Subkontraktor</p>
      </div>
      <Button variant="outline" @click="router.push('/reports/subcontractor-summary')">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back to Summary
      </Button>
    </div>

    <!-- Filters -->
    <Card>
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-semibold text-foreground">Filter Period</h3>
        <div class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-foreground mb-2">Start Date</label>
            <Input v-model="startDate" type="date" />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm font-medium text-foreground mb-2">End Date</label>
            <Input v-model="endDate" type="date" />
          </div>
          <div class="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" @click="setQuickRange(30)">Last 30 Days</Button>
            <Button variant="outline" size="sm" @click="setThisMonth()">This Month</Button>
            <Button variant="outline" size="sm" @click="setLastMonth()">Last Month</Button>
          </div>
        </div>
      </div>
    </Card>

    <!-- Loading -->
    <div v-if="isPending" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p class="text-muted-foreground mt-4">Loading subcontractor data...</p>
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
      <!-- Subcontractor Info + Summary Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Contact Info -->
        <Card class="p-6">
          <h3 class="text-sm font-semibold text-muted-foreground mb-3">Contact Info</h3>
          <div class="space-y-2">
            <p class="font-mono text-sm text-muted-foreground">{{ report.subcontractor.code }}</p>
            <p class="text-lg font-semibold text-foreground">{{ report.subcontractor.name }}</p>
            <div v-if="report.subcontractor.email" class="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail class="w-4 h-4" />
              {{ report.subcontractor.email }}
            </div>
            <div v-if="report.subcontractor.phone" class="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone class="w-4 h-4" />
              {{ report.subcontractor.phone }}
            </div>
            <div v-if="report.subcontractor.daily_rate" class="text-sm text-muted-foreground">
              Daily rate: {{ formatCurrency(report.subcontractor.daily_rate) }}
            </div>
            <div v-if="report.subcontractor.hourly_rate" class="text-sm text-muted-foreground">
              Hourly rate: {{ formatCurrency(report.subcontractor.hourly_rate) }}
            </div>
          </div>
        </Card>

        <!-- Financial Summary -->
        <Card class="p-6 lg:col-span-2">
          <h3 class="text-sm font-semibold text-muted-foreground mb-3">Financial Summary</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div class="text-xl font-bold text-foreground">{{ report.summary.total_work_orders }}</div>
              <div class="text-xs text-muted-foreground">Work Orders</div>
              <div class="text-xs text-muted-foreground">({{ report.summary.completed_work_orders }} done)</div>
            </div>
            <div>
              <div class="text-xl font-bold text-foreground">{{ formatCurrency(report.summary.total_agreed) }}</div>
              <div class="text-xs text-muted-foreground">Total Agreed</div>
            </div>
            <div>
              <div class="text-xl font-bold text-foreground">{{ formatCurrency(report.summary.total_paid) }}</div>
              <div class="text-xs text-muted-foreground">Total Paid</div>
            </div>
            <div>
              <div class="text-xl font-bold text-amber-600 dark:text-amber-400">{{ formatCurrency(report.summary.outstanding) }}</div>
              <div class="text-xs text-muted-foreground">Outstanding</div>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
            <div>
              <div class="text-sm font-semibold text-foreground">{{ formatCurrency(report.summary.total_actual) }}</div>
              <div class="text-xs text-muted-foreground">Total Actual</div>
            </div>
            <div>
              <div class="text-sm font-semibold text-foreground">{{ formatCurrency(report.summary.total_invoiced) }}</div>
              <div class="text-xs text-muted-foreground">Total Invoiced</div>
            </div>
            <div>
              <div class="text-sm font-semibold text-foreground">{{ formatCurrency(report.summary.retention_held) }}</div>
              <div class="text-xs text-muted-foreground">Retention Held</div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Work Orders Table -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">Work Orders</h3>
          <div v-if="report.work_orders.length === 0" class="text-center py-8 text-muted-foreground">
            No work orders found for this period
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">SC WO#</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Name</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Project</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Status</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Agreed</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Invoiced</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Paid</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Progress</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="wo in report.work_orders"
                  :key="wo.id"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  @click="router.push(`/manufacturing/subcontractor-work-orders/${wo.id}`)"
                >
                  <td class="py-3 font-mono text-sm text-foreground">{{ wo.sc_wo_number }}</td>
                  <td class="py-3 text-sm text-foreground">{{ wo.name }}</td>
                  <td class="py-3 text-sm text-muted-foreground">
                    <template v-if="wo.project_number">
                      {{ wo.project_number }} - {{ wo.project_name }}
                    </template>
                    <span v-else>-</span>
                  </td>
                  <td class="py-3">
                    <Badge :status="woStatusMap[wo.status] ?? wo.status">
                      {{ wo.status.replace('_', ' ') }}
                    </Badge>
                  </td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(wo.agreed_amount) }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(wo.amount_invoiced) }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(wo.amount_paid) }}</td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatPercent(wo.completion_percentage) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <!-- Invoices Table -->
      <Card>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-foreground mb-4">Invoices</h3>
          <div v-if="report.invoices.length === 0" class="text-center py-8 text-muted-foreground">
            No invoices found for this period
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead class="border-b border-border">
                <tr class="text-left">
                  <th class="pb-3 text-sm font-semibold text-foreground">Invoice#</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Date</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">SC WO#</th>
                  <th class="pb-3 text-sm font-semibold text-foreground">Status</th>
                  <th class="pb-3 text-sm font-semibold text-foreground text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="inv in report.invoices"
                  :key="inv.id"
                  class="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  @click="router.push(`/manufacturing/subcontractor-invoices/${inv.id}`)"
                >
                  <td class="py-3 font-mono text-sm text-foreground">{{ inv.invoice_number }}</td>
                  <td class="py-3 text-sm text-muted-foreground">{{ formatDate(inv.invoice_date) }}</td>
                  <td class="py-3 font-mono text-sm text-muted-foreground">{{ inv.sc_wo_number || '-' }}</td>
                  <td class="py-3">
                    <Badge :status="invoiceStatusMap[inv.status] ?? inv.status">
                      {{ inv.status }}
                    </Badge>
                  </td>
                  <td class="py-3 text-sm text-foreground text-right">{{ formatCurrency(inv.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </template>
  </div>
</template>
