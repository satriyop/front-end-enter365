<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  REVIEW_KIND_META,
  useAuditTrail,
  useJournalAudit,
  useJournalItems,
  useWorkingFiles,
  type ReviewKind,
} from '@/api/useAccountingReview'
import { formatCurrency, formatDate, toLocalISODate } from '@/utils/format'
import { Button, Card, Input, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'

const props = defineProps<{ kind: ReviewKind }>()
const router = useRouter()
const meta = computed(() => REVIEW_KIND_META[props.kind])
const from = ref('')
const to = ref(toLocalISODate())
const search = ref('')

const itemFilters = computed(() => ({
  from: from.value || undefined,
  to: to.value || undefined,
  search: search.value || undefined,
  per_page: 50,
}))

const isItems = computed(() => props.kind === 'journal-items')
const isAudit = computed(() => props.kind === 'journal-audit')
const isFiles = computed(() => props.kind === 'working-files')
const isTrail = computed(() => props.kind === 'audit-trail')

const { data: items, isLoading: itemsLoading, error: itemsError } = useJournalItems(itemFilters, isItems)
const { data: audit, isLoading: auditLoading, error: auditError } = useJournalAudit(itemFilters, isAudit)
const { data: files, isLoading: filesLoading, error: filesError } = useWorkingFiles(isFiles)
const { data: trail, isLoading: trailLoading, error: trailError } = useAuditTrail(itemFilters, isTrail)

const itemColumns: ResponsiveColumn[] = [
  { key: 'entry_date', label: 'Date', mobilePriority: 1 },
  { key: 'entry_number', label: 'Entry', mobilePriority: 2 },
  { key: 'account_code', label: 'Account', mobilePriority: 3 },
  { key: 'partner_name', label: 'Partner', showInMobile: false },
  { key: 'description', label: 'Label', showInMobile: false },
  { key: 'debit', label: 'Debit', mobilePriority: 4 },
  { key: 'credit', label: 'Credit', showInMobile: false },
]

const auditColumns: ResponsiveColumn[] = [
  { key: 'journal_name', label: 'Journal', mobilePriority: 1 },
  { key: 'journal_type', label: 'Type', mobilePriority: 2 },
  { key: 'entry_count', label: 'Entries', mobilePriority: 3 },
  { key: 'debit', label: 'Debit', mobilePriority: 4 },
  { key: 'credit', label: 'Credit', showInMobile: false },
]

const fileColumns: ResponsiveColumn[] = [
  { key: 'number', label: 'Number', mobilePriority: 1 },
  { key: 'date', label: 'Date', mobilePriority: 2 },
  { key: 'partner', label: 'Partner', mobilePriority: 3 },
  { key: 'amount', label: 'Amount', mobilePriority: 4 },
]

const trailColumns: ResponsiveColumn[] = [
  { key: 'created_at', label: 'When', mobilePriority: 1 },
  { key: 'user_name', label: 'User', mobilePriority: 2 },
  { key: 'action', label: 'Action', mobilePriority: 3 },
  { key: 'auditable_type', label: 'Document', showInMobile: false },
  { key: 'auditable_label', label: 'Label', mobilePriority: 4 },
]

const loading = computed(() => {
  if (props.kind === 'journal-items') return itemsLoading.value
  if (props.kind === 'journal-audit') return auditLoading.value
  if (props.kind === 'working-files') return filesLoading.value
  return trailLoading.value
})

const error = computed(() => {
  if (props.kind === 'journal-items') return itemsError.value
  if (props.kind === 'journal-audit') return auditError.value
  if (props.kind === 'working-files') return filesError.value
  return trailError.value
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ meta.title }}</h1>
        <p class="text-slate-500 dark:text-slate-400">{{ meta.description }}</p>
      </div>
      <Button variant="ghost" @click="router.push('/accounting/journal-entries')">Journal Entries</Button>
    </div>

    <Card v-if="kind !== 'working-files'" class="mb-4 p-4 flex flex-wrap gap-3">
      <Input v-model="from" type="date" data-testid="review-from" />
      <Input v-model="to" type="date" data-testid="review-to" />
      <Input
        v-if="kind === 'journal-items' || kind === 'audit-trail'"
        v-model="search"
        placeholder="Search..."
        data-testid="review-search"
      />
    </Card>

    <div v-if="error" class="py-12 text-center text-red-500">Failed to load review</div>
    <div v-else-if="loading" class="py-12 text-center text-slate-500">Loading…</div>

    <template v-else-if="kind === 'journal-items'">
      <Card>
        <div v-if="!(items?.rows.length)" class="py-12 text-center text-slate-500">No journal items</div>
        <ResponsiveTable v-else :items="items?.rows ?? []" :columns="itemColumns" row-key="id">
          <template #cell-entry_date="{ item }">{{ item.entry_date ? formatDate(item.entry_date) : '—' }}</template>
          <template #cell-account_code="{ item }">
            {{ item.account_code ? item.account_code + ' · ' + (item.account_name || '') : '—' }}
          </template>
          <template #cell-debit="{ item }">{{ formatCurrency(item.debit) }}</template>
          <template #cell-credit="{ item }">{{ formatCurrency(item.credit) }}</template>
        </ResponsiveTable>
      </Card>
    </template>

    <template v-else-if="kind === 'journal-audit'">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card class="p-4">
          <div class="text-sm text-slate-500">Entries</div>
          <div class="text-xl font-semibold">{{ audit?.totals.entry_count ?? 0 }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Debit</div>
          <div class="text-xl font-semibold">{{ formatCurrency(audit?.totals.debit ?? 0) }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Credit</div>
          <div class="text-xl font-semibold">{{ formatCurrency(audit?.totals.credit ?? 0) }}</div>
        </Card>
      </div>
      <Card>
        <div v-if="!(audit?.journals.length)" class="py-12 text-center text-slate-500">No posted journals in range</div>
        <ResponsiveTable v-else :items="audit?.journals ?? []" :columns="auditColumns" row-key="journal_id">
          <template #cell-debit="{ item }">{{ formatCurrency(item.debit) }}</template>
          <template #cell-credit="{ item }">{{ formatCurrency(item.credit) }}</template>
        </ResponsiveTable>
      </Card>
    </template>

    <template v-else-if="kind === 'working-files'">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card class="p-4">
          <div class="text-sm text-slate-500">Unposted journals</div>
          <div class="text-xl font-semibold">{{ files?.totals.unposted_journal_entries ?? 0 }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Draft invoices</div>
          <div class="text-xl font-semibold">{{ files?.totals.draft_invoices ?? 0 }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Draft bills</div>
          <div class="text-xl font-semibold">{{ files?.totals.draft_bills ?? 0 }}</div>
        </Card>
      </div>
      <Card class="mb-4">
        <div class="p-4 font-semibold">Unposted journal entries</div>
        <div v-if="!(files?.unposted_journal_entries.length)" class="py-8 text-center text-slate-500">None</div>
        <ResponsiveTable v-else :items="files?.unposted_journal_entries ?? []" :columns="fileColumns" row-key="id">
          <template #cell-date="{ item }">{{ item.date ? formatDate(item.date) : '—' }}</template>
        </ResponsiveTable>
      </Card>
      <Card class="mb-4">
        <div class="p-4 font-semibold">Draft invoices</div>
        <div v-if="!(files?.draft_invoices.length)" class="py-8 text-center text-slate-500">None</div>
        <ResponsiveTable v-else :items="files?.draft_invoices ?? []" :columns="fileColumns" row-key="id">
          <template #cell-date="{ item }">{{ item.date ? formatDate(item.date) : '—' }}</template>
          <template #cell-amount="{ item }">{{ formatCurrency(item.amount ?? 0) }}</template>
        </ResponsiveTable>
      </Card>
      <Card>
        <div class="p-4 font-semibold">Draft bills</div>
        <div v-if="!(files?.draft_bills.length)" class="py-8 text-center text-slate-500">None</div>
        <ResponsiveTable v-else :items="files?.draft_bills ?? []" :columns="fileColumns" row-key="id">
          <template #cell-date="{ item }">{{ item.date ? formatDate(item.date) : '—' }}</template>
          <template #cell-amount="{ item }">{{ formatCurrency(item.amount ?? 0) }}</template>
        </ResponsiveTable>
      </Card>
    </template>

    <template v-else>
      <Card>
        <div v-if="!(trail?.data.length)" class="py-12 text-center text-slate-500">No audit events</div>
        <ResponsiveTable v-else :items="trail?.data ?? []" :columns="trailColumns" row-key="id">
          <template #cell-created_at="{ item }">{{ item.created_at ? formatDate(item.created_at) : '—' }}</template>
        </ResponsiveTable>
      </Card>
    </template>
  </div>
</template>
