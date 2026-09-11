<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  useCreateReconciliation,
  useReconcileAccounts,
  useReconcileHistory,
  useReconcileLines,
  useUnreconcile,
  type ReconcileLine,
} from '@/api/useAccountReconcile'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, Select, useToast } from '@/components/ui'

const toast = useToast()
const accountId = ref('')
const selected = ref<number[]>([])
const { data: accounts, isLoading: accountsLoading } = useReconcileAccounts()
const { data: lines, isLoading: linesLoading } = useReconcileLines(accountId)
const { data: history } = useReconcileHistory(accountId)
const createMutation = useCreateReconciliation()
const unreconcileMutation = useUnreconcile()

const accountOptions = computed(() =>
  (accounts.value ?? []).map((account) => ({
    value: String(account.id),
    label: account.code + ' · ' + account.name + ' (' + String(account.unreconciled_count) + ')',
  })),
)

const debitLines = computed(() => (lines.value ?? []).filter((line) => line.side === 'debit'))
const creditLines = computed(() => (lines.value ?? []).filter((line) => line.side === 'credit'))

const selectedDebit = computed(() =>
  debitLines.value.filter((line) => selected.value.includes(line.id)).reduce((sum, line) => sum + line.residual, 0),
)
const selectedCredit = computed(() =>
  creditLines.value.filter((line) => selected.value.includes(line.id)).reduce((sum, line) => sum + line.residual, 0),
)
const difference = computed(() => selectedDebit.value - selectedCredit.value)
const canReconcile = computed(() =>
  selectedDebit.value > 0 && selectedCredit.value > 0 && difference.value === 0 && !createMutation.isPending.value,
)

function toggleLine(id: number) {
  if (selected.value.includes(id)) {
    selected.value = selected.value.filter((item) => item !== id)
    return
  }
  selected.value = [...selected.value, id]
}

function isSelected(id: number): boolean {
  return selected.value.includes(id)
}

function onAccountChange(value: string | number | null) {
  accountId.value = value ? String(value) : ''
  selected.value = []
}

async function reconcile() {
  if (!canReconcile.value || !accountId.value) return
  try {
    await createMutation.mutateAsync({
      account_id: Number(accountId.value),
      items: selected.value.map((id) => ({ journal_entry_line_id: id })),
    })
    selected.value = []
    toast.success('Lines reconciled')
  } catch {
    toast.error('Failed to reconcile selected lines')
  }
}

async function undo(id: number) {
  try {
    await unreconcileMutation.mutateAsync(id)
    toast.success('Reconciliation undone')
  } catch {
    toast.error('Failed to unreconcile')
  }
}

function lineLabel(line: ReconcileLine): string {
  return (line.entry_number || 'JE') + ' · ' + (line.description || '—')
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Reconcile</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Match unreconciled journal items on reconcilable accounts. Bank statement matching stays on Bank Reconciliation.
        </p>
      </div>
    </div>

    <Card class="mb-4 p-4">
      <Select
        :model-value="accountId"
        :options="accountOptions"
        placeholder="Select reconcilable account"
        test-id="reconcile-account"
        @update:model-value="onAccountChange"
      />
    </Card>

    <div v-if="accountsLoading" class="text-slate-500 mb-4">Loading accounts…</div>

    <div v-if="accountId" class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <Card class="p-4">
        <h2 class="font-semibold mb-3">Debit outstanding</h2>
        <div v-if="linesLoading" class="text-slate-500">Loading…</div>
        <div v-else-if="!debitLines.length" class="text-slate-500">No debit residuals</div>
        <label
          v-for="line in debitLines"
          :key="'d-' + line.id"
          class="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800"
        >
          <input
            type="checkbox"
            :checked="isSelected(line.id)"
            :data-testid="'reconcile-line-' + line.id"
            @change="toggleLine(line.id)"
          >
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ lineLabel(line) }}</div>
            <div class="text-sm text-slate-500">{{ formatDate(line.entry_date) }} · {{ formatCurrency(line.residual) }}</div>
          </div>
        </label>
      </Card>

      <Card class="p-4">
        <h2 class="font-semibold mb-3">Credit outstanding</h2>
        <div v-if="linesLoading" class="text-slate-500">Loading…</div>
        <div v-else-if="!creditLines.length" class="text-slate-500">No credit residuals</div>
        <label
          v-for="line in creditLines"
          :key="'c-' + line.id"
          class="flex items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800"
        >
          <input
            type="checkbox"
            :checked="isSelected(line.id)"
            :data-testid="'reconcile-line-' + line.id"
            @change="toggleLine(line.id)"
          >
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ lineLabel(line) }}</div>
            <div class="text-sm text-slate-500">{{ formatDate(line.entry_date) }} · {{ formatCurrency(line.residual) }}</div>
          </div>
        </label>
      </Card>
    </div>

    <Card v-if="accountId" class="p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
      <div class="text-sm text-slate-600 dark:text-slate-300">
        Debit {{ formatCurrency(selectedDebit) }}
        · Credit {{ formatCurrency(selectedCredit) }}
        · Difference {{ formatCurrency(difference) }}
      </div>
      <Button data-testid="reconcile-submit" :disabled="!canReconcile" @click="reconcile">
        Reconcile
      </Button>
    </Card>

    <Card>
      <div class="p-4 font-semibold">Recent reconciliations</div>
      <div v-if="!(history ?? []).length" class="py-8 text-center text-slate-500">No reconciliations yet</div>
      <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
        <div
          v-for="row in history"
          :key="row.id"
          class="flex items-center justify-between gap-4 px-4 py-3"
        >
          <div>
            <div class="font-medium">{{ row.account?.code }} · {{ formatCurrency(row.amount) }}</div>
            <div class="text-sm text-slate-500">{{ formatDate(row.reconciled_at) }}</div>
          </div>
          <Button variant="secondary" :data-testid="'unreconcile-' + row.id" @click="undo(row.id)">
            Unreconcile
          </Button>
        </div>
      </div>
    </Card>
  </div>
</template>
