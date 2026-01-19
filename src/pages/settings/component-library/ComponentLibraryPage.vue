<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useComponentStandards,
  useComponentCategories,
  useAvailableBrands,
  useDeleteComponentStandard,
  useValidateImport,
  useImportMappings,
  useImportStats,
  downloadMappingTemplate,
  useUnmappedProducts,
  useBatchMappingSuggestions,
  useBulkAcceptMappingSuggestions,
  type ComponentStandardFilters,
  type ImportValidationResult,
  type ProductMappingSuggestion,
  type BulkMappingInput,
} from '@/api/useComponentStandards'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, AlertTriangle, Wand2, Loader2, Check } from 'lucide-vue-next'

const toast = useToast()

const filters = ref<ComponentStandardFilters>({
  page: 1,
  per_page: 15,
  category: undefined,
  brand: undefined,
  is_active: true,
  search: '',
})

const { data, isLoading, error } = useComponentStandards(filters)
const { data: categories } = useComponentCategories()
const { data: brands } = useAvailableBrands()

const standards = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

const categoryOptions = computed(() => [
  { value: '', label: 'All Categories' },
  ...(categories.value?.map(c => ({ value: c.category, label: `${c.label} (${c.count})` })) ?? [])
])

const brandOptions = computed(() => [
  { value: '', label: 'All Brands' },
  ...(brands.value?.map(b => ({ value: b.code, label: b.name })) ?? [])
])

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
]

function handlePageChange(page: number) {
  filters.value.page = page
}

function handleSearch(value: string | number) {
  filters.value.search = String(value)
  filters.value.page = 1
}

function handleStatusChange(value: string | number | null) {
  const strValue = String(value ?? '')
  filters.value.is_active = strValue === '' ? undefined : strValue === 'true'
  filters.value.page = 1
}

// Delete handling
const deleteMutation = useDeleteComponentStandard()
const showDeleteModal = ref(false)
const standardToDelete = ref<{ id: number; name: string } | null>(null)

function confirmDelete(id: number, name: string) {
  standardToDelete.value = { id, name }
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!standardToDelete.value) return
  try {
    await deleteMutation.mutateAsync(standardToDelete.value.id)
    showDeleteModal.value = false
    standardToDelete.value = null
    toast.success('Component standard deleted')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete'
    toast.error(message)
  }
}

// ============================================
// Import handling
// ============================================
const showImportModal = ref(false)
const importStep = ref<'upload' | 'preview' | 'result'>('upload')
const selectedFile = ref<File | null>(null)
const validationResult = ref<ImportValidationResult | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const validateMutation = useValidateImport()
const importMutation = useImportMappings()
const { data: importStats } = useImportStats()

function openImportModal() {
  importStep.value = 'upload'
  selectedFile.value = null
  validationResult.value = null
  showImportModal.value = true
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files[0]) {
    selectedFile.value = input.files[0]
  }
}

function handleFileDrop(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    const file = event.dataTransfer.files[0]
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
      selectedFile.value = file
    } else {
      toast.error('Please upload an Excel or CSV file')
    }
  }
}

async function validateFile() {
  if (!selectedFile.value) return
  try {
    const result = await validateMutation.mutateAsync(selectedFile.value)
    validationResult.value = result
    importStep.value = 'preview'
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Validation failed'
    toast.error(message)
  }
}

async function executeImport() {
  if (!selectedFile.value) return
  try {
    const result = await importMutation.mutateAsync({ file: selectedFile.value })
    importStep.value = 'result'
    toast.success(result.message)
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Import failed'
    toast.error(message)
  }
}

function closeImportModal() {
  showImportModal.value = false
  // Reset state after modal close animation
  setTimeout(() => {
    importStep.value = 'upload'
    selectedFile.value = null
    validationResult.value = null
  }, 300)
}

const isDownloading = ref(false)

async function downloadTemplate() {
  isDownloading.value = true
  try {
    await downloadMappingTemplate({ includeExamples: true, includeProducts: true })
    toast.success('Template downloaded')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to download template'
    toast.error(message)
  } finally {
    isDownloading.value = false
  }
}

// ============================================
// Auto-Mapping handling
// ============================================
const showAutoMapModal = ref(false)
const autoMapStep = ref<'loading' | 'suggestions' | 'result'>('loading')
const suggestions = ref<ProductMappingSuggestion[]>([])
const selectedMappings = ref<Map<number, number>>(new Map()) // productId -> standardId

