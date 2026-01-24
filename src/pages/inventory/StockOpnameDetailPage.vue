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
  useUpdateOpnameItem
} from '@/api/useStockOpnames'
import { formatDate, formatNumber } from '@/utils/format'
import { 
  Button, 
  Badge, 
  Card, 
  useToast, 
  ResponsiveTable, 
  type ResponsiveColumn,
  Modal,
  Input
} from '@/components/ui'
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  XCircle, 
  History,
  Info
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

// Mutations
const startMutation = useStartCounting()
const submitMutation = useSubmitForReview()
const approveMutation = useApproveOpname()
const rejectMutation = useRejectOpname()
const cancelMutation = useCancelOpname()
const updateItemMutation = useUpdateOpnameItem()

// Table Columns
const columns: ResponsiveColumn[] = [
  { key: 'product.name', label: 'Product', mobilePriority: 1 },
  { key: 'system_quantity', label: 'System Qty', align: 'right', mobilePriority: 3 },
  { key: 'counted_quantity', label: 'Counted Qty', align: 'right', mobilePriority: 2 },
  { key: 'variance_quantity', label: 'Variance', align: 'right', showInMobile: false },
]

// Workflow Handlers
async function handleStart() {
  try {
    await startMutation.mutateAsync(opnameId.value)
    toast.success('Counting started')
  } catch (err: any) {
    toast.error(err.message || 'Failed to start counting')
  }
}

async function handleSubmitReview() {
  try {
    await submitMutation.mutateAsync(opnameId.value)
    toast.success('Submitted for review')
  } catch (err: any) {
    toast.error(err.message || 'Failed to submit review')
  }
}

async function handleApprove() {
  if (!confirm('Approve this stock opname? This will adjust your inventory levels permanently.')) return
  try {
    await approveMutation.mutateAsync(opnameId.value)
    toast.success('Stock opname approved and completed')
  } catch (err: any) {
    toast.error(err.message || 'Failed to approve')
  }
}

// Inline Editing State
const editingItemId = ref<number | string | null>(null)
const editValue = ref<number>(0)

function startEdit(item: any) {
  if (!opname.value?.can_edit) return
  editingItemId.value = item.id
  editValue.value = item.counted_quantity ?? item.system_quantity
}

async function saveEdit(item: any) {
  try {
    await updateItemMutation.mutateAsync({
      opnameId: opnameId.value,
      itemId: item.id,
      data: { counted_quantity: editValue.value }
    })
    editingItemId.value = null
    toast.success('Quantity updated')
  } catch (err: any) {
    toast.error(err.message || 'Failed to update quantity')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading/Error -->
    <div v-if="isLoading" class="text-center py-12">Loading...</div>
    <div v-else-if="error" class="text-center py-12 text-red-500">Failed to load stock opname</div>

    <template v-else-if="opname">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="sm" @click="router.push('/inventory/opnames')">
            <ArrowLeft class="w-4 h-4" />
          </Button>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">{{ opname.opname_number }}</h1>
              <Badge :status="opname.status.value as any">{{ opname.status.label }}</Badge>
            </div>
            <p class="text-slate-500">{{ opname.warehouse?.name }} • {{ formatDate(opname.opname_date) }}</p>
          </div>
        </div>

        <!-- Workflow Actions -->
        <div class="flex flex-wrap gap-2">
          <Button v-if="opname.can_start_counting" @click="handleStart" :loading="startMutation.isPending.value">
            <Play class="w-4 h-4 mr-2" /> Start Counting
          </Button>
          
          <Button v-if="opname.can_submit_for_review" @click="handleSubmitReview" :loading="submitMutation.isPending.value">
            <CheckCircle class="w-4 h-4 mr-2" /> Submit Review
          </Button>

          <Button v-if="opname.can_approve" @click="handleApprove" :loading="approveMutation.isPending.value">
            <CheckCircle class="w-4 h-4 mr-2" /> Approve & Complete
          </Button>

          <Button v-if="opname.can_reject" variant="secondary" @click="() => {}">
            <XCircle class="w-4 h-4 mr-2" /> Reject
          </Button>

          <Button v-if="opname.can_cancel" variant="ghost" class="text-red-500" @click="() => {}">
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
                <h2 class="font-semibold text-slate-900 dark:text-slate-100">Items to Count</h2>
                <div class="text-sm text-slate-500">
                  {{ opname.total_counted }} / {{ opname.total_items }} counted
                </div>
              </div>
            </template>

            <ResponsiveTable :items="opname.items || []" :columns="columns">
              <!-- Custom Product Cell -->
              <template #cell-product\.name="{ item }">
                <div class="font-medium text-slate-900 dark:text-slate-100">{{ item.product?.name }}</div>
                <div class="text-xs text-slate-500 font-mono">{{ item.product?.sku }}</div>
              </template>

              <!-- Custom Counted Qty Cell (Editable) -->
              <template #cell-counted_quantity="{ item }">
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
                  class="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded transition-colors text-right"
                  :class="{ 'text-slate-400 italic': item.counted_quantity === null }"
                  @click="startEdit(item)"
                >
                  {{ item.counted_quantity !== null ? formatNumber(item.counted_quantity) : 'Not counted' }}
                </div>
              </template>

              <!-- Variance Cell -->
              <template #cell-variance_quantity="{ item }">
                <span v-if="item.counted_quantity !== null" :class="{
                  'text-green-600': item.variance_quantity > 0,
                  'text-red-600': item.variance_quantity < 0,
                  'text-slate-500': item.variance_quantity === 0
                }">
                  {{ item.variance_quantity > 0 ? '+' : '' }}{{ formatNumber(item.variance_quantity) }}
                </span>
                <span v-else class="text-slate-300">-</span>
              </template>
            </ResponsiveTable>
          </Card>
        </div>

        <!-- Sidebar Summary -->
        <div class="space-y-6">
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Summary</h2>
            </template>
            <div class="space-y-4">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Progress</span>
                <span class="font-medium">{{ opname.counting_progress }}%</span>
              </div>
              <div class="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-orange-500" :style="{ width: `${opname.counting_progress}%` }"></div>
              </div>
              
              <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div class="flex justify-between">
                  <span class="text-slate-500">Total Variance Qty</span>
                  <span class="font-medium" :class="opname.total_variance_qty < 0 ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'">
                    {{ opname.total_variance_qty }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Total Variance Value</span>
                  <span class="font-medium text-slate-900 dark:text-slate-100">
                    {{ opname.total_variance_value }}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card v-if="opname.counted_by_user">
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Workflow</h2>
            </template>
            <div class="space-y-4 text-sm">
              <div v-if="opname.counted_by_user" class="flex items-start gap-3">
                <div class="mt-0.5 p-1 bg-blue-50 text-blue-600 rounded">
                  <CheckCircle class="w-3 h-3" />
                </div>
                <div>
                  <p class="font-medium">Counted by {{ opname.counted_by_user.name }}</p>
                  <p class="text-slate-500 text-xs">{{ opname.counting_started_at ? formatDate(opname.counting_started_at) : '-' }}</p>
                </div>
              </div>
              <div v-if="opname.reviewed_by_user" class="flex items-start gap-3">
                <div class="mt-0.5 p-1 bg-yellow-50 text-yellow-600 rounded">
                  <History class="w-3 h-3" />
                </div>
                <div>
                  <p class="font-medium">Reviewed by {{ opname.reviewed_by_user.name }}</p>
                  <p class="text-slate-500 text-xs">{{ opname.reviewed_at ? formatDate(opname.reviewed_at) : '-' }}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
