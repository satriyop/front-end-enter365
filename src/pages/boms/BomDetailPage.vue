<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useBom,
  useActivateBom,
  useDeactivateBom,
  useDuplicateBom,
  useDeleteBom,
} from '@/api/useBoms'
import {
  useAvailableBrands,
  useSwapBomBrand,
  useSwapBrandPreview,
  useGenerateBrandVariants,
  useBrandComparison,
  useCostOptimizationPreview,
  useApplyCostOptimization,
  useItemAlternatives,
  useQuickSwapItem,
  type SwapReport,
  type SwapPreview,
  type CostOptimizationReport,
} from '@/api/useComponentStandards'
import { Check, TrendingDown, ArrowLeftRight, Loader2 } from 'lucide-vue-next'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Badge, Modal, Card, Input, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const bomId = computed(() => Number(route.params.id))

const { data: bom, isLoading, error } = useBom(bomId)

// Mutations
const activateMutation = useActivateBom()
const deactivateMutation = useDeactivateBom()
const duplicateMutation = useDuplicateBom()
const deleteMutation = useDeleteBom()
const swapBrandMutation = useSwapBomBrand()
const swapPreviewMutation = useSwapBrandPreview()
const generateVariantsMutation = useGenerateBrandVariants()

// Brand data
const { data: availableBrands } = useAvailableBrands()
const { data: brandComparison, isLoading: isLoadingComparison, refetch: refetchComparison } = useBrandComparison(bomId)

// Cost optimization
const { data: costOptimization, isLoading: isLoadingOptimization, refetch: refetchOptimization } = useCostOptimizationPreview(bomId)
const applyCostOptimizationMutation = useApplyCostOptimization()

// Best value brand recommendation
const bestValueBrand = computed(() => {
  if (!brandComparison.value?.recommendations?.best_value) return null
  return brandComparison.value.brands.find(
    b => b.brand === brandComparison.value?.recommendations.best_value
  ) || null
})

// Modal states
const showDeleteModal = ref(false)
const showSwapBrandModal = ref(false)
const showGenerateVariantsModal = ref(false)
const showSwapReportModal = ref(false)
const showCompareModal = ref(false)
const showOptimizeModal = ref(false)
const showOptimizationReportModal = ref(false)

// Brand swap state
const selectedBrand = ref('')
const selectedBrands = ref<string[]>([])
const variantGroupName = ref('')
const lastSwapReport = ref<SwapReport | null>(null)
const lastSwappedBomId = ref<number | null>(null)
const swapPreview = ref<SwapPreview | null>(null)

// Cost optimization state
const selectedOptimizations = ref<Set<number>>(new Set())
const lastOptimizationReport = ref<CostOptimizationReport | null>(null)
const lastOptimizedBomId = ref<number | null>(null)

// Quick Swap state
const showQuickSwapModal = ref(false)
const quickSwapItemId = ref<number>(0)
const quickSwapItem = ref<{ id: number; description: string; product_sku?: string } | null>(null)
const quickSwapMutation = useQuickSwapItem()

// Item alternatives (only fetch when modal is open)
const { data: itemAlternatives, isLoading: isLoadingAlternatives, refetch: refetchAlternatives } = useItemAlternatives(
  bomId,
  computed(() => quickSwapItemId.value)
)

// Fetch preview when brand is selected
watch(selectedBrand, async (brand) => {
  if (brand && bomId.value) {
    swapPreview.value = null
    try {
      swapPreview.value = await swapPreviewMutation.mutateAsync({
        bomId: bomId.value,
        targetBrand: brand
      })
    } catch {
      // Preview failed, will show without preview
    }
  } else {
    swapPreview.value = null
  }
})

// Action handlers
async function handleActivate() {
  try {
    await activateMutation.mutateAsync(bomId.value)
    toast.success('BOM activated successfully')
  } catch {
    toast.error('Failed to activate BOM')
  }
}

async function handleDeactivate() {
  try {
    await deactivateMutation.mutateAsync(bomId.value)
    toast.success('BOM deactivated')
  } catch {
    toast.error('Failed to deactivate BOM')
  }
}

async function handleDuplicate() {
  try {
    const newBom = await duplicateMutation.mutateAsync(bomId.value)
    toast.success('BOM duplicated')
    router.push(`/boms/${newBom.id}/edit`)
  } catch {
    toast.error('Failed to duplicate BOM')
  }
}

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(bomId.value)
    showDeleteModal.value = false
    toast.success('BOM deleted')
    router.push('/boms')
  } catch {
    toast.error('Failed to delete BOM')
  }
}

async function handleSwapBrand() {
  if (!selectedBrand.value) {
    toast.error('Please select a target brand')
    return
  }
  try {
    const result = await swapBrandMutation.mutateAsync({
      bomId: bomId.value,
      targetBrand: selectedBrand.value,
      createVariant: true
    })
    showSwapBrandModal.value = false
    lastSwapReport.value = result.data.swap_report
    lastSwappedBomId.value = result.data.bom.id
    showSwapReportModal.value = true
    toast.success(`Brand swap complete! New BOM: ${result.data.bom.bom_number}`)
    selectedBrand.value = ''
    swapPreview.value = null
  } catch {
    toast.error('Failed to swap brand')
  }
}

function viewSwappedBom() {
  if (lastSwappedBomId.value) {
    showSwapReportModal.value = false
    router.push(`/boms/${lastSwappedBomId.value}`)
  }
}

async function handleQuickSwap(brandCode: string) {
  try {
    const result = await swapBrandMutation.mutateAsync({
      bomId: bomId.value,
      targetBrand: brandCode,
      createVariant: true
    })
    showCompareModal.value = false
    lastSwapReport.value = result.data.swap_report
    lastSwappedBomId.value = result.data.bom.id
    showSwapReportModal.value = true
    toast.success(`Brand swap complete! New BOM: ${result.data.bom.bom_number}`)
  } catch {
    toast.error('Failed to swap brand')
  }
}

