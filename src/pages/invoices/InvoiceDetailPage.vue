<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useInvoice,
  usePostInvoice,
  useVoidInvoice,
  useDuplicateInvoice,
  useDeleteInvoice,
} from '@/api/useInvoices'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Badge, Modal, Card, useToast } from '@/components/ui'
import { usePrint } from '@/composables/usePrint'
import PrintableDocument from '@/components/PrintableDocument.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { print, isPrinting } = usePrint()

const invoiceId = computed(() => Number(route.params.id))

const { data: invoice, isLoading, error } = useInvoice(invoiceId)

// Mutations
const postMutation = usePostInvoice()
const voidMutation = useVoidInvoice()
const duplicateMutation = useDuplicateInvoice()
const deleteMutation = useDeleteInvoice()

// Modal states
const showVoidModal = ref(false)
const showDeleteModal = ref(false)
const showPrintPreview = ref(false)
const voidReason = ref('')

// Action handlers
async function handlePost() {
  try {
    await postMutation.mutateAsync(invoiceId.value)
    toast.success('Invoice posted successfully')
  } catch {
    toast.error('Failed to post invoice')
  }
}

async function handleVoid() {
  try {
    await voidMutation.mutateAsync({ id: invoiceId.value, reason: voidReason.value })
    showVoidModal.value = false
    voidReason.value = ''
    toast.success('Invoice voided')
  } catch {
    toast.error('Failed to void invoice')
  }
}

async function handleDuplicate() {
  try {
    const duplicate = await duplicateMutation.mutateAsync(invoiceId.value)
    toast.success('Invoice duplicated')
    router.push(`/invoices/${duplicate.id}/edit`)
  } catch {
    toast.error('Failed to duplicate invoice')
  }
}

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(invoiceId.value)
    showDeleteModal.value = false
    toast.success('Invoice deleted')
    router.push('/invoices')
  } catch {
    toast.error('Failed to delete invoice')
  }
}

// Status-based action availability
const canEdit = computed(() => invoice.value?.status === 'draft')
const canPost = computed(() => invoice.value?.status === 'draft')
const canVoid = computed(() => ['posted', 'partial'].includes(invoice.value?.status ?? ''))
const canDelete = computed(() => invoice.value?.status === 'draft')

// Print functionality
function handlePrint() {
  print({
    title: `Invoice ${invoice.value?.invoice_number}`,
    onAfterPrint: () => {
      showPrintPreview.value = false
    },
  })
}

