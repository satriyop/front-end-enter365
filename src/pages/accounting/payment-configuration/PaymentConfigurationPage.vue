<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { api, getErrorMessage } from '@/api/client'
import {
  listPaymentConfiguration, savePaymentConfiguration, previewPaymentTerm,
  newPaymentConfiguration, paymentMasterTitles,
  type PaymentConfiguration, type PaymentMasterKind,
} from '@/api/paymentConfiguration'
import { useAuthStore } from '@/stores/auth'
import { Button, Card, Pagination } from '@/components/ui'

const props = defineProps<{ kind: PaymentMasterKind }>()
const auth = useAuthStore()
const title = computed(() => paymentMasterTitles[props.kind])
const rows = ref<PaymentConfiguration[]>([])
const form = ref<PaymentConfiguration | null>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const formError = ref('')
const notice = ref('')
const search = ref('')
const status = ref('')
const page = ref(1)
const meta = ref({ current_page: 1, last_page: 1, total: 0, per_page: 50 })
const journals = ref<{ id: number; name: string; type: string }[]>([])
const methods = ref<PaymentConfiguration[]>([])
const amount = ref(1000)
const date = ref(new Date().toISOString().slice(0, 10))
const preview = ref<{ due_date: string; amount: number }[]>([])
const previewing = ref(false)
const previewError = ref('')
const dirty = ref(false)
const writable = computed(() => auth.hasPermission(form.value?.id ? 'journals.edit' : 'journals.create'))
const bankJournals = computed(() => journals.value.filter(j => j.type === 'bank' || (props.kind === 'payment-methods' && j.type === 'cash')))
const control = 'w-full rounded-md border border-slate-300 bg-white p-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'
let loadVersion = 0

