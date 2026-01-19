<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  useBomTemplate,
  useBomTemplateMetadata,
  useTemplateAvailableBrands,
  useAddTemplateItem,
  useUpdateTemplateItem,
  useDeleteTemplateItem,
  type BomTemplateItemInput,
  type BomTemplateItem,
} from '@/api/useBomTemplates'
import { useComponentStandards, type ComponentStandardFilters } from '@/api/useComponentStandards'
import { useProducts } from '@/api/useProducts'
import { Button, Input, Select, Modal, Badge, FormField, Card, useToast } from '@/components/ui'
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, PlayCircle, Package, Settings } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const templateId = computed(() => Number(route.params.id))
const { data: template, isLoading, error } = useBomTemplate(templateId)
const { data: metadata } = useBomTemplateMetadata()
const { data: availableBrands } = useTemplateAvailableBrands(templateId)

// Component standards for selection
const standardFilters = ref<ComponentStandardFilters>({ per_page: 100, is_active: true })
const { data: standardsData } = useComponentStandards(standardFilters)
const standards = computed(() => standardsData.value?.data ?? [])

// Products for selection
const productFilters = ref({ per_page: 100 })
const { data: productsData } = useProducts(productFilters)
const products = computed(() => productsData.value?.data ?? [])

// Mutations
const addItemMutation = useAddTemplateItem()
const updateItemMutation = useUpdateTemplateItem()
const deleteItemMutation = useDeleteTemplateItem()

// Item modal state
const showItemModal = ref(false)
const editingItem = ref<BomTemplateItem | null>(null)
const itemForm = ref<BomTemplateItemInput>({
  type: 'material',
  component_standard_id: null,
  product_id: null,
  description: '',
  default_quantity: 1,
  unit: 'pcs',
  is_required: true,
  is_quantity_variable: false,
  notes: '',
})
const itemFormErrors = ref<Record<string, string>>({})

// Delete modal state
const showDeleteModal = ref(false)
const itemToDelete = ref<BomTemplateItem | null>(null)

// Computed options
const typeOptions = computed(() => {
  if (!metadata.value?.item_types) {
    return [
      { value: 'material', label: 'Material' },
      { value: 'labor', label: 'Labor' },
      { value: 'overhead', label: 'Overhead' },
    ]
  }
  return Object.entries(metadata.value.item_types).map(([value, label]) => ({
    value,
    label: label as string
  }))
})

const standardOptions = computed(() => [
  { value: '', label: '-- None --' },
  ...standards.value.map(s => ({
    value: String(s.id),
    label: `${s.code} - ${s.name}`
  }))
])

const productOptions = computed(() => [
  { value: '', label: '-- None --' },
  ...products.value.map(p => ({
    value: String(p.id),
    label: `${p.sku || 'No SKU'} - ${p.name}`
  }))
])

// Group items by type
const groupedItems = computed(() => {
  if (!template.value?.items) return { material: [], labor: [], overhead: [] }
  const groups: Record<string, BomTemplateItem[]> = { material: [], labor: [], overhead: [] }
  for (const item of template.value.items) {
    const arr = groups[item.type]
    if (arr) {
      arr.push(item)
    }
  }
  return groups
})

// Item form handlers
function openAddItem() {
  editingItem.value = null
  itemForm.value = {
    type: 'material',
    component_standard_id: null,
    product_id: null,
    description: '',
    default_quantity: 1,
    unit: 'pcs',
    is_required: true,
    is_quantity_variable: false,
    notes: '',
  }
  itemFormErrors.value = {}
  showItemModal.value = true
}

function openEditItem(item: BomTemplateItem) {
  editingItem.value = item
  itemForm.value = {
    type: item.type,
    component_standard_id: item.component_standard_id,
    product_id: item.product_id,
    description: item.description,
    default_quantity: item.default_quantity,
    unit: item.unit,
    is_required: item.is_required,
    is_quantity_variable: item.is_quantity_variable,
    notes: item.notes ?? '',
  }
  itemFormErrors.value = {}
  showItemModal.value = true
}

function validateItemForm(): boolean {
  itemFormErrors.value = {}

  if (!itemForm.value.description.trim()) {
    itemFormErrors.value.description = 'Description is required'
  }
  if (itemForm.value.default_quantity <= 0) {
    itemFormErrors.value.default_quantity = 'Quantity must be greater than 0'
  }
  if (!itemForm.value.unit.trim()) {
    itemFormErrors.value.unit = 'Unit is required'
  }

  return Object.keys(itemFormErrors.value).length === 0
}

