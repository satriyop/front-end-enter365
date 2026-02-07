<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useQuotation,
  useSubmitQuotation,
  useApproveQuotation,
  useRejectQuotation,
  useReviseQuotation,
  useConvertToInvoice,
  useDuplicateQuotation,
  useDeleteQuotation,
  useMarkQuotationSent,
  useMarkQuotationWon,
  useMarkQuotationLost,
  useExportQuotationPdf,
} from '@/api/useQuotations'
import {
  useQuotationActivities,
  useAssignQuotation,
  useUpdatePriority,
} from '@/api/useQuotationFollowUp'
import { useUsersLookup } from '@/api/useUsers'
import { getErrorMessage } from '@/api/client'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Badge, Modal, ConfirmDialog, PageSkeleton, useToast, ResponsiveTable, type ResponsiveColumn, Select, Input } from '@/components/ui'
import { usePrint } from '@/composables/usePrint'
import PrintableDocument from '@/components/PrintableDocument.vue'
import LogActivityModal from '@/components/quotations/LogActivityModal.vue'
import ScheduleFollowUpModal from '@/components/quotations/ScheduleFollowUpModal.vue'
import AttachmentCard from '@/components/AttachmentCard.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { print, isPrinting } = usePrint()

const quotationId = computed(() => Number(route.params.id))

const { data: quotation, isLoading, error } = useQuotation(quotationId)

// Mutations
const submitMutation = useSubmitQuotation()
const approveMutation = useApproveQuotation()
const rejectMutation = useRejectQuotation()
const reviseMutation = useReviseQuotation()
const convertMutation = useConvertToInvoice()
const duplicateMutation = useDuplicateQuotation()
const deleteMutation = useDeleteQuotation()
const markSentMutation = useMarkQuotationSent()
const markWonMutation = useMarkQuotationWon()
const markLostMutation = useMarkQuotationLost()
const exportPdfMutation = useExportQuotationPdf()
const assignMutation = useAssignQuotation()
const priorityMutation = useUpdatePriority()

// Follow-up data
const { data: activitiesData, isLoading: activitiesLoading } = useQuotationActivities(quotationId)
const { data: usersData } = useUsersLookup()

const activities = computed(() => activitiesData.value?.data ?? [])
const userOptions = computed(() => [
  { value: '', label: 'Unassigned' },
  ...(usersData.value?.map((u) => ({ value: String(u.id), label: u.name })) ?? []),
])

// Modal states
const showRejectModal = ref(false)
const showPrintPreview = ref(false)
const showWonModal = ref(false)
const showLostModal = ref(false)
const showLogActivity = ref(false)
const showScheduleFollowUp = ref(false)
const rejectReason = ref('')
const wonReason = ref('')
const wonNotes = ref('')
const lostReason = ref('')
const lostToCompetitor = ref('')
const lostNotes = ref('')
const deleteConfirmRef = ref<InstanceType<typeof ConfirmDialog>>()

// Won/Lost reason options
const wonReasonOptions = [
  { value: '', label: 'Select reason...' },
  { value: 'harga_kompetitif', label: 'Harga Kompetitif' },
  { value: 'kualitas_produk', label: 'Kualitas Produk' },
  { value: 'layanan_baik', label: 'Layanan Baik' },
  { value: 'waktu_pengiriman', label: 'Waktu Pengiriman' },
  { value: 'hubungan_baik', label: 'Hubungan Baik' },
  { value: 'spesifikasi_sesuai', label: 'Spesifikasi Sesuai' },
  { value: 'rekomendasi', label: 'Rekomendasi' },
  { value: 'lainnya', label: 'Lainnya' },
]

const lostReasonOptions = [
  { value: '', label: 'Select reason...' },
  { value: 'harga_tinggi', label: 'Harga Tinggi' },
  { value: 'kalah_kompetitor', label: 'Kalah Kompetitor' },
  { value: 'spesifikasi_tidak_sesuai', label: 'Spesifikasi Tidak Sesuai' },
  { value: 'waktu_pengiriman_lama', label: 'Waktu Pengiriman Lama' },
  { value: 'proyek_dibatalkan', label: 'Proyek Dibatalkan' },
  { value: 'tidak_ada_budget', label: 'Tidak Ada Budget' },
  { value: 'tidak_ada_respon', label: 'Tidak Ada Respon' },
  { value: 'lainnya', label: 'Lainnya' },
]

