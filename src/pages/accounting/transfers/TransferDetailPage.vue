<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useAccountingTransfer,
  useCancelAccountingTransfer,
  usePostAccountingTransfer,
} from '@/api/useAccountingTransfers'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const transferId = computed(() => String(route.params.id ?? ''))
const { data: transfer, isLoading, error } = useAccountingTransfer(transferId)
const postMutation = usePostAccountingTransfer()
const cancelMutation = useCancelAccountingTransfer()

function accountLabel(account: { code: string; name: string } | null | undefined): string {
  if (!account) return '—'
  return account.code + ' · ' + account.name
}

async function postTransfer() {
  try {
    await postMutation.mutateAsync(transferId.value)
    toast.success('Transfer posted')
  } catch {
    toast.error('Failed to post transfer')
  }
}

async function cancelTransfer() {
  try {
    await cancelMutation.mutateAsync({ id: transferId.value })
    toast.success('Transfer cancelled')
  } catch {
    toast.error('Failed to cancel transfer')
  }
}

function editTransfer() {
  router.push('/accounting/transfers/' + transferId.value + '/edit')
}

function goList() {
  router.push('/accounting/transfers')
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goList">
        <ArrowLeft class="w-4 h-4" />
        Transfers
      </button>
    </div>

    <div v-if="error" class="text-red-500">Failed to load transfer</div>
    <div v-else-if="isLoading || !transfer" class="text-slate-500">Loading…</div>
    <template v-else>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold">{{ transfer.transfer_number }}</h1>
          <p class="text-slate-500">{{ transfer.status }} · {{ formatDate(transfer.transfer_date) }}</p>
        </div>
        <div class="flex gap-2">
          <Button v-if="transfer.status === 'draft'" variant="secondary" @click="editTransfer">
            Edit
          </Button>
          <Button v-if="transfer.status === 'draft'" data-testid="transfer-post" @click="postTransfer">
            Post
          </Button>
          <Button v-if="transfer.status === 'posted'" data-testid="transfer-cancel" @click="cancelTransfer">
            Cancel
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card class="p-4">
          <div class="text-sm text-slate-500">From</div>
          <div class="font-semibold">{{ accountLabel(transfer.from_account) }}</div>
          <div class="text-sm text-slate-500">{{ transfer.from_journal?.name }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">To</div>
          <div class="font-semibold">{{ accountLabel(transfer.to_account) }}</div>
          <div class="text-sm text-slate-500">{{ transfer.to_journal?.name }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Amount</div>
          <div class="font-semibold">{{ formatCurrency(transfer.amount) }}</div>
          <div class="text-sm text-slate-500">{{ transfer.journal_entry?.entry_number || 'Not posted' }}</div>
        </Card>
      </div>

      <Card class="p-4">
        <div class="text-sm text-slate-500">Memo</div>
        <div>{{ transfer.memo || '—' }}</div>
      </Card>
    </template>
  </div>
</template>