async function handleSaveItem() {
  if (!validateItemForm()) return

  // Convert empty strings to null
  const data = {
    ...itemForm.value,
    component_standard_id: itemForm.value.component_standard_id || null,
    product_id: itemForm.value.product_id || null,
  }

  try {
    if (editingItem.value) {
      await updateItemMutation.mutateAsync({
        templateId: templateId.value,
        itemId: editingItem.value.id,
        data,
      })
      toast.success('Item updated')
    } else {
      await addItemMutation.mutateAsync({
        templateId: templateId.value,
        data,
      })
      toast.success('Item added')
    }
    showItemModal.value = false
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save item'
    toast.error(message)
  }
}

function confirmDeleteItem(item: BomTemplateItem) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

async function handleDeleteItem() {
  if (!itemToDelete.value) return

  try {
    await deleteItemMutation.mutateAsync({
      templateId: templateId.value,
      itemId: itemToDelete.value.id,
    })
    toast.success('Item deleted')
    showDeleteModal.value = false
    itemToDelete.value = null
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete item'
    toast.error(message)
  }
}

// Auto-fill description from standard or product
function handleStandardChange(value: string | number | null) {
  const standardId = value ? Number(value) : null
  itemForm.value.component_standard_id = standardId

  if (standardId && !itemForm.value.description) {
    const standard = standards.value.find(s => s.id === standardId)
    if (standard) {
      itemForm.value.description = standard.name
    }
  }
}

function handleProductChange(value: string | number | null) {
  const productId = value ? Number(value) : null
  itemForm.value.product_id = productId

  if (productId && !itemForm.value.description) {
    const product = products.value.find(p => p.id === productId)
    if (product) {
      itemForm.value.description = product.name
      if (product.unit) itemForm.value.unit = product.unit
    }
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'material': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    case 'labor': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    case 'overhead': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
  }
}

