<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useQuotation,
  useSubmitQuotation,
  useApproveQuotation,
  useRejectQuotation,
  useConvertToInvoice,
  useDuplicateQuotation,
  useDeleteQuotation,
} from '@/api/useQuotations'
import { getErrorMessage } from '@/api/client'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Badge, Modal, ConfirmDialog, PageSkeleton, useToast } from '@/components/ui'
import { usePrint } from '@/composables/usePrint'
import PrintableDocument from '@/components/PrintableDocument.vue'

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
const convertMutation = useConvertToInvoice()
const duplicateMutation = useDuplicateQuotation()
const deleteMutation = useDeleteQuotation()

// Modal states
const showRejectModal = ref(false)
const showPrintPreview = ref(false)
const rejectReason = ref('')
const deleteConfirmRef = ref<InstanceType<typeof ConfirmDialog>>()

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
    router.push(`/invoices/${result.invoice_id}`)
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

// Status-based action availability
const canEdit = computed(() => quotation.value?.status === 'draft')
const canSubmit = computed(() => quotation.value?.status === 'draft')
const canApprove = computed(() => quotation.value?.status === 'submitted')
const canReject = computed(() => quotation.value?.status === 'submitted')
const canConvert = computed(() => quotation.value?.status === 'approved')
const canDelete = computed(() => quotation.value?.status === 'draft')

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
</script>

<template>
  <div>
    <!-- Loading -->
    <PageSkeleton v-if="isLoading" type="detail" />

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500">
      {{ getErrorMessage(error, 'Failed to load quotation') }}
    </div>

    <!-- Content -->
    <template v-else-if="quotation">
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 mb-4">
        <RouterLink to="/quotations" class="hover:text-slate-700">Quotations</RouterLink>
        <span class="mx-2">›</span>
        <span class="text-slate-900">{{ quotation.full_number }}</span>
      </div>

      <!-- Header -->
      <div class="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900">
                {{ quotation.full_number }}
              </h1>
              <Badge :status="quotation.status as any" />
            </div>
            <p class="text-slate-500">{{ quotation.contact?.name }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
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
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="font-semibold text-slate-900 mb-4">Details</h2>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500">Subject</dt>
                <dd class="font-medium text-slate-900">{{ quotation.subject || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Reference</dt>
                <dd class="font-medium text-slate-900">{{ quotation.reference || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Quotation Date</dt>
                <dd class="font-medium text-slate-900">{{ formatDate(quotation.quotation_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Valid Until</dt>
                <dd class="font-medium text-slate-900">
                  {{ formatDate(quotation.valid_until) }}
                  <span v-if="quotation.is_expired" class="text-red-500 text-sm">(Expired)</span>
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Customer</dt>
                <dd class="font-medium text-slate-900">{{ quotation.contact?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Email</dt>
                <dd class="font-medium text-slate-900">{{ quotation.contact?.email || '-' }}</dd>
              </div>
            </dl>
          </div>

          <!-- Items Card -->
          <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-200">
              <h2 class="font-semibold text-slate-900">Line Items</h2>
            </div>
            <table class="w-full">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Price</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Disc</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tax</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr v-for="item in quotation.items" :key="item.id">
                  <td class="px-6 py-4">
                    <div class="font-medium text-slate-900">{{ item.product?.name || item.description }}</div>
                    <div v-if="item.product?.name" class="text-sm text-slate-500">{{ item.description }}</div>
                  </td>
                  <td class="px-6 py-4 text-right text-slate-900">
                    {{ item.quantity }} {{ item.unit }}
                  </td>
                  <td class="px-6 py-4 text-right text-slate-900">
                    {{ formatCurrency(item.unit_price) }}
                  </td>
                  <td class="px-6 py-4 text-right text-slate-500">
                    {{ item.discount_percent }}%
                  </td>
                  <td class="px-6 py-4 text-right text-slate-500">
                    {{ item.tax_rate }}%
                  </td>
                  <td class="px-6 py-4 text-right font-medium text-slate-900">
                    {{ formatCurrency(item.line_total) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Notes & Terms -->
          <div v-if="quotation.notes || quotation.terms_conditions" class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="font-semibold text-slate-900 mb-4">Notes & Terms</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div v-if="quotation.notes">
                <h3 class="text-sm font-medium text-slate-500 mb-2">Notes</h3>
                <p class="text-slate-900 whitespace-pre-line">{{ quotation.notes }}</p>
              </div>
              <div v-if="quotation.terms_conditions">
                <h3 class="text-sm font-medium text-slate-500 mb-2">Terms & Conditions</h3>
                <p class="text-slate-900 whitespace-pre-line">{{ quotation.terms_conditions }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary Card -->
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="font-semibold text-slate-900 mb-4">Summary</h2>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500">Subtotal</dt>
                <dd class="font-medium text-slate-900">{{ formatCurrency(quotation.subtotal) }}</dd>
              </div>
              <div v-if="quotation.discount_amount" class="flex justify-between">
                <dt class="text-slate-500">Discount</dt>
                <dd class="font-medium text-slate-900">-{{ formatCurrency(quotation.discount_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Tax</dt>
                <dd class="font-medium text-slate-900">{{ formatCurrency(quotation.tax_amount) }}</dd>
              </div>
              <hr class="border-slate-200" />
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900">Total</dt>
                <dd class="font-bold text-lg text-orange-600">{{ formatCurrency(quotation.total) }}</dd>
              </div>
            </dl>
          </div>

          <!-- Activity Card -->
          <div v-if="quotation.submitted_at || quotation.approved_at" class="bg-white rounded-xl border border-slate-200 p-6">
            <h2 class="font-semibold text-slate-900 mb-4">Activity</h2>
            <ul class="space-y-3 text-sm">
              <li v-if="quotation.approved_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                <div>
                  <p class="text-slate-900">Approved</p>
                  <p class="text-slate-500">{{ formatDate(quotation.approved_at) }}</p>
                </div>
              </li>
              <li v-if="quotation.submitted_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-amber-500"></div>
                <div>
                  <p class="text-slate-900">Submitted</p>
                  <p class="text-slate-500">{{ formatDate(quotation.submitted_at) }}</p>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-slate-300"></div>
                <div>
                  <p class="text-slate-900">Created</p>
                  <p class="text-slate-500">{{ formatDate(quotation.created_at) }}</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>

    <!-- Reject Modal -->
    <Modal :open="showRejectModal" title="Reject Quotation" @update:open="showRejectModal = $event">
      <p class="text-slate-600 mb-4">
        Are you sure you want to reject this quotation? This action cannot be undone.
      </p>
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
        <textarea
          v-model="rejectReason"
          rows="3"
          class="w-full px-3 py-2 border border-slate-300 rounded-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

    <!-- Print Preview Modal -->
    <Modal
      :open="showPrintPreview"
      title="Print Quotation"
      size="2xl"
      @update:open="showPrintPreview = $event"
    >
      <div class="no-print mb-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
        Click "Print" to open the print dialog. You can print directly or save as PDF.
      </div>

      <div v-if="quotation" class="border border-slate-200 rounded-lg overflow-hidden">
        <PrintableDocument
          type="quotation"
          :number="quotation.full_number"
          :status="quotation.status"
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
          :total="quotation.total"
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