const { data: unmappedProductsData, refetch: refetchUnmapped } = useUnmappedProducts(ref(undefined), ref(50))
const batchSuggestionsMutation = useBatchMappingSuggestions()
const bulkAcceptMutation = useBulkAcceptMappingSuggestions()

const unmappedProducts = computed(() => unmappedProductsData.value?.data ?? [])

async function openAutoMapModal() {
  showAutoMapModal.value = true
  autoMapStep.value = 'loading'
  selectedMappings.value = new Map()
  suggestions.value = []

  await refetchUnmapped()

  if (unmappedProducts.value.length === 0) {
    toast.info('No unmapped products found')
    showAutoMapModal.value = false
    return
  }

  try {
    const productIds = unmappedProducts.value.map(p => p.id)
    const result = await batchSuggestionsMutation.mutateAsync(productIds)
    suggestions.value = result

    // Auto-select best suggestions (score >= 80)
    for (const suggestion of result) {
      const topMatch = suggestion.suggestions?.[0]
      if (suggestion.has_suggestions && topMatch && topMatch.match_score >= 80) {
        selectedMappings.value.set(suggestion.product_id, topMatch.component_standard_id)
      }
    }

    autoMapStep.value = 'suggestions'
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to get suggestions'
    toast.error(message)
    showAutoMapModal.value = false
  }
}

function toggleSuggestionSelection(productId: number, standardId: number) {
  if (selectedMappings.value.get(productId) === standardId) {
    selectedMappings.value.delete(productId)
  } else {
    selectedMappings.value.set(productId, standardId)
  }
  // Force reactivity
  selectedMappings.value = new Map(selectedMappings.value)
}

function selectAllHighConfidence() {
  for (const suggestion of suggestions.value) {
    const topMatch = suggestion.suggestions?.[0]
    if (suggestion.has_suggestions && topMatch && topMatch.match_score >= 70) {
      selectedMappings.value.set(suggestion.product_id, topMatch.component_standard_id)
    }
  }
  selectedMappings.value = new Map(selectedMappings.value)
}

function clearAllSelections() {
  selectedMappings.value = new Map()
}

const selectedCount = computed(() => selectedMappings.value.size)

async function applySelectedMappings() {
  if (selectedMappings.value.size === 0) {
    toast.info('No mappings selected')
    return
  }

  const mappings: BulkMappingInput[] = []
  for (const [productId, standardId] of selectedMappings.value) {
    mappings.push({ product_id: productId, component_standard_id: standardId })
  }

  try {
    const result = await bulkAcceptMutation.mutateAsync(mappings)
    autoMapStep.value = 'result'
    toast.success(`Created ${result.data.created} mappings`)
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to apply mappings'
    toast.error(message)
  }
}

function closeAutoMapModal() {
  showAutoMapModal.value = false
  setTimeout(() => {
    autoMapStep.value = 'loading'
    suggestions.value = []
    selectedMappings.value = new Map()
  }, 300)
}

function getMatchScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30'
  if (score >= 70) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30'
  return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800'
}

// Format specs for display
function formatSpecs(specs: Record<string, unknown>): string {
  const parts: string[] = []
  if (specs.rating_amps) parts.push(`${specs.rating_amps}A`)
  if (specs.poles) parts.push(`${specs.poles}P`)
  if (specs.curve) parts.push(`Curve ${specs.curve}`)
  if (specs.breaking_capacity_ka) parts.push(`${specs.breaking_capacity_ka}kA`)
  if (specs.conductor_size_mm2) parts.push(`${specs.conductor_size_mm2}mm²`)
  if (specs.cores) parts.push(`${specs.cores} core`)
  if (specs.current_rating_a) parts.push(`${specs.current_rating_a}A`)
  return parts.join(' | ') || '-'
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    circuit_breaker: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    contactor: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    cable: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    busbar: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    enclosure: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    relay: 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
    terminal: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  }
  return colors[category] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
}

