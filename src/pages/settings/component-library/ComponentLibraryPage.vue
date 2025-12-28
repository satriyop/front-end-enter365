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
  type ComponentStandardFilters,
  type ImportValidationResult,
} from '@/api/useComponentStandards'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast } from '@/components/ui'
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-vue-next'

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
    circuit_breaker: 'bg-blue-50 text-blue-700',
    contactor: 'bg-purple-50 text-purple-700',
    cable: 'bg-green-50 text-green-700',
    busbar: 'bg-orange-50 text-orange-700',
    enclosure: 'bg-slate-100 text-slate-700',
    relay: 'bg-pink-50 text-pink-700',
    terminal: 'bg-cyan-50 text-cyan-700',
  }
  return colors[category] || 'bg-slate-100 text-slate-700'
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Component Library</h1>
        <p class="text-muted-foreground">Manage IEC component standards and brand mappings</p>
      </div>
      <div class="flex items-center gap-3">
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
    <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6">
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
    <div v-if="error" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <p class="text-red-500">Failed to load component standards</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="standards.length === 0" class="bg-white rounded-xl border border-slate-200">
      <EmptyState
        title="No component standards found"
        description="Create component standards to enable cross-brand BOM swapping"
        action-label="New Standard"
        @action="$router.push('/settings/component-library/new')"
      />
    </div>

    <!-- Data Table -->
    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Specifications</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Brands</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="standard in standards" :key="standard.id" class="hover:bg-slate-50">
            <td class="px-6 py-4">
              <span class="font-mono text-sm text-slate-600">{{ standard.code }}</span>
            </td>
            <td class="px-6 py-4">
              <RouterLink
                :to="`/settings/component-library/${standard.id}`"
                class="text-orange-600 hover:text-orange-700 font-medium"
              >
                {{ standard.name }}
              </RouterLink>
              <div v-if="standard.standard" class="text-xs text-slate-400">
                {{ standard.standard }}
              </div>
            </td>
            <td class="px-6 py-4">
              <span
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                :class="getCategoryColor(standard.category)"
              >
                {{ standard.category_label }}
              </span>
              <div v-if="standard.subcategory" class="text-xs text-slate-400 mt-1">
                {{ standard.subcategory }}
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-slate-600">
              {{ formatSpecs(standard.specifications) }}
            </td>
            <td class="px-6 py-4 text-center">
              <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-sm font-medium">
                {{ standard.brand_mappings_count ?? standard.brand_mappings?.length ?? 0 }}
              </span>
            </td>
            <td class="px-6 py-4 text-center">
              <Badge :variant="standard.is_active ? 'success' : 'default'">
                {{ standard.is_active ? 'Active' : 'Inactive' }}
              </Badge>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <RouterLink :to="`/settings/component-library/${standard.id}`">
                  <Button variant="ghost" size="xs">View</Button>
                </RouterLink>
                <RouterLink :to="`/settings/component-library/${standard.id}/edit`">
                  <Button variant="ghost" size="xs">Edit</Button>
                </RouterLink>
                <Button
                  variant="ghost"
                  size="xs"
                  class="text-red-500 hover:text-red-600"
                  @click="confirmDelete(standard.id, standard.name)"
                >
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200">
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
      <p class="text-slate-600">
        Are you sure you want to delete <strong>{{ standardToDelete?.name }}</strong>?
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
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <FileSpreadsheet class="w-5 h-5 text-blue-600 mt-0.5" />
            <div class="flex-1">
              <h4 class="font-medium text-blue-900">Download Template</h4>
              <p class="text-sm text-blue-700 mt-1">
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
          :class="selectedFile ? 'border-green-300 bg-green-50' : 'border-border hover:border-primary/50'"
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
            <CheckCircle2 class="w-12 h-12 mx-auto text-green-500" />
            <div>
              <p class="font-medium">{{ selectedFile.name }}</p>
              <p class="text-sm text-muted-foreground">{{ (selectedFile.size / 1024).toFixed(1) }} KB</p>
            </div>
            <Button variant="ghost" size="sm" @click="selectedFile = null">
              Choose Different File
            </Button>
          </div>

          <div v-else class="space-y-3">
            <Upload class="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <p class="font-medium">Drop your file here or click to browse</p>
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
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-green-700">{{ validationResult.valid_count }}</div>
            <div class="text-sm text-green-600">Valid Rows</div>
          </div>
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-amber-700">{{ validationResult.warning_count }}</div>
            <div class="text-sm text-amber-600">Warnings</div>
          </div>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <div class="text-2xl font-bold text-red-700">{{ validationResult.error_count }}</div>
            <div class="text-sm text-red-600">Errors</div>
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
          <h4 class="font-medium text-red-700 flex items-center gap-2">
            <AlertCircle class="w-4 h-4" />
            Errors (will be skipped)
          </h4>
          <div class="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
            <ul class="text-sm text-red-700 space-y-1">
              <li v-for="error in validationResult.errors" :key="`error-${error.row}`">
                <span class="font-medium">Row {{ error.row }}:</span> {{ error.message }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Warnings -->
        <div v-if="validationResult.warnings.length > 0" class="space-y-2">
          <h4 class="font-medium text-amber-700 flex items-center gap-2">
            <AlertTriangle class="w-4 h-4" />
            Warnings
          </h4>
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3 max-h-40 overflow-y-auto">
            <ul class="text-sm text-amber-700 space-y-1">
              <li v-for="warning in validationResult.warnings" :key="`warning-${warning.row}`">
                <span class="font-medium">Row {{ warning.row }}:</span> {{ warning.message }}
              </li>
            </ul>
          </div>
        </div>

        <!-- Cannot Import Message -->
        <div v-if="!validationResult.can_import" class="bg-red-100 border border-red-300 rounded-lg p-4">
          <p class="text-red-700 font-medium">Cannot import: No valid rows found in the file.</p>
        </div>
      </div>

      <!-- Step 3: Result -->
      <div v-else-if="importStep === 'result' && importMutation.data.value" class="space-y-6">
        <div class="text-center py-4">
          <CheckCircle2 class="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 class="text-xl font-semibold text-green-700">Import Successful!</h3>
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
  </div>
</template>
