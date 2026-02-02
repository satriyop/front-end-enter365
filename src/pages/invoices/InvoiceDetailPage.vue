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
import { useCreateDeliveryOrderFromInvoice, type CreateFromInvoiceData } from '@/api/useDeliveryOrders'
import { useWarehousesLookup } from '@/api/useInventory'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Badge, Modal, Card, Input, Textarea, Select, FormField, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { usePrint } from '@/composables/usePrint'
import PrintableDocument from '@/components/PrintableDocument.vue'
import { FileText, Truck } from 'lucide-vue-next'

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

// Create DO
const createDOMutation = useCreateDeliveryOrderFromInvoice()
const { data: warehouses, isLoading: loadingWarehouses } = useWarehousesLookup()

// Modal states
const showVoidModal = ref(false)
const showDeleteModal = ref(false)
const showPrintPreview = ref(false)
const showCreateDOModal = ref(false)
const voidReason = ref('')

// Create DO form
const doFormData = ref<CreateFromInvoiceData>({
  do_date: new Date().toISOString().split('T')[0],
  warehouse_id: undefined,
  shipping_address: '',
  shipping_method: '',
  notes: '',
})

const canCreateDeliveryOrder = computed(() => {
  const status = invoice.value?.status?.value
  return status === 'sent' || status === 'partial' || status === 'paid'
})

const warehouseOptions = computed(() => {
  if (!warehouses.value) return []
  return [
    { value: '', label: 'No warehouse' },
    ...warehouses.value.map(w => ({
      value: w.id,
      label: w.name || `Warehouse #${w.id}`,
    })),
  ]
})

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

async function handleCreateDO() {
  try {
    const payload: CreateFromInvoiceData = {
      ...doFormData.value,
      warehouse_id: doFormData.value.warehouse_id || undefined,
      shipping_address: doFormData.value.shipping_address || undefined,
      shipping_method: doFormData.value.shipping_method || undefined,
      notes: doFormData.value.notes || undefined,
    }
    const newDO = await createDOMutation.mutateAsync({
      invoiceId: invoiceId.value,
      data: payload,
    })
    showCreateDOModal.value = false
    toast.success('Delivery order created')
    router.push(`/sales/delivery-orders/${newDO.id}`)
  } catch {
    toast.error('Failed to create delivery order')
  }
}

// Status-based action availability
const canEdit = computed(() => invoice.value?.actions?.can_edit)
const canPost = computed(() => invoice.value?.actions?.can_post)
const canVoid = computed(() => invoice.value?.actions?.can_cancel)
const canDelete = computed(() => invoice.value?.actions?.can_delete)

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