async function load() {
  const version = ++loadVersion
  loading.value = true
  error.value = ''
  try {
    const result = await listPaymentConfiguration(props.kind, { page: page.value, search: search.value, ...(status.value === '' ? {} : { is_active: status.value === 'active' }) })
    if (version !== loadVersion) return
    rows.value = result.data
    meta.value = result.meta
  } catch (e) {
    if (version === loadVersion) error.value = getErrorMessage(e, 'Unable to load configuration.')
  } finally {
    if (version === loadVersion) loading.value = false
  }
}
async function loadChoices() {
  try {
    const result = await api.get<{ data: typeof journals.value }>('/journals', { params: { per_page: 200 } })
    journals.value = result.data.data
    if (props.kind === 'payment-providers') {
      const result = await listPaymentConfiguration('payment-methods', { page: 1, search: '', per_page: 200 })
      methods.value = result.data.filter(method => method.direction === 'inbound')
    }
  } catch (e) {
    formError.value = getErrorMessage(e, 'Unable to load journal or method choices. Try reopening this form.')
  }
}
function edit(record?: PaymentConfiguration) {
  form.value = record ? JSON.parse(JSON.stringify(record)) : newPaymentConfiguration(props.kind)
  formError.value = ''
  preview.value = []
  previewError.value = ''
  dirty.value = false
  if (props.kind !== 'payment-terms') void loadChoices()
}
function addInstallment() {
  form.value?.lines?.splice(form.value.lines.length - 1, 0, { type: 'percent', value: 30, days: 0, due_type: 'days_after' })
  dirty.value = true
  preview.value = []
}
async function save() {
  if (!form.value || saving.value) return
  const kind = props.kind
  saving.value = true
  formError.value = ''
  try {
    const saved = await savePaymentConfiguration(kind, form.value)
    if (props.kind !== kind) return
    form.value = saved
    dirty.value = false
    preview.value = []
    notice.value = 'Configuration saved.'
    await load()
  } catch (e) { if (props.kind === kind) formError.value = getErrorMessage(e, 'Unable to save configuration.') }
  finally { saving.value = false }
}
async function showPreview() {
  if (!form.value?.id || dirty.value) return
  previewing.value = true
  previewError.value = ''
  preview.value = []
  try { preview.value = await previewPaymentTerm(form.value.id, Math.round(Number(amount.value) * 100), date.value) }
  catch (e) { previewError.value = getErrorMessage(e, 'Unable to calculate schedule.') }
  finally { previewing.value = false }
}
function applyFilters() { page.value = 1; void load() }
function goToPage(value: number) { page.value = value; void load() }
watch(() => props.kind, () => {
  form.value = null; rows.value = []; search.value = ''; status.value = ''; page.value = 1; notice.value = ''; void load()
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ title }}</h1>
      <Button v-if="auth.hasPermission('journals.create')" data-testid="config-new" @click="edit()">New Configuration</Button>
    </div>
    <p v-if="kind === 'payment-terms'" class="text-sm text-slate-500">Define installments and preview their due dates. Fixed amounts use the same currency as your preview. Saved schedules do not change existing invoices.</p>
    <p v-if="kind === 'payment-providers'" class="text-sm text-slate-500">Maintain provider settings and supported methods. Payment processing requires a separate provider integration; saving these settings does not connect a provider.</p>
    <p v-if="kind === 'checks'" class="text-sm text-slate-500">Configure check numbering and layout for each bank journal. These settings do not issue or print checks.</p>
    <p v-if="notice" role="status" class="text-green-700 dark:text-green-400">{{ notice }}</p>
    <Card class="p-4">
      <form class="flex flex-wrap items-end gap-3" @submit.prevent="applyFilters">
        <label class="flex flex-1 flex-col gap-1">Search<input v-model="search" :class="control" placeholder="Code or name" data-testid="config-search" /></label>
        <label class="flex flex-col gap-1">Status<select v-model="status" :class="control"><option value="">All</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
        <Button type="submit">Search</Button>
      </form>
    </Card>
    <p v-if="error" role="alert" class="text-red-600">{{ error }} <Button variant="ghost" @click="load">Retry</Button></p>
    <p v-else-if="loading" role="status">Loading configuration…</p>
    <Card v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead><tr class="border-b dark:border-slate-700"><th class="p-3">Code</th><th class="p-3">Name</th><th class="p-3">Status</th><th class="p-3"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id" class="border-b dark:border-slate-700"><td class="p-3">{{ row.code }}</td><td class="p-3">{{ row.name }}</td><td class="p-3">{{ row.is_active ? 'Active' : 'Archived' }}</td><td class="p-3"><Button variant="ghost" @click="edit(row)">{{ auth.hasPermission('journals.edit') ? 'Edit' : 'View' }}</Button></td></tr>
          <tr v-if="!rows.length"><td colspan="4" class="p-6 text-center text-slate-500">No configuration found.</td></tr>
        </tbody>
      </table>
      <div class="p-4"><Pagination :current-page="meta.current_page" :total-pages="meta.last_page" :total="meta.total" :per-page="meta.per_page" @page-change="goToPage" /></div>
    </Card>
    <Card v-if="form" class="p-5">
      <form class="flex flex-col gap-5" @submit.prevent="save" @input="dirty = true; preview = []" @change="dirty = true; preview = []">
        <div class="flex items-center justify-between"><h2 class="text-lg font-semibold">{{ form.id ? 'Edit' : 'New' }} {{ title }}</h2><Button type="button" variant="ghost" :disabled="saving" @click="form = null">Close</Button></div>
        <p v-if="formError" role="alert" class="text-red-600">{{ formError }}</p>
        <fieldset :disabled="!writable || saving" class="flex flex-col gap-4">
          <div class="grid gap-4 sm:grid-cols-2">
            <label class="flex flex-col gap-1">Code<input v-model="form.code" :class="control" required maxlength="64" data-testid="config-code" /></label>
            <label class="flex flex-col gap-1">Name<input v-model="form.name" :class="control" required maxlength="255" data-testid="config-name" /></label>
          </div>
          <label class="flex items-center gap-2"><input v-model="form.is_active" type="checkbox" /> Active (uncheck to archive)</label>
          <template v-if="kind === 'payment-terms'">
            <label class="flex flex-col gap-1">Description<textarea v-model="form.note" :class="control" maxlength="2000" /></label>
            <h3 class="font-medium">Installments</h3>
            <div v-for="(line, index) in form.lines" :key="index" class="grid items-end gap-3 rounded border p-3 dark:border-slate-700 sm:grid-cols-5">
              <label class="flex flex-col gap-1">Type<select v-model="line.type" :class="control" :disabled="line.type === 'balance'"><option value="percent">Percent</option><option value="fixed">Fixed amount</option><option v-if="line.type === 'balance'" value="balance">Remaining balance</option></select></label>
              <label class="flex flex-col gap-1">Value<input v-model.number="line.value" type="number" :class="control" :disabled="line.type === 'balance'" min="0" step="0.01" required /></label>
              <label class="flex flex-col gap-1">Days<input v-model.number="line.days" type="number" :class="control" min="0" max="3650" required /></label>
              <label class="flex flex-col gap-1">Due date<select v-model="line.due_type" :class="control"><option value="days_after">Days after invoice</option><option value="end_of_month">Days after month end</option><option value="end_of_next_month">Days after next month end</option></select></label>
              <Button v-if="line.type !== 'balance'" type="button" variant="ghost" @click="form.lines?.splice(index, 1); dirty = true; preview = []">Remove</Button>
            </div>
            <Button type="button" variant="outline" :disabled="(form.lines?.length ?? 0) >= 36" data-testid="add-installment" @click="addInstallment">Add Installment</Button>
          </template>
          <template v-if="kind === 'payment-methods'">
            <label class="flex flex-col gap-1">Direction<select v-model="form.direction" :class="control"><option value="inbound">Incoming payments</option><option value="outbound">Outgoing payments</option></select></label>
            <label class="flex flex-col gap-1">Payment type<select v-model="form.payment_type" :class="control"><option value="manual">Manual</option><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="card">Card</option><option value="check">Check</option></select></label>
          </template>
          <label v-if="kind !== 'payment-terms'" class="flex flex-col gap-1">Journal<select v-model="form.journal_id" :class="control" :required="kind === 'checks'" data-testid="config-journal"><option :value="null">Select journal</option><option v-for="journal in bankJournals" :key="journal.id" :value="journal.id">{{ journal.name }}</option></select></label>
          <template v-if="kind === 'payment-providers'">
            <label class="flex flex-col gap-1">Configured mode<select v-model="form.state" :class="control"><option value="disabled">Disabled</option><option value="test">Test</option><option value="enabled">Enabled</option></select></label>
            <label class="flex flex-col gap-1">Provider website<input v-model="form.website" type="url" :class="control" maxlength="255" /></label>
            <label class="flex flex-col gap-1">Supported incoming payment methods<select v-model="form.payment_method_ids" multiple :class="control"><option v-for="method in methods" :key="method.id" :value="method.id">{{ method.name }}{{ method.is_active ? '' : ' (archived)' }}</option></select></label>
          </template>
          <template v-if="kind === 'checks'">
            <label class="flex flex-col gap-1">Next check number<input v-model.number="form.next_number" type="number" :class="control" min="1" max="2147483647" required /></label>
            <label class="flex flex-col gap-1">Check position<select v-model="form.layout" :class="control"><option value="top">Top</option><option value="middle">Middle</option><option value="bottom">Bottom</option></select></label>
            <label class="flex items-center gap-2"><input v-model="form.manual_numbering" type="checkbox" /> Manual numbering</label>
          </template>
          <Button v-if="writable" type="submit" :disabled="saving" data-testid="config-save">{{ saving ? 'Saving…' : 'Save Configuration' }}</Button>
        </fieldset>
      </form>
      <form v-if="kind === 'payment-terms' && form.id" class="mt-6 flex flex-col gap-3 border-t pt-4 dark:border-slate-700" @submit.prevent="showPreview">
        <h3 class="font-medium">Schedule Preview</h3>
        <p v-if="dirty" class="text-sm text-amber-700">Save your changes before previewing the schedule.</p>
        <div class="grid gap-3 sm:grid-cols-2"><label class="flex flex-col gap-1">Invoice date<input v-model="date" type="date" :class="control" required @input="preview = []" /></label><label class="flex flex-col gap-1">Invoice amount<input v-model.number="amount" type="number" :class="control" min="0.01" max="1000000000000" step="0.01" required @input="preview = []" /></label></div>
        <Button type="submit" variant="outline" :disabled="dirty || saving || previewing" data-testid="preview-schedule">{{ previewing ? 'Calculating…' : 'Preview Schedule' }}</Button>
        <p v-if="previewError" role="alert" class="text-red-600">{{ previewError }}</p>
        <table v-if="preview.length" class="w-full text-left"><thead><tr><th>Due date</th><th>Amount</th></tr></thead><tbody><tr v-for="(line, index) in preview" :key="index"><td>{{ line.due_date }}</td><td>{{ (line.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td></tr></tbody></table>
      </form>
    </Card>
  </div>
</template>