function openCompareModal() {
  showCompareModal.value = true
  refetchComparison()
}

function openOptimizeModal() {
  showOptimizeModal.value = true
  refetchOptimization()
  // Pre-select all optimizable items
  if (costOptimization.value) {
    selectedOptimizations.value = new Set(
      costOptimization.value.items
        .filter(item => item.can_optimize && !item.is_already_cheapest)
        .map(item => item.bom_item_id)
    )
  }
}

// Watch for optimization data to pre-select items
watch(costOptimization, (data) => {
  if (data && showOptimizeModal.value) {
    selectedOptimizations.value = new Set(
      data.items
        .filter(item => item.can_optimize && !item.is_already_cheapest)
        .map(item => item.bom_item_id)
    )
  }
})

function toggleOptimizationItem(itemId: number) {
  if (selectedOptimizations.value.has(itemId)) {
    selectedOptimizations.value.delete(itemId)
  } else {
    selectedOptimizations.value.add(itemId)
  }
  // Force reactivity
  selectedOptimizations.value = new Set(selectedOptimizations.value)
}

function selectAllOptimizations() {
  if (costOptimization.value) {
    selectedOptimizations.value = new Set(
      costOptimization.value.items
        .filter(item => item.can_optimize && !item.is_already_cheapest)
        .map(item => item.bom_item_id)
    )
  }
}

function deselectAllOptimizations() {
  selectedOptimizations.value = new Set()
}

// Computed for selected savings
const selectedSavings = computed(() => {
  if (!costOptimization.value) return { total: 0, count: 0 }
  const selected = costOptimization.value.items.filter(
    item => selectedOptimizations.value.has(item.bom_item_id)
  )
  return {
    total: selected.reduce((sum, item) => sum + item.savings, 0),
    count: selected.length
  }
})

async function handleApplyOptimization() {
  if (selectedOptimizations.value.size === 0) {
    toast.error('Please select at least one item to optimize')
    return
  }
  try {
    const result = await applyCostOptimizationMutation.mutateAsync({
      bomId: bomId.value,
      itemIds: Array.from(selectedOptimizations.value)
    })
    showOptimizeModal.value = false
    lastOptimizationReport.value = result.data.optimization_report
    lastOptimizedBomId.value = result.data.bom.id
    showOptimizationReportModal.value = true
    toast.success(`Optimization applied! New BOM: ${result.data.bom.bom_number}`)
    selectedOptimizations.value = new Set()
  } catch {
    toast.error('Failed to apply optimization')
  }
}

function viewOptimizedBom() {
  if (lastOptimizedBomId.value) {
    showOptimizationReportModal.value = false
    router.push(`/boms/${lastOptimizedBomId.value}`)
  }
}

// Quick Swap handlers
function openQuickSwapModal(item: { id: number; description: string; product?: { sku?: string }; component_standard_id?: number | null }) {
  if (!item.component_standard_id) {
    toast.info('This item has no component standard mapping')
    return
  }
  quickSwapItem.value = {
    id: item.id,
    description: item.description,
    product_sku: item.product?.sku
  }
  quickSwapItemId.value = item.id
  showQuickSwapModal.value = true
  refetchAlternatives()
}

async function handleQuickSwapToProduct(productId: number) {
  if (!quickSwapItemId.value) return

  try {
    await quickSwapMutation.mutateAsync({
      bomId: bomId.value,
      itemId: quickSwapItemId.value,
      productId,
      reason: 'quick_swap'
    })
    showQuickSwapModal.value = false
    quickSwapItemId.value = 0
    quickSwapItem.value = null
    toast.success('Item berhasil diganti')
  } catch {
    toast.error('Failed to swap item')
  }
}

async function handleGenerateVariants() {
  if (selectedBrands.value.length === 0) {
    toast.error('Please select at least one brand')
    return
  }
  try {
    const result = await generateVariantsMutation.mutateAsync({
      bomId: bomId.value,
      brands: selectedBrands.value,
      groupName: variantGroupName.value || undefined
    })
    showGenerateVariantsModal.value = false
    toast.success(`Generated ${result.data.boms.length} brand variants!`)
    selectedBrands.value = []
    variantGroupName.value = ''
    // Navigate to variant group
    router.push(`/boms?variant_group=${result.data.variant_group.id}`)
  } catch {
    toast.error('Failed to generate variants')
  }
}

function toggleBrandSelection(brandCode: string) {
  const index = selectedBrands.value.indexOf(brandCode)
  if (index === -1) {
    selectedBrands.value.push(brandCode)
  } else {
    selectedBrands.value.splice(index, 1)
  }
}

// Status-based action availability
const canEdit = computed(() => bom.value?.status === 'draft')
const canActivate = computed(() => bom.value?.status === 'draft')
const canDeactivate = computed(() => bom.value?.status === 'active')
const canDelete = computed(() => bom.value?.status === 'draft')

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'destructive' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'destructive'> = {
    draft: 'default',
    active: 'success',
    inactive: 'warning',
  }
  return map[status] || 'default'
}

function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    material: 'text-blue-600 bg-blue-50',
    labor: 'text-purple-600 bg-purple-50',
    overhead: 'text-orange-600 bg-orange-50',
  }
  return map[type] || 'text-slate-600 bg-slate-50'
}

