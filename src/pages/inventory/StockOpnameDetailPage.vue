<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useStockOpname,
  useStartCounting,
  useSubmitForReview,
  useApproveOpname,
  useRejectOpname,
  useCancelOpname,
  useGenerateOpnameItems,
  useAddOpnameItem,
  useDeleteOpnameItem,
  useUpdateOpnameItem,
} from '@/api/useStockOpnames'
import { useProductsLookup, type Product } from '@/api/useProducts'
import { formatDate, formatNumber } from '@/utils/format'
import {
  Button,
  Badge,
  Card,
  Modal,
  Select,
  useToast,
  ResponsiveTable,
  type ResponsiveColumn,
  Input,
} from '@/components/ui'
import {
  ArrowLeft,
  Play,
  CheckCircle,
  XCircle,
  History,
  RefreshCw,
  Plus,
  Trash2,
  BarChart3,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const opnameId = computed(() => String(route.params.id))

// Fetch data with explicit includes
const { data: opname, isLoading, error } = useStockOpname(
  opnameId,
  ref({ include: ['warehouse', 'items.product', 'countedByUser', 'reviewedByUser', 'approvedByUser'] })
)

// Products for add-item modal
const { data: products } = useProductsLookup()

// Workflow mutations
const startMutation = useStartCounting()
const submitMutation = useSubmitForReview()
const approveMutation = useApproveOpname()
const rejectMutation = useRejectOpname()
const cancelMutation = useCancelOpname()

// Item management mutations
const generateMutation = useGenerateOpnameItems()
const addItemMutation = useAddOpnameItem()
const deleteItemMutation = useDeleteOpnameItem()
const updateItemMutation = useUpdateOpnameItem()

// Table Columns
const columns: ResponsiveColumn[] = [
  { key: 'product.name', label: 'Product', mobilePriority: 1 },
  { key: 'system_quantity', label: 'System Qty', align: 'right', mobilePriority: 3 },
  { key: 'actual_quantity', label: 'Counted Qty', align: 'right', mobilePriority: 2 },
  { key: 'difference_quantity', label: 'Variance', align: 'right', showInMobile: false },
  { key: 'actions', label: '', showInMobile: false },
]

// ============================================
// Workflow Handlers
// ============================================

async function handleStart() {
  try {
    await startMutation.mutateAsync(opnameId.value)
    toast.success('Counting started')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Failed to start counting')
  }
}

async function handleSubmitReview() {
  try {
    await submitMutation.mutateAsync(opnameId.value)
    toast.success('Submitted for review')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Failed to submit review')
  }
}

async function handleApprove() {
  if (!confirm('Approve this stock opname? This will adjust your inventory levels permanently.')) return
  try {
    await approveMutation.mutateAsync(opnameId.value)
    toast.success('Stock opname approved and completed')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Failed to approve')
  }
}

async function handleReject() {
  const reason = prompt('Reason for rejection (optional):')
  if (reason === null) return // user pressed Cancel on prompt
  try {
    await rejectMutation.mutateAsync({ id: opnameId.value, reason: reason || undefined })
    toast.success('Stock opname rejected — returned to counting')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Failed to reject')
  }
}

async function handleCancel() {
  if (!confirm('Cancel this stock opname? This action cannot be undone.')) return
  try {
    await cancelMutation.mutateAsync(opnameId.value)
    toast.success('Stock opname cancelled')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Failed to cancel')
  }
}

// ============================================
// Generate Items
// ============================================

async function handleGenerateItems() {
  if (!confirm('Generate items from warehouse stock? This will replace any existing items.')) return
  try {
    await generateMutation.mutateAsync(opnameId.value)
    toast.success('Items generated from warehouse stock')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Failed to generate items')
  }
}

// ============================================
// Add Item Modal
// ============================================

const showAddItemModal = ref(false)
const selectedProductId = ref<number | null>(null)
const addItemError = ref('')

const productOptions = computed(() => {
  if (!products.value) return []
  // Filter out products already in the opname
  const existingIds = new Set(
    (opname.value?.items ?? []).map((i: { product_id: number }) => i.product_id)
  )
  return products.value
    .filter((p: Product) => !existingIds.has(p.id))
    .map((p: Product) => ({
      value: p.id,
      label: `${p.sku} - ${p.name}`,
    }))
})

function openAddItemModal() {
  selectedProductId.value = null
  addItemError.value = ''
  showAddItemModal.value = true
}

async function handleAddItem() {
  addItemError.value = ''
  if (!selectedProductId.value) {
    addItemError.value = 'Please select a product'
    return
  }

  try {
    await addItemMutation.mutateAsync({
      opnameId: opnameId.value,
      productId: selectedProductId.value,
    })
    toast.success('Item added')
    showAddItemModal.value = false
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    addItemError.value = msg || 'Failed to add item'
  }
}

// ============================================
// Delete Item
// ============================================

async function handleDeleteItem(itemId: number | string) {
  if (!confirm('Remove this item from the count?')) return
  try {
    await deleteItemMutation.mutateAsync({ opnameId: opnameId.value, itemId })
    toast.success('Item removed')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Failed to remove item')
  }
}

// ============================================
// Inline Editing
// ============================================

const editingItemId = ref<number | string | null>(null)
const editValue = ref<number>(0)

function startEdit(item: Record<string, unknown>) {
  if (!opname.value?.can_edit) return
  editingItemId.value = item.id as number
  editValue.value = (item.actual_quantity as number) ?? (item.system_quantity as number)
}

async function saveEdit(item: Record<string, unknown>) {
  try {
    await updateItemMutation.mutateAsync({
      opnameId: opnameId.value,
      itemId: item.id as number,
      data: { counted_quantity: editValue.value },
    })
    editingItemId.value = null
    toast.success('Quantity updated')
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    toast.error(msg || 'Failed to update quantity')
  }
}

// ============================================
// Helpers
// ============================================

const canManageItems = computed(() => opname.value?.can_edit === true)
</script>

<template>
  <div class="space-y-6">
    <!-- Loading/Error -->
    <div v-if="isLoading" class="text-center py-12 text-muted-foreground">Loading...</div>
    <div v-else-if="error" class="text-center py-12 text-destructive">Failed to load stock opname</div>

    <template v-else-if="opname">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="sm" @click="router.push('/inventory/opnames')">
            <ArrowLeft class="w-4 h-4" />
          </Button>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-foreground">{{ opname.opname_number }}</h1>
              <Badge :status="opname.status.value as any">{{ opname.status.label }}</Badge>
            </div>
            <p class="text-muted-foreground">{{ opname.warehouse?.name }} &bull; {{ formatDate(opname.opname_date) }}</p>
          </div>
        </div>

        <!-- Workflow Actions -->
        <div class="flex flex-wrap gap-2">
          <Button v-if="opname.can_start_counting" data-testid="opname-start-btn" @click="handleStart" :loading="startMutation.isPending.value">
            <Play class="w-4 h-4 mr-2" /> Start Counting
          </Button>

          <Button v-if="opname.can_submit_for_review" data-testid="opname-submit-review-btn" @click="handleSubmitReview" :loading="submitMutation.isPending.value">
            <CheckCircle class="w-4 h-4 mr-2" /> Submit Review
          </Button>

          <Button v-if="opname.can_approve" data-testid="opname-approve-btn" @click="handleApprove" :loading="approveMutation.isPending.value">
            <CheckCircle class="w-4 h-4 mr-2" /> Approve & Complete
          </Button>

          <Button
            v-if="opname.can_reject"
            variant="secondary"
            data-testid="opname-reject-btn"
            @click="handleReject"
            :loading="rejectMutation.isPending.value"
          >
            <XCircle class="w-4 h-4 mr-2" /> Reject
          </Button>

          <Button
            v-if="opname.can_cancel"
            variant="destructive"
            data-testid="opname-cancel-btn"
            @click="handleCancel"
            :loading="cancelMutation.isPending.value"
          >
            Cancel
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Table -->
        <div class="lg:col-span-2 space-y-6">
          <Card :padding="false">
            <template #header>
              <div class="px-6 py-4 flex items-center justify-between">
                <h2 class="font-semibold text-foreground">Items to Count</h2>
                <div class="flex items-center gap-3">
                  <span class="text-sm text-muted-foreground">
                    {{ opname.total_counted }} / {{ opname.total_items }} counted
                  </span>
                  <template v-if="canManageItems">
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid="opname-generate-btn"
                      @click="handleGenerateItems"
                      :loading="generateMutation.isPending.value"
                    >
                      <RefreshCw class="w-4 h-4 mr-1" />
                      Generate
                    </Button>
                    <Button variant="ghost" size="sm" data-testid="opname-add-item-btn" @click="openAddItemModal">
                      <Plus class="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </template>
                </div>
              </div>
            </template>

            <!-- Empty state -->
            <div
              v-if="!opname.items || opname.items.length === 0"
              class="text-center py-12 px-6"
            >
              <p class="text-muted-foreground mb-4">No items to count yet</p>
              <div v-if="canManageItems" class="flex gap-2 justify-center">
                <Button @click="handleGenerateItems" :loading="generateMutation.isPending.value">
                  <RefreshCw class="w-4 h-4 mr-1" />
                  Generate from Stock
                </Button>
                <Button variant="secondary" @click="openAddItemModal">
                  <Plus class="w-4 h-4 mr-1" />
                  Add Manually
                </Button>
              </div>
            </div>

            <ResponsiveTable v-else :items="opname.items || []" :columns="columns">
              <!-- Product Cell -->
              <template #cell-product\.name="{ item }">
                <div class="font-medium text-foreground">{{ item.product?.name }}</div>
                <div class="text-xs text-muted-foreground font-mono">{{ item.product?.sku }}</div>
              </template>

              <!-- Counted Qty Cell (Editable) -->
              <template #cell-actual_quantity="{ item }">
                <div v-if="editingItemId === item.id" class="flex items-center gap-2">
                  <Input
                    v-model="editValue"
                    type="number"
                    class="w-20 h-8 text-right"
                    autofocus
                    @keyup.enter="saveEdit(item)"
                    @keyup.esc="editingItemId = null"
                  />
                  <Button size="xs" @click="saveEdit(item)" :loading="updateItemMutation.isPending.value">Save</Button>
                </div>
                <div
                  v-else
                  class="cursor-pointer hover:bg-muted p-1 rounded transition-colors text-right"
                  :class="{ 'text-muted-foreground italic': item.actual_quantity === null }"
                  @click="startEdit(item)"
                >
                  {{ item.actual_quantity !== null ? formatNumber(item.actual_quantity) : 'Not counted' }}
                </div>
              </template>

              <!-- Variance Cell -->
              <template #cell-difference_quantity="{ item }">
                <span v-if="item.actual_quantity !== null" :class="{
                  'text-green-600 dark:text-green-400': item.difference_quantity > 0,
                  'text-destructive': item.difference_quantity < 0,
                  'text-muted-foreground': item.difference_quantity === 0,
                }">
                  {{ item.difference_quantity > 0 ? '+' : '' }}{{ formatNumber(item.difference_quantity) }}
                </span>
                <span v-else class="text-muted-foreground/50">-</span>
              </template>

              <!-- Actions Cell (Delete) -->
              <template #cell-actions="{ item }">
                <button
                  v-if="canManageItems"
                  class="text-muted-foreground hover:text-destructive transition-colors"
                  @click.stop="handleDeleteItem(item.id)"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </template>
            </ResponsiveTable>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-foreground">Summary</h2>
            </template>
            <div class="space-y-4">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Progress</span>
                <span class="font-medium text-foreground">{{ opname.counting_progress }}%</span>
              </div>
              <div class="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all" :style="{ width: `${opname.counting_progress}%` }"></div>
              </div>

              <div class="pt-4 border-t border-border space-y-3">
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Total Variance Qty</span>
                  <span class="font-medium" :class="opname.total_variance_qty < 0 ? 'text-destructive' : 'text-foreground'">
                    {{ opname.total_variance_qty }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Total Variance Value</span>
                  <span class="font-medium text-foreground">
                    {{ opname.total_variance_value }}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <!-- Variance Report Link -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-foreground">Reports</h2>
            </template>
            <RouterLink
              :to="`/inventory/opnames/${opname.id}/variance`"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <BarChart3 class="w-5 h-5 text-muted-foreground" />
              <div>
                <div class="font-medium text-foreground text-sm">Variance Report</div>
                <div class="text-xs text-muted-foreground">View detailed variance analysis</div>
              </div>
            </RouterLink>
          </Card>

          <!-- Workflow Audit -->
          <Card v-if="opname.counted_by_user">
            <template #header>
              <h2 class="font-semibold text-foreground">Workflow</h2>
            </template>
            <div class="space-y-4 text-sm">
              <div v-if="opname.counted_by_user" class="flex items-start gap-3">
                <div class="mt-0.5 p-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                  <CheckCircle class="w-3 h-3" />
                </div>
                <div>
                  <p class="font-medium text-foreground">Counted by {{ opname.counted_by_user.name }}</p>
                  <p class="text-muted-foreground text-xs">{{ opname.counting_started_at ? formatDate(opname.counting_started_at) : '-' }}</p>
                </div>
              </div>
              <div v-if="opname.reviewed_by_user" class="flex items-start gap-3">
                <div class="mt-0.5 p-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded">
                  <History class="w-3 h-3" />
                </div>
                <div>
                  <p class="font-medium text-foreground">Reviewed by {{ opname.reviewed_by_user.name }}</p>
                  <p class="text-muted-foreground text-xs">{{ opname.reviewed_at ? formatDate(opname.reviewed_at) : '-' }}</p>
                </div>
              </div>
              <div v-if="opname.approved_by_user" class="flex items-start gap-3">
                <div class="mt-0.5 p-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                  <CheckCircle class="w-3 h-3" />
                </div>
                <div>
                  <p class="font-medium text-foreground">Approved by {{ opname.approved_by_user.name }}</p>
                  <p class="text-muted-foreground text-xs">{{ opname.approved_at ? formatDate(opname.approved_at) : '-' }}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <!-- Add Item Modal -->
      <Modal
        :open="showAddItemModal"
        @update:open="showAddItemModal = $event"
        title="Add Item"
        description="Select a product to add to this stock count."
        size="md"
      >
        <div class="space-y-4">
          <p v-if="addItemError" class="text-sm text-destructive">{{ addItemError }}</p>

          <Select
            :model-value="selectedProductId ?? ''"
            :options="productOptions"
            placeholder="Search products..."
            @update:model-value="(v) => selectedProductId = v ? Number(v) : null"
          />

          <p class="text-xs text-muted-foreground">
            Only products that track inventory and are not already in this count are shown.
          </p>
        </div>

        <template #footer>
          <Button variant="ghost" @click="showAddItemModal = false">Cancel</Button>
          <Button
            @click="handleAddItem"
            :loading="addItemMutation.isPending.value"
            :disabled="!selectedProductId"
          >
            Add Item
          </Button>
        </template>
      </Modal>
    </template>
  </div>
</template>
