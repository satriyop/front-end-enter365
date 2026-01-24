<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  useSubcontractorInvoice,
  useApproveSubcontractorInvoice,
  useRejectSubcontractorInvoice,
  useConvertSubcontractorInvoiceToBill,
  getSubcontractorInvoiceStatus,
  formatSCInvoiceNumber,
} from '@/api/useSubcontractorInvoices'
import { getErrorMessage } from '@/api/client'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Receipt,
} from 'lucide-vue-next'

// UI Components
import { Button, Badge, Card, Modal, PageSkeleton, useToast } from '@/components/ui'

const route = useRoute()
const toast = useToast()

const invoiceId = computed(() => Number(route.params.id))

// Data fetching
const { data: invoice, isLoading, error } = useSubcontractorInvoice(invoiceId)

// Mutations
const approveMutation = useApproveSubcontractorInvoice()
const rejectMutation = useRejectSubcontractorInvoice()
const convertMutation = useConvertSubcontractorInvoiceToBill()

// Modal states
const showApproveModal = ref(false)
const showRejectModal = ref(false)
const showConvertModal = ref(false)

// Form data
const approvalNotes = ref('')
const rejectReason = ref('')
const convertData = ref({
  bill_date: new Date().toISOString().split('T')[0],
  due_date: '',
})

// Action handlers
async function handleApprove() {
  try {
    await approveMutation.mutateAsync({
      id: invoiceId.value,
      notes: approvalNotes.value || undefined,
    })
    showApproveModal.value = false
    approvalNotes.value = ''
    toast.success('Invoice approved')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to approve invoice'))
  }
}

async function handleReject() {
  if (!rejectReason.value.trim()) {
    toast.error('Rejection reason is required')
    return
  }
  try {
    await rejectMutation.mutateAsync({
      id: invoiceId.value,
      reason: rejectReason.value,
    })
    showRejectModal.value = false
    rejectReason.value = ''
    toast.success('Invoice rejected')
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to reject invoice'))
  }
}

async function handleConvertToBill() {
  try {
    await convertMutation.mutateAsync({
      id: invoiceId.value,
      data: {
        bill_date: convertData.value.bill_date || undefined,
        due_date: convertData.value.due_date || undefined,
      },
    })
    showConvertModal.value = false
    toast.success('Bill created successfully')
    // The invoice is now converted, the detail page will refresh
  } catch (err) {
    toast.error(getErrorMessage(err, 'Failed to convert to bill'))
  }
}

// Permission checks based on status
const canApprove = computed(() => invoice.value?.status.value === 'pending')
const canReject = computed(() => invoice.value?.status.value === 'pending')
const canConvert = computed(() => invoice.value?.status.value === 'approved')

// Calculate net amount
const netAmount = computed(() => {
  if (!invoice.value) return 0
  return Number(invoice.value.gross_amount || 0) -
    Number(invoice.value.retention_held || 0) -
    Number(invoice.value.other_deductions || 0)
})
</script>

