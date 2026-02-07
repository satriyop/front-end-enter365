<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePayment, useVoidPayment } from '@/api/usePayments'
import { Button, Card, Badge, useToast } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'
import AttachmentCard from '@/components/AttachmentCard.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const paymentId = computed(() => Number(route.params.id))
const { data: payment, isLoading } = usePayment(paymentId)

const isFx = computed(() => payment.value?.currency && payment.value.currency !== 'IDR')

const hasPph = computed(() => (payment.value?.pph_amount ?? 0) > 0)

const pphCategoryLabels: Record<string, string> = {
  pph23_jasa: 'PPh 23 - Jasa',
  pph23_sewa: 'PPh 23 - Sewa Peralatan',
  pph23_bunga: 'PPh 23 - Bunga',
  pph23_royalti: 'PPh 23 - Royalti',
  pph4_2_konstruksi: 'PPh 4(2) - Konstruksi',
  pph4_2_sewa: 'PPh 4(2) - Sewa Tanah/Bangunan',
  pph26: 'PPh 26 - Badan Asing',
}

const pphCategoryLabel = computed(() =>
  pphCategoryLabels[payment.value?.pph_category ?? ''] ?? '-'
)

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
      <div class="text-slate-500 dark:text-slate-400">Loading payment...</div>
    </div>

    <template v-else-if="payment">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ payment.payment_number }}</h1>
            <Badge :variant="payment.type === 'receive' ? 'success' : 'warning'">
              {{ payment.type === 'receive' ? 'Received' : 'Paid' }}
            </Badge>
            <Badge v-if="payment.is_voided" variant="destructive">Voided</Badge>
          </div>
          <p class="text-slate-500 dark:text-slate-400">{{ payment.contact?.name }}</p>
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" @click="router.back()">Back</Button>
          <Button
            v-if="!payment.is_voided"
            variant="destructive"
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
              <h2 class="font-medium text-slate-900 dark:text-slate-100">Payment Details</h2>
            </template>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Payment Number</dt>
                <dd class="font-mono text-slate-900 dark:text-slate-100">{{ payment.payment_number }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Type</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ payment.type === 'receive' ? 'Payment Received' : 'Payment Made' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Contact</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ payment.contact?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Payment Date</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatDate(payment.payment_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Payment Method</dt>
                <dd class="capitalize text-slate-900 dark:text-slate-100">{{ payment.payment_method }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Cash Account</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ payment.cash_account?.name ?? '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Reference</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ payment.reference || '-' }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Notes</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ payment.notes || '-' }}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div>
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900 dark:text-slate-100">Amount</h2>
            </template>
            <div class="text-center py-4">
              <div class="text-3xl font-bold" :class="payment.type === 'receive' ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'">
                {{ isFx ? formatCurrency(payment.amount, payment.currency) : formatCurrency(payment.amount) }}
              </div>
              <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {{ payment.type === 'receive' ? 'Received from customer' : 'Paid to vendor' }}
              </div>
              <!-- Foreign currency details -->
              <template v-if="isFx">
                <div class="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
                  <div class="text-sm text-slate-500 dark:text-slate-400">
                    Exchange Rate: <span class="font-medium text-slate-900 dark:text-slate-100">{{ Number(payment.exchange_rate).toLocaleString('id-ID') }} IDR/{{ payment.currency }}</span>
                  </div>
                  <div class="text-sm text-slate-500 dark:text-slate-400">
                    Base Amount: <span class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(payment.base_currency_amount) }}</span>
                  </div>
                </div>
              </template>
            </div>
          </Card>

          <!-- PPh Withholding -->
          <Card v-if="hasPph">
            <template #header>
              <h2 class="font-medium text-amber-700 dark:text-amber-300">PPh Withholding</h2>
            </template>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-muted-foreground">Category</dt>
                <dd class="font-medium text-foreground">{{ pphCategoryLabel }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Rate</dt>
                <dd class="text-foreground">{{ payment.pph_rate }}%</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Base Amount</dt>
                <dd class="text-foreground">{{ formatCurrency(payment.pph_base_amount) }}</dd>
              </div>
              <div class="rounded-md bg-amber-50 dark:bg-amber-950/30 p-3">
                <dt class="text-sm text-amber-600 dark:text-amber-400">PPh Amount</dt>
                <dd class="text-lg font-bold text-amber-700 dark:text-amber-300">{{ formatCurrency(payment.pph_amount) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Cash Disbursement</dt>
                <dd class="font-semibold text-foreground">{{ formatCurrency(payment.cash_disbursement) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Attachments -->
          <AttachmentCard attachable-type="Payment" :attachable-id="payment.id" />
        </div>
      </div>
    </template>
  </div>
</template>
