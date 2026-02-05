<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBill, usePostBill, useVoidBill, useDeleteBill } from '@/api/useBills'
import { Button, Card, Badge, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatCurrency, formatDate, toNumber } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const billId = computed(() => Number(route.params.id))
const { data: bill, isLoading } = useBill(billId)

const postMutation = usePostBill()
const voidMutation = useVoidBill()
const deleteMutation = useDeleteBill()

async function handlePost() {
  if (!confirm('Post this bill? This will create journal entries.')) return
  try {
    await postMutation.mutateAsync(billId.value)
    toast.success('Bill posted successfully')
  } catch {
    toast.error('Failed to post bill')
  }
}

async function handleVoid() {
  if (!confirm('Void this bill? This action cannot be undone.')) return
  try {
    await voidMutation.mutateAsync(billId.value)
    toast.success('Bill voided')
  } catch {
    toast.error('Failed to void bill')
  }
}

async function handleDelete() {
  if (!confirm('Delete this bill?')) return
  try {
    await deleteMutation.mutateAsync(billId.value)
    toast.success('Bill deleted')
    router.push('/bills')
  } catch {
    toast.error('Failed to delete bill')
  }
}

// Line items table columns with mobile priorities
const itemColumns: ResponsiveColumn[] = [
  { key: 'description', label: 'Description', mobilePriority: 1 },
  { key: 'quantity', label: 'Qty', align: 'right', mobilePriority: 3 },
  { key: 'unit_price', label: 'Price', align: 'right', showInMobile: false },
  { key: 'line_total', label: 'Amount', align: 'right', mobilePriority: 2 },
]
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-slate-500 dark:text-slate-400">Loading bill...</div>
    </div>

    <template v-else-if="bill">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ bill.bill_number }}</h1>
            <Badge :status="bill.status">
              {{ bill.status_label }}
            </Badge>
          </div>
          <p class="text-slate-500 dark:text-slate-400">{{ bill.contact?.name }}</p>
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" @click="router.back()">Back</Button>
          <Button v-if="bill.status.value === 'draft'" @click="handlePost" :loading="postMutation.isPending.value">
            Post Bill
          </Button>
          <RouterLink v-if="bill.status.value === 'draft'" :to="`/bills/${bill.id}/edit`">
            <Button variant="secondary">Edit</Button>
          </RouterLink>
          <Button v-if="bill.status.value === 'posted'" variant="destructive" @click="handleVoid" :loading="voidMutation.isPending.value">
            Void
          </Button>
          <Button v-if="bill.status.value === 'draft'" variant="destructive" @click="handleDelete" :loading="deleteMutation.isPending.value">
            Delete
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900 dark:text-slate-100">Bill Details</h2>
            </template>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Vendor</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ bill.contact?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Vendor Invoice #</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ bill.vendor_invoice_number || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Bill Date</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatDate(bill.bill_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Due Date</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatDate(bill.due_date) }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Description</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ bill.description || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <Card :padding="false">
            <template #header>
              <h2 class="font-medium text-slate-900 dark:text-slate-100 px-6 pt-6">Line Items</h2>
            </template>
            <ResponsiveTable
              :items="bill.items || []"
              :columns="itemColumns"
              title-field="description"
            >
              <!-- Custom cell: Description -->
              <template #cell-description="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ item.description }}</span>
              </template>

              <!-- Custom cell: Quantity -->
              <template #cell-quantity="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ item.quantity }} {{ item.unit }}</span>
              </template>

              <!-- Custom cell: Unit Price -->
              <template #cell-unit_price="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ formatCurrency(item.unit_price) }}</span>
              </template>

              <!-- Custom cell: Line Total -->
              <template #cell-line_total="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(item.line_total) }}</span>
              </template>

              <!-- Mobile title slot -->
              <template #mobile-title="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.description }}</span>
              </template>
            </ResponsiveTable>
          </Card>
        </div>

        <div class="space-y-6">
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900 dark:text-slate-100">Summary</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Subtotal</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatCurrency(bill.subtotal) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Tax ({{ bill.tax_rate }}%)</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatCurrency(bill.tax_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Discount</dt>
                <dd class="text-slate-900 dark:text-slate-100">-{{ formatCurrency(bill.discount_amount) }}</dd>
              </div>
              <div class="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-3 text-lg font-medium">
                <dt class="text-slate-900 dark:text-slate-100">Total</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatCurrency(bill.total_amount) }}</dd>
              </div>
              <div class="flex justify-between text-green-600 dark:text-green-400">
                <dt>Paid</dt>
                <dd>{{ formatCurrency(bill.paid_amount) }}</dd>
              </div>
              <div class="flex justify-between text-orange-600 dark:text-orange-400 font-medium">
                <dt>Outstanding</dt>
                <dd>{{ formatCurrency(bill.outstanding_amount) }}</dd>
              </div>
            </dl>
          </Card>

          <Card v-if="toNumber(bill.outstanding_amount) > 0 && bill.status.value !== 'draft'">
            <RouterLink :to="`/payments/new?type=send&bill_id=${bill.id}`">
              <Button class="w-full">Record Payment</Button>
            </RouterLink>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
