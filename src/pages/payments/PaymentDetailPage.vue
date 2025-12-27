<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePayment, useVoidPayment } from '@/api/usePayments'
import { Button, Card, Badge, useToast } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const paymentId = computed(() => Number(route.params.id))
const { data: payment, isLoading } = usePayment(paymentId)

const voidMutation = useVoidPayment()

async function handleVoid() {
  if (!confirm('Void this payment? This will reverse the journal entries.')) return
  try {
    await voidMutation.mutateAsync(paymentId.value)
    toast.success('Payment voided')
  } catch {
    toast.error('Failed to void payment')
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-slate-500">Loading payment...</div>
    </div>

    <template v-else-if="payment">
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-slate-900">{{ payment.payment_number }}</h1>
            <Badge :variant="payment.type === 'receive' ? 'success' : 'warning'">
              {{ payment.type === 'receive' ? 'Received' : 'Paid' }}
            </Badge>
            <Badge v-if="payment.is_voided" variant="error">Voided</Badge>
          </div>
          <p class="text-slate-500">{{ payment.contact?.name }}</p>
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" @click="router.back()">Back</Button>
          <Button
            v-if="!payment.is_voided"
            variant="danger"
            @click="handleVoid"
            :loading="voidMutation.isPending.value"
          >
            Void Payment
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Payment Details</h2>
            </template>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500">Payment Number</dt>
                <dd class="font-mono">{{ payment.payment_number }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Type</dt>
                <dd>{{ payment.type === 'receive' ? 'Payment Received' : 'Payment Made' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Contact</dt>
                <dd class="font-medium">{{ payment.contact?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Payment Date</dt>
                <dd>{{ formatDate(payment.payment_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Payment Method</dt>
                <dd class="capitalize">{{ payment.payment_method }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Cash Account</dt>
                <dd>{{ payment.cash_account?.name ?? '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Reference</dt>
                <dd>{{ payment.reference || '-' }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-slate-500">Notes</dt>
                <dd>{{ payment.notes || '-' }}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div>
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Amount</h2>
            </template>
            <div class="text-center py-4">
              <div class="text-3xl font-bold" :class="payment.type === 'receive' ? 'text-green-600' : 'text-orange-600'">
                {{ formatCurrency(payment.amount) }}
              </div>
              <div class="text-sm text-slate-500 mt-1">
                {{ payment.type === 'receive' ? 'Received from customer' : 'Paid to vendor' }}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
