<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
// import { useVirtualizer } from '@tanstack/vue-virtual' // Temporarily disabled
import {
  useActiveTemplates,
  useBomTemplate,
  useTemplateAvailableBrands,
  usePreviewCreateBom,
  useCreateBomFromTemplate,
  type CreateBomPreviewItem,
} from '@/api/useBomTemplates'
import { useProducts } from '@/api/useProducts'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { Button, Input, Select, FormField, Card, Badge, Modal, useToast } from '@/components/ui'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileStack,
  Package,
  Palette,
  Eye,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Info,
  Plus,
  Search,
  Keyboard,
  PieChart,
  Filter,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// ============================================
// Constants
// ============================================
const STORAGE_KEY = 'bom-wizard-draft'
const LAST_TEMPLATE_KEY = 'bom-wizard-last-template'
const DEBOUNCE_DELAY = 500
const STORAGE_DEBOUNCE_DELAY = 2000 // Debounce localStorage saves
const LOW_COVERAGE_THRESHOLD = 30
const MAX_QUANTITY = 99999
const MIN_QUANTITY = 0.01
// Virtual scroll temporarily disabled
// const VIRTUAL_ITEM_HEIGHT = 88
// const VIRTUAL_SCROLL_THRESHOLD = 20

// ============================================
// Wizard State
// ============================================
const currentStep = ref(1)
const totalSteps = 4
const stepLabels = ['Template', 'Preview', 'Details', 'Complete']

// Step 1: Template & Brand Selection
const selectedTemplateId = ref<number | null>(null)
const selectedBrand = ref<string>('')

// Step 2: Item Preview & Quantity Adjustments
const previewItems = ref<CreateBomPreviewItem[]>([])
const previewReport = ref<{
  total_items: number
  resolved: number
  no_mapping: number
  using_product: number
} | null>(null)
const quantityOverrides = ref<Record<number, number>>({})
const previewError = ref<string | null>(null)

// Search & Filter for Step 2
const itemSearch = ref('')
const itemStatusFilter = ref<string>('')

// Step 3: BOM Details
const bomName = ref('')
const bomNotes = ref('')
const outputProductId = ref<number | null>(null)
const outputQuantity = ref(1)

// Step 4: Review & Create
const isCreating = ref(false)
const createdBomId = ref<number | null>(null)

// Modal States
const showUnmappedWarningModal = ref(false)
const showKeyboardShortcutsModal = ref(false)

// Debounce timers
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let storageDebounceTimer: ReturnType<typeof setTimeout> | null = null

// Input refs for auto-focus
const templateSelectRef = ref<{ focus?: () => void } | null>(null)
const bomNameInputRef = ref<{ focus?: () => void } | null>(null)

// Draft save indicator
const isSavingDraft = ref(false)
const showSaveIndicator = ref(false)

// ============================================
// Data Fetching
// ============================================
const { data: templates, isLoading: isLoadingTemplates } = useActiveTemplates()
const { data: selectedTemplate, isLoading: isLoadingTemplate } = useBomTemplate(
  computed(() => selectedTemplateId.value ?? 0)
)
const { data: availableBrands, isLoading: isLoadingBrands } = useTemplateAvailableBrands(
  computed(() => selectedTemplateId.value ?? 0)
)

// Products for output selection
const productFilters = ref({ per_page: 100, type: 'product' as const })
const { data: productsData, isLoading: isLoadingProducts } = useProducts(productFilters)
const products = computed(() => productsData.value?.data ?? [])

// Mutations
const previewMutation = usePreviewCreateBom()
const createMutation = useCreateBomFromTemplate()

// Virtual Scrolling (P1) - TEMPORARILY DISABLED
// TODO: Re-enable virtual scrolling once issue is identified
// const useVirtualScroll = computed(() => previewItems.value.length > VIRTUAL_SCROLL_THRESHOLD)
// See: https://tanstack.com/virtual/latest/docs/framework/vue/vue-virtual

// ============================================
// Unsaved Changes Guard (P0)
// ============================================
const isDirty = computed(() => {
  // Not dirty if on step 4 (completed)
  if (currentStep.value === 4) return false
  // Dirty if any meaningful data entered
  return selectedTemplateId.value !== null ||
    bomName.value.trim() !== '' ||
    outputProductId.value !== null ||
    Object.keys(quantityOverrides.value).length > 0
})

const { markAsSaved } = useUnsavedChanges(
  isDirty,
  'You have unsaved wizard progress. Are you sure you want to leave?'
)

// ============================================
// Computed
// ============================================
const hasTemplates = computed(() => !isLoadingTemplates.value && templates.value && templates.value.length > 0)
const hasProducts = computed(() => !isLoadingProducts.value && products.value.length > 0)

const templateOptions = computed(() =>
  templates.value?.map(t => ({
    value: String(t.id),
    label: `${t.code} - ${t.name}`
  })) ?? []
)

const brandOptions = computed(() => {
  const opts = [{ value: '', label: '-- No brand preference --' }]
  if (availableBrands.value) {
    for (const brand of availableBrands.value) {
      const isLowCoverage = brand.coverage_percent < LOW_COVERAGE_THRESHOLD
      opts.push({
        value: brand.code,
        label: `${brand.name} (${brand.coverage_percent}% coverage)${isLowCoverage ? ' ⚠️' : ''}`
      })
    }
  }
  return opts
})

const selectedBrandCoverage = computed(() => {
  if (!selectedBrand.value || !availableBrands.value) return null
  return availableBrands.value.find(b => b.code === selectedBrand.value) ?? null
})