// Transform invoice items for PrintableDocument
const printableItems = computed(() => {
  if (!invoice.value?.items) return []
  return invoice.value.items.map((item) => ({
    id: item.id,
    description: item.description,
    notes: item.notes,
    quantity: item.quantity,
    unit: item.unit,
    unit_price: item.unit_price,
    line_total: item.line_total,
  }))
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-slate-500">
      Loading...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500">
      Failed to load invoice
    </div>

    <!-- Content -->
    <template v-else-if="invoice">
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 mb-4">
        <RouterLink to="/invoices" class="hover:text-slate-700">Invoices</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-slate-900">{{ invoice.invoice_number }}</span>
      </div>

      <!-- Header -->
      <Card class="mb-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900">
                {{ invoice.invoice_number }}
              </h1>
              <Badge :status="invoice.status as any" />
            </div>
            <p class="text-slate-500">{{ invoice.contact?.name }}</p>
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
            <RouterLink v-if="canEdit" :to="`/invoices/${invoiceId}/edit`">
              <Button variant="secondary" size="sm">Edit</Button>
            </RouterLink>

            <!-- Post (draft only) -->
            <Button
              v-if="canPost"
             
              size="sm"
              :loading="postMutation.isPending.value"
              @click="handlePost"
            >
              Post Invoice
            </Button>

            <!-- Void (posted/partial) -->
            <Button
              v-if="canVoid"
              variant="destructive"
              size="sm"
              @click="showVoidModal = true"
            >
              Void
            </Button>

            <!-- Delete (draft only) -->
            <Button
              v-if="canDelete"
              variant="ghost"
              size="sm"
              class="text-red-500 hover:text-red-600"
              @click="showDeleteModal = true"
            >
              Delete
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
              <h2 class="font-semibold text-slate-900">Details</h2>
            </template>

            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500">Customer</dt>
                <dd class="font-medium text-slate-900">{{ invoice.contact?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Reference</dt>
                <dd class="font-medium text-slate-900">{{ invoice.reference || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Invoice Date</dt>
                <dd class="font-medium text-slate-900">{{ formatDate(invoice.invoice_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Due Date</dt>
                <dd class="font-medium text-slate-900">{{ formatDate(invoice.due_date) }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-slate-500">Description</dt>
                <dd class="font-medium text-slate-900">{{ invoice.description || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Items Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Line Items</h2>
            </template>

            <div class="overflow-x-auto -mx-6">
              <table class="w-full">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Price</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr v-for="item in invoice.items" :key="item.id">
                    <td class="px-6 py-4">
                      <div class="font-medium text-slate-900">{{ item.description }}</div>
                      <div v-if="item.notes" class="text-sm text-slate-500">{{ item.notes }}</div>
                    </td>
                    <td class="px-6 py-4 text-right text-slate-900">
                      {{ item.quantity }} {{ item.unit }}
                    </td>
                    <td class="px-6 py-4 text-right text-slate-900">
                      {{ formatCurrency(item.unit_price) }}
                    </td>
                    <td class="px-6 py-4 text-right font-medium text-slate-900">
                      {{ formatCurrency(item.line_total) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <!-- Payments Card -->
          <Card v-if="invoice.payments && invoice.payments.length > 0">
            <template #header>
              <h2 class="font-semibold text-slate-900">Payments</h2>
            </template>

            <div class="space-y-3">
              <div
                v-for="payment in invoice.payments"
                :key="payment.id"
                class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
              >
                <div>
                  <p class="font-medium text-slate-900">{{ payment.payment_number }}</p>
                  <p class="text-sm text-slate-500">{{ formatDate(payment.payment_date) }}</p>
                </div>
                <span class="font-medium text-green-600">{{ formatCurrency(payment.amount) }}</span>
              </div>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Summary</h2>
            </template>

            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500">Subtotal</dt>
                <dd class="font-medium text-slate-900">{{ formatCurrency(invoice.subtotal) }}</dd>
              </div>
              <div v-if="invoice.discount_amount" class="flex justify-between">
                <dt class="text-slate-500">Discount</dt>
                <dd class="font-medium text-slate-900">-{{ formatCurrency(invoice.discount_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Tax ({{ invoice.tax_rate }}%)</dt>
                <dd class="font-medium text-slate-900">{{ formatCurrency(invoice.tax_amount) }}</dd>
              </div>
              <hr class="border-slate-200" />
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900">Total</dt>
                <dd class="font-bold text-lg text-slate-900">{{ formatCurrency(invoice.total_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Paid</dt>
                <dd class="font-medium text-green-600">{{ formatCurrency(invoice.paid_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900">Outstanding</dt>
                <dd class="font-bold text-lg text-orange-600">{{ formatCurrency(invoice.outstanding_amount) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Quick Actions -->
          <Card v-if="invoice.status === 'posted' || invoice.status === 'partial'">
            <template #header>
              <h2 class="font-semibold text-slate-900">Quick Actions</h2>
            </template>

            <div class="space-y-2">
              <RouterLink :to="`/payments/new?invoice_id=${invoice.id}`" class="block">
                <Button class="w-full">
                  Record Payment
                </Button>
              </RouterLink>
              <Button variant="secondary" class="w-full">
                Send Invoice
              </Button>
              <Button
                variant="ghost"
                class="w-full"
                :loading="isPrinting"
                @click="showPrintPreview = true"
              >
                Print / Download PDF
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </template>

    <!-- Void Modal -->
    <Modal :open="showVoidModal" title="Void Invoice" @update:open="showVoidModal = $event">
      <p class="text-slate-600 mb-4">
        Are you sure you want to void this invoice? This will reverse the journal entry.
      </p>
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 mb-1">Reason (optional)</label>
        <textarea
          v-model="voidReason"
          rows="3"
          class="w-full px-3 py-2 border border-slate-300 rounded-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Enter reason for voiding..."
        />
      </div>
      <template #footer>
        <Button variant="ghost" @click="showVoidModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="voidMutation.isPending.value"
          @click="handleVoid"
        >
          Void Invoice
        </Button>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Invoice" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600">
        Are you sure you want to delete this invoice? This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="deleteMutation.isPending.value"
          @click="handleDelete"
        >
          Delete
        </Button>
      </template>
    </Modal>

    <!-- Print Preview Modal -->
    <Modal
      :open="showPrintPreview"
      title="Print Invoice"
      size="2xl"
      @update:open="showPrintPreview = $event"
    >
      <div class="no-print mb-4 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
        Click "Print" to open the print dialog. You can print directly or save as PDF.
      </div>

      <div v-if="invoice" class="border border-slate-200 rounded-lg overflow-hidden">
        <PrintableDocument
          type="invoice"
          :number="invoice.invoice_number"
          :status="invoice.status"
          :date="invoice.invoice_date"
          :due-date="invoice.due_date"
          :reference="invoice.reference"
          :contact-name="invoice.contact?.name || ''"
          :contact-address="invoice.contact?.address"
          :contact-email="invoice.contact?.email"
          :items="printableItems"
          :subtotal="invoice.subtotal"
          :discount-amount="invoice.discount_amount"
          :tax-rate="invoice.tax_rate"
          :tax-amount="invoice.tax_amount"
          :total="invoice.total_amount"
          :paid-amount="invoice.paid_amount"
          :outstanding-amount="invoice.outstanding_amount"
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