// Table columns with mobile priorities
const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', showInMobile: false },
  { key: 'name', label: 'Name', mobilePriority: 1 },
  { key: 'category', label: 'Category', mobilePriority: 2 },
  { key: 'specifications', label: 'Specifications', showInMobile: false },
  { key: 'brand_mappings_count', label: 'Brands', align: 'center', mobilePriority: 3 },
  { key: 'is_active', label: 'Status', align: 'center', showInMobile: false },
]
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Component Library</h1>
        <p class="text-muted-foreground">Manage IEC component standards and brand mappings</p>
      </div>
      <div class="flex items-center gap-3">
        <Button variant="outline" @click="openAutoMapModal">
          <Wand2 class="w-4 h-4 mr-2" />
          Auto-Map
        </Button>
        <Button variant="outline" @click="openImportModal">
          <Upload class="w-4 h-4 mr-2" />
          Import
        </Button>
        <RouterLink to="/settings/component-library/new">
          <Button>
            <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Standard
          </Button>
        </RouterLink>
      </div>
    </div>

    <!-- Stats Banner -->
    <div v-if="importStats" class="bg-card rounded-xl border border-border p-4 mb-6">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
        <div>
          <div class="text-2xl font-semibold">{{ importStats.total_standards }}</div>
          <div class="text-sm text-muted-foreground">Standards</div>
        </div>
        <div>
          <div class="text-2xl font-semibold">{{ importStats.total_mappings }}</div>
          <div class="text-sm text-muted-foreground">Brand Mappings</div>
        </div>
        <div>
          <div class="text-2xl font-semibold text-green-600">{{ importStats.products_with_mapping }}</div>
          <div class="text-sm text-muted-foreground">Products Mapped</div>
        </div>
        <div>
          <div class="text-2xl font-semibold text-amber-600">{{ importStats.products_without_mapping }}</div>
          <div class="text-sm text-muted-foreground">Unmapped</div>
        </div>
        <div>
          <div class="text-2xl font-semibold">{{ importStats.coverage_percentage }}%</div>
          <div class="text-sm text-muted-foreground">Coverage</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search by code, name..."
            @update:model-value="handleSearch"
          />
        </div>
        <div class="w-48">
          <Select
            v-model="filters.category"
            :options="categoryOptions"
            placeholder="All Categories"
          />
        </div>
        <div class="w-40">
          <Select
            v-model="filters.brand"
            :options="brandOptions"
            placeholder="All Brands"
          />
        </div>
        <div class="w-32">
          <Select
            :model-value="filters.is_active === undefined ? '' : String(filters.is_active)"
            :options="statusOptions"
            @update:model-value="handleStatusChange"
          />
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500 dark:text-red-400">Failed to load component standards</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="standards.length === 0" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No component standards found"
        description="Create component standards to enable cross-brand BOM swapping"
        action-label="New Standard"
        @action="$router.push('/settings/component-library/new')"
      />
    </div>

    <!-- Data Table -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <ResponsiveTable
        :items="standards"
        :columns="columns"
        :loading="isLoading"
        title-field="name"
        subtitle-field="code"
        @row-click="(item) => $router.push(`/settings/component-library/${item.id}`)"
      >
        <!-- Custom cell: Code -->
        <template #cell-code="{ item }">
          <span class="font-mono text-sm text-slate-600 dark:text-slate-400">{{ item.code }}</span>
        </template>

        <!-- Custom cell: Name -->
        <template #cell-name="{ item }">
          <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
            {{ item.name }}
          </span>
          <div v-if="item.standard" class="text-xs text-slate-400 dark:text-slate-500">
            {{ item.standard }}
          </div>
        </template>

        <!-- Custom cell: Category -->
        <template #cell-category="{ item }">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
            :class="getCategoryColor(item.category)"
          >
            {{ item.category_label }}
          </span>
          <div v-if="item.subcategory" class="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {{ item.subcategory }}
          </div>
        </template>

        <!-- Custom cell: Specifications -->
        <template #cell-specifications="{ item }">
          <span class="text-sm text-slate-600 dark:text-slate-400">{{ formatSpecs(item.specifications) }}</span>
        </template>

        <!-- Custom cell: Brands -->
        <template #cell-brand_mappings_count="{ item }">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-slate-100">
            {{ item.brand_mappings_count ?? item.brand_mappings?.length ?? 0 }}
          </span>
        </template>

        <!-- Custom cell: Status -->
        <template #cell-is_active="{ item }">
          <Badge :variant="item.is_active ? 'success' : 'default'">
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </Badge>
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ item.name }}
          </span>
        </template>

        <!-- Mobile status slot -->
        <template #mobile-status="{ item }">
          <span
            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
            :class="getCategoryColor(item.category)"
          >
            {{ item.category_label }}
          </span>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-2">
            <RouterLink :to="`/settings/component-library/${item.id}`">
              <Button variant="ghost" size="xs">View</Button>
            </RouterLink>
            <RouterLink :to="`/settings/component-library/${item.id}/edit`">
              <Button variant="ghost" size="xs">Edit</Button>
            </RouterLink>
            <Button
              variant="ghost"
              size="xs"
              class="text-red-500 hover:text-red-600"
              @click.stop="confirmDelete(item.id, item.name)"
            >
              Delete
            </Button>
          </div>
        </template>
      </ResponsiveTable>

      <!-- Pagination -->
      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :per-page="pagination.per_page"
          @page-change="handlePageChange"
        />
      </div>
    </div>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Component Standard" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete <strong class="text-slate-900 dark:text-slate-100">{{ standardToDelete?.name }}</strong>?
        This will also remove all brand mappings.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>

    <!-- Import Modal -->
    <Modal
      :open="showImportModal"
      :title="importStep === 'upload' ? 'Import Component Mappings' : importStep === 'preview' ? 'Validation Preview' : 'Import Complete'"
      size="lg"
      @update:open="closeImportModal"
    >
      <!-- Step 1: Upload -->
      <div v-if="importStep === 'upload'" class="space-y-6">
        <!-- Template Download -->
        <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <FileSpreadsheet class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div class="flex-1">
              <h4 class="font-medium text-blue-900 dark:text-blue-100">Download Template</h4>
              <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Download the Excel template with all required columns, example data, and reference sheets for products, categories, and brands.
              </p>
              <Button variant="outline" size="sm" class="mt-3" :loading="isDownloading" @click="downloadTemplate">
                <Download class="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>
        </div>

        <!-- File Upload Area -->
        <div
          class="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
          :class="selectedFile ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/30' : 'border-border hover:border-primary/50'"
          @dragover.prevent
          @drop="handleFileDrop"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".xlsx,.xls,.csv"
            class="hidden"
            @change="handleFileSelect"
          />

          <div v-if="selectedFile" class="space-y-3">
            <CheckCircle2 class="w-12 h-12 mx-auto text-green-500 dark:text-green-400" />
            <div>
              <p class="font-medium text-slate-900 dark:text-slate-100">{{ selectedFile.name }}</p>
              <p class="text-sm text-muted-foreground">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
            </div>
            <Button variant="ghost" size="sm" @click="selectedFile = null">
              Choose Different File
            </Button>
          </div>

          <div v-else class="space-y-3">
            <Upload class="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <p class="font-medium text-slate-900 dark:text-slate-100">Drop your file here or click to browse</p>
              <p class="text-sm text-muted-foreground">Supports Excel (.xlsx, .xls) and CSV files</p>
            </div>
            <Button variant="outline" @click="fileInputRef?.click()">
              Select File
            </Button>
          </div>
        </div>
      </div>

      <!-- Step 2: Validation Preview -->
      <div v-else-if="importStep === 'preview' && validationResult" class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-700 dark:text-green-400">{{ validationResult.valid_count }}</div>
            <div class="text-sm text-green-600 dark:text-green-500">Valid Rows</div>
          </div>
          <div class="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-amber-700 dark:text-amber-400">{{ validationResult.warning_count }}</div>
            <div class="text-sm text-amber-600 dark:text-amber-500">Warnings</div>
          </div>
          <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-red-700 dark:text-red-400">{{ validationResult.error_count }}</div>
            <div class="text-sm text-red-600 dark:text-red-500">Errors</div>
          </div>
        </div>

        <!-- Import Preview -->
        <div class="bg-card border border-border rounded-lg p-4">
          <h4 class="font-medium mb-2">What will be imported:</h4>
          <ul class="text-sm text-muted-foreground space-y-1">
            <li>• {{ validationResult.summary.new_standards }} new component standards will be created</li>
            <li>• {{ validationResult.summary.new_mappings }} new brand mappings will be added</li>
          </ul>
        </div>

        <!-- Errors -->
        <div v-if="validationResult.errors.length > 0" class="space-y-2">
          <h4 class="font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle class="w-4 h-4" />
            Errors (will be skipped)
          </h4>
          <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3 max-h-40 overflow-y-auto">
            <ul class="text-sm text-red-700 dark:text-red-300 space-y-1">
              <li v-for="error in validationResult.errors" :key="`error-${error.row}`">
                <span class="font-medium">Row {{ error.row }}:</span> {{ error.message }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Warnings -->
        <div v-if="validationResult.warnings.length > 0" class="space-y-2">
          <h4 class="font-medium text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle class="w-4 h-4" />
            Warnings
          </h4>
          <div class="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 max-h-40 overflow-y-auto">
            <ul class="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              <li v-for="warning in validationResult.warnings" :key="`warning-${warning.row}`">
                <span class="font-medium">Row {{ warning.row }}:</span> {{ warning.message }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Cannot Import Message -->
        <div v-if="!validationResult.can_import" class="bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-800 rounded-lg p-4">
          <p class="text-red-700 dark:text-red-300 font-medium">Cannot import: No valid rows found in the file.</p>
        </div>
      </div>

      <!-- Step 3: Result -->
      <div v-else-if="importStep === 'result' && importMutation.data.value" class="space-y-6">
        <div class="text-center py-4">
          <CheckCircle2 class="w-16 h-16 mx-auto text-green-500 dark:text-green-400 mb-4" />
          <h3 class="text-xl font-semibold text-green-700 dark:text-green-400">Import Successful!</h3>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <div class="text-2xl font-bold">{{ importMutation.data.value.data.created_standards }}</div>
            <div class="text-sm text-muted-foreground">Standards Created</div>
          </div>
          <div class="bg-card border border-border rounded-lg p-4 text-center">
            <div class="text-2xl font-bold">{{ importMutation.data.value.data.created_mappings }}</div>
            <div class="text-sm text-muted-foreground">Mappings Created</div>
          </div>
        </div>

        <div v-if="importMutation.data.value.data.updated_mappings > 0" class="text-center text-muted-foreground">
          {{ importMutation.data.value.data.updated_mappings }} existing mappings were updated.
        </div>

        <div v-if="importMutation.data.value.data.skipped_errors > 0" class="text-center text-amber-600">
          {{ importMutation.data.value.data.skipped_errors }} rows were skipped due to errors.
        </div>
      </div>

      <template #footer>
        <!-- Step 1 Footer -->
        <template v-if="importStep === 'upload'">
          <Button variant="ghost" @click="closeImportModal">Cancel</Button>
          <Button
            :disabled="!selectedFile"
            :loading="validateMutation.isPending.value"
            @click="validateFile"
          >
            Validate File
          </Button>
        </template>

        <!-- Step 2 Footer -->
        <template v-else-if="importStep === 'preview'">
          <Button variant="ghost" @click="importStep = 'upload'">Back</Button>
          <Button
            :disabled="!validationResult?.can_import"
            :loading="importMutation.isPending.value"
            @click="executeImport"
          >
            Import {{ validationResult?.valid_count }} Rows
          </Button>
        </template>

        <!-- Step 3 Footer -->
        <template v-else>
          <Button @click="closeImportModal">Done</Button>
        </template>
      </template>
    </Modal>

    <!-- Auto-Mapping Modal -->
    <Modal
      :open="showAutoMapModal"
      :title="autoMapStep === 'loading' ? 'Analyzing Products...' : autoMapStep === 'suggestions' ? 'Auto-Map Suggestions' : 'Mapping Complete'"
      size="xl"
      @update:open="closeAutoMapModal"
    >
      <!-- Loading State -->
      <div v-if="autoMapStep === 'loading'" class="py-12 text-center">
        <Loader2 class="w-12 h-12 mx-auto text-orange-500 dark:text-orange-400 animate-spin mb-4" />
        <p class="text-lg font-medium text-slate-900 dark:text-slate-100">Analyzing unmapped products...</p>
        <p class="text-muted-foreground mt-1">Finding matching component standards</p>
      </div>

      <!-- Suggestions State -->
      <div v-else-if="autoMapStep === 'suggestions'" class="space-y-4">
        <!-- Quick Actions -->
        <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
          <div class="text-sm text-slate-600 dark:text-slate-400">
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ suggestions.length }}</span> products analyzed,
            <span class="font-medium text-green-600 dark:text-green-400">{{ selectedCount }}</span> selected for mapping
          </div>
          <div class="flex gap-2">
            <Button variant="ghost" size="sm" @click="clearAllSelections">
              Clear All
            </Button>
            <Button variant="outline" size="sm" @click="selectAllHighConfidence">
              Select High Confidence (70%+)
            </Button>
          </div>
        </div>

        <!-- Suggestions List -->
        <div class="max-h-[400px] overflow-y-auto space-y-3">
          <div
            v-for="suggestion in suggestions"
            :key="suggestion.product_id"
            class="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
          >
            <!-- Product Info -->
            <div class="flex items-start justify-between mb-3">
              <div>
                <h4 class="font-medium text-slate-900 dark:text-slate-100">{{ suggestion.product_name }}</h4>
                <div class="text-sm text-slate-500 dark:text-slate-400">
                  <span v-if="suggestion.product_sku">SKU: {{ suggestion.product_sku }}</span>
                  <span v-if="suggestion.product_brand" class="ml-2">• {{ suggestion.product_brand }}</span>
                </div>
              </div>
              <div v-if="suggestion.parsed_specs.category" class="text-right">
                <Badge variant="info">{{ suggestion.parsed_specs.category }}</Badge>
                <div v-if="suggestion.parsed_specs.subcategory" class="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {{ suggestion.parsed_specs.subcategory }}
                </div>
              </div>
            </div>

            <!-- Parsed Specs Preview -->
            <div v-if="Object.keys(suggestion.parsed_specs.specs).length > 0" class="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Detected: {{ formatSpecs(suggestion.parsed_specs.specs) }}
            </div>

            <!-- Suggestions or No Match -->
            <div v-if="suggestion.has_suggestions" class="space-y-2">
              <button
                v-for="match in suggestion.suggestions.slice(0, 3)"
                :key="match.component_standard_id"
                type="button"
                class="w-full flex items-center gap-3 p-2 rounded-lg border-2 transition-all text-left"
                :class="selectedMappings.get(suggestion.product_id) === match.component_standard_id
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                  : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'"
                @click="toggleSuggestionSelection(suggestion.product_id, match.component_standard_id)"
              >
                <div
                  class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="selectedMappings.get(suggestion.product_id) === match.component_standard_id
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700'"
                >
                  <Check v-if="selectedMappings.get(suggestion.product_id) === match.component_standard_id" class="w-4 h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm truncate text-slate-900 dark:text-slate-100">{{ match.name }}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400">{{ match.code }}</div>
                </div>
                <div
                  class="px-2 py-1 rounded text-xs font-medium"
                  :class="getMatchScoreColor(match.match_score)"
                >
                  {{ match.match_score }}%
                </div>
                <div v-if="match.existing_brands.length" class="text-xs text-slate-400 dark:text-slate-500">
                  {{ match.existing_brands.length }} brand(s)
                </div>
              </button>
            </div>

            <div v-else class="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2">
              <AlertTriangle class="w-4 h-4" />
              No matching standard found. Consider creating a new standard or importing via Excel.
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="suggestions.length === 0" class="py-8 text-center text-slate-500 dark:text-slate-400">
          No unmapped products with potential matches found.
        </div>
      </div>

      <!-- Result State -->
      <div v-else-if="autoMapStep === 'result' && bulkAcceptMutation.data.value" class="space-y-6">
        <div class="text-center py-4">
          <CheckCircle2 class="w-16 h-16 mx-auto text-green-500 dark:text-green-400 mb-4" />
          <h3 class="text-xl font-semibold text-green-700 dark:text-green-400">Mappings Created!</h3>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-700 dark:text-green-400">{{ bulkAcceptMutation.data.value.data.created }}</div>
            <div class="text-sm text-green-600 dark:text-green-500">Created</div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-slate-700 dark:text-slate-300">{{ bulkAcceptMutation.data.value.data.skipped }}</div>
            <div class="text-sm text-slate-600 dark:text-slate-400">Skipped</div>
          </div>
          <div v-if="bulkAcceptMutation.data.value.data.errors.length" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-red-700 dark:text-red-400">{{ bulkAcceptMutation.data.value.data.errors.length }}</div>
            <div class="text-sm text-red-600 dark:text-red-500">Errors</div>
          </div>
        </div>
      </div>

      <template #footer>
        <!-- Suggestions Footer -->
        <template v-if="autoMapStep === 'suggestions'">
          <Button variant="ghost" @click="closeAutoMapModal">Cancel</Button>
          <Button
            :disabled="selectedCount === 0"
            :loading="bulkAcceptMutation.isPending.value"
            @click="applySelectedMappings"
          >
            Apply {{ selectedCount }} Mapping{{ selectedCount !== 1 ? 's' : '' }}
          </Button>
        </template>

        <!-- Result Footer -->
        <template v-else-if="autoMapStep === 'result'">
          <Button @click="closeAutoMapModal">Done</Button>
        </template>
      </template>
    </Modal>
  </div>
</template>