// Cost breakdown percentages
const costBreakdown = computed(() => {
  if (!bom.value || bom.value.total_cost === 0) return null
  const total = bom.value.total_cost
  return {
    material: ((bom.value.total_material_cost / total) * 100).toFixed(1),
    labor: ((bom.value.total_labor_cost / total) * 100).toFixed(1),
    overhead: ((bom.value.total_overhead_cost / total) * 100).toFixed(1),
  }
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
      Failed to load BOM
    </div>

    <!-- Content -->
    <template v-else-if="bom">
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 mb-4">
        <RouterLink to="/boms" class="hover:text-slate-700">Bill of Materials</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-slate-900">{{ bom.bom_number }}</span>
      </div>

      <!-- Header -->
      <Card class="mb-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900">
                {{ bom.bom_number }}
              </h1>
              <Badge :variant="getStatusVariant(bom.status)">
                {{ bom.status }}
              </Badge>
              <span v-if="bom.version > 1" class="text-sm text-slate-500">
                v{{ bom.version }}
              </span>
            </div>
            <p class="text-slate-500">{{ bom.name }}</p>
            <p v-if="bom.product" class="text-sm text-slate-600 mt-1">
              Product: <span class="font-medium">{{ bom.product.name }}</span>
              <span v-if="bom.product.sku" class="text-slate-400">({{ bom.product.sku }})</span>
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <!-- Brand Swap Buttons (Primary Feature) -->
            <Button
              variant="success"
              size="sm"
              @click="openOptimizeModal"
            >
              <TrendingDown class="w-4 h-4 mr-1" />
              Optimize Cost
            </Button>
            <Button
              size="sm"
              @click="openCompareModal"
            >
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare Brands
            </Button>
            <Button
              variant="secondary"
              size="sm"
              @click="showSwapBrandModal = true"
            >
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Swap Brand
            </Button>
            <Button
              variant="secondary"
              size="sm"
              @click="showGenerateVariantsModal = true"
            >
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Generate Variants
            </Button>

            <div class="w-px h-6 bg-slate-200 self-center mx-1"></div>

            <Button
              variant="ghost"
              size="sm"
              :loading="duplicateMutation.isPending.value"
              @click="handleDuplicate"
            >
              Duplicate
            </Button>

            <RouterLink v-if="canEdit" :to="`/boms/${bomId}/edit`">
              <Button variant="secondary" size="sm">Edit</Button>
            </RouterLink>

            <Button
              v-if="canActivate"
              variant="success"
              size="sm"
              :loading="activateMutation.isPending.value"
              @click="handleActivate"
            >
              Activate
            </Button>

            <Button
              v-if="canDeactivate"
              variant="secondary"
              size="sm"
              :loading="deactivateMutation.isPending.value"
              @click="handleDeactivate"
            >
              Deactivate
            </Button>

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

      <!-- Content Grid -->
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
                <dt class="text-sm text-slate-500">Output Quantity</dt>
                <dd class="font-medium text-slate-900">
                  {{ bom.output_quantity }} {{ bom.output_unit }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Unit Cost</dt>
                <dd class="font-medium text-slate-900">{{ formatCurrency(bom.unit_cost) }}</dd>
              </div>
              <div v-if="bom.variant_label">
                <dt class="text-sm text-slate-500">Variant</dt>
                <dd class="font-medium text-slate-900">{{ bom.variant_label }}</dd>
              </div>
              <div v-if="bom.creator">
                <dt class="text-sm text-slate-500">Created By</dt>
                <dd class="font-medium text-slate-900">{{ bom.creator.name }}</dd>
              </div>
              <div v-if="bom.description" class="col-span-2">
                <dt class="text-sm text-slate-500">Description</dt>
                <dd class="font-medium text-slate-900">{{ bom.description }}</dd>
              </div>
            </dl>
          </Card>

          <!-- BOM Items Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">BOM Items</h2>
            </template>

            <div class="overflow-x-auto -mx-6">
              <table class="w-full">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Unit Cost</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                    <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase w-20"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr v-for="item in bom.items" :key="item.id">
                    <td class="px-6 py-4">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize"
                        :class="getTypeColor(item.type)"
                      >
                        {{ item.type }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="font-medium text-slate-900">
                        {{ item.product?.name || item.description }}
                      </div>
                      <div v-if="item.product?.sku" class="text-sm text-slate-500">
                        {{ item.product.sku }}
                      </div>
                      <div v-if="item.waste_percentage > 0" class="text-xs text-orange-600">
                        +{{ item.waste_percentage }}% waste allowance
                      </div>
                    </td>
                    <td class="px-6 py-4 text-right text-slate-900">
                      {{ item.quantity }} {{ item.unit }}
                    </td>
                    <td class="px-6 py-4 text-right text-slate-900">
                      {{ formatCurrency(item.unit_cost) }}
                    </td>
                    <td class="px-6 py-4 text-right font-medium text-slate-900">
                      {{ formatCurrency(item.total_cost) }}
                    </td>
                    <td class="px-6 py-4 text-center">
                      <button
                        v-if="item.component_standard_id"
                        type="button"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                        title="Swap to equivalent product"
                        @click="openQuickSwapModal(item)"
                      >
                        <ArrowLeftRight class="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="!bom.items?.length" class="py-8 text-center text-slate-500">
              No items in this BOM
            </div>
          </Card>

          <!-- Notes -->
          <Card v-if="bom.notes">
            <template #header>
              <h2 class="font-semibold text-slate-900">Notes</h2>
            </template>
            <p class="text-slate-600 whitespace-pre-line">{{ bom.notes }}</p>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Cost Summary Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Cost Summary</h2>
            </template>

            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500 flex items-center gap-2">
                  <span class="w-3 h-3 rounded bg-blue-500"></span>
                  Materials
                </dt>
                <dd class="font-medium text-slate-900">
                  {{ formatCurrency(bom.total_material_cost) }}
                  <span v-if="costBreakdown" class="text-sm text-slate-500">
                    ({{ costBreakdown.material }}%)
                  </span>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 flex items-center gap-2">
                  <span class="w-3 h-3 rounded bg-purple-500"></span>
                  Labor
                </dt>
                <dd class="font-medium text-slate-900">
                  {{ formatCurrency(bom.total_labor_cost) }}
                  <span v-if="costBreakdown" class="text-sm text-slate-500">
                    ({{ costBreakdown.labor }}%)
                  </span>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 flex items-center gap-2">
                  <span class="w-3 h-3 rounded bg-orange-500"></span>
                  Overhead
                </dt>
                <dd class="font-medium text-slate-900">
                  {{ formatCurrency(bom.total_overhead_cost) }}
                  <span v-if="costBreakdown" class="text-sm text-slate-500">
                    ({{ costBreakdown.overhead }}%)
                  </span>
                </dd>
              </div>
              <hr class="border-slate-200" />
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900">Total Cost</dt>
                <dd class="font-bold text-lg text-slate-900">
                  {{ formatCurrency(bom.total_cost) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900">Unit Cost</dt>
                <dd class="font-bold text-lg text-orange-600">
                  {{ formatCurrency(bom.unit_cost) }}
                </dd>
              </div>
            </dl>

            <!-- Cost Breakdown Bar -->
            <div v-if="costBreakdown" class="mt-4">
              <div class="h-3 rounded-full overflow-hidden flex bg-slate-100">
                <div
                  class="bg-blue-500"
                  :style="{ width: `${costBreakdown.material}%` }"
                ></div>
                <div
                  class="bg-purple-500"
                  :style="{ width: `${costBreakdown.labor}%` }"
                ></div>
                <div
                  class="bg-orange-500"
                  :style="{ width: `${costBreakdown.overhead}%` }"
                ></div>
              </div>
            </div>
          </Card>

          <!-- Activity Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Activity</h2>
            </template>
            <ul class="space-y-3 text-sm">
              <li v-if="bom.approved_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                <div>
                  <p class="text-slate-900">Activated</p>
                  <p class="text-slate-500">{{ formatDate(bom.approved_at) }}</p>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-slate-300"></div>
                <div>
                  <p class="text-slate-900">Created</p>
                  <p class="text-slate-500">{{ formatDate(bom.created_at) }}</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </template>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete BOM" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600">
        Are you sure you want to delete this BOM? This action cannot be undone.
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

    <!-- Swap Brand Modal -->
    <Modal :open="showSwapBrandModal" title="Swap Brand" size="lg" @update:open="showSwapBrandModal = $event">
      <div class="space-y-4">
        <!-- Brand Selection -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Select Target Brand</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="brand in availableBrands"
              :key="brand.code"
              type="button"
              class="px-3 py-2 rounded-lg border-2 text-left transition-colors"
              :class="selectedBrand === brand.code
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-slate-200 hover:border-slate-300'"
              @click="selectedBrand = brand.code"
            >
              <div class="font-medium text-sm">{{ brand.name }}</div>
            </button>
          </div>
        </div>

        <!-- Preview Loading -->
        <div v-if="swapPreviewMutation.isPending.value" class="py-6 text-center">
          <div class="flex items-center justify-center gap-2 text-slate-500">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Calculating price impact...</span>
          </div>
        </div>

        <!-- Preview Results -->
        <div v-else-if="swapPreview" class="space-y-4">
          <!-- Price Summary -->
          <div class="bg-slate-50 rounded-xl p-4">
            <div class="grid grid-cols-3 gap-3 text-center">
              <div class="min-w-0">
                <div class="text-xs text-slate-500">Current Total</div>
                <div class="text-base font-semibold text-slate-900 truncate">{{ formatCurrency(swapPreview.current_total) }}</div>
              </div>
              <div class="min-w-0">
                <div class="text-xs text-slate-500">After Swap</div>
                <div class="text-base font-semibold text-slate-900 truncate">{{ formatCurrency(swapPreview.estimated_total) }}</div>
              </div>
              <div class="min-w-0">
                <div class="text-xs text-slate-500">{{ swapPreview.savings >= 0 ? 'Savings' : 'Increase' }}</div>
                <div
                  class="text-base font-bold truncate"
                  :class="swapPreview.savings >= 0 ? 'text-green-600' : 'text-red-600'"
                >
                  {{ swapPreview.savings >= 0 ? '' : '+' }}{{ formatCurrency(Math.abs(swapPreview.savings)) }}
                </div>
                <div class="text-xs" :class="swapPreview.savings >= 0 ? 'text-green-500' : 'text-red-500'">
                  ({{ swapPreview.savings >= 0 ? '-' : '+' }}{{ Math.abs(swapPreview.savings_percentage) }}%)
                </div>
              </div>
            </div>
          </div>

          <!-- Coverage Info -->
          <div class="flex items-center gap-4 text-sm">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-green-500"></div>
              <span>{{ swapPreview.coverage.swappable }} items can be swapped</span>
            </div>
            <div v-if="swapPreview.coverage.no_mapping > 0" class="flex items-center gap-2 text-amber-600">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{{ swapPreview.coverage.no_mapping }} items have no equivalent</span>
            </div>
          </div>

          <!-- Item Preview (collapsible) -->
          <details class="group">
            <summary class="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
              View item details
              <span class="ml-1 text-slate-400 group-open:hidden">▶</span>
              <span class="ml-1 text-slate-400 hidden group-open:inline">▼</span>
            </summary>
            <div class="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 sticky top-0">
                  <tr>
                    <th class="px-3 py-2 text-left text-xs font-medium text-slate-500">Item</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-slate-500">Current</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-slate-500">New</th>
                    <th class="px-3 py-2 text-right text-xs font-medium text-slate-500">Change</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(item, idx) in swapPreview.items" :key="idx" :class="!item.can_swap ? 'bg-amber-50' : ''">
                    <td class="px-3 py-2">
                      <div class="font-medium text-slate-900 truncate max-w-[200px]">{{ item.description }}</div>
                      <div v-if="item.target_sku" class="text-xs text-slate-400">→ {{ item.target_sku }}</div>
                      <div v-else class="text-xs text-amber-600">No equivalent</div>
                    </td>
                    <td class="px-3 py-2 text-right text-slate-600">{{ formatCurrency(item.current_total) }}</td>
                    <td class="px-3 py-2 text-right text-slate-600">{{ formatCurrency(item.estimated_total) }}</td>
                    <td class="px-3 py-2 text-right">
                      <span
                        v-if="item.cost_change !== 0"
                        :class="item.cost_change < 0 ? 'text-green-600' : 'text-red-600'"
                      >
                        {{ item.cost_change < 0 ? '' : '+' }}{{ formatCurrency(item.cost_change) }}
                      </span>
                      <span v-else class="text-slate-400">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </details>
        </div>

        <!-- No brand selected -->
        <div v-else-if="!selectedBrand" class="py-6 text-center text-slate-500">
          Select a brand above to see price comparison
        </div>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showSwapBrandModal = false; selectedBrand = ''">Cancel</Button>
        <Button
         
          :loading="swapBrandMutation.isPending.value"
          :disabled="!selectedBrand || swapPreviewMutation.isPending.value"
          @click="handleSwapBrand"
        >
          <template v-if="swapPreview && swapPreview.savings > 0">
            Swap & Save {{ Math.abs(swapPreview.savings_percentage) }}%
          </template>
          <template v-else-if="swapPreview">
            Swap to {{ availableBrands?.find(b => b.code === selectedBrand)?.name }}
          </template>
          <template v-else>
            Select a Brand
          </template>
        </Button>
      </template>
    </Modal>

    <!-- Generate Variants Modal -->
    <Modal :open="showGenerateVariantsModal" title="Generate Brand Variants" @update:open="showGenerateVariantsModal = $event">
      <div class="space-y-4">
        <p class="text-slate-600">
          Generate multiple BOM variants at once by selecting the target brands.
          All variants will be grouped together for easy comparison.
        </p>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Select Brands</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="brand in availableBrands"
              :key="brand.code"
              type="button"
              class="px-4 py-3 rounded-lg border-2 text-left transition-colors"
              :class="selectedBrands.includes(brand.code)
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-slate-200 hover:border-slate-300'"
              @click="toggleBrandSelection(brand.code)"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-5 h-5 rounded border-2 flex items-center justify-center"
                  :class="selectedBrands.includes(brand.code)
                    ? 'bg-orange-500 border-orange-500'
                    : 'border-slate-300'"
                >
                  <svg v-if="selectedBrands.includes(brand.code)" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="font-medium">{{ brand.name }}</div>
              </div>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Variant Group Name (Optional)</label>
          <Input
            v-model="variantGroupName"
            placeholder="e.g., Panel MDP Lantai 1 - Brand Options"
          />
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showGenerateVariantsModal = false">Cancel</Button>
        <Button
         
          :loading="generateVariantsMutation.isPending.value"
          :disabled="selectedBrands.length === 0"
          @click="handleGenerateVariants"
        >
          Generate {{ selectedBrands.length }} Variant{{ selectedBrands.length !== 1 ? 's' : '' }}
        </Button>
      </template>
    </Modal>

    <!-- Swap Report Modal -->
    <Modal :open="showSwapReportModal" title="Swap Report" size="lg" @update:open="showSwapReportModal = $event">
      <div v-if="lastSwapReport" class="space-y-4">
        <!-- Summary -->
        <div class="grid grid-cols-4 gap-2">
          <div class="bg-slate-50 rounded-lg p-3 text-center min-w-0">
            <div class="text-xl font-bold text-slate-900">{{ lastSwapReport.total_items }}</div>
            <div class="text-xs text-slate-500">Total</div>
          </div>
          <div class="bg-green-50 rounded-lg p-3 text-center min-w-0">
            <div class="text-xl font-bold text-green-600">{{ lastSwapReport.swapped }}</div>
            <div class="text-xs text-green-600">Swapped</div>
          </div>
          <div class="bg-yellow-50 rounded-lg p-3 text-center min-w-0">
            <div class="text-xl font-bold text-yellow-600">{{ lastSwapReport.partial_match }}</div>
            <div class="text-xs text-yellow-600">Partial</div>
          </div>
          <div class="bg-red-50 rounded-lg p-3 text-center min-w-0">
            <div class="text-xl font-bold text-red-600">{{ lastSwapReport.no_mapping }}</div>
            <div class="text-xs text-red-600">No Map</div>
          </div>
        </div>

        <!-- Item Details -->
        <div v-if="lastSwapReport.items?.length" class="max-h-64 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Original</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">New</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Cost Change</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="(item, index) in lastSwapReport.items" :key="index">
                <td class="px-3 py-2">
                  <Badge
                    :variant="item.status === 'swapped' ? 'success' : item.status === 'partial_match' ? 'warning' : 'destructive'"
                  >
                    {{ item.status === 'swapped' ? 'Swapped' : item.status === 'partial_match' ? 'Partial' : 'No Map' }}
                  </Badge>
                </td>
                <td class="px-3 py-2">
                  <div class="text-slate-900">{{ item.original.description }}</div>
                  <div class="text-xs text-slate-400">{{ formatCurrency(item.original.unit_cost) }}</div>
                </td>
                <td class="px-3 py-2">
                  <template v-if="item.new">
                    <div class="text-slate-900">{{ item.new.description }}</div>
                    <div class="text-xs text-slate-400">{{ item.new.brand_sku }}</div>
                  </template>
                  <span v-else class="text-slate-400">-</span>
                </td>
                <td class="px-3 py-2 text-right">
                  <template v-if="item.new">
                    <span
                      :class="item.new.unit_cost > item.original.unit_cost
                        ? 'text-red-600'
                        : item.new.unit_cost < item.original.unit_cost
                          ? 'text-green-600'
                          : 'text-slate-500'"
                    >
                      {{ item.new.unit_cost > item.original.unit_cost ? '+' : '' }}{{ formatCurrency(item.new.unit_cost - item.original.unit_cost) }}
                    </span>
                  </template>
                  <span v-else class="text-slate-400">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showSwapReportModal = false">Close</Button>
        <Button @click="viewSwappedBom">
          View New BOM
        </Button>
      </template>
    </Modal>

    <!-- Brand Comparison Modal -->
    <Modal :open="showCompareModal" title="Compare All Brands" size="xl" @update:open="showCompareModal = $event">
      <div class="space-y-4">
        <!-- Loading state -->
        <div v-if="isLoadingComparison" class="py-12 text-center">
          <div class="flex items-center justify-center gap-2 text-slate-500">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Comparing all brands...</span>
          </div>
        </div>

        <!-- Comparison content -->
        <template v-else-if="brandComparison">
          <!-- Current BOM Summary -->
          <div class="bg-slate-50 rounded-xl p-4">
            <div class="flex items-center justify-between gap-4">
              <div class="min-w-0 flex-1">
                <div class="text-xs text-slate-500">Current BOM Total</div>
                <div class="text-xl font-bold text-slate-900 truncate">{{ formatCurrency(brandComparison.current.total) }}</div>
              </div>
              <div class="text-right min-w-0">
                <div class="text-xs text-slate-500">Total Items</div>
                <div class="text-xl font-bold text-slate-900">{{ brandComparison.current.total_items }}</div>
              </div>
            </div>
          </div>

          <!-- Recommendation -->
          <div v-if="bestValueBrand" class="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div class="font-medium text-green-800">
                Best Value: {{ bestValueBrand.brand_label }}
              </div>
              <div class="text-sm text-green-600">
                Save {{ formatCurrency(bestValueBrand.savings) }}
                with {{ bestValueBrand.coverage_percentage }}% coverage
              </div>
            </div>
          </div>

          <!-- Brand Comparison Table -->
          <div class="overflow-x-auto rounded-lg border border-slate-200">
            <table class="w-full">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Brand</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Est. Total</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Savings</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Coverage</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr
                  v-for="(item, index) in brandComparison.brands"
                  :key="item.brand"
                  :class="index === 0 ? 'bg-green-50/50' : ''"
                >
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-slate-900">{{ item.brand_label }}</span>
                      <Badge v-if="index === 0" variant="success" class="text-xs">Best Value</Badge>
                    </div>
                    <div class="text-xs text-slate-500 mt-0.5">
                      {{ item.swappable_items }} swappable, {{ item.no_mapping_items }} unmapped
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="font-semibold text-slate-900">{{ formatCurrency(item.estimated_total) }}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span
                      v-if="item.savings > 0"
                      class="font-medium text-green-600"
                    >
                      -{{ formatCurrency(item.savings) }}
                      <span class="text-xs">({{ item.savings_percentage }}%)</span>
                    </span>
                    <span
                      v-else-if="item.savings < 0"
                      class="font-medium text-red-600"
                    >
                      +{{ formatCurrency(Math.abs(item.savings)) }}
                      <span class="text-xs">({{ Math.abs(item.savings_percentage) }}%)</span>
                    </span>
                    <span v-else class="text-slate-400">-</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-center gap-2">
                      <div class="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full"
                          :class="item.coverage_percentage >= 80 ? 'bg-green-500' : item.coverage_percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'"
                          :style="{ width: `${item.coverage_percentage}%` }"
                        ></div>
                      </div>
                      <span class="text-sm text-slate-600">{{ item.coverage_percentage }}%</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      :loading="swapBrandMutation.isPending.value"
                      @click="handleQuickSwap(item.brand)"
                    >
                      Swap
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Info Note -->
          <p class="text-xs text-slate-500 text-center">
            Brands are sorted by potential savings. Coverage shows % of items that can be swapped to each brand.
          </p>
        </template>

        <!-- No data -->
        <div v-else class="py-12 text-center text-slate-500">
          Unable to load brand comparison data.
        </div>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showCompareModal = false">Close</Button>
      </template>
    </Modal>

    <!-- Cost Optimization Modal -->
    <Modal :open="showOptimizeModal" title="Cost Optimization" size="xl" @update:open="showOptimizeModal = $event">
      <div class="space-y-4">
        <!-- Loading state -->
        <div v-if="isLoadingOptimization" class="py-12 text-center">
          <div class="flex items-center justify-center gap-2 text-muted-foreground">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Analyzing cost optimization opportunities...</span>
          </div>
        </div>

        <template v-else-if="costOptimization">
          <!-- Summary Cards -->
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-white rounded-xl p-4 border border-slate-200">
              <div class="text-xs text-slate-500 mb-1">Current Total</div>
              <div class="text-lg font-bold text-slate-900 truncate">{{ formatCurrency(costOptimization.current_total) }}</div>
            </div>
            <div class="bg-white rounded-xl p-4 border border-slate-200">
              <div class="text-xs text-slate-500 mb-1">Optimized Total</div>
              <div class="text-lg font-bold text-slate-900 truncate">{{ formatCurrency(costOptimization.optimized_total) }}</div>
            </div>
            <div class="bg-green-50 rounded-xl p-4 border border-green-200">
              <div class="text-xs text-green-600 mb-1">Potential Savings</div>
              <div class="text-lg font-bold text-green-600 truncate">{{ formatCurrency(costOptimization.savings) }}</div>
              <div class="text-sm text-green-500">({{ costOptimization.savings_percentage }}%)</div>
            </div>
          </div>

          <!-- Selection Controls -->
          <div class="flex items-center justify-between border-b border-slate-200 pb-3">
            <div class="flex items-center gap-4">
              <button
                type="button"
                class="text-sm text-primary hover:underline"
                @click="selectAllOptimizations"
              >
                Select All
              </button>
              <button
                type="button"
                class="text-sm text-muted-foreground hover:underline"
                @click="deselectAllOptimizations"
              >
                Deselect All
              </button>
            </div>
            <div class="text-sm text-muted-foreground">
              {{ costOptimization.summary.can_optimize }} of {{ costOptimization.summary.total_items }} items optimizable
            </div>
          </div>

          <!-- Items List -->
          <div class="max-h-80 overflow-y-auto space-y-2">
            <div
              v-for="item in costOptimization.items"
              :key="item.bom_item_id"
              class="rounded-lg border p-3 transition-colors"
              :class="{
                'border-green-300 bg-green-50': selectedOptimizations.has(item.bom_item_id),
                'border-border bg-card': !selectedOptimizations.has(item.bom_item_id) && item.can_optimize && !item.is_already_cheapest,
                'border-border bg-muted/50 opacity-60': !item.can_optimize || item.is_already_cheapest
              }"
            >
              <div class="flex items-start gap-3">
                <!-- Checkbox -->
                <button
                  v-if="item.can_optimize && !item.is_already_cheapest"
                  type="button"
                  class="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  :class="selectedOptimizations.has(item.bom_item_id)
                    ? 'bg-green-500 border-green-500'
                    : 'border-border hover:border-green-400'"
                  @click="toggleOptimizationItem(item.bom_item_id)"
                >
                  <Check v-if="selectedOptimizations.has(item.bom_item_id)" class="w-3 h-3 text-white" />
                </button>
                <div v-else class="mt-0.5 w-5 h-5 rounded border-2 border-border bg-muted flex-shrink-0" />

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium truncate">{{ item.description }}</span>
                    <span class="text-xs text-muted-foreground">×{{ item.quantity }}</span>
                  </div>
                  <div class="flex items-center gap-2 mt-1 text-sm">
                    <span class="text-muted-foreground">{{ item.current_brand || 'Unknown' }}</span>
                    <span v-if="item.can_optimize && !item.is_already_cheapest" class="text-muted-foreground">→</span>
                    <span v-if="item.can_optimize && !item.is_already_cheapest" class="text-green-600 font-medium">
                      {{ item.cheapest_brand_label }}
                    </span>
                    <Badge v-if="item.is_already_cheapest" variant="success" class="text-xs">Already Cheapest</Badge>
                    <Badge v-else-if="!item.can_optimize" variant="warning" class="text-xs">No Alternative</Badge>
                  </div>
                </div>

                <!-- Price & Savings -->
                <div class="text-right flex-shrink-0">
                  <div class="text-sm">
                    <span class="text-muted-foreground">{{ formatCurrency(item.current_unit_cost) }}</span>
                    <span v-if="item.can_optimize && !item.is_already_cheapest" class="text-muted-foreground mx-1">→</span>
                    <span v-if="item.can_optimize && !item.is_already_cheapest" class="text-foreground">
                      {{ formatCurrency(item.cheapest_unit_cost) }}
                    </span>
                  </div>
                  <div v-if="item.savings > 0" class="text-green-600 font-medium text-sm">
                    Save {{ formatCurrency(item.savings) }}
                  </div>
                </div>
              </div>

              <!-- Savings Bar -->
              <div v-if="item.savings > 0 && costOptimization.savings > 0" class="mt-2 flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    class="h-full bg-green-500 rounded-full"
                    :style="{ width: `${(item.savings / costOptimization.savings) * 100}%` }"
                  />
                </div>
                <span class="text-xs text-muted-foreground">{{ item.savings_percentage }}%</span>
              </div>
            </div>
          </div>

          <!-- Selected Summary -->
          <div v-if="selectedSavings.count > 0" class="bg-green-50 border border-green-200 rounded-lg p-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Check class="w-5 h-5 text-green-600" />
                <span class="font-medium text-green-800">
                  {{ selectedSavings.count }} items selected
                </span>
              </div>
              <div class="text-green-800 font-bold">
                Save {{ formatCurrency(selectedSavings.total) }}
              </div>
            </div>
          </div>
        </template>

        <!-- No data -->
        <div v-else class="py-12 text-center text-muted-foreground">
          Unable to load optimization data.
        </div>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showOptimizeModal = false">Cancel</Button>
        <Button
          variant="success"
          :loading="applyCostOptimizationMutation.isPending.value"
          :disabled="selectedOptimizations.size === 0"
          @click="handleApplyOptimization"
        >
          Create Optimized BOM
          <span v-if="selectedSavings.total > 0" class="ml-1">
            (Save {{ formatCurrency(selectedSavings.total) }})
          </span>
        </Button>
      </template>
    </Modal>

    <!-- Optimization Report Modal -->
    <Modal :open="showOptimizationReportModal" title="Optimization Report" size="lg" @update:open="showOptimizationReportModal = $event">
      <div v-if="lastOptimizationReport" class="space-y-4">
        <!-- Summary -->
        <div class="grid grid-cols-3 gap-3">
          <div class="bg-white rounded-lg p-4 text-center border border-slate-200 min-w-0">
            <div class="text-xl font-bold text-slate-900 truncate">{{ lastOptimizationReport.total_items }}</div>
            <div class="text-xs text-slate-500">Total Items</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center border border-green-200 min-w-0">
            <div class="text-xl font-bold text-green-600 truncate">{{ lastOptimizationReport.optimized }}</div>
            <div class="text-xs text-green-600">Optimized</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center border border-green-200 min-w-0">
            <div class="text-xl font-bold text-green-600 truncate" :title="formatCurrency(lastOptimizationReport.total_savings)">{{ formatCurrency(lastOptimizationReport.total_savings) }}</div>
            <div class="text-xs text-green-600">Total Savings</div>
          </div>
        </div>

        <!-- Item Details -->
        <div v-if="lastOptimizationReport.items?.length" class="max-h-64 overflow-y-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Original</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">New</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Savings</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr v-for="(item, index) in lastOptimizationReport.items" :key="index">
                <td class="px-3 py-2">
                  <Badge
                    :variant="item.status === 'optimized' ? 'success' : item.status === 'already_cheapest' ? 'info' : 'warning'"
                  >
                    {{ item.status === 'optimized' ? 'Optimized' : item.status === 'already_cheapest' ? 'Already Best' : 'No Alt' }}
                  </Badge>
                </td>
                <td class="px-3 py-2">
                  <div>{{ item.original.description }}</div>
                  <div class="text-xs text-muted-foreground">{{ formatCurrency(item.original.unit_cost) }}</div>
                </td>
                <td class="px-3 py-2">
                  <template v-if="item.new">
                    <div>{{ item.new.description }}</div>
                    <div class="text-xs text-muted-foreground">{{ item.new.brand_label }} • {{ formatCurrency(item.new.unit_cost) }}</div>
                  </template>
                  <span v-else class="text-muted-foreground">-</span>
                </td>
                <td class="px-3 py-2 text-right">
                  <span v-if="item.savings > 0" class="text-green-600 font-medium">
                    {{ formatCurrency(item.savings) }}
                  </span>
                  <span v-else class="text-muted-foreground">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showOptimizationReportModal = false">Close</Button>
        <Button @click="viewOptimizedBom">
          View Optimized BOM
        </Button>
      </template>
    </Modal>

    <!-- Quick Swap Modal -->
    <Modal :open="showQuickSwapModal" title="Swap Item" size="lg" @update:open="showQuickSwapModal = $event">
      <div class="space-y-4">
        <!-- Current Item -->
        <div v-if="quickSwapItem" class="bg-slate-50 rounded-lg p-4">
          <div class="text-xs text-slate-500 mb-1">Current Item</div>
          <div class="font-medium text-slate-900">{{ quickSwapItem.description }}</div>
          <div v-if="quickSwapItem.product_sku" class="text-sm text-slate-500">{{ quickSwapItem.product_sku }}</div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingAlternatives" class="py-8 text-center">
          <div class="flex items-center justify-center gap-2 text-slate-500">
            <Loader2 class="w-5 h-5 animate-spin" />
            <span>Loading alternatives...</span>
          </div>
        </div>

        <!-- Alternatives List -->
        <template v-else-if="itemAlternatives">
          <!-- Current Product Info -->
          <div v-if="itemAlternatives.current" class="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Check class="w-4 h-4 text-orange-600" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-orange-800 truncate">{{ itemAlternatives.current.product_name }}</div>
              <div class="text-sm text-orange-600">{{ itemAlternatives.current.brand_label }} • {{ formatCurrency(itemAlternatives.current.unit_cost) }}</div>
            </div>
            <Badge variant="warning">Current</Badge>
          </div>

          <!-- No alternatives message -->
          <div v-if="!itemAlternatives.alternatives?.length" class="py-6 text-center text-slate-500">
            No alternative products available for this item.
          </div>

          <!-- Alternatives -->
          <div v-else class="space-y-2">
            <div class="text-sm font-medium text-slate-700">Available Alternatives</div>
            <div class="max-h-64 overflow-y-auto space-y-2">
              <button
                v-for="alt in itemAlternatives.alternatives"
                :key="alt.product_id"
                type="button"
                class="w-full p-3 rounded-lg border-2 text-left transition-all hover:border-orange-300 hover:bg-orange-50/50"
                :class="alt.is_preferred ? 'border-green-300 bg-green-50/50' : 'border-slate-200'"
                :disabled="quickSwapMutation.isPending.value"
                @click="handleQuickSwapToProduct(alt.product_id)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-slate-900 truncate">{{ alt.product_name }}</span>
                      <Badge v-if="alt.is_preferred" variant="success" class="text-xs">Preferred</Badge>
                      <Badge v-if="alt.is_verified" variant="info" class="text-xs">Verified</Badge>
                    </div>
                    <div class="text-sm text-slate-500 mt-0.5">
                      {{ alt.brand_label }} • {{ alt.product_sku }}
                    </div>
                    <div v-if="alt.stock !== null" class="text-xs text-slate-400 mt-1">
                      Stock: {{ alt.stock }} units
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <div class="font-semibold text-slate-900">{{ formatCurrency(alt.unit_cost) }}</div>
                    <div
                      v-if="alt.price_diff !== 0"
                      class="text-sm font-medium"
                      :class="alt.price_diff < 0 ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ alt.price_diff < 0 ? '' : '+' }}{{ formatCurrency(alt.price_diff) }}
                      <span class="text-xs">({{ alt.price_diff_percent > 0 ? '+' : '' }}{{ alt.price_diff_percent.toFixed(1) }}%)</span>
                    </div>
                    <div v-else class="text-sm text-slate-400">Same price</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- No Standard Info -->
          <div v-if="!itemAlternatives.has_standard" class="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
            This item has no component standard mapping. Add mapping in Component Library to enable brand alternatives.
          </div>
        </template>

        <!-- No data -->
        <div v-else class="py-8 text-center text-slate-500">
          Unable to load alternatives.
        </div>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showQuickSwapModal = false">Close</Button>
      </template>
    </Modal>
  </div>
</template>
