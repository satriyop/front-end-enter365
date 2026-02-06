<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useMrpRun,
  useMrpRunDemands,
  useMrpRunSuggestions,
  useExecuteMrpRun,
  useDeleteMrpRun,
  useAcceptSuggestion,
  useRejectSuggestion,
  useConvertToPO,
  useConvertToWO,
  useConvertToScWO,
  useBulkAcceptSuggestions,
  useBulkRejectSuggestions,
  getMrpRunStatusLabel,
  getSuggestionTypeLabel,
  getSuggestionStatusLabel,
  formatMrpRunNumber,
  type MrpSuggestion,
} from '@/api/useMrp'
import { Button, Card, Badge, useToast } from '@/components/ui'
import { formatDate, formatNumber } from '@/utils/format'
import {
  Play,
  Trash2,
  Edit,
  Check,
  X,
  ShoppingCart,
  Wrench,
  Users,
  ChevronDown,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const mrpRunId = computed(() => route.params.id as string)
const { data: mrpRun, isLoading } = useMrpRun(mrpRunId)

// Demands and suggestions
const { data: demands, isLoading: loadingDemands } = useMrpRunDemands(mrpRunId)
const { data: suggestions, isLoading: loadingSuggestions } = useMrpRunSuggestions(mrpRunId)

// Active tab
const activeTab = ref<'demands' | 'suggestions' | 'settings'>('demands')

// Bulk selection
const selectedSuggestionIds = ref<Set<number>>(new Set())
// Helper to get status value from status object
function getStatusValue(status: unknown): string {
  if (!status) return ''
  if (typeof status === 'string') return status
  if (typeof status === 'object' && 'value' in status) return (status as { value: string }).value
  return ''
}

// Helper to get parameters object
interface MrpParameters {
  include_safety_stock?: boolean
  respect_moq?: boolean
  respect_order_multiple?: boolean
}

const mrpParameters = computed<MrpParameters>(() => {
  const params = mrpRun.value?.parameters
  if (!params) return {}
  if (Array.isArray(params)) return {}
  if (typeof params === 'object') return params as MrpParameters
  return {}
})

const allSelected = computed(() => {
  const pendingSuggestions = suggestions.value?.filter(s => getStatusValue(s.status) === 'pending') || []
  return pendingSuggestions.length > 0 && pendingSuggestions.every(s => selectedSuggestionIds.value.has(s.id))
})

function toggleSelectAll() {
  const pendingSuggestions = suggestions.value?.filter(s => getStatusValue(s.status) === 'pending') || []
  if (allSelected.value) {
    selectedSuggestionIds.value.clear()
  } else {
    pendingSuggestions.forEach(s => selectedSuggestionIds.value.add(s.id))
  }
}

function toggleSuggestion(id: number) {
  if (selectedSuggestionIds.value.has(id)) {
    selectedSuggestionIds.value.delete(id)
  } else {
    selectedSuggestionIds.value.add(id)
  }
}

// Mutations
const executeMutation = useExecuteMrpRun()
const deleteMutation = useDeleteMrpRun()
const acceptMutation = useAcceptSuggestion()
const rejectMutation = useRejectSuggestion()
const convertToPOMutation = useConvertToPO()
const convertToWOMutation = useConvertToWO()
const convertToScWOMutation = useConvertToScWO()
const bulkAcceptMutation = useBulkAcceptSuggestions()
const bulkRejectMutation = useBulkRejectSuggestions()

// Computed stats
const shortageCount = computed(() =>
  demands.value?.filter(d => d.quantity_short && d.quantity_short > 0).length || 0
)
const totalDemands = computed(() => demands.value?.length || 0)
const pendingSuggestions = computed(() =>
  suggestions.value?.filter(s => getStatusValue(s.status) === 'pending').length || 0
)
const totalSuggestions = computed(() => suggestions.value?.length || 0)

// Check if run is editable
const isDraft = computed(() => mrpRun.value?.status?.value === 'draft')
const isCompleted = computed(() => mrpRun.value?.status?.value === 'completed')

// Actions
async function handleExecute() {
  if (!confirm('Execute this MRP run? This will analyze demands and generate suggestions.')) return
  try {
    await executeMutation.mutateAsync(mrpRunId.value)
    toast.success('MRP run executed successfully')
  } catch {
    toast.error('Failed to execute MRP run')
  }
}

async function handleDelete() {
  if (!confirm('Delete this MRP run? This cannot be undone.')) return
  try {
    await deleteMutation.mutateAsync(mrpRunId.value)
    toast.success('MRP run deleted')
    router.push('/manufacturing/mrp')
  } catch {
    toast.error('Failed to delete MRP run')
  }
}

async function handleAccept(suggestion: MrpSuggestion) {
  try {
    await acceptMutation.mutateAsync({ id: suggestion.id })
    toast.success('Suggestion accepted')
  } catch {
    toast.error('Failed to accept suggestion')
  }
}

async function handleReject(suggestion: MrpSuggestion) {
  const reason = prompt('Reason for rejection (optional):')
  try {
    await rejectMutation.mutateAsync({ id: suggestion.id, reason: reason || undefined })
    toast.success('Suggestion rejected')
  } catch {
    toast.error('Failed to reject suggestion')
  }
}

async function handleConvert(suggestion: MrpSuggestion, target: 'po' | 'wo' | 'scwo') {
  const confirmMsg = {
    po: 'Convert this suggestion to a Purchase Order?',
    wo: 'Convert this suggestion to a Work Order?',
    scwo: 'Convert this suggestion to a Subcontractor Work Order?',
  }
  if (!confirm(confirmMsg[target])) return

  try {
    if (target === 'po') {
      const result = await convertToPOMutation.mutateAsync(suggestion.id)
      toast.success('Created Purchase Order')
      router.push(`/purchasing/purchase-orders/${result.purchase_order_id}`)
    } else if (target === 'wo') {
      const result = await convertToWOMutation.mutateAsync(suggestion.id)
      toast.success('Created Work Order')
      router.push(`/work-orders/${result.work_order_id}`)
    } else {
      const result = await convertToScWOMutation.mutateAsync(suggestion.id)
      toast.success('Created Subcontractor Work Order')
      router.push(`/manufacturing/subcontractor-work-orders/${result.subcontractor_work_order_id}`)
    }
  } catch {
    toast.error('Failed to convert suggestion')
  }
}

async function handleBulkAccept() {
  if (selectedSuggestionIds.value.size === 0) return
  if (!confirm(`Accept ${selectedSuggestionIds.value.size} selected suggestions?`)) return
  try {
    await bulkAcceptMutation.mutateAsync(Array.from(selectedSuggestionIds.value))
    toast.success('Suggestions accepted')
    selectedSuggestionIds.value.clear()
  } catch {
    toast.error('Failed to accept suggestions')
  }
}

async function handleBulkReject() {
  if (selectedSuggestionIds.value.size === 0) return
  const reason = prompt('Reason for rejection (optional):')
  try {
    await bulkRejectMutation.mutateAsync({
      ids: Array.from(selectedSuggestionIds.value),
      reason: reason || undefined,
    })
    toast.success('Suggestions rejected')
    selectedSuggestionIds.value.clear()
  } catch {
    toast.error('Failed to reject suggestions')
  }
}

// Filter demands
const showOnlyShortages = ref(false)
const filteredDemands = computed(() => {
  if (!showOnlyShortages.value) return demands.value || []
  return demands.value?.filter(d => d.quantity_short && d.quantity_short > 0) || []
})

// Filter suggestions
const suggestionTypeFilter = ref<string>('')
const suggestionStatusFilter = ref<string>('')
const filteredSuggestions = computed(() => {
  let result = suggestions.value || []
  if (suggestionTypeFilter.value) {
    result = result.filter(s => s.suggestion_type === suggestionTypeFilter.value)
  }
  if (suggestionStatusFilter.value) {
    result = result.filter(s => getStatusValue(s.status) === suggestionStatusFilter.value)
  }
  return result
})
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-muted-foreground">Loading MRP run...</div>
    </div>

    <template v-else-if="mrpRun">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-foreground">{{ formatMrpRunNumber(mrpRun) }}</h1>
            <Badge :class="getMrpRunStatusLabel(mrpRun).color">
              {{ getMrpRunStatusLabel(mrpRun).label }}
            </Badge>
          </div>
          <p v-if="mrpRun.name" class="text-lg text-foreground/80">{{ mrpRun.name }}</p>
          <p class="text-muted-foreground">
            {{ formatDate(mrpRun.planning_horizon_start || '') }} - {{ formatDate(mrpRun.planning_horizon_end || '') }}
            <span v-if="mrpRun.warehouse"> &bull; {{ mrpRun.warehouse.name }}</span>
          </p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <Button variant="ghost" @click="router.back()">Back</Button>
          <RouterLink v-if="isDraft" :to="`/manufacturing/mrp/${mrpRun.id}/edit`">
            <Button variant="secondary">
              <Edit class="w-4 h-4 mr-2" />
              Edit
            </Button>
          </RouterLink>
          <Button
            v-if="isDraft"
            @click="handleExecute"
            :loading="executeMutation.isPending.value"
          >
            <Play class="w-4 h-4 mr-2" />
            Execute
          </Button>
          <Button
            v-if="isDraft"
            variant="destructive"
            @click="handleDelete"
            :loading="deleteMutation.isPending.value"
          >
            <Trash2 class="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div v-if="isCompleted" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card class="text-center">
          <div class="text-sm text-muted-foreground">Products Analyzed</div>
          <div class="text-2xl font-bold text-foreground">{{ formatNumber(totalDemands) }}</div>
        </Card>
        <Card
          class="text-center"
          :class="shortageCount > 0 ? 'bg-destructive/10 border-destructive/30' : ''"
        >
          <div class="text-sm text-muted-foreground">Shortages</div>
          <div class="text-2xl font-bold" :class="shortageCount > 0 ? 'text-destructive' : 'text-foreground'">
            {{ formatNumber(shortageCount) }}
          </div>
        </Card>
        <Card class="text-center">
          <div class="text-sm text-muted-foreground">Total Suggestions</div>
          <div class="text-2xl font-bold text-foreground">{{ formatNumber(totalSuggestions) }}</div>
        </Card>
        <Card class="text-center bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div class="text-sm text-muted-foreground">Pending Actions</div>
          <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {{ formatNumber(pendingSuggestions) }}
          </div>
        </Card>
      </div>

      <!-- Tabs -->
      <div class="border-b border-border mb-6">
        <nav class="flex space-x-8">
          <button
            @click="activeTab = 'demands'"
            class="py-3 border-b-2 font-medium text-sm transition-colors"
            :class="activeTab === 'demands'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'"
          >
            Demands ({{ totalDemands }})
          </button>
          <button
            @click="activeTab = 'suggestions'"
            class="py-3 border-b-2 font-medium text-sm transition-colors"
            :class="activeTab === 'suggestions'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'"
          >
            Suggestions ({{ totalSuggestions }})
          </button>
          <button
            @click="activeTab = 'settings'"
            class="py-3 border-b-2 font-medium text-sm transition-colors"
            :class="activeTab === 'settings'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'"
          >
            Settings
          </button>
        </nav>
      </div>

      <!-- Demands Tab -->
      <div v-if="activeTab === 'demands'">
        <Card :padding="false">
          <div class="px-6 py-4 border-b border-border flex items-center justify-between">
            <h3 class="font-medium text-foreground">Material Demands</h3>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="showOnlyShortages" class="rounded" />
              <span class="text-muted-foreground">Show only shortages</span>
            </label>
          </div>

          <div v-if="loadingDemands" class="text-center py-8">
            <div class="text-muted-foreground">Loading demands...</div>
          </div>

          <div v-else-if="!filteredDemands.length" class="text-center py-8">
            <div class="text-muted-foreground">No demands found</div>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-muted/50">
                <tr>
                  <th class="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th class="text-right px-4 py-3 font-medium text-muted-foreground">Required Date</th>
                  <th class="text-right px-4 py-3 font-medium text-muted-foreground">Required Qty</th>
                  <th class="text-right px-4 py-3 font-medium text-muted-foreground">On Hand</th>
                  <th class="text-right px-4 py-3 font-medium text-muted-foreground">On Order</th>
                  <th class="text-right px-4 py-3 font-medium text-muted-foreground">Available</th>
                  <th class="text-right px-4 py-3 font-medium text-muted-foreground">Shortage</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="demand in filteredDemands"
                  :key="demand.id"
                  class="hover:bg-muted/30"
                >
                  <td class="px-4 py-3">
                    <div class="font-medium text-foreground">
                      {{ demand.product?.name || `Product #${demand.product_id}` }}
                    </div>
                    <div class="text-xs text-muted-foreground">{{ demand.product?.sku }}</div>
                  </td>
                  <td class="text-right px-4 py-3 text-foreground">
                    {{ formatDate(demand.required_date) }}
                  </td>
                  <td class="text-right px-4 py-3 font-mono text-foreground">
                    {{ formatNumber(demand.quantity_required) }}
                  </td>
                  <td class="text-right px-4 py-3 font-mono text-foreground">
                    {{ formatNumber(demand.quantity_on_hand || 0) }}
                  </td>
                  <td class="text-right px-4 py-3 font-mono text-foreground">
                    {{ formatNumber(demand.quantity_on_order || 0) }}
                  </td>
                  <td class="text-right px-4 py-3 font-mono text-foreground">
                    {{ formatNumber(demand.quantity_available || 0) }}
                  </td>
                  <td class="text-right px-4 py-3 font-mono font-semibold">
                    <span
                      v-if="demand.quantity_short && demand.quantity_short > 0"
                      class="text-destructive"
                    >
                      -{{ formatNumber(demand.quantity_short) }}
                    </span>
                    <span v-else class="text-green-600 dark:text-green-400">-</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <!-- Suggestions Tab -->
      <div v-if="activeTab === 'suggestions'">
        <Card :padding="false">
          <div class="px-6 py-4 border-b border-border">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <h3 class="font-medium text-foreground">Suggestions</h3>
              <div class="flex items-center gap-4">
                <!-- Filters -->
                <select
                  v-model="suggestionTypeFilter"
                  class="text-sm border border-border rounded-md px-3 py-1.5 bg-background"
                >
                  <option value="">All Types</option>
                  <option value="purchase">Purchase</option>
                  <option value="work_order">Work Order</option>
                  <option value="subcontract">Subcontract</option>
                </select>
                <select
                  v-model="suggestionStatusFilter"
                  class="text-sm border border-border rounded-md px-3 py-1.5 bg-background"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="converted">Converted</option>
                </select>
                <!-- Bulk Actions -->
                <div v-if="selectedSuggestionIds.size > 0" class="flex items-center gap-2">
                  <span class="text-sm text-muted-foreground">
                    {{ selectedSuggestionIds.size }} selected
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    @click="handleBulkAccept"
                    :loading="bulkAcceptMutation.isPending.value"
                  >
                    <Check class="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    @click="handleBulkReject"
                    :loading="bulkRejectMutation.isPending.value"
                  >
                    <X class="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="loadingSuggestions" class="text-center py-8">
            <div class="text-muted-foreground">Loading suggestions...</div>
          </div>

          <div v-else-if="!filteredSuggestions.length" class="text-center py-8">
            <div class="text-muted-foreground">No suggestions found</div>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-muted/50">
                <tr>
                  <th class="px-4 py-3">
                    <input
                      type="checkbox"
                      :checked="allSelected"
                      @change="toggleSelectAll"
                      class="rounded"
                    />
                  </th>
                  <th class="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th class="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th class="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                  <th class="text-right px-4 py-3 font-medium text-muted-foreground">Quantity</th>
                  <th class="text-right px-4 py-3 font-medium text-muted-foreground">Due Date</th>
                  <th class="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th class="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border">
                <tr
                  v-for="suggestion in filteredSuggestions"
                  :key="suggestion.id"
                  class="hover:bg-muted/30"
                >
                  <td class="px-4 py-3">
                    <input
                      v-if="getStatusValue(suggestion.status) === 'pending'"
                      type="checkbox"
                      :checked="selectedSuggestionIds.has(suggestion.id)"
                      @change="toggleSuggestion(suggestion.id)"
                      class="rounded"
                    />
                  </td>
                  <td class="px-4 py-3">
                    <div class="font-medium text-foreground">
                      {{ suggestion.product?.name || `Product #${suggestion.product_id}` }}
                    </div>
                    <div class="text-xs text-muted-foreground">{{ suggestion.product?.sku }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <Badge :class="getSuggestionTypeLabel(suggestion.suggestion_type as any).color">
                      <component
                        :is="suggestion.suggestion_type === 'purchase' ? ShoppingCart
                          : suggestion.suggestion_type === 'work_order' ? Wrench
                          : Users"
                        class="w-3 h-3 mr-1"
                      />
                      {{ getSuggestionTypeLabel(suggestion.suggestion_type as any).label }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-foreground">{{ suggestion.action }}</td>
                  <td class="text-right px-4 py-3 font-mono text-foreground">
                    {{ formatNumber(suggestion.suggested_quantity) }}
                  </td>
                  <td class="text-right px-4 py-3 text-foreground">
                    {{ formatDate(suggestion.suggested_due_date) }}
                  </td>
                  <td class="px-4 py-3">
                    <Badge :class="getSuggestionStatusLabel(suggestion.status as any).color">
                      {{ getSuggestionStatusLabel(suggestion.status as any).label }}
                    </Badge>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div v-if="getStatusValue(suggestion.status) === 'pending'" class="flex items-center justify-end gap-1">
                      <Button
                        size="xs"
                        variant="ghost"
                        @click="handleAccept(suggestion)"
                        :loading="acceptMutation.isPending.value"
                        title="Accept"
                      >
                        <Check class="w-4 h-4 text-green-600" />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        @click="handleReject(suggestion)"
                        :loading="rejectMutation.isPending.value"
                        title="Reject"
                      >
                        <X class="w-4 h-4 text-destructive" />
                      </Button>
                      <!-- Convert dropdown -->
                      <div class="relative group">
                        <Button size="xs" variant="secondary" class="px-2">
                          Convert
                          <ChevronDown class="w-3 h-3 ml-1" />
                        </Button>
                        <div class="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            v-if="suggestion.suggestion_type === 'purchase'"
                            @click="handleConvert(suggestion, 'po')"
                            class="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                          >
                            <ShoppingCart class="w-4 h-4" />
                            To Purchase Order
                          </button>
                          <button
                            v-if="suggestion.suggestion_type === 'work_order'"
                            @click="handleConvert(suggestion, 'wo')"
                            class="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                          >
                            <Wrench class="w-4 h-4" />
                            To Work Order
                          </button>
                          <button
                            v-if="suggestion.suggestion_type === 'subcontract'"
                            @click="handleConvert(suggestion, 'scwo')"
                            class="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2"
                          >
                            <Users class="w-4 h-4" />
                            To Subcontractor WO
                          </button>
                        </div>
                      </div>
                    </div>
                    <span v-else-if="getStatusValue(suggestion.status) === 'converted'" class="text-muted-foreground text-xs">
                      Converted
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <!-- Settings Tab -->
      <div v-if="activeTab === 'settings'">
        <Card>
          <template #header>
            <h3 class="font-medium text-foreground">Run Configuration</h3>
          </template>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <div class="text-sm text-muted-foreground">Planning Horizon</div>
              <div class="font-medium text-foreground">
                {{ formatDate(mrpRun.planning_horizon_start || '') }} -
                {{ formatDate(mrpRun.planning_horizon_end || '') }}
              </div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground">Warehouse</div>
              <div class="font-medium text-foreground">
                {{ mrpRun.warehouse?.name || 'All Warehouses' }}
              </div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground">Include Safety Stock</div>
              <div class="font-medium text-foreground">
                {{ mrpParameters.include_safety_stock ? 'Yes' : 'No' }}
              </div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground">Respect MOQ</div>
              <div class="font-medium text-foreground">
                {{ mrpParameters.respect_moq ? 'Yes' : 'No' }}
              </div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground">Respect Order Multiple</div>
              <div class="font-medium text-foreground">
                {{ mrpParameters.respect_order_multiple ? 'Yes' : 'No' }}
              </div>
            </div>
            <div>
              <div class="text-sm text-muted-foreground">Created</div>
              <div class="font-medium text-foreground">
                {{ formatDate(mrpRun.created_at) }}
              </div>
            </div>
          </div>
          <div v-if="mrpRun.notes" class="mt-6 pt-6 border-t border-border">
            <div class="text-sm text-muted-foreground mb-2">Notes</div>
            <div class="text-foreground">{{ mrpRun.notes }}</div>
          </div>
        </Card>
      </div>
    </template>
  </div>
</template>