const isLowCoverageBrand = computed(() => {
  return selectedBrandCoverage.value !== null &&
    selectedBrandCoverage.value.coverage_percent < LOW_COVERAGE_THRESHOLD
})

const productOptions = computed(() => [
  { value: '', label: '-- Select output product --' },
  ...products.value.map(p => ({
    value: String(p.id),
    label: `${p.sku || 'No SKU'} - ${p.name}`
  }))
])

const canProceedStep1 = computed(() => selectedTemplateId.value !== null)
const canProceedStep2 = computed(() => previewItems.value.length > 0 && !previewError.value)
const canProceedStep3 = computed(() =>
  outputProductId.value !== null &&
  bomName.value.trim().length >= 3 &&
  outputQuantity.value >= MIN_QUANTITY &&
  outputQuantity.value <= MAX_QUANTITY
)

// Real-time validation state
const validation = computed(() => ({
  bomName: {
    touched: bomName.value.length > 0,
    valid: bomName.value.trim().length >= 3,
    error: bomName.value.trim().length > 0 && bomName.value.trim().length < 3
      ? 'Name must be at least 3 characters'
      : undefined,
    success: bomName.value.trim().length >= 3,
  },
  outputQuantity: {
    touched: true,
    valid: outputQuantity.value >= MIN_QUANTITY && outputQuantity.value <= MAX_QUANTITY,
    error: outputQuantity.value < MIN_QUANTITY || outputQuantity.value > MAX_QUANTITY
      ? `Must be between ${MIN_QUANTITY} and ${MAX_QUANTITY}`
      : undefined,
    success: outputQuantity.value >= MIN_QUANTITY && outputQuantity.value <= MAX_QUANTITY,
  },
  outputProduct: {
    touched: outputProductId.value !== null,
    valid: outputProductId.value !== null,
    error: undefined,
    success: outputProductId.value !== null,
  },
}))

const estimatedTotalCost = computed(() => {
  if (!previewItems.value?.length) return 0
  return previewItems.value.reduce((sum, item) => {
    if (!item) return sum
    const qty = Number(quantityOverrides.value[item.template_item_id] ?? item.quantity) || 0
    const cost = (Number(item.unit_cost) || 0) * qty
    return sum + (isNaN(cost) ? 0 : cost)
  }, 0)
})

const resolutionStats = computed(() => {
  if (!previewReport.value) return null
  const { total_items, resolved, no_mapping, using_product } = previewReport.value
  return {
    total: total_items,
    resolved,
    noMapping: no_mapping,
    usingProduct: using_product,
    successRate: total_items > 0 ? Math.round(((resolved + using_product) / total_items) * 100) : 0
  }
})

const hasUnmappedItems = computed(() => (resolutionStats.value?.noMapping ?? 0) > 0)

// Filtered preview items based on search and status filter
const filteredPreviewItems = computed(() => {
  if (!previewItems.value?.length) return []

  let items = previewItems.value

  // Apply status filter
  if (itemStatusFilter.value) {
    items = items.filter(item => item.status === itemStatusFilter.value)
  }

  // Apply search filter
  if (itemSearch.value.trim()) {
    const searchLower = itemSearch.value.toLowerCase().trim()
    items = items.filter(item =>
      item.description?.toLowerCase().includes(searchLower) ||
      (item.product as any)?.name?.toLowerCase().includes(searchLower) ||
      (item.product as any)?.sku?.toLowerCase().includes(searchLower) ||
      (item.component_standard as any)?.code?.toLowerCase().includes(searchLower)
    )
  }

  return items
})

// Status filter options
const statusFilterOptions = computed(() => [
  { value: '', label: 'All Status' },
  { value: 'resolved', label: `Resolved (${previewReport.value?.resolved ?? 0})` },
  { value: 'using_product', label: `Direct Product (${previewReport.value?.using_product ?? 0})` },
  { value: 'no_mapping', label: `No Mapping (${previewReport.value?.no_mapping ?? 0})` },
])

// Cost breakdown by status for chart
const costBreakdown = computed(() => {
  const breakdown = {
    resolved: { count: 0, cost: 0, label: 'Resolved', color: '#22c55e' },
    using_product: { count: 0, cost: 0, label: 'Direct Product', color: '#3b82f6' },
    no_mapping: { count: 0, cost: 0, label: 'No Mapping', color: '#f59e0b' },
  }

  if (!previewItems.value?.length) return breakdown

  for (const item of previewItems.value) {
    if (!item) continue
    const qty = Number(quantityOverrides.value[item.template_item_id] ?? item.quantity ?? 0) || 0
    const cost = (Number(item.unit_cost) || 0) * qty
    const status = item.status as keyof typeof breakdown
    if (breakdown[status] && !isNaN(cost)) {
      breakdown[status].count++
      breakdown[status].cost += cost
    }
  }

  return breakdown
})

// Total cost for percentage calculation
const totalCostForChart = computed(() => {
  const values = Object.values(costBreakdown.value)
  if (!values.length) return 0
  return values.reduce((sum, b) => sum + (Number(b?.cost) || 0), 0)
})

// Progress bar value for accessibility
const progressPercent = computed(() => Math.round(((currentStep.value - 1) / (totalSteps - 1)) * 100))