const priorityOptions: { value: string; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

// Action handlers
async function handleSubmit() {
  try {
    await submitMutation.mutateAsync(quotationId.value)
    toast.success('Quotation submitted for approval')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to submit quotation'))
  }
}

async function handleApprove() {
  try {
    await approveMutation.mutateAsync(quotationId.value)
    toast.success('Quotation approved')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to approve quotation'))
  }
}

async function handleReject() {
  try {
    await rejectMutation.mutateAsync({ id: quotationId.value, reason: rejectReason.value })
    showRejectModal.value = false
    rejectReason.value = ''
    toast.success('Quotation rejected')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to reject quotation'))
  }
}

async function handleConvert() {
  try {
    const result = await convertMutation.mutateAsync(quotationId.value)
    toast.success('Invoice created successfully')
    router.push(`/invoices/${result.invoice.id}`)
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to convert to invoice'))
  }
}

async function handleDuplicate() {
  try {
    const duplicate = await duplicateMutation.mutateAsync(quotationId.value)
    toast.success('Quotation duplicated')
    router.push(`/quotations/${duplicate.id}/edit`)
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to duplicate quotation'))
  }
}

async function handleRevise() {
  try {
    const revised = await reviseMutation.mutateAsync(quotationId.value)
    toast.success('New revision created')
    router.push(`/quotations/${revised.id}/edit`)
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to create revision'))
  }
}

async function handleDelete() {
  const confirmed = await deleteConfirmRef.value?.open()
  if (!confirmed) return

  try {
    await deleteMutation.mutateAsync(quotationId.value)
    toast.success('Quotation deleted')
    router.push('/quotations')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to delete quotation'))
  }
}

async function handleMarkSent() {
  try {
    await markSentMutation.mutateAsync(quotationId.value)
    toast.success('Quotation marked as sent')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to mark quotation as sent'))
  }
}

async function handleMarkWon() {
  try {
    await markWonMutation.mutateAsync({
      id: quotationId.value,
      won_reason: wonReason.value || null,
      outcome_notes: wonNotes.value || null,
    })
    showWonModal.value = false
    wonReason.value = ''
    wonNotes.value = ''
    toast.success('Quotation marked as won')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to mark quotation as won'))
  }
}

async function handleMarkLost() {
  try {
    await markLostMutation.mutateAsync({
      id: quotationId.value,
      lost_reason: lostReason.value || null,
      lost_to_competitor: lostToCompetitor.value || null,
      outcome_notes: lostNotes.value || null,
    })
    showLostModal.value = false
    lostReason.value = ''
    lostToCompetitor.value = ''
    lostNotes.value = ''
    toast.success('Quotation marked as lost')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to mark quotation as lost'))
  }
}

async function handleAssign(userId: string) {
  if (!userId) return
  try {
    await assignMutation.mutateAsync({ id: quotationId.value, assigned_to: Number(userId) })
    toast.success('Quotation assigned')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to assign'))
  }
}

async function handlePriority(priority: string) {
  try {
    await priorityMutation.mutateAsync({
      id: quotationId.value,
      priority: priority as 'low' | 'normal' | 'high' | 'urgent',
    })
    toast.success('Priority updated')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to update priority'))
  }
}

// Activity type icon mapping
function getActivityIcon(type: string): string {
  const icons: Record<string, string> = {
    call: '📞',
    email: '📧',
    meeting: '🤝',
    note: '📝',
    whatsapp: '💬',
    visit: '🏢',
  }
  return icons[type] ?? '📋'
}

function getOutcomeClass(outcome?: string | null): string {
  if (!outcome) return ''
  const classes: Record<string, string> = {
    positive: 'text-emerald-600 dark:text-emerald-400',
    neutral: 'text-slate-500 dark:text-slate-400',
    negative: 'text-red-600 dark:text-red-400',
    no_answer: 'text-amber-600 dark:text-amber-400',
  }
  return classes[outcome] ?? ''
}

async function handleExportPdf() {
  try {
    await exportPdfMutation.mutateAsync(quotationId.value)
    toast.success('PDF downloaded')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Failed to download PDF'))
  }
}

// Status-based action availability
const canEdit = computed(() => quotation.value?.status.value === 'draft')
const canSubmit = computed(() => quotation.value?.status.value === 'draft')
const canApprove = computed(() => quotation.value?.status.value === 'submitted')
const canReject = computed(() => quotation.value?.status.value === 'submitted')
const canRevise = computed(() => {
  const status = quotation.value?.status.value
  return status === 'cancelled' || status === 'rejected' || status === 'lost'
})
const canConvert = computed(() => quotation.value?.status.value === 'approved')
const canDelete = computed(() => quotation.value?.status.value === 'draft')
const canMarkSent = computed(() => {
  const status = quotation.value?.status.value
  // Sent status would be tracked via status.value or last_contacted_at
  return status === 'approved'
})
const canMarkWonLost = computed(() => {
  const status = quotation.value?.status.value
  return status === 'approved' || status === 'sent'
})

// Print functionality
function handlePrint() {
  print({
    title: `Quotation ${quotation.value?.full_number}`,
    onAfterPrint: () => {
      showPrintPreview.value = false
    },
  })
}

// Transform quotation items for PrintableDocument
const printableItems = computed(() => {
  if (!quotation.value?.items) return []
  return quotation.value.items.map((item) => ({
    id: item.id,
    description: item.product?.name || item.description,
    notes: item.product?.name ? item.description : undefined,
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unit_price,
    discount_percent: item.discount_percent,
    tax_rate: item.tax_rate,
    line_total: item.line_total,
  }))
})

// Line items table columns with mobile priorities
const itemColumns: ResponsiveColumn[] = [
  { key: 'item', label: 'Item', mobilePriority: 1 },
  { key: 'quantity', label: 'Qty', align: 'right', mobilePriority: 3 },
  { key: 'unit_price', label: 'Price', align: 'right', showInMobile: false },
  { key: 'discount_percent', label: 'Disc', align: 'right', showInMobile: false },
  { key: 'tax_rate', label: 'Tax', align: 'right', showInMobile: false },
  { key: 'line_total', label: 'Total', align: 'right', mobilePriority: 2 },
]
</script>

<template>
  <div>
    <!-- Loading -->
    <PageSkeleton v-if="isLoading" type="detail" />

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500 dark:text-red-400">
      {{ getErrorMessage(error, 'Failed to load quotation') }}
    </div>

    <!-- Content -->
    <template v-else-if="quotation">
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/quotations" class="hover:text-slate-700 dark:hover:text-slate-300">Quotations</RouterLink>
        <span class="mx-2">›</span>
        <span class="text-slate-900 dark:text-slate-100">{{ quotation.full_number }}</span>
      </div>

      <!-- Header -->
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ quotation.full_number }}
              </h1>
              <Badge :status="quotation.status">
                {{ quotation.status_label }}
              </Badge>
            </div>
            <p class="text-slate-500 dark:text-slate-400">{{ quotation.contact?.name }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <!-- PDF Download -->
            <Button
              variant="ghost"
              size="sm"
              :loading="exportPdfMutation.isPending.value"
              @click="handleExportPdf"
            >
              Download PDF
            </Button>

            <!-- Print -->
            <Button
              variant="ghost"
              size="sm"
              :loading="isPrinting"
              @click="showPrintPreview = true"
            >
              Print
            </Button>

            <!-- Duplicate -->
            <Button
              variant="ghost"
              size="sm"
              :loading="duplicateMutation.isPending.value"
              @click="handleDuplicate"
            >
              Duplicate
            </Button>

            <!-- Mark Sent (approved only, not yet sent) -->
            <Button
              v-if="canMarkSent"
              variant="secondary"
              size="sm"
              :loading="markSentMutation.isPending.value"
              @click="handleMarkSent"
            >
              Mark as Sent
            </Button>

            <!-- Mark Won (approved/sent only) -->
            <Button
              v-if="canMarkWonLost"
              variant="success"
              size="sm"
              @click="showWonModal = true"
            >
              Mark as Won
            </Button>

            <!-- Mark Lost (approved/sent only) -->
            <Button
              v-if="canMarkWonLost"
              variant="ghost"
              size="sm"
              @click="showLostModal = true"
            >
              Mark as Lost
            </Button>

            <!-- Log Activity -->
            <Button
              variant="secondary"
              size="sm"
              @click="showLogActivity = true"
            >
              Log Activity
            </Button>

            <!-- Schedule Follow-Up -->
            <Button
              variant="secondary"
              size="sm"
              @click="showScheduleFollowUp = true"
            >
              Schedule Follow-Up
            </Button>

            <!-- Edit (draft only) -->
            <RouterLink
              v-if="canEdit"
              :to="`/quotations/${quotationId}/edit`"
            >
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </RouterLink>

            <!-- Submit (draft only) -->
            <Button
              v-if="canSubmit"
             
              size="sm"
              :loading="submitMutation.isPending.value"
              @click="handleSubmit"
            >
              Submit for Approval
            </Button>

            <!-- Approve (submitted only) -->
            <Button
              v-if="canApprove"
              variant="success"
              size="sm"
              :loading="approveMutation.isPending.value"
              @click="handleApprove"
            >
              Approve
            </Button>

            <!-- Reject (submitted only) -->
            <Button
              v-if="canReject"
              variant="destructive"
              size="sm"
              @click="showRejectModal = true"
            >
              Reject
            </Button>

            <!-- Convert to Invoice (approved only) -->
            <Button
              v-if="canConvert"

              size="sm"
              :loading="convertMutation.isPending.value"
              @click="handleConvert"
            >
              Convert to Invoice
            </Button>

            <!-- Revise (cancelled/rejected only) -->
            <Button
              v-if="canRevise"
              variant="secondary"
              size="sm"
              :loading="reviseMutation.isPending.value"
              @click="handleRevise"
            >
              Revise
            </Button>

            <!-- Delete (draft only) -->
            <Button
              v-if="canDelete"
              variant="ghost"
              size="sm"
              class="text-red-500 hover:text-red-600"
              @click="handleDelete"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Details Card -->
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">Details</h2>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Subject</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ quotation.subject || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Reference</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ quotation.reference || '-' }}</dd>
              </div>
              <div v-if="quotation.currency && quotation.currency !== 'IDR'" data-testid="quotation-currency-display">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Currency</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ quotation.currency }} ({{ quotation.exchange_rate }})</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Quotation Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(quotation.quotation_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Valid Until</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(quotation.valid_until) }}
                  <span v-if="quotation.is_expired" class="text-red-500 dark:text-red-400 text-sm">(Expired)</span>
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Customer</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ quotation.contact?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Email</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ quotation.contact?.email || '-' }}</dd>
              </div>
            </dl>
          </div>

          <!-- Items Card -->
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Line Items</h2>
            </div>
            <ResponsiveTable
              :items="quotation.items || []"
              :columns="itemColumns"
              title-field="item"
            >
              <!-- Custom cell: Item -->
              <template #cell-item="{ item }">
                <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.product?.name || item.description }}</div>
                <div v-if="item.product?.name" class="text-sm text-slate-500 dark:text-slate-400">{{ item.description }}</div>
              </template>

              <!-- Custom cell: Quantity -->
              <template #cell-quantity="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ item.quantity }} {{ item.unit }}</span>
              </template>

              <!-- Custom cell: Unit Price -->
              <template #cell-unit_price="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ formatCurrency(item.unit_price) }}</span>
              </template>

              <!-- Custom cell: Discount -->
              <template #cell-discount_percent="{ item }">
                <span class="text-slate-500 dark:text-slate-400">{{ item.discount_percent }}%</span>
              </template>

              <!-- Custom cell: Tax -->
              <template #cell-tax_rate="{ item }">
                <span class="text-slate-500 dark:text-slate-400">{{ item.tax_rate }}%</span>
              </template>

              <!-- Custom cell: Line Total -->
              <template #cell-line_total="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(item.line_total) }}</span>
              </template>

              <!-- Mobile title slot -->
              <template #mobile-title="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.product?.name || item.description }}</span>
              </template>
            </ResponsiveTable>
          </div>

          <!-- Notes & Terms -->
          <div v-if="quotation.notes || quotation.terms_conditions" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">Notes & Terms</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-if="quotation.notes">
                <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Notes</h3>
                <p class="text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ quotation.notes }}</p>
              </div>
              <div v-if="quotation.terms_conditions">
                <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Terms & Conditions</h3>
                <p class="text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ quotation.terms_conditions }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary Card -->
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">Summary</h2>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Subtotal</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(quotation.subtotal) }}</dd>
              </div>
              <div v-if="quotation.discount_amount" class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Discount</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">-{{ formatCurrency(quotation.discount_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Tax</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(quotation.tax_amount) }}</dd>
              </div>
              <hr class="border-slate-200 dark:border-slate-700" />
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900 dark:text-slate-100">Total</dt>
                <dd class="font-bold text-lg text-orange-600 dark:text-orange-400">{{ formatCurrency(quotation.total_amount) }}</dd>
              </div>
              <div v-if="quotation.currency && quotation.currency !== 'IDR'" class="flex justify-between text-sm" data-testid="quotation-base-currency-total">
                <dt class="text-slate-500 dark:text-slate-400">Base Currency (IDR)</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(quotation.base_currency_total) }}</dd>
              </div>
            </dl>
          </div>

          <!-- Activity Card -->
          <div v-if="quotation.submitted_at || quotation.approved_at || quotation.outcome_at" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">Activity</h2>
            <ul class="space-y-3 text-sm">
              <li v-if="quotation.outcome?.value === 'won'" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-emerald-500"></div>
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Won</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(quotation.outcome_at) }}</p>
                </div>
              </li>
              <li v-if="quotation.outcome?.value === 'lost'" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-red-500"></div>
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Lost</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(quotation.outcome_at) }}</p>
                </div>
              </li>
              <li v-if="quotation.last_contacted_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Last Contact</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(quotation.last_contacted_at) }}</p>
                </div>
              </li>
              <li v-if="quotation.approved_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Approved</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(quotation.approved_at) }}</p>
                </div>
              </li>
              <li v-if="quotation.submitted_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-amber-500"></div>
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Submitted</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(quotation.submitted_at) }}</p>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Created</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(quotation.created_at) }}</p>
                </div>
              </li>
            </ul>
          </div>

          <!-- Follow-Up Info Card -->
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 class="font-semibold text-slate-900 dark:text-slate-100 mb-4">Follow-Up</h2>
            <dl class="space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Priority</dt>
                <dd>
                  <Select
                    :model-value="quotation.priority?.value ?? 'normal'"
                    :options="priorityOptions"
                    class="w-28"
                    @update:model-value="(v) => handlePriority(String(v))"
                  />
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Assigned To</dt>
                <dd>
                  <Select
                    :model-value="quotation.assigned_to ? String(quotation.assigned_to) : ''"
                    :options="userOptions"
                    class="w-36"
                    @update:model-value="(v) => handleAssign(String(v))"
                  />
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Next Follow-Up</dt>
                <dd>
                  <span v-if="quotation.next_follow_up_at" class="font-medium">
                    {{ formatDate(quotation.next_follow_up_at) }}
                  </span>
                  <Button v-else variant="link" size="xs" @click="showScheduleFollowUp = true">
                    Schedule
                  </Button>
                </dd>
              </div>
              <div v-if="quotation.days_since_last_contact !== null" class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Days Since Contact</dt>
                <dd class="font-medium" :class="(quotation.days_since_last_contact ?? 0) > 7 ? 'text-red-600 dark:text-red-400' : ''">
                  {{ quotation.days_since_last_contact }}
                </dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Follow-Up Count</dt>
                <dd class="font-medium">{{ quotation.follow_up_count ?? 0 }}</dd>
              </div>
            </dl>
          </div>

          <!-- Activity Timeline Card -->
          <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Activity Log</h2>
              <Button variant="ghost" size="xs" @click="showLogActivity = true">
                + Log
              </Button>
            </div>

            <div v-if="activitiesLoading" class="text-sm text-muted-foreground">Loading...</div>
            <div v-else-if="activities.length === 0" class="text-sm text-muted-foreground text-center py-4">
              No activities yet
            </div>
            <ul v-else class="space-y-4">
              <li v-for="activity in activities" :key="activity.id" class="flex gap-3">
                <div class="text-lg leading-none mt-0.5">{{ getActivityIcon(activity.activity_type) }}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
                    {{ activity.activity_type }}
                  </p>
                  <p v-if="activity.description" class="text-sm text-muted-foreground line-clamp-2">
                    {{ activity.description }}
                  </p>
                  <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{{ formatDate(activity.created_at) }}</span>
                    <span v-if="activity.user">by {{ activity.user.name }}</span>
                    <span
                      v-if="activity.outcome"
                      :class="getOutcomeClass(activity.outcome)"
                      class="capitalize font-medium"
                    >
                      {{ activity.outcome }}
                    </span>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Attachments -->
          <AttachmentCard attachable-type="Quotation" :attachable-id="quotation.id" />
        </div>
      </div>
    </template>

    <!-- Reject Modal -->
    <Modal :open="showRejectModal" title="Reject Quotation" @update:open="showRejectModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Are you sure you want to reject this quotation? This action cannot be undone.
      </p>
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason (optional)</label>
        <textarea
          v-model="rejectReason"
          rows="3"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Enter rejection reason..."
        />
      </div>
      <template #footer>
        <Button variant="ghost" @click="showRejectModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="rejectMutation.isPending.value"
          @click="handleReject"
        >
          Reject Quotation
        </Button>
      </template>
    </Modal>

    <!-- Delete Confirmation -->
    <ConfirmDialog
      ref="deleteConfirmRef"
      title="Delete Quotation"
      message="Are you sure you want to delete this quotation? This action cannot be undone."
      confirm-text="Delete"
      variant="destructive"
    />

    <!-- Mark Won Modal -->
    <Modal :open="showWonModal" title="Mark as Won" @update:open="showWonModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Great news! Mark this quotation as won to track the successful conversion.
      </p>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Won Reason</label>
          <Select v-model="wonReason" :options="wonReasonOptions" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (optional)</label>
          <textarea
            v-model="wonNotes"
            rows="3"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Add any notes about the win..."
          />
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showWonModal = false">Cancel</Button>
        <Button
          variant="success"
          :loading="markWonMutation.isPending.value"
          @click="handleMarkWon"
        >
          Mark as Won
        </Button>
      </template>
    </Modal>

    <!-- Mark Lost Modal -->
    <Modal :open="showLostModal" title="Mark as Lost" @update:open="showLostModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Mark this quotation as lost. Recording the reason helps improve future sales.
      </p>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lost Reason</label>
          <Select v-model="lostReason" :options="lostReasonOptions" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lost To Competitor (optional)</label>
          <Input v-model="lostToCompetitor" placeholder="Competitor name..." />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (optional)</label>
          <textarea
            v-model="lostNotes"
            rows="3"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Additional details..."
          />
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showLostModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="markLostMutation.isPending.value"
          @click="handleMarkLost"
        >
          Mark as Lost
        </Button>
      </template>
    </Modal>

    <!-- Log Activity Modal -->
    <LogActivityModal
      :open="showLogActivity"
      :quotation-id="quotationId"
      @update:open="showLogActivity = $event"
    />

    <!-- Schedule Follow-Up Modal -->
    <ScheduleFollowUpModal
      :open="showScheduleFollowUp"
      :quotation-id="quotationId"
      :current-follow-up="quotation?.next_follow_up_at"
      @update:open="showScheduleFollowUp = $event"
    />

    <!-- Print Preview Modal -->
    <Modal
      :open="showPrintPreview"
      title="Print Quotation"
      size="2xl"
      @update:open="showPrintPreview = $event"
    >
      <div class="no-print mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400">
        Click "Print" to open the print dialog. You can print directly or save as PDF.
      </div>

      <div v-if="quotation" class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <PrintableDocument
          type="quotation"
          :number="quotation.full_number"
          :status="quotation.status.value"
          :date="quotation.quotation_date"
          :valid-until="quotation.valid_until"
          :reference="quotation.reference"
          :subject="quotation.subject"
          :contact-name="quotation.contact?.name || ''"
          :contact-address="quotation.contact?.address"
          :contact-email="quotation.contact?.email"
          :items="printableItems"
          :subtotal="quotation.subtotal"
          :discount-amount="quotation.discount_amount"
          :tax-amount="quotation.tax_amount"
          :total="quotation.total_amount"
          :notes="quotation.notes"
          :terms-conditions="quotation.terms_conditions"
        />
      </div>

      <template #footer>
        <Button variant="ghost" @click="showPrintPreview = false">Cancel</Button>
        <Button :loading="isPrinting" @click="handlePrint">
          Print
        </Button>
      </template>
    </Modal>
  </div>
</template>
