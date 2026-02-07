<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBill, usePostBill, useVoidBill, useDeleteBill } from '@/api/useBills'
import { useMakeBillRecurring, frequencyOptions, type MakeRecurringData } from '@/api/useRecurringTemplates'
import { useCreatePurchaseReturnFromBill, type CreateFromBillData } from '@/api/usePurchaseReturns'
import { useWarehousesLookup } from '@/api/useInventory'
import { Button, Card, Badge, Modal, Input, Textarea, Select, FormField, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatCurrency, formatDate, toNumber } from '@/utils/format'
import { FileText, RotateCcw, Repeat } from 'lucide-vue-next'
import AttachmentCard from '@/components/AttachmentCard.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const billId = computed(() => Number(route.params.id))
const { data: bill, isLoading } = useBill(billId)

// Mutations
const postMutation = usePostBill()
const voidMutation = useVoidBill()
const deleteMutation = useDeleteBill()
const makeRecurringMutation = useMakeBillRecurring()
const createPRMutation = useCreatePurchaseReturnFromBill()

// Warehouse lookup for purchase return form
const { data: warehouses, isLoading: loadingWarehouses } = useWarehousesLookup()

// Modal states
const showVoidModal = ref(false)
const showDeleteModal = ref(false)
const showRecurringModal = ref(false)
const showCreatePRModal = ref(false)
const voidReason = ref('')

// Make Recurring form
const today = new Date().toISOString().split('T')[0] || ''
const recurringFormData = ref<MakeRecurringData>({
  name: '',
  frequency: 'monthly',
  interval: 1,
  start_date: today,
  end_date: null,
  occurrences_limit: null,
  auto_post: false,
  auto_send: false,
})

const frequencySelectOptions = [
  { value: '', label: 'Select frequency...' },
  ...frequencyOptions.map(f => ({ value: f.value, label: f.label })),
]

// Create Purchase Return form
const prFormData = ref<CreateFromBillData>({
  return_date: new Date().toISOString().split('T')[0],
  warehouse_id: undefined,
  reason: '',
  notes: '',
})

const reasonOptions = [
  { value: '', label: 'Select reason...' },
  { value: 'damaged', label: 'Barang Rusak' },
  { value: 'wrong_item', label: 'Barang Salah' },
  { value: 'quality_issue', label: 'Masalah Kualitas' },
  { value: 'vendor_request', label: 'Permintaan Vendor' },
  { value: 'other', label: 'Lainnya' },
]

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

// Status-based availability
const canMakeRecurring = computed(() => {
  const status = bill.value?.status?.value
  return status === 'posted' || status === 'partial'
})

const canCreatePurchaseReturn = computed(() => {
  const status = bill.value?.status?.value
  return status === 'posted' || status === 'partial' || status === 'paid'
})

// Action handlers
async function handlePost() {
  try {
    await postMutation.mutateAsync(billId.value)
    toast.success('Bill posted successfully')
  } catch {
    toast.error('Failed to post bill')
  }
}

async function handleVoid() {
  try {
    await voidMutation.mutateAsync(billId.value)
    showVoidModal.value = false
    voidReason.value = ''
    toast.success('Bill voided')
  } catch {
    toast.error('Failed to void bill')
  }
}

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(billId.value)
    showDeleteModal.value = false
    toast.success('Bill deleted')
    router.push('/bills')
  } catch {
    toast.error('Failed to delete bill')
  }
}

function openRecurringModal() {
  recurringFormData.value = {
    name: `Recurring - ${bill.value?.bill_number}`,
    frequency: 'monthly',
    interval: 1,
    start_date: new Date().toISOString().split('T')[0] || '',
    end_date: null,
    occurrences_limit: null,
    auto_post: false,
    auto_send: false,
  }
  showRecurringModal.value = true
}

async function handleMakeRecurring() {
  try {
    await makeRecurringMutation.mutateAsync({
      billId: billId.value,
      data: recurringFormData.value,
    })
    showRecurringModal.value = false
    toast.success('Recurring template created')
  } catch {
    toast.error('Failed to create recurring template')
  }
}