function getTypeLabel(type: string): string {
  return metadata.value?.item_types?.[type] ?? type
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-500 dark:text-red-400">Failed to load template</p>
      <Button variant="outline" class="mt-4" @click="router.back()">Go Back</Button>
    </div>

    <!-- Content -->
    <template v-else-if="template">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <RouterLink to="/settings/bom-templates">
            <Button variant="ghost" size="sm">
              <ArrowLeft class="w-4 h-4 mr-2" />
              Back
            </Button>
          </RouterLink>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ template.name }}</h1>
              <Badge :variant="template.is_active ? 'success' : 'default'">
                {{ template.is_active ? 'Active' : 'Inactive' }}
              </Badge>
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400 font-mono">{{ template.code }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <RouterLink :to="`/boms/from-template?template=${template.id}`">
            <Button variant="outline">
              <PlayCircle class="w-4 h-4 mr-2" />
              Create BOM
            </Button>
          </RouterLink>
          <RouterLink :to="`/settings/bom-templates/${template.id}/edit`">
            <Button variant="outline">
              <Pencil class="w-4 h-4 mr-2" />
              Edit
            </Button>
          </RouterLink>
        </div>
      </div>

      <!-- Info Cards -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Package class="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Total Items</div>
              <div class="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {{ template.items?.length ?? 0 }}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <PlayCircle class="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Times Used</div>
              <div class="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {{ template.usage_count }}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Settings class="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <div class="text-sm text-slate-500 dark:text-slate-400">Rule Set</div>
              <div class="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {{ template.default_rule_set?.code ?? 'Default' }}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Available Brands -->
      <Card v-if="availableBrands && availableBrands.length > 0" class="mb-6">
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Available Brands for This Template</h2>
        </template>
        <div class="flex flex-wrap gap-3">
          <div
            v-for="brand in availableBrands"
            :key="brand.code"
            class="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
          >
            <span class="font-medium text-slate-900 dark:text-slate-100">{{ brand.name }}</span>
            <span class="text-sm text-slate-500 dark:text-slate-400">
              {{ brand.coverage_percent }}% coverage
            </span>
          </div>
        </div>
      </Card>

      <!-- Description -->
      <Card v-if="template.description" class="mb-6">
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Description</h2>
        </template>
        <p class="text-slate-700 dark:text-slate-300">{{ template.description }}</p>
      </Card>

      <!-- Items Section -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Template Items</h2>
        <Button @click="openAddItem">
          <Plus class="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      <!-- Items by Type -->
      <div class="space-y-6">
        <template v-for="(items, type) in groupedItems" :key="type">
          <Card v-if="items.length > 0">
            <template #header>
              <div class="flex items-center gap-2">
                <span
                  class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  :class="getTypeColor(type)"
                >
                  {{ getTypeLabel(type) }}
                </span>
                <span class="text-sm text-slate-500 dark:text-slate-400">
                  {{ items.length }} item{{ items.length !== 1 ? 's' : '' }}
                </span>
              </div>
            </template>

            <div class="divide-y divide-slate-100 dark:divide-slate-800">
              <div
                v-for="item in items"
                :key="item.id"
                class="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
              >
                <GripVertical class="w-4 h-4 text-slate-400 dark:text-slate-600 cursor-move" />

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-slate-900 dark:text-slate-100">
                      {{ item.description }}
                    </span>
                    <Badge v-if="item.is_required" variant="info" size="sm">Required</Badge>
                    <Badge v-if="item.is_quantity_variable" variant="warning" size="sm">Variable Qty</Badge>
                  </div>
                  <div class="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <span>Qty: {{ item.default_quantity }} {{ item.unit }}</span>
                    <span v-if="item.component_standard" class="font-mono text-xs">
                      Standard: {{ item.component_standard.code }}
                    </span>
                    <span v-if="item.product" class="text-xs">
                      Product: {{ item.product.name }}
                    </span>
                  </div>
                  <div v-if="item.notes" class="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">
                    {{ item.notes }}
                  </div>
                </div>

                <div class="flex items-center gap-1">
                  <Button variant="ghost" size="xs" @click="openEditItem(item)">
                    <Pencil class="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    class="text-red-500 hover:text-red-600"
                    @click="confirmDeleteItem(item)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </template>
      </div>

      <!-- Empty Items -->
      <Card v-if="!template.items || template.items.length === 0" class="text-center py-12">
        <div class="text-slate-500 dark:text-slate-400">
          <Package class="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p class="font-medium">No items in this template</p>
          <p class="text-sm mt-1">Add items to define the template structure</p>
          <Button class="mt-4" @click="openAddItem">
            <Plus class="w-4 h-4 mr-2" />
            Add First Item
          </Button>
        </div>
      </Card>
    </template>

    <!-- Item Modal -->
    <Modal
      :open="showItemModal"
      :title="editingItem ? 'Edit Item' : 'Add Item'"
      size="md"
      @update:open="showItemModal = $event"
    >
      <div class="space-y-4">
        <FormField label="Type" required>
          <Select v-model="itemForm.type" :options="typeOptions" />
        </FormField>

        <FormField label="Description" required :error="itemFormErrors.description">
          <Input v-model="itemForm.description" placeholder="e.g., MCB 16A 1P" />
        </FormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Quantity" required :error="itemFormErrors.default_quantity">
            <Input
              v-model.number="itemForm.default_quantity"
              type="number"
              min="0.01"
              step="0.01"
            />
          </FormField>

          <FormField label="Unit" required :error="itemFormErrors.unit">
            <Input v-model="itemForm.unit" placeholder="e.g., pcs, m, kg" />
          </FormField>
        </div>

        <FormField label="Component Standard" hint="Link to IEC standard for brand swapping">
          <Select
            :model-value="itemForm.component_standard_id ? String(itemForm.component_standard_id) : ''"
            :options="standardOptions"
            @update:model-value="handleStandardChange"
          />
        </FormField>

        <FormField label="Specific Product" hint="Optional: use specific product instead of standard">
          <Select
            :model-value="itemForm.product_id ? String(itemForm.product_id) : ''"
            :options="productOptions"
            @update:model-value="handleProductChange"
          />
        </FormField>

        <div class="flex gap-6">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="itemForm.is_required"
              type="checkbox"
              class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-500"
            />
            <span class="text-sm text-slate-700 dark:text-slate-300">Required item</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="itemForm.is_quantity_variable"
              type="checkbox"
              class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-500"
            />
            <span class="text-sm text-slate-700 dark:text-slate-300">Variable quantity</span>
          </label>
        </div>

        <FormField label="Notes">
          <Input v-model="itemForm.notes" placeholder="Optional notes..." />
        </FormField>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showItemModal = false">Cancel</Button>
        <Button
          :loading="addItemMutation.isPending.value || updateItemMutation.isPending.value"
          @click="handleSaveItem"
        >
          {{ editingItem ? 'Update' : 'Add' }} Item
        </Button>
      </template>
    </Modal>

    <!-- Delete Item Modal -->
    <Modal
      :open="showDeleteModal"
      title="Delete Item"
      size="sm"
      @update:open="showDeleteModal = $event"
    >
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete
        <strong class="text-slate-900 dark:text-slate-100">{{ itemToDelete?.description }}</strong>?
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="deleteItemMutation.isPending.value"
          @click="handleDeleteItem"
        >
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
