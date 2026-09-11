<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  deferredBasePath,
  deferredLabel,
  useConfirmDeferredEntry,
  useDeferredEntry,
  usePostDeferredRecognition,
  type DeferredKind,
} from '@/api/useDeferredEntries'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, ResponsiveTable, useToast, type ResponsiveColumn } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const kind = computed<DeferredKind>(() => (route.meta.kind === 'revenue' ? 'revenue' : 'expense'))
const basePath = computed(() => deferredBasePath(kind.value))
const title = computed(() => deferredLabel(kind.value))
const entryId = computed(() => String(route.params.id ?? ''))
const { data: entry, isLoading, error } = useDeferredEntry(kind.value)(entryId)
const confirmMutation = useConfirmDeferredEntry(kind.value)
const postMutation = usePostDeferredRecognition(kind.value)

const columns: ResponsiveColumn[] = [
  { key: 'sequence', label: '#', mobilePriority: 1 },
  { key: 'recognition_date', label: 'Date', mobilePriority: 2 },
  { key: 'amount', label: 'Amount', mobilePriority: 3 },
  { key: 'remaining_amount', label: 'Remaining', showInMobile: false },
  { key: 'status', label: 'Status', mobilePriority: 4 },
]

async function confirm() {
  try {
    await confirmMutation.mutateAsync(entryId.value)
    toast.success('Entry confirmed and schedule generated')
  } catch {
    toast.error('Failed to confirm entry')
  }
}

async function postNext() {
  try {
    await postMutation.mutateAsync(entryId.value)
    toast.success('Recognition posted')
  } catch {
    toast.error('Failed to post recognition')
  }
}

function editEntry() {
  router.push(basePath.value + '/' + entryId.value + '/edit')
}

function goList() {
  router.push(basePath.value)
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goList">
        <ArrowLeft class="w-4 h-4" />
        {{ title }}
      </button>
    </div>

    <div v-if="error" class="text-red-500">Failed to load entry</div>
    <div v-else-if="isLoading || !entry" class="text-slate-500">Loading…</div>
    <template v-else>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold">{{ entry.code }} · {{ entry.name }}</h1>
          <p class="text-slate-500">{{ entry.status }} · remaining {{ formatCurrency(entry.remaining_amount) }}</p>
        </div>
        <div class="flex gap-2">
          <Button v-if="entry.status === 'draft'" variant="secondary" @click="editEntry">
            Edit
          </Button>
          <Button v-if="entry.status === 'draft'" data-testid="deferred-confirm" @click="confirm">
            Confirm
          </Button>
          <Button v-if="entry.status === 'running'" data-testid="deferred-post-recognition" @click="postNext">
            Post next recognition
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card class="p-4">
          <div class="text-sm text-slate-500">Amount</div>
          <div class="font-semibold">{{ formatCurrency(entry.amount) }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Duration</div>
          <div class="font-semibold">{{ entry.duration_months }} months</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Start</div>
          <div class="font-semibold">{{ formatDate(entry.start_date) }}</div>
        </Card>
      </div>

      <Card>
        <div class="p-4 font-semibold">Recognition schedule</div>
        <div v-if="!entry.lines?.length" class="py-8 text-center text-slate-500">
          Confirm the entry to generate the schedule and post origination.
        </div>
        <ResponsiveTable
          v-else
          :items="entry.lines"
          :columns="columns"
          row-key="id"
        >
          <template #cell-recognition_date="{ item }">{{ formatDate(item.recognition_date) }}</template>
          <template #cell-amount="{ item }">{{ formatCurrency(item.amount) }}</template>
          <template #cell-remaining_amount="{ item }">{{ formatCurrency(item.remaining_amount) }}</template>
        </ResponsiveTable>
      </Card>
    </template>
  </div>
</template>
