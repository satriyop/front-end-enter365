<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBill, usePostBill, useVoidBill, useDeleteBill } from '@/api/useBills'
import { Button, Card, Badge, useToast } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const billId = computed(() => Number(route.params.id))
const { data: bill, isLoading } = useBill(billId)

const postMutation = usePostBill()
const voidMutation = useVoidBill()
const deleteMutation = useDeleteBill()

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
  draft: 'default',
  posted: 'info',
  partial: 'warning',
  paid: 'success',
  overdue: 'error',
  voided: 'error',
}

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
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-slate-500">Loading bill...</div>
    </div>

    <template v-else-if="bill">
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-slate-900">{{ bill.bill_number }}</h1>
            <Badge :variant="statusColors[bill.status] || 'default'">
              {{ bill.status }}
            </Badge>
          </div>
          <p class="text-slate-500">{{ bill.contact?.name }}</p>
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" @click="router.back()">Back</Button>
          <Button v-if="bill.status === 'draft'" variant="primary" @click="handlePost" :loading="postMutation.isPending.value">
            Post Bill
          </Button>
          <RouterLink v-if="bill.status === 'draft'" :to="`/bills/${bill.id}/edit`">
            <Button variant="secondary">Edit</Button>
          </RouterLink>
          <Button v-if="bill.status === 'posted'" variant="danger" @click="handleVoid" :loading="voidMutation.isPending.value">
            Void
          </Button>
          <Button v-if="bill.status === 'draft'" variant="danger" @click="handleDelete" :loading="deleteMutation.isPending.value">
            Delete
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Bill Details</h2>
            </template>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500">Vendor</dt>
                <dd class="font-medium">{{ bill.contact?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Vendor Invoice #</dt>
                <dd>{{ bill.vendor_invoice_number || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Bill Date</dt>
                <dd>{{ formatDate(bill.bill_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Due Date</dt>
                <dd>{{ formatDate(bill.due_date) }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-slate-500">Description</dt>
                <dd>{{ bill.description || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Line Items</h2>
            </template>
            <table class="w-full">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-slate-500">Description</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-slate-500">Qty</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-slate-500">Price</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-slate-500">Amount</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-for="item in bill.items" :key="item.id">
                  <td class="px-4 py-3">{{ item.description }}</td>
                  <td class="px-4 py-3 text-right">{{ item.quantity }} {{ item.unit }}</td>
                  <td class="px-4 py-3 text-right">{{ formatCurrency(item.unit_price) }}</td>
                  <td class="px-4 py-3 text-right font-medium">{{ formatCurrency(item.line_total) }}</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>

        <div class="space-y-6">
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Summary</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500">Subtotal</dt>
                <dd>{{ formatCurrency(bill.subtotal) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Tax ({{ bill.tax_rate }}%)</dt>
                <dd>{{ formatCurrency(bill.tax_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Discount</dt>
                <dd>-{{ formatCurrency(bill.discount_amount) }}</dd>
              </div>
              <div class="flex justify-between border-t pt-3 text-lg font-medium">
                <dt>Total</dt>
                <dd>{{ formatCurrency(bill.total_amount) }}</dd>
              </div>
              <div class="flex justify-between text-green-600">
                <dt>Paid</dt>
                <dd>{{ formatCurrency(bill.paid_amount) }}</dd>
              </div>
              <div class="flex justify-between text-orange-600 font-medium">
                <dt>Outstanding</dt>
                <dd>{{ formatCurrency(bill.outstanding_amount) }}</dd>
              </div>
            </dl>
          </Card>

          <Card v-if="bill.outstanding_amount > 0 && bill.status !== 'draft'">
            <RouterLink :to="`/payments/new?type=pay&bill_id=${bill.id}`">
              <Button variant="primary" class="w-full">Record Payment</Button>
            </RouterLink>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