// ============================================
// localStorage Persistence with Debounce (P1)
// ============================================
function saveDraft() {
  if (currentStep.value === 4) return // Don't save completed state
  const draft = {
    selectedTemplateId: selectedTemplateId.value,
    selectedBrand: selectedBrand.value,
    bomName: bomName.value,
    bomNotes: bomNotes.value,
    outputProductId: outputProductId.value,
    outputQuantity: outputQuantity.value,
    quantityOverrides: quantityOverrides.value,
    currentStep: currentStep.value,
    savedAt: Date.now(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}

function debouncedSaveDraft() {
  if (storageDebounceTimer) clearTimeout(storageDebounceTimer)
  isSavingDraft.value = true
  showSaveIndicator.value = true
  storageDebounceTimer = setTimeout(() => {
    saveDraft()
    isSavingDraft.value = false
    // Hide indicator after a brief moment
    setTimeout(() => {
      showSaveIndicator.value = false
    }, 1500)
  }, STORAGE_DEBOUNCE_DELAY)
}

function loadDraft() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return false

    const draft = JSON.parse(saved)
    // Only restore if saved within last hour
    if (Date.now() - draft.savedAt > 3600000) {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }

    selectedTemplateId.value = draft.selectedTemplateId
    selectedBrand.value = draft.selectedBrand ?? ''
    bomName.value = draft.bomName ?? ''
    bomNotes.value = draft.bomNotes ?? ''
    outputProductId.value = draft.outputProductId
    outputQuantity.value = draft.outputQuantity ?? 1
    quantityOverrides.value = draft.quantityOverrides ?? {}
    // Don't restore step - start from beginning but with data filled

    toast.info('Restored your previous draft')
    return true
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return false
  }
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEY)
}

function saveLastTemplate(templateId: number) {
  localStorage.setItem(LAST_TEMPLATE_KEY, String(templateId))
}

function loadLastTemplate(): number | null {
  try {
    const saved = localStorage.getItem(LAST_TEMPLATE_KEY)
    return saved ? Number(saved) : null
  } catch {
    return null
  }
}

// ============================================
// Watchers
// ============================================

// Initialize from URL query param, draft, or last used template
onMounted(() => {
  const templateParam = route.query.template
  if (templateParam) {
    selectedTemplateId.value = Number(templateParam)
  } else if (!loadDraft()) {
    // No draft found, try to load last used template
    const lastTemplate = loadLastTemplate()
    if (lastTemplate) {
      selectedTemplateId.value = lastTemplate
    }
  }
})

// Auto-save draft on changes (debounced)
watch([selectedTemplateId, selectedBrand, bomName, outputProductId, quantityOverrides], () => {
  debouncedSaveDraft()
}, { deep: true })

// Auto-generate BOM name when template is selected
watch(selectedTemplate, (template) => {
  if (template && !bomName.value) {
    bomName.value = `BOM dari ${template.name}`
  }
})

// Reset brand when template changes
watch(selectedTemplateId, () => {
  selectedBrand.value = ''
  previewItems.value = []
  previewReport.value = null
  previewError.value = null
  quantityOverrides.value = {}
})

// Auto-focus appropriate input when step changes
watch(currentStep, (step) => {
  nextTick(() => {
    if (step === 1) {
      templateSelectRef.value?.focus?.()
    } else if (step === 3) {
      bomNameInputRef.value?.focus?.()
    }
  })
})

// Debounced auto-refresh when quantities change (P1)
watch(quantityOverrides, () => {
  if (currentStep.value === 2 && previewItems.value.length > 0) {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      // Only refresh if we're still on step 2
      if (currentStep.value === 2) {
        loadPreview()
      }
    }, DEBOUNCE_DELAY)
  }
}, { deep: true })

// Cleanup debounce timers
onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (storageDebounceTimer) clearTimeout(storageDebounceTimer)
})