<template>
  <div>
    <!-- Loading -->
    <PageSkeleton v-if="isLoading" type="detail" />

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500 dark:text-red-400">
      {{ getErrorMessage(error, 'Failed to load invoice') }}
    </div>

    <!-- Content -->
    <template v-else-if="invoice">
      <!-- Breadcrumb -->
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/manufacturing/subcontractor-invoices" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft class="w-4 h-4" />
          Subcontractor Invoices
        </RouterLink>
        <span>/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ formatSCInvoiceNumber(invoice) }}</span>
      </div>

      <!-- Header Card -->
      <Card class="mb-6">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ formatSCInvoiceNumber(invoice) }}
              </h1>
              <Badge :class="getSubcontractorInvoiceStatus(invoice).color">
                {{ getSubcontractorInvoiceStatus(invoice).label }}
              </Badge>
            </div>
            <p v-if="invoice.subcontractor" class="text-slate-500 dark:text-slate-400">
              From: {{ invoice.subcontractor.name }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <!-- Approve (pending) -->
            <Button
              v-if="canApprove"
              variant="success"
              size="sm"
              @click="showApproveModal = true"
            >
              <CheckCircle class="w-4 h-4 mr-1" />
              Approve
            </Button>

            <!-- Reject (pending) -->
            <Button
              v-if="canReject"
              variant="destructive"
              size="sm"
              @click="showRejectModal = true"
            >
              <XCircle class="w-4 h-4 mr-1" />
              Reject
            </Button>

            <!-- Convert to Bill (approved) -->
            <Button
              v-if="canConvert"
              size="sm"
              @click="showConvertModal = true"
            >
              <FileText class="w-4 h-4 mr-1" />
              Convert to Bill
            </Button>
          </div>
        </div>
      </Card>

      <!-- Details Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Details Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Invoice Details</h2>
            </template>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Invoice Number</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ invoice.invoice_number || '-' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Invoice Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(invoice.invoice_date) }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Due Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(invoice.due_date) }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Subcontractor</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ invoice.subcontractor?.name || '-' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Work Order</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  <RouterLink
                    v-if="invoice.subcontractor_work_order"
                    :to="`/manufacturing/subcontractor-work-orders/${invoice.subcontractor_work_order.id}`"
                    class="text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {{ invoice.subcontractor_work_order.sc_wo_number }}
                  </RouterLink>
                  <span v-else>-</span>
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Created At</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">
                  {{ formatDate(invoice.created_at) }}
                </dd>
              </div>
            </dl>
          </Card>

          <!-- Description -->
          <Card v-if="invoice.description">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Description</h2>
            </template>
            <p class="text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ invoice.description }}</p>
          </Card>

          <!-- Notes -->
          <Card v-if="invoice.notes">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Notes</h2>
            </template>
            <p class="text-slate-900 dark:text-slate-100 whitespace-pre-line">{{ invoice.notes }}</p>
          </Card>

          <!-- Rejection Reason -->
          <Card v-if="invoice.rejection_reason" class="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <template #header>
              <h2 class="font-semibold text-red-700 dark:text-red-400">Rejection Reason</h2>
            </template>
            <p class="text-red-700 dark:text-red-400">{{ invoice.rejection_reason }}</p>
          </Card>

          <!-- Linked Bill -->
          <Card v-if="invoice.bill_id" class="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
            <template #header>
              <h2 class="font-semibold text-blue-700 dark:text-blue-400">Converted to Bill</h2>
            </template>
            <div class="flex items-center gap-3">
              <div class="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                <FileText class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p class="text-blue-700 dark:text-blue-400">
                  This invoice has been converted to a bill.
                </p>
                <RouterLink
                  :to="`/bills/${invoice.bill_id}`"
                  class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  View Bill #{{ invoice.bill_id }}
                </RouterLink>
              </div>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Amount Summary Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Amount Summary</h2>
            </template>

            <div class="space-y-4">
              <div class="flex items-center justify-center">
                <div class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Receipt class="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
              </div>

              <dl class="space-y-3">
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Gross Amount</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">
                    {{ formatCurrency(invoice.gross_amount) }}
                  </dd>
                </div>
                <div v-if="Number(invoice.retention_held || 0) > 0" class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Retention Held</dt>
                  <dd class="font-medium text-red-600 dark:text-red-400">
                    -{{ formatCurrency(invoice.retention_held) }}
                  </dd>
                </div>
                <div v-if="Number(invoice.other_deductions || 0) > 0" class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Other Deductions</dt>
                  <dd class="font-medium text-red-600 dark:text-red-400">
                    -{{ formatCurrency(invoice.other_deductions) }}
                  </dd>
                </div>
                <hr class="border-slate-200 dark:border-slate-700" />
                <div class="flex justify-between">
                  <dt class="font-semibold text-slate-900 dark:text-slate-100">Net Amount</dt>
                  <dd class="font-bold text-lg text-primary-600 dark:text-primary-400">
                    {{ formatCurrency(invoice.net_amount || netAmount) }}
                  </dd>
                </div>
              </dl>
            </div>
          </Card>

          <!-- Activity Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Activity</h2>
            </template>

            <ul class="space-y-3 text-sm">
              <li v-if="(invoice as Record<string, unknown>).converted_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-blue-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Converted to Bill</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate((invoice as Record<string, unknown>).converted_at as string) }}</p>
                </div>
              </li>
              <li v-if="invoice.rejected_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-red-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Rejected</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(invoice.rejected_at) }}</p>
                </div>
              </li>
              <li v-if="invoice.approved_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Approved</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(invoice.approved_at) }}</p>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                <div>
                  <p class="text-slate-900 dark:text-slate-100">Created</p>
                  <p class="text-slate-500 dark:text-slate-400">{{ formatDate(invoice.created_at) }}</p>
                </div>
              </li>
            </ul>
          </Card>

          <!-- Related Work Order -->
          <Card v-if="invoice.subcontractor_work_order">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Related Work Order</h2>
            </template>
            <div class="space-y-2">
              <RouterLink
                :to="`/manufacturing/subcontractor-work-orders/${invoice.subcontractor_work_order.id}`"
                class="text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                {{ invoice.subcontractor_work_order.sc_wo_number }}
              </RouterLink>
              <p v-if="invoice.subcontractor_work_order.name" class="text-sm text-slate-500 dark:text-slate-400">
                {{ invoice.subcontractor_work_order.name }}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </template>

    <!-- Approve Modal -->
    <Modal :open="showApproveModal" title="Approve Invoice" size="sm" @update:open="showApproveModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Are you sure you want to approve this invoice?
      </p>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Notes (optional)
        </label>
        <textarea
          v-model="approvalNotes"
          rows="2"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Enter approval notes..."
        />
      </div>
      <template #footer>
        <Button variant="ghost" @click="showApproveModal = false">Cancel</Button>
        <Button
          variant="success"
          :loading="approveMutation.isPending.value"
          @click="handleApprove"
        >
          Approve
        </Button>
      </template>
    </Modal>

    <!-- Reject Modal -->
    <Modal :open="showRejectModal" title="Reject Invoice" size="sm" @update:open="showRejectModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Please provide a reason for rejecting this invoice.
      </p>
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Reason <span class="text-red-500">*</span>
        </label>
        <textarea
          v-model="rejectReason"
          rows="3"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          Reject
        </Button>
      </template>
    </Modal>

    <!-- Convert to Bill Modal -->
    <Modal :open="showConvertModal" title="Convert to Bill" size="sm" @update:open="showConvertModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Create a bill from this approved invoice. You can optionally set different dates.
      </p>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Bill Date
          </label>
          <input
            v-model="convertData.bill_date"
            type="date"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Due Date
          </label>
          <input
            v-model="convertData.due_date"
            type="date"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showConvertModal = false">Cancel</Button>
        <Button
          :loading="convertMutation.isPending.value"
          @click="handleConvertToBill"
        >
          <FileText class="w-4 h-4 mr-1" />
          Create Bill
        </Button>
      </template>
    </Modal>
  </div>
</template>