// Line items table columns with mobile priorities
const itemColumns: ResponsiveColumn[] = [
  { key: 'description', label: 'Description', mobilePriority: 1 },
  { key: 'quantity', label: 'Qty', align: 'right', mobilePriority: 3 },
  { key: 'unit_price', label: 'Price', align: 'right', showInMobile: false },
  { key: 'line_total', label: 'Total', align: 'right', mobilePriority: 2 },
]
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-slate-500 dark:text-slate-400">
      Loading...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500 dark:text-red-400">
      Failed to load invoice
    </div>

    <!-- Content -->
    <template v-else-if="invoice">
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 dark:text-slate-400 mb-4">
        <RouterLink to="/invoices" class="hover:text-slate-700 dark:hover:text-slate-300">Invoices</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ invoice.invoice_number }}</span>
      </div>

      <!-- Header -->
      <Card class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ invoice.invoice_number }}
              </h1>
              <Badge :status="invoice.status">
                {{ invoice.status_label }}
              </Badge>
            </div>
            <p class="text-slate-500 dark:text-slate-400">{{ invoice.contact?.name }}</p>
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
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Details</h2>
            </template>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Customer</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ invoice.contact?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Reference</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ invoice.reference || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Invoice Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(invoice.invoice_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500 dark:text-slate-400">Due Date</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatDate(invoice.due_date) }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-slate-500 dark:text-slate-400">Description</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ invoice.description || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Items Card -->
          <Card :padding="false">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100 px-6 pt-6">Line Items</h2>
            </template>

            <ResponsiveTable
              :items="invoice.items || []"
              :columns="itemColumns"
              title-field="description"
            >
              <!-- Custom cell: Description -->
              <template #cell-description="{ item }">
                <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.description }}</div>
                <div v-if="item.notes" class="text-sm text-slate-500 dark:text-slate-400">{{ item.notes }}</div>
              </template>

              <!-- Custom cell: Quantity -->
              <template #cell-quantity="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ item.quantity }} {{ item.unit }}</span>
              </template>

              <!-- Custom cell: Unit Price -->
              <template #cell-unit_price="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ formatCurrency(item.unit_price) }}</span>
              </template>

              <!-- Custom cell: Line Total -->
              <template #cell-line_total="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(item.line_total) }}</span>
              </template>

              <!-- Mobile title slot -->
              <template #mobile-title="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.description }}</span>
              </template>
            </ResponsiveTable>
          </Card>

          <!-- Payments Card -->
          <Card v-if="invoice.payments && invoice.payments.length > 0">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Payments</h2>
            </template>

            <div class="space-y-3">
              <div
                v-for="payment in invoice.payments"
                :key="payment.id"
                class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div>
                  <p class="font-medium text-slate-900 dark:text-slate-100">{{ payment.payment_number }}</p>
                  <p class="text-sm text-slate-500 dark:text-slate-400">{{ formatDate(payment.payment_date) }}</p>
                </div>
                <span class="font-medium text-green-600 dark:text-green-400">{{ formatCurrency(payment.amount) }}</span>
              </div>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Summary</h2>
            </template>

            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Subtotal</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(invoice.subtotal) }}</dd>
              </div>
              <div v-if="invoice.discount_amount" class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Discount</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">-{{ formatCurrency(invoice.discount_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Tax ({{ invoice.tax_rate }}%)</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(invoice.tax_amount) }}</dd>
              </div>
              <hr class="border-slate-200 dark:border-slate-700" />
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900 dark:text-slate-100">Total</dt>
                <dd class="font-bold text-lg text-slate-900 dark:text-slate-100">{{ formatCurrency(invoice.total_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 dark:text-slate-400">Paid</dt>
                <dd class="font-medium text-green-600 dark:text-green-400">{{ formatCurrency(invoice.paid_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900 dark:text-slate-100">Outstanding</dt>
                <dd class="font-bold text-lg text-orange-600 dark:text-orange-400">{{ formatCurrency(invoice.outstanding_amount) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Quick Actions -->
          <Card v-if="invoice.status.value === 'sent' || invoice.status.value === 'partial'">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h2>
            </template>

            <div class="space-y-2">
              <RouterLink :to="`/payments/new?invoice_id=${invoice.id}`" class="block">
                <Button class="w-full">
                  Record Payment
                </Button>
              </RouterLink>
              <Button
                v-if="canCreateDeliveryOrder"
                variant="secondary"
                class="w-full"
                @click="showCreateDOModal = true"
              >
                <Truck class="w-4 h-4 mr-2" />
                Create Delivery Order
              </Button>
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

          <!-- Related Documents -->
          <Card v-if="invoice.journal_entry_id">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Related Documents</h2>
            </template>

            <div class="space-y-2">
              <RouterLink :to="`/accounting/journal-entries/${invoice.journal_entry_id}`" class="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
                <FileText class="w-4 h-4" />
                Journal Entry #{{ invoice.journal_entry?.entry_number || invoice.journal_entry_id }}
              </RouterLink>
            </div>
          </Card>
        </div>
      </div>
    </template>

    <!-- Void Modal -->
    <Modal :open="showVoidModal" title="Void Invoice" @update:open="showVoidModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Are you sure you want to void this invoice? This will reverse the journal entry.
      </p>
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason (optional)</label>
        <textarea
          v-model="voidReason"
          rows="3"
          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
      <p class="text-slate-600 dark:text-slate-400">
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

    <!-- Create Delivery Order Modal -->
    <Modal :open="showCreateDOModal" title="Create Delivery Order" @update:open="showCreateDOModal = $event">
      <p class="text-slate-600 dark:text-slate-400 mb-4">
        Create a delivery order from this invoice. Items will be copied automatically.
      </p>
      <div class="space-y-4">
        <FormField label="DO Date">
          <Input v-model="doFormData.do_date" type="date" />
        </FormField>
        <FormField label="Warehouse">
          <Select
            :model-value="doFormData.warehouse_id"
            :options="warehouseOptions"
            placeholder="Select warehouse..."
            :loading="loadingWarehouses"
            @update:model-value="(v) => { doFormData.warehouse_id = v ? Number(v) : undefined }"
          />
        </FormField>
        <FormField label="Shipping Address">
          <Textarea
            v-model="doFormData.shipping_address"
            :rows="2"
            placeholder="Delivery address"
          />
        </FormField>
        <FormField label="Shipping Method">
          <Input v-model="doFormData.shipping_method" placeholder="e.g. Courier, Self-pickup" />
        </FormField>
        <FormField label="Notes">
          <Textarea
            v-model="doFormData.notes"
            :rows="2"
            placeholder="Additional notes"
          />
        </FormField>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showCreateDOModal = false">Cancel</Button>
        <Button
          :loading="createDOMutation.isPending.value"
          @click="handleCreateDO"
        >
          <Truck class="w-4 h-4 mr-2" />
          Create Delivery Order
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
      <div class="no-print mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400">
        Click "Print" to open the print dialog. You can print directly or save as PDF.
      </div>

      <div v-if="invoice" class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <PrintableDocument
          type="invoice"
          :number="invoice.invoice_number"
          :status="invoice.status.value"
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