// ============================================
// Keyboard Navigation (P2)
// ============================================
function handleKeydown(e: KeyboardEvent) {
  // Show keyboard shortcuts on ?
  if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
    const target = e.target as HTMLElement
    if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
      e.preventDefault()
      showKeyboardShortcutsModal.value = true
      return
    }
  }

  // Ignore other shortcuts if typing in input
  if ((e.target as HTMLElement).tagName === 'INPUT' ||
      (e.target as HTMLElement).tagName === 'TEXTAREA') {
    return
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (currentStep.value === 1 && canProceedStep1.value) nextStep()
    else if (currentStep.value === 2 && canProceedStep2.value) nextStep()
    else if (currentStep.value === 3 && canProceedStep3.value) handleCreateClick()
  } else if (e.key === 'Escape') {
    if (showKeyboardShortcutsModal.value) {
      showKeyboardShortcutsModal.value = false
    } else if (showUnmappedWarningModal.value) {
      showUnmappedWarningModal.value = false
    } else if (currentStep.value > 1 && currentStep.value < 4) {
      prevStep()
    }
  } else if (e.key === 'ArrowLeft' && currentStep.value > 1 && currentStep.value < 4) {
    prevStep()
  } else if (e.key === 'ArrowRight') {
    if (currentStep.value === 1 && canProceedStep1.value) nextStep()
    else if (currentStep.value === 2 && canProceedStep2.value) nextStep()
  } else if (e.key === '/' && currentStep.value === 2) {
    // Focus search on /
    e.preventDefault()
    const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement
    searchInput?.focus()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// ============================================
// Step Navigation
// ============================================
function nextStep() {
  if (currentStep.value < totalSteps) {
    if (currentStep.value === 1 && canProceedStep1.value) {
      loadPreview()
    }
    currentStep.value++
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    previewError.value = null // Clear error when going back
    currentStep.value--
  }
}

function goToStep(step: number) {
  if (step <= currentStep.value || (step === 2 && canProceedStep1.value)) {
    if (step < currentStep.value) {
      previewError.value = null
    }
    currentStep.value = step
  }
}

// ============================================
// Actions
// ============================================
async function loadPreview() {
  if (!selectedTemplateId.value) return

  previewError.value = null
  try {
    const result = await previewMutation.mutateAsync({
      templateId: selectedTemplateId.value,
      data: {
        target_brand: selectedBrand.value || undefined,
        quantity_overrides: Object.keys(quantityOverrides.value).length > 0
          ? quantityOverrides.value as any
          : undefined,
      }
    })
    previewItems.value = result.data
    previewReport.value = result.report
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to load preview'
    previewError.value = message
    toast.error(message)
  }
}

async function refreshPreview() {
  await loadPreview()
  if (!previewError.value) {
    toast.success('Preview updated')
  }
}

function handleCreateClick() {
  // Show warning if there are unmapped items (P0)
  if (hasUnmappedItems.value) {
    showUnmappedWarningModal.value = true
  } else {
    createBom()
  }
}

async function createBom() {
  if (!selectedTemplateId.value || !outputProductId.value) return

  showUnmappedWarningModal.value = false
  isCreating.value = true
  try {
    const result = await createMutation.mutateAsync({
      templateId: selectedTemplateId.value,
      data: {
        product_id: outputProductId.value,
        target_brand: selectedBrand.value || undefined,
        name: bomName.value.trim(),
        notes: bomNotes.value.trim() || undefined,
        output_quantity: Math.min(Math.max(outputQuantity.value, MIN_QUANTITY), MAX_QUANTITY),
        quantity_overrides: Object.keys(quantityOverrides.value).length > 0
          ? quantityOverrides.value as any
          : undefined,
      }
    })
    createdBomId.value = result.data.id
    markAsSaved() // Clear unsaved changes guard
    clearDraft() // Clear localStorage draft
    if (selectedTemplateId.value) {
      saveLastTemplate(selectedTemplateId.value) // Remember this template for next time
    }
    currentStep.value = 4
    toast.success(result.message)
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create BOM'
    toast.error(message)
  } finally {
    isCreating.value = false
  }
}

function viewCreatedBom() {
  if (createdBomId.value) {
    router.push(`/boms/${createdBomId.value}`)
  }
}

function createAnother(preserveTemplate = false) {
  // Preserve template selection if requested (P1)
  const templateToKeep = preserveTemplate ? selectedTemplateId.value : null

  selectedTemplateId.value = templateToKeep
  selectedBrand.value = ''
  previewItems.value = []
  previewReport.value = null
  previewError.value = null
  quantityOverrides.value = {}
  bomName.value = ''
  bomNotes.value = ''
  outputProductId.value = null
  outputQuantity.value = 1
  createdBomId.value = null
  currentStep.value = 1
  clearDraft()
}

// Quantity validation helper (P1)
function handleQuantityChange(itemId: number, value: string | number) {
  const numValue = Number(value)
  // Round to 2 decimal places and clamp
  const clampedValue = Math.min(Math.max(Math.round(numValue * 100) / 100, MIN_QUANTITY), MAX_QUANTITY)
  quantityOverrides.value[itemId] = clampedValue
}

// ============================================
// Helpers
// ============================================
function getStatusColor(status: string): string {
  switch (status) {
    case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    case 'using_product': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'no_mapping': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'resolved': return 'Resolved'
    case 'using_product': return 'Using Product'
    case 'no_mapping': return 'No Mapping'
    default: return status
  }
}

function getStatusTooltip(status: string): string {
  switch (status) {
    case 'resolved': return 'Component matched via cross-reference system'
    case 'using_product': return 'Using directly specified product from template'
    case 'no_mapping': return 'No product mapping found - will be added with zero cost'
    default: return ''
  }
}

function formatCurrency(value: number): string {
  const safeValue = Number(value) || 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeValue)
}

function getStepAriaLabel(step: number): string {
  const label = stepLabels[step - 1]
  if (step === currentStep.value) return `Step ${step}: ${label} (current step)`
  if (step < currentStep.value) return `Step ${step}: ${label} (completed)`
  return `Step ${step}: ${label} (not started)`
}