async function handleCreatePR() {
  try {
    const payload: CreateFromBillData = {
      ...prFormData.value,
      warehouse_id: prFormData.value.warehouse_id || undefined,
      reason: prFormData.value.reason || undefined,
      notes: prFormData.value.notes || undefined,
    }
    const newPR = await createPRMutation.mutateAsync({
      billId: billId.value,
      data: payload,
    })
    showCreatePRModal.value = false
    toast.success('Purchase return created')
    router.push(`/purchasing/purchase-returns/${newPR.id}`)
  } catch {
    toast.error('Failed to create purchase return')
  }
}

// Line items table columns with mobile priorities
const itemColumns: ResponsiveColumn[] = [
  { key: 'description', label: 'Description', mobilePriority: 1 },
  { key: 'quantity', label: 'Qty', align: 'right', mobilePriority: 3 },
  { key: 'unit_price', label: 'Price', align: 'right', showInMobile: false },
  { key: 'line_total', label: 'Amount', align: 'right', mobilePriority: 2 },
]
</script>

<template>
  <div>
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-muted-foreground">Loading bill...</div>
    </div>

    <template v-else-if="bill">
      <!-- Breadcrumb -->
      <div class="text-sm text-muted-foreground mb-4">
        <RouterLink to="/bills" class="hover:text-slate-700 dark:hover:text-slate-300">Bills</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-slate-900 dark:text-slate-100">{{ bill.bill_number }}</span>
      </div>

      <!-- Header -->
      <Card class="mb-6">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ bill.bill_number }}</h1>
              <Badge :status="bill.status">
                {{ bill.status_label }}
              </Badge>
            </div>
            <p class="text-muted-foreground">{{ bill.contact?.name }}</p>
          </div>
          <div class="flex gap-2">
            <RouterLink v-if="bill.status.value === 'draft'" :to="`/bills/${bill.id}/edit`">
              <Button variant="secondary" size="sm">Edit</Button>
            </RouterLink>
            <Button
              v-if="bill.status.value === 'draft'"
              size="sm"
              :loading="postMutation.isPending.value"
              @click="handlePost"
            >
              Post Bill
            </Button>
            <Button
              v-if="bill.status.value === 'posted' || bill.status.value === 'partial'"
              variant="destructive"
              size="sm"
              @click="showVoidModal = true"
            >
              Void
            </Button>
            <Button
              v-if="bill.status.value === 'draft'"
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

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <!-- Bill Details -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Details</h2>
            </template>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-muted-foreground">Vendor</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ bill.contact?.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Vendor Invoice #</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ bill.vendor_invoice_number || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Bill Date</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatDate(bill.bill_date) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Due Date</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatDate(bill.due_date) }}</dd>
              </div>
              <div v-if="bill.currency && bill.currency !== 'IDR'" data-testid="bill-currency-display">
                <dt class="text-sm text-muted-foreground">Currency</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ bill.currency }} ({{ bill.exchange_rate }})</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-muted-foreground">Description</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ bill.description || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Line Items -->
          <Card :padding="false">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100 px-6 pt-6">Line Items</h2>
            </template>
            <ResponsiveTable
              :items="bill.items || []"
              :columns="itemColumns"
              title-field="description"
            >
              <template #cell-description="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ item.description }}</span>
              </template>
              <template #cell-quantity="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ item.quantity }} {{ item.unit }}</span>
              </template>
              <template #cell-unit_price="{ item }">
                <span class="text-slate-900 dark:text-slate-100">{{ formatCurrency(item.unit_price) }}</span>
              </template>
              <template #cell-line_total="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(item.line_total) }}</span>
              </template>
              <template #mobile-title="{ item }">
                <span class="font-medium text-slate-900 dark:text-slate-100">{{ item.description }}</span>
              </template>
            </ResponsiveTable>
          </Card>

          <!-- Payments -->
          <Card v-if="bill.payments && bill.payments.length > 0">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Payments</h2>
            </template>
            <div class="space-y-3">
              <div
                v-for="payment in bill.payments"
                :key="payment.id"
                class="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p class="font-medium text-slate-900 dark:text-slate-100">{{ payment.payment_number }}</p>
                  <p class="text-sm text-muted-foreground">{{ formatDate(payment.payment_date) }}</p>
                </div>
                <span class="font-medium text-green-600 dark:text-green-400">{{ formatCurrency(payment.amount) }}</span>
              </div>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Summary</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Subtotal</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatCurrency(bill.subtotal) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Tax ({{ bill.tax_rate }}%)</dt>
                <dd class="text-slate-900 dark:text-slate-100">{{ formatCurrency(bill.tax_amount) }}</dd>
              </div>
              <div v-if="bill.discount_amount" class="flex justify-between">
                <dt class="text-muted-foreground">Discount</dt>
                <dd class="text-slate-900 dark:text-slate-100">-{{ formatCurrency(bill.discount_amount) }}</dd>
              </div>
              <hr class="border-border" />
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900 dark:text-slate-100">Total</dt>
                <dd class="font-bold text-lg text-slate-900 dark:text-slate-100">{{ formatCurrency(bill.total_amount) }}</dd>
              </div>
              <div v-if="bill.currency && bill.currency !== 'IDR'" class="flex justify-between text-sm" data-testid="bill-base-currency-total">
                <dt class="text-muted-foreground">Base Currency (IDR)</dt>
                <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(bill.base_currency_total) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Paid</dt>
                <dd class="font-medium text-green-600 dark:text-green-400">{{ formatCurrency(bill.paid_amount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900 dark:text-slate-100">Outstanding</dt>
                <dd class="font-bold text-lg text-orange-600 dark:text-orange-400">{{ formatCurrency(bill.outstanding_amount) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Quick Actions -->
          <Card v-if="bill.status.value !== 'draft' && bill.status.value !== 'void'">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Quick Actions</h2>
            </template>
            <div class="space-y-2">
              <RouterLink v-if="toNumber(bill.outstanding_amount) > 0" :to="`/payments/new?type=send&bill_id=${bill.id}`" class="block">
                <Button class="w-full">Record Payment</Button>
              </RouterLink>
              <Button
                v-if="canCreatePurchaseReturn"
                variant="secondary"
                class="w-full"
                @click="showCreatePRModal = true"
              >
                <RotateCcw class="w-4 h-4 mr-2" />
                Create Purchase Return
              </Button>
              <Button
                v-if="canMakeRecurring"
                variant="secondary"
                class="w-full"
                @click="openRecurringModal"
              >
                <Repeat class="w-4 h-4 mr-2" />
                Make Recurring
              </Button>
            </div>
          </Card>

          <!-- Related Documents -->
          <Card v-if="bill.journal_entry_id">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Related Documents</h2>
            </template>
            <div class="space-y-2">
              <RouterLink
                :to="`/accounting/journal-entries/${bill.journal_entry_id}`"
                class="flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium"
              >
                <FileText class="w-4 h-4" />
                Journal Entry #{{ bill.journal_entry?.entry_number || bill.journal_entry_id }}
              </RouterLink>
            </div>
          </Card>

          <!-- Attachments -->
          <AttachmentCard attachable-type="Bill" :attachable-id="bill.id" />
        </div>
      </div>
    </template>

    <!-- Void Modal -->
    <Modal :open="showVoidModal" title="Void Bill" @update:open="showVoidModal = $event">
      <p class="text-muted-foreground mb-4">
        Are you sure you want to void this bill? This will reverse the journal entry.
      </p>
      <div class="mb-4">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Reason (optional)</label>
        <Textarea v-model="voidReason" :rows="3" placeholder="Enter reason for voiding..." />
      </div>
      <template #footer>
        <Button variant="ghost" @click="showVoidModal = false">Cancel</Button>
        <Button variant="destructive" :loading="voidMutation.isPending.value" @click="handleVoid">
          Void Bill
        </Button>
      </template>
    </Modal>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Bill" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-muted-foreground">
        Are you sure you want to delete this bill? This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">
          Delete
        </Button>
      </template>
    </Modal>

    <!-- Make Recurring Modal -->
    <Modal :open="showRecurringModal" title="Make Bill Recurring" @update:open="showRecurringModal = $event">
      <p class="text-muted-foreground mb-4">
        Create a recurring template from this bill. New bills will be generated automatically based on the schedule.
      </p>
      <div class="space-y-4">
        <FormField label="Template Name">
          <Input
            :model-value="recurringFormData.name || ''"
            placeholder="e.g., Monthly Server Hosting"
            @update:model-value="(v) => recurringFormData.name = String(v) || null"
          />
        </FormField>

        <div class="grid grid-cols-2 gap-4">
          <FormField label="Frequency">
            <Select
              :model-value="recurringFormData.frequency"
              :options="frequencySelectOptions"
              @update:model-value="(v) => recurringFormData.frequency = v as any"
            />
          </FormField>
          <FormField label="Every" hint="Generate every N periods">
            <Input v-model.number="recurringFormData.interval" type="number" min="1" max="12" />
          </FormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormField label="Start Date">
            <Input v-model="recurringFormData.start_date" type="date" />
          </FormField>
          <FormField label="End Date" hint="Optional">
            <Input
              :model-value="recurringFormData.end_date ?? ''"
              type="date"
              @update:model-value="(v) => recurringFormData.end_date = (v as string) || null"
            />
          </FormField>
        </div>

        <FormField label="Max Occurrences" hint="Leave empty for unlimited">
          <Input
            :model-value="recurringFormData.occurrences_limit || ''"
            type="number"
            min="1"
            placeholder="Unlimited"
            @update:model-value="(v) => recurringFormData.occurrences_limit = v ? Number(v) : null"
          />
        </FormField>

        <div class="space-y-3 pt-2 border-t border-border">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="recurringFormData.auto_post"
              type="checkbox"
              class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
            />
            <div>
              <span class="text-sm font-medium text-slate-900 dark:text-slate-100">Auto-post bills</span>
              <p class="text-xs text-muted-foreground">Automatically post generated bills</p>
            </div>
          </label>
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showRecurringModal = false">Cancel</Button>
        <Button :loading="makeRecurringMutation.isPending.value" @click="handleMakeRecurring">
          <Repeat class="w-4 h-4 mr-2" />
          Create Recurring Template
        </Button>
      </template>
    </Modal>

    <!-- Create Purchase Return Modal -->
    <Modal :open="showCreatePRModal" title="Create Purchase Return" @update:open="showCreatePRModal = $event">
      <p class="text-muted-foreground mb-4">
        Create a purchase return from this bill. Items will be copied automatically.
      </p>
      <div class="space-y-4">
        <FormField label="Return Date">
          <Input v-model="prFormData.return_date" type="date" />
        </FormField>
        <FormField label="Warehouse">
          <Select
            :model-value="prFormData.warehouse_id"
            :options="warehouseOptions"
            placeholder="Select warehouse..."
            :loading="loadingWarehouses"
            @update:model-value="(v) => { prFormData.warehouse_id = v ? Number(v) : undefined }"
          />
        </FormField>
        <FormField label="Reason">
          <Select
            :model-value="prFormData.reason"
            :options="reasonOptions"
            placeholder="Select reason..."
            @update:model-value="(v) => { prFormData.reason = String(v) }"
          />
        </FormField>
        <FormField label="Notes">
          <Textarea v-model="prFormData.notes" :rows="2" placeholder="Additional notes" />
        </FormField>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showCreatePRModal = false">Cancel</Button>
        <Button :loading="createPRMutation.isPending.value" @click="handleCreatePR">
          <RotateCcw class="w-4 h-4 mr-2" />
          Create Purchase Return
        </Button>
      </template>
    </Modal>
  </div>
</template>
