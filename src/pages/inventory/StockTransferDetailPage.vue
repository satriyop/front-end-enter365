<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStockTransfer, useConfirmStockTransfer, useCancelStockTransfer, transferStatusLabel } from '@/api/useStockTransfers'
import { Badge, Button, Card, useToast } from '@/components/ui'
import { formatDate } from '@/utils/format'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const id = computed(() => String(route.params.id))
const { data: transfer, isLoading, error } = useStockTransfer(id)
const confirmMutation = useConfirmStockTransfer()
const cancelMutation = useCancelStockTransfer()
const isDraft = computed(() => transfer.value?.status.value === 'draft')

async function confirm() {
  try {
    await confirmMutation.mutateAsync(id.value)
    toast.success('Transfer marked Done — stock moved')
  } catch (err: unknown) {
    toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to confirm')
  }
}

async function cancel() {
  try {
    await cancelMutation.mutateAsync(id.value)
    toast.success('Transfer cancelled')
  } catch (err: unknown) {
    toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to cancel')
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div v-if="isLoading" class="py-12 text-center text-muted-foreground">Loading...</div>
    <div v-else-if="error" class="py-12 text-center text-destructive">Failed to load transfer</div>
    <template v-else-if="transfer">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <Button variant="ghost" size="sm" @click="router.push('/inventory/transfer')">
            <ArrowLeft class="h-4 w-4" />
          </Button>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-semibold text-foreground">{{ transfer.transfer_number }}</h1>
              <Badge :status="transfer.status.value as any">
                {{ transferStatusLabel(transfer.status.value, transfer.status.label) }}
              </Badge>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ transfer.operation_type }} · {{ formatDate(transfer.scheduled_date) }}
            </p>
          </div>
        </div>
        <div v-if="isDraft" class="flex gap-2">
          <Button variant="outline" :loading="cancelMutation.isPending.value" @click="cancel">Cancel</Button>
          <Button :loading="confirmMutation.isPending.value" @click="confirm">Mark Done</Button>
        </div>
      </div>

      <Card>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt class="text-sm text-muted-foreground">From</dt>
            <dd>{{ transfer.from_warehouse?.name ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted-foreground">To</dt>
            <dd>{{ transfer.to_warehouse?.name ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted-foreground">Contact</dt>
            <dd>{{ transfer.contact?.name ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-sm text-muted-foreground">Source document</dt>
            <dd>{{ transfer.source_document || '—' }}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Lines</h2>
        </template>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-muted-foreground border-b border-border">
              <th class="py-2">Product</th>
              <th class="py-2 text-right">Qty</th>
              <th class="py-2">UoM</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="line in transfer.items" :key="line.id" class="border-b border-border">
              <td class="py-2">{{ line.product?.sku }} — {{ line.product?.name }}</td>
              <td class="py-2 text-right font-mono">{{ line.quantity }}</td>
              <td class="py-2">{{ line.unit }}</td>
            </tr>
          </tbody>
        </table>
      </Card>
    </template>
  </div>
</template>