// Safe percentage calculation
function getPercentage(value: number, total: number): number {
  if (!total || total <= 0 || isNaN(total)) return 0
  if (isNaN(value)) return 0
  return Math.round((value / total) * 100)
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <RouterLink to="/boms">
        <Button variant="ghost" size="sm">
          <ArrowLeft class="w-4 h-4 mr-2" />
          Back
        </Button>
      </RouterLink>
      <div class="flex-1">
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Create BOM from Template</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Use a template to quickly create a new Bill of Materials
        </p>
      </div>
      <!-- Draft Save Indicator -->
      <Transition
        enter-active-class="transition-opacity duration-300"
        leave-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="showSaveIndicator"
          class="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500"
        >
          <Loader2 v-if="isSavingDraft" class="w-3 h-3 animate-spin" />
          <CheckCircle2 v-else class="w-3 h-3 text-green-500" />
          <span>{{ isSavingDraft ? 'Saving...' : 'Draft saved' }}</span>
        </div>
      </Transition>
    </div>

    <!-- Progress Steps with Step Indicator and Accessibility (P0) -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-slate-500 dark:text-slate-400">
          Step {{ currentStep }} of {{ totalSteps }}: {{ stepLabels[currentStep - 1] }}
        </span>
        <!-- Hide keyboard hint on mobile (P0) -->
        <span class="hidden md:block text-xs text-slate-400 dark:text-slate-500">
          Press Enter to proceed, Esc to go back
        </span>
      </div>
      <!-- Stepper Navigation with ARIA (P0) -->
      <nav aria-label="BOM creation progress" class="flex items-center justify-between">
        <button
          v-for="step in totalSteps"
          :key="step"
          type="button"
          class="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-lg p-1"
          :class="step <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'"
          :aria-label="getStepAriaLabel(step)"
          :aria-current="currentStep === step ? 'step' : undefined"
          :aria-disabled="step > currentStep"
          @click="goToStep(step)"
        >
          <!-- Increased touch target to 44px (P0) -->
          <div
            class="w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium transition-colors"
            :class="currentStep === step
              ? 'bg-orange-500 text-white'
              : step < currentStep
                ? 'bg-green-500 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'"
          >
            <Check v-if="step < currentStep" class="w-5 h-5" />
            <span v-else>{{ step }}</span>
          </div>
          <span
            class="hidden sm:block text-sm font-medium"
            :class="currentStep === step
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-slate-500 dark:text-slate-400'"
          >
            {{ stepLabels[step - 1] }}
          </span>
        </button>
      </nav>
      <!-- Progress bar with accessibility (P0) -->
      <div
        class="mt-2 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
        role="progressbar"
        :aria-valuenow="progressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`Progress: ${progressPercent}% complete`"
      >
        <div
          class="h-full bg-orange-500 transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        />
      </div>
    </div>

    <!-- Step 1: Template & Brand Selection -->
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 translate-y-2"
      leave-to-class="opacity-0 -translate-y-2"
    >
    <div v-if="currentStep === 1" key="step1" class="space-y-6">
      <Card>
        <template #header>
          <div class="flex items-center gap-2">
            <FileStack class="w-5 h-5 text-orange-500" />
            <h2 class="font-medium text-slate-900 dark:text-slate-100">Select Template</h2>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Empty State for Templates (P0) -->
          <div v-if="!isLoadingTemplates && !hasTemplates" class="text-center py-8">
            <FileStack class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 class="font-medium text-slate-900 dark:text-slate-100 mb-2">No templates available</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Create a BOM template first to use this wizard.
            </p>
            <RouterLink to="/settings/bom-templates/new">
              <Button>
                <Plus class="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </RouterLink>
          </div>

          <!-- Template Selection -->
          <template v-else>
            <FormField label="BOM Template" required>
              <Select
                ref="templateSelectRef"
                :model-value="selectedTemplateId ? String(selectedTemplateId) : ''"
                :options="[{ value: '', label: '-- Select a template --' }, ...templateOptions]"
                :loading="isLoadingTemplates"
                @update:model-value="(v: string | number | null) => selectedTemplateId = v ? Number(v) : null"
              />
            </FormField>

            <!-- Template Info Skeleton -->
            <div v-if="selectedTemplateId && isLoadingTemplate" class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 animate-pulse">
              <div class="flex items-start gap-4">
                <div class="flex-1">
                  <div class="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                  <div class="h-4 w-32 bg-slate-300 dark:bg-slate-600 rounded" />
                </div>
                <div class="text-right">
                  <div class="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
                  <div class="h-4 w-16 bg-slate-300 dark:bg-slate-600 rounded ml-auto" />
                </div>
              </div>
            </div>

            <!-- Selected Template Info -->
            <div v-else-if="selectedTemplate" class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div class="flex items-start gap-4">
                <div class="flex-1">
                  <h3 class="font-medium text-slate-900 dark:text-slate-100">{{ selectedTemplate.name }}</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400 font-mono">{{ selectedTemplate.code }}</p>
                  <p v-if="selectedTemplate.description" class="text-sm text-slate-600 dark:text-slate-300 mt-2">
                    {{ selectedTemplate.description }}
                  </p>
                </div>
                <div class="text-right">
                  <Badge>{{ selectedTemplate.category_label }}</Badge>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {{ selectedTemplate.items?.length ?? 0 }} items
                  </p>
                </div>
              </div>
            </div>
          </template>
        </div>
      </Card>

      <Card v-if="selectedTemplateId">
        <template #header>
          <div class="flex items-center gap-2">
            <Palette class="w-5 h-5 text-purple-500" />
            <h2 class="font-medium text-slate-900 dark:text-slate-100">Target Brand (Optional)</h2>
          </div>
        </template>

        <div class="space-y-4">
          <FormField
            label="Preferred Brand"
            hint="Components will be resolved to this brand where possible"
          >
            <Select
              v-model="selectedBrand"
              :options="brandOptions"
              :loading="isLoadingBrands"
            />
          </FormField>

          <!-- Low Coverage Warning (P1) -->
          <div
            v-if="isLowCoverageBrand"
            class="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
          >
            <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div class="text-sm">
              <p class="font-medium text-amber-800 dark:text-amber-200">Low Coverage Warning</p>
              <p class="text-amber-700 dark:text-amber-300">
                {{ selectedBrandCoverage?.name }} only covers {{ selectedBrandCoverage?.coverage_percent }}% of components.
                Many items may not have mappings for this brand.
              </p>
            </div>
          </div>

          <!-- Brand Coverage Info -->
          <div v-if="availableBrands && availableBrands.length > 0" class="text-sm text-slate-500 dark:text-slate-400">
            <p class="mb-2">Available brands for this template:</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="brand in availableBrands"
                :key="brand.code"
                class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
                :class="brand.coverage_percent < LOW_COVERAGE_THRESHOLD
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-700'"
              >
                {{ brand.name }}
                <span :class="brand.coverage_percent < LOW_COVERAGE_THRESHOLD ? '' : 'text-slate-400 dark:text-slate-500'">
                  ({{ brand.coverage_percent }}%)
                </span>
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div class="flex justify-end">
        <Button :disabled="!canProceedStep1 || !hasTemplates" @click="nextStep">
          Next: Preview Items
          <ArrowRight class="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
    </Transition>

    <!-- Step 2: Preview Items -->
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 translate-y-2"
      leave-to-class="opacity-0 -translate-y-2"
    >
    <div v-if="currentStep === 2" key="step2" class="space-y-6">
      <!-- Loading Skeleton (P0 UX) -->
      <div v-if="previewMutation.isPending.value" class="space-y-6" aria-live="polite" aria-busy="true">
        <!-- Stats Skeleton -->
        <Card>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="i in 4" :key="i" class="text-center">
              <div class="h-8 w-16 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
              <div class="h-4 w-20 mx-auto bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
        </Card>

        <!-- Items List Skeleton -->
        <Card>
          <template #header>
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div class="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </template>
          <div class="divide-y divide-slate-100 dark:divide-slate-800">
            <div v-for="i in 5" :key="i" class="py-4">
              <div class="flex items-start gap-4">
                <div class="flex-1">
                  <div class="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
                  <div class="h-4 w-32 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                </div>
                <div class="w-24 text-right">
                  <div class="h-8 w-full bg-slate-100 dark:bg-slate-800 rounded animate-pulse mb-2" />
                  <div class="h-4 w-16 ml-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        <p class="text-center text-sm text-slate-500 dark:text-slate-400">
          <Loader2 class="w-4 h-4 inline animate-spin mr-2" />
          Loading preview...
        </p>
      </div>

      <!-- Error State with Recovery (P0) -->
      <div v-else-if="previewError" class="text-center py-12" aria-live="assertive">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <AlertTriangle class="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 class="font-medium text-slate-900 dark:text-slate-100 mb-2">Failed to load preview</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          {{ previewError }}
        </p>
        <div class="flex justify-center gap-3">
          <Button variant="outline" @click="prevStep">
            <ArrowLeft class="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Button @click="loadPreview">
            <RefreshCw class="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>

      <template v-else>
        <!-- Resolution Stats - Mobile Responsive Grid (P0) -->
        <Card v-if="resolutionStats">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {{ resolutionStats.total }}
              </div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Total Items</div>
            </div>
            <div>
              <div class="text-2xl font-semibold text-green-600 dark:text-green-400">
                {{ resolutionStats.resolved }}
              </div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Resolved</div>
            </div>
            <div>
              <div class="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                {{ resolutionStats.usingProduct }}
              </div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Direct Product</div>
            </div>
            <div>
              <div class="text-2xl font-semibold" :class="resolutionStats.noMapping > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'">
                {{ resolutionStats.noMapping }}
              </div>
              <div class="text-sm text-slate-500 dark:text-slate-400">No Mapping</div>
            </div>
          </div>

          <!-- Unmapped Warning Banner (P0) -->
          <div
            v-if="hasUnmappedItems"
            class="mt-4 flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
            role="alert"
          >
            <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div class="text-sm">
              <p class="font-medium text-amber-800 dark:text-amber-200">
                {{ resolutionStats.noMapping }} item(s) without product mapping
              </p>
              <p class="text-amber-700 dark:text-amber-300">
                These items will be added to the BOM with zero cost. You can add products manually later.
              </p>
            </div>
          </div>

          <!-- Cost Breakdown Chart -->
          <div v-if="totalCostForChart > 0" class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div class="flex items-center gap-2 mb-3">
              <PieChart class="w-4 h-4 text-slate-500" />
              <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Cost Breakdown</span>
            </div>
            <!-- Horizontal Bar Chart -->
            <div class="space-y-2">
              <div
                v-for="(data, status) in costBreakdown"
                :key="status"
                class="flex items-center gap-3"
              >
                <span class="w-28 text-xs text-slate-600 dark:text-slate-400 truncate">
                  {{ data?.label ?? status }}
                </span>
                <div class="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :style="{
                      width: `${getPercentage(data?.cost ?? 0, totalCostForChart)}%`,
                      backgroundColor: data?.color ?? '#94a3b8',
                    }"
                  />
                </div>
                <span class="w-24 text-xs text-right text-slate-600 dark:text-slate-400 tabular-nums">
                  {{ formatCurrency(data?.cost ?? 0) }}
                </span>
                <span class="w-12 text-xs text-right text-slate-400 tabular-nums">
                  {{ getPercentage(data?.cost ?? 0, totalCostForChart) }}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        <!-- Items List -->
        <Card>
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Eye class="w-5 h-5 text-blue-500" />
                <h2 class="font-medium text-slate-900 dark:text-slate-100">Preview Items</h2>
                <Badge v-if="filteredPreviewItems.length !== previewItems.length" variant="info" size="sm">
                  {{ filteredPreviewItems.length }} of {{ previewItems.length }}
                </Badge>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="xs"
                  title="Keyboard shortcuts (?)"
                  class="hidden md:flex"
                  @click="showKeyboardShortcutsModal = true"
                >
                  <Keyboard class="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" :loading="previewMutation.isPending.value" @click="refreshPreview">
                  <RefreshCw class="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </template>

          <!-- Search & Filter Bar -->
          <div v-if="previewItems.length > 0" class="flex flex-col sm:flex-row gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div class="relative flex-1">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                v-model="itemSearch"
                type="text"
                data-search-input
                placeholder="Search items... (press /)"
                class="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div class="flex items-center gap-2">
              <Filter class="w-4 h-4 text-slate-400" />
              <Select
                v-model="itemStatusFilter"
                :options="statusFilterOptions"
                class="w-44"
              />
            </div>
          </div>

          <!-- Empty Items State -->
          <div v-if="previewItems.length === 0" class="text-center py-8">
            <Package class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p class="text-slate-500 dark:text-slate-400">No items in this template</p>
          </div>

          <!-- Virtual Scrolling temporarily disabled -->

          <!-- No Results from Filter -->
          <div v-else-if="filteredPreviewItems.length === 0" class="text-center py-8">
            <Search class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p class="text-slate-500 dark:text-slate-400 mb-2">No items match your search</p>
            <Button variant="ghost" size="sm" @click="itemSearch = ''; itemStatusFilter = ''">
              Clear Filters
            </Button>
          </div>

          <!-- Regular List for Small Items Count -->
          <div v-else class="divide-y divide-slate-100 dark:divide-slate-800" role="list" aria-label="Preview items">
            <div
              v-for="item in filteredPreviewItems"
              :key="item.template_item_id"
              class="py-4 first:pt-0 last:pb-0"
              role="listitem"
            >
              <div class="flex items-start gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="font-medium text-slate-900 dark:text-slate-100">
                      {{ item.description }}
                    </span>
                    <!-- Status Badge with Tooltip (P2) -->
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium cursor-help"
                      :class="getStatusColor(item.status)"
                      :title="getStatusTooltip(item.status)"
                    >
                      {{ getStatusLabel(item.status) }}
                      <Info class="w-3 h-3 opacity-60" />
                    </span>
                    <Badge v-if="item.is_required" variant="info" size="sm">Required</Badge>
                  </div>

                  <div class="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span v-if="item.product">
                      <Package class="w-3 h-3 inline mr-1" />
                      {{ item.product.name }}
                    </span>
                    <span v-else-if="item.component_standard" class="font-mono text-xs">
                      {{ item.component_standard.code }}
                    </span>
                    <span>{{ formatCurrency(item.unit_cost) }}/{{ item.unit }}</span>
                  </div>

                  <div v-if="item.notes" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {{ item.notes }}
                  </div>
                </div>

                <div class="w-32 text-right flex-shrink-0">
                  <!-- Variable Quantity with Validation (P1) -->
                  <div v-if="item.is_quantity_variable" class="mb-1">
                    <Input
                      :model-value="quantityOverrides[item.template_item_id] ?? item.quantity ?? 0"
                      type="number"
                      :min="MIN_QUANTITY"
                      :max="MAX_QUANTITY"
                      step="0.01"
                      class="text-right text-sm"
                      :aria-label="`Quantity for ${item.description ?? 'item'}`"
                      @update:model-value="(v: string | number) => handleQuantityChange(item.template_item_id, v)"
                    />
                  </div>
                  <div v-else class="text-slate-900 dark:text-slate-100">
                    {{ item.quantity ?? 0 }} {{ item.unit ?? 'unit' }}
                  </div>
                  <div class="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {{ formatCurrency((Number(quantityOverrides[item.template_item_id] ?? item.quantity) || 0) * (Number(item.unit_cost) || 0)) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="previewItems.length > 0" class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span class="text-slate-500 dark:text-slate-400">Estimated Total</span>
            <span class="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {{ formatCurrency(estimatedTotalCost) }}
            </span>
          </div>
        </Card>

        <div class="flex justify-between">
          <Button variant="outline" @click="prevStep">
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button :disabled="!canProceedStep2" @click="nextStep">
            Next: BOM Details
            <ArrowRight class="w-4 h-4 ml-2" />
          </Button>
        </div>
      </template>
    </div>
    </Transition>

    <!-- Step 3: BOM Details -->
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 translate-y-2"
      leave-to-class="opacity-0 -translate-y-2"
    >
    <div v-if="currentStep === 3" key="step3" class="space-y-6">
      <Card>
        <template #header>
          <div class="flex items-center gap-2">
            <Package class="w-5 h-5 text-green-500" />
            <h2 class="font-medium text-slate-900 dark:text-slate-100">BOM Details</h2>
          </div>
        </template>

        <div class="space-y-4">
          <!-- Empty Products State (P0) -->
          <div v-if="!isLoadingProducts && !hasProducts" class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg" role="alert">
            <div class="flex items-start gap-3">
              <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p class="font-medium text-amber-800 dark:text-amber-200">No products available</p>
                <p class="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  Create a product first to use as the BOM output.
                </p>
                <RouterLink to="/products/new" target="_blank">
                  <Button size="sm" variant="outline">
                    <Plus class="w-4 h-4 mr-2" />
                    Create Product
                  </Button>
                </RouterLink>
              </div>
            </div>
          </div>

          <FormField label="Output Product" required hint="The product this BOM produces">
            <div class="relative">
              <Select
                :model-value="outputProductId ? String(outputProductId) : ''"
                :options="productOptions"
                :loading="isLoadingProducts"
                :disabled="!hasProducts"
                @update:model-value="(v: string | number | null) => outputProductId = v ? Number(v) : null"
              />
              <CheckCircle2
                v-if="validation.outputProduct.success"
                class="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500"
              />
            </div>
          </FormField>

          <FormField
            label="BOM Name"
            required
            :error="validation.bomName.error"
          >
            <div class="relative">
              <Input
                ref="bomNameInputRef"
                v-model="bomName"
                placeholder="e.g., Panel 100A - Schneider"
                maxlength="100"
                :class="validation.bomName.success ? 'border-green-500 focus:ring-green-500' : ''"
              />
              <CheckCircle2
                v-if="validation.bomName.success"
                class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500"
              />
            </div>
            <p v-if="validation.bomName.success" class="text-xs text-green-600 dark:text-green-400 mt-1">
              Looks good!
            </p>
          </FormField>

          <div class="grid grid-cols-2 gap-4">
            <FormField
              label="Output Quantity"
              :error="validation.outputQuantity.error"
            >
              <div class="relative">
                <Input
                  v-model.number="outputQuantity"
                  type="number"
                  :min="MIN_QUANTITY"
                  :max="MAX_QUANTITY"
                  step="1"
                  :class="validation.outputQuantity.success ? 'border-green-500 focus:ring-green-500' : ''"
                />
                <CheckCircle2
                  v-if="validation.outputQuantity.success"
                  class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500"
                />
              </div>
            </FormField>
            <FormField label="Output Unit">
              <Input :model-value="selectedTemplate?.default_output_unit ?? 'unit'" disabled />
            </FormField>
          </div>

          <FormField label="Notes">
            <textarea
              v-model="bomNotes"
              rows="3"
              maxlength="500"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Optional notes about this BOM..."
            />
          </FormField>
        </div>
      </Card>

      <!-- Summary -->
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Summary</h2>
        </template>

        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-slate-500 dark:text-slate-400">Template:</span>
            <span class="ml-2 font-medium text-slate-900 dark:text-slate-100">
              {{ selectedTemplate?.name }}
            </span>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400">Brand:</span>
            <span class="ml-2 font-medium text-slate-900 dark:text-slate-100">
              {{ selectedBrand || 'No preference' }}
            </span>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400">Items:</span>
            <span class="ml-2 font-medium text-slate-900 dark:text-slate-100">
              {{ previewItems.length }}
              <span v-if="hasUnmappedItems" class="text-amber-600 dark:text-amber-400">
                ({{ resolutionStats?.noMapping }} unmapped)
              </span>
            </span>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400">Estimated Cost:</span>
            <span class="ml-2 font-medium text-slate-900 dark:text-slate-100">
              {{ formatCurrency(estimatedTotalCost) }}
            </span>
          </div>
        </div>
      </Card>

      <div class="flex justify-between">
        <Button variant="outline" @click="prevStep">
          <ArrowLeft class="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button :disabled="!canProceedStep3 || !hasProducts" :loading="isCreating" @click="handleCreateClick">
          <Sparkles class="w-4 h-4 mr-2" />
          Create BOM
        </Button>
      </div>
    </div>
    </Transition>

    <!-- Step 4: Complete -->
    <Transition
      mode="out-in"
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="opacity-0 translate-y-2"
      leave-to-class="opacity-0 -translate-y-2"
    >
    <div v-if="currentStep === 4" key="step4" class="space-y-6">
      <Card class="text-center py-8">
        <CheckCircle2 class="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
          BOM Created Successfully!
        </h2>
        <p class="text-slate-600 dark:text-slate-400 mb-6">
          Your new Bill of Materials has been created from the template.
        </p>

        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="outline" @click="createAnother(false)">
            Create New
          </Button>
          <Button variant="outline" @click="createAnother(true)">
            Same Template
          </Button>
          <Button @click="viewCreatedBom">
            <Eye class="w-4 h-4 mr-2" />
            View BOM
          </Button>
        </div>
      </Card>
    </div>
    </Transition>

    <!-- Unmapped Items Warning Modal (P0) -->
    <Modal
      :open="showUnmappedWarningModal"
      title="Create BOM with Unmapped Items?"
      size="md"
      @update:open="showUnmappedWarningModal = $event"
    >
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
          <AlertTriangle class="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p class="text-slate-700 dark:text-slate-300 mb-2">
            <strong>{{ resolutionStats?.noMapping }}</strong> item(s) don't have product mappings and will be added with
            <strong>zero cost</strong>.
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            You can manually add products to these items after the BOM is created, or go back and select a different brand with better coverage.
          </p>
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showUnmappedWarningModal = false">
          Go Back
        </Button>
        <Button @click="createBom">
          Create Anyway
        </Button>
      </template>
    </Modal>

    <!-- Keyboard Shortcuts Modal -->
    <Modal
      :open="showKeyboardShortcutsModal"
      title="Keyboard Shortcuts"
      size="sm"
      @update:open="showKeyboardShortcutsModal = $event"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">Enter</kbd>
            <span class="text-slate-600 dark:text-slate-400">Next step</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">Esc</kbd>
            <span class="text-slate-600 dark:text-slate-400">Previous step</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">←</kbd>
            <span class="text-slate-600 dark:text-slate-400">Previous step</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">→</kbd>
            <span class="text-slate-600 dark:text-slate-400">Next step</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">/</kbd>
            <span class="text-slate-600 dark:text-slate-400">Focus search (Step 2)</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono">?</kbd>
            <span class="text-slate-600 dark:text-slate-400">Show this help</span>
          </div>
        </div>
        <p class="text-xs text-slate-400 dark:text-slate-500 text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          Shortcuts work when not typing in a text field
        </p>
      </div>
      <template #footer>
        <Button @click="showKeyboardShortcutsModal = false">
          Got it
        </Button>
      </template>
    </Modal>
  </div>
</template>
