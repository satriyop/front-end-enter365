<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useComponentStandard,
  useDeleteComponentStandard,
  useDeleteBrandMapping,
  useVerifyBrandMapping,
  useSetPreferredMapping,
  useAddBrandMapping,
  useAvailableBrands,
  type BrandMappingInput
} from '@/api/useComponentStandards'
import { useProducts } from '@/api/useProducts'
import { Button, Badge, Modal, Card, Input, Select, useToast } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const standardId = computed(() => Number(route.params.id))
const { data: standard, isLoading, error } = useComponentStandard(standardId)
const { data: brands } = useAvailableBrands()

// Mutations
const deleteMutation = useDeleteComponentStandard()
const deleteMappingMutation = useDeleteBrandMapping()
const verifyMutation = useVerifyBrandMapping()
const setPreferredMutation = useSetPreferredMapping()
const addMappingMutation = useAddBrandMapping()

// Modal states
const showDeleteModal = ref(false)
const showAddMappingModal = ref(false)
const showDeleteMappingModal = ref(false)
const mappingToDelete = ref<{ id: number; brand: string } | null>(null)

// Add mapping form
const newMapping = ref<BrandMappingInput>({
  brand: '',
  product_id: 0,
  brand_sku: '',
  is_preferred: false,
  price_factor: 1.0,
  notes: ''
})

// Product search for mapping
const productSearch = ref('')
const productFilters = computed(() => ({
  search: productSearch.value,
  per_page: 20
}))
const { data: productsData } = useProducts(productFilters)
const products = computed(() => productsData.value?.data ?? [])

const brandOptions = computed(() =>
  brands.value?.map(b => ({ value: b.code, label: b.name })) ?? []
)

// Actions
async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(standardId.value)
    showDeleteModal.value = false
    toast.success('Component standard deleted')
    router.push('/settings/component-library')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete'
    toast.error(message)
  }
}

async function handleDeleteMapping() {
  if (!mappingToDelete.value) return
  try {
    await deleteMappingMutation.mutateAsync({
      standardId: standardId.value,
      mappingId: mappingToDelete.value.id
    })
    showDeleteMappingModal.value = false
    mappingToDelete.value = null
    toast.success('Brand mapping deleted')
  } catch {
    toast.error('Failed to delete mapping')
  }
}

async function handleVerify(mappingId: number) {
  try {
    await verifyMutation.mutateAsync({
      standardId: standardId.value,
      mappingId
    })
    toast.success('Mapping verified')
  } catch {
    toast.error('Failed to verify mapping')
  }
}

async function handleSetPreferred(mappingId: number) {
  try {
    await setPreferredMutation.mutateAsync({
      standardId: standardId.value,
      mappingId
    })
    toast.success('Set as preferred')
  } catch {
    toast.error('Failed to set preferred')
  }
}

async function handleAddMapping() {
  if (!newMapping.value.brand || !newMapping.value.product_id || !newMapping.value.brand_sku) {
    toast.error('Please fill in all required fields')
    return
  }

  try {
    await addMappingMutation.mutateAsync({
      standardId: standardId.value,
      data: newMapping.value
    })
    showAddMappingModal.value = false
    resetMappingForm()
    toast.success('Brand mapping added')
  } catch {
    toast.error('Failed to add mapping')
  }
}

function resetMappingForm() {
  newMapping.value = {
    brand: '',
    product_id: 0,
    brand_sku: '',
    is_preferred: false,
    price_factor: 1.0,
    notes: ''
  }
  productSearch.value = ''
}

function confirmDeleteMapping(id: number, brand: string) {
  mappingToDelete.value = { id, brand }
  showDeleteMappingModal.value = true
}

function selectProduct(productId: number, productName: string) {
  newMapping.value.product_id = productId
  productSearch.value = productName
}

// Helpers
function formatSpecs(specs: Record<string, unknown>): Array<{ key: string; value: unknown }> {
  return Object.entries(specs).map(([key, value]) => ({
    key: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value
  }))
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
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-slate-500">Loading...</div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500">Failed to load component standard</div>

    <!-- Content -->
    <template v-else-if="standard">
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 mb-4">
        <RouterLink to="/settings/component-library" class="hover:text-slate-700">Component Library</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-slate-900">{{ standard.code }}</span>
      </div>

      <!-- Header -->
      <Card class="mb-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900">{{ standard.code }}</h1>
              <span
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                :class="getCategoryColor(standard.category)"
              >
                {{ standard.category_label }}
              </span>
              <Badge :variant="standard.is_active ? 'success' : 'default'">
                {{ standard.is_active ? 'Active' : 'Inactive' }}
              </Badge>
            </div>
            <p class="text-slate-500">{{ standard.name }}</p>
            <p v-if="standard.standard" class="text-sm text-slate-400 mt-1">{{ standard.standard }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <RouterLink :to="`/settings/component-library/${standardId}/edit`">
              <Button variant="secondary" size="sm">Edit</Button>
            </RouterLink>
            <Button
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
          <!-- Specifications Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Specifications</h2>
            </template>
            <dl class="grid grid-cols-2 gap-4">
              <div v-for="spec in formatSpecs(standard.specifications)" :key="spec.key">
                <dt class="text-sm text-slate-500">{{ spec.key }}</dt>
                <dd class="font-medium text-slate-900">{{ spec.value }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Unit</dt>
                <dd class="font-medium text-slate-900">{{ standard.unit }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Brand Mappings Card -->
          <Card>
            <template #header>
              <div class="flex items-center justify-between">
                <h2 class="font-semibold text-slate-900">Brand Mappings</h2>
                <Button variant="secondary" size="sm" @click="showAddMappingModal = true">
                  Add Mapping
                </Button>
              </div>
            </template>

            <div v-if="!standard.brand_mappings?.length" class="py-8 text-center text-slate-500">
              No brand mappings yet. Add mappings to enable cross-brand swapping.
            </div>

            <div v-else class="overflow-x-auto -mx-6">
              <table class="w-full">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Brand</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Product</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Brand SKU</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Price</th>
                    <th class="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr v-for="mapping in standard.brand_mappings" :key="mapping.id" class="hover:bg-slate-50">
                    <td class="px-6 py-4">
                      <span class="font-medium text-slate-900">{{ mapping.brand_label }}</span>
                    </td>
                    <td class="px-6 py-4">
                      <div v-if="mapping.product" class="text-slate-900">
                        {{ mapping.product.name }}
                        <div class="text-sm text-slate-400">{{ mapping.product.sku }}</div>
                      </div>
                      <span v-else class="text-slate-400">-</span>
                    </td>
                    <td class="px-6 py-4">
                      <span class="font-mono text-sm">{{ mapping.brand_sku }}</span>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <span v-if="mapping.product">{{ formatCurrency(mapping.product.selling_price) }}</span>
                      <span v-else>-</span>
                      <div v-if="mapping.price_factor !== 1" class="text-xs text-slate-400">
                        x{{ mapping.price_factor }}
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-center gap-1">
                        <Badge v-if="mapping.is_preferred" variant="success">Preferred</Badge>
                        <Badge v-if="mapping.is_verified" variant="info">Verified</Badge>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <Button
                          v-if="!mapping.is_preferred"
                          variant="ghost"
                          size="xs"
                          :loading="setPreferredMutation.isPending.value"
                          @click="handleSetPreferred(mapping.id)"
                        >
                          Set Preferred
                        </Button>
                        <Button
                          v-if="!mapping.is_verified"
                          variant="ghost"
                          size="xs"
                          :loading="verifyMutation.isPending.value"
                          @click="handleVerify(mapping.id)"
                        >
                          Verify
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          class="text-red-500 hover:text-red-600"
                          @click="confirmDeleteMapping(mapping.id, mapping.brand_label)"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Info Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Information</h2>
            </template>
            <dl class="space-y-3">
              <div>
                <dt class="text-sm text-slate-500">Category</dt>
                <dd class="font-medium text-slate-900">{{ standard.category_label }}</dd>
              </div>
              <div v-if="standard.subcategory">
                <dt class="text-sm text-slate-500">Subcategory</dt>
                <dd class="font-medium text-slate-900">{{ standard.subcategory }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Brand Mappings</dt>
                <dd class="font-medium text-slate-900">{{ standard.brand_mappings?.length ?? 0 }}</dd>
              </div>
              <div v-if="standard.creator">
                <dt class="text-sm text-slate-500">Created By</dt>
                <dd class="font-medium text-slate-900">{{ standard.creator.name }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Created At</dt>
                <dd class="font-medium text-slate-900">{{ formatDate(standard.created_at) }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Available Brands -->
          <Card v-if="standard.available_brands?.length">
            <template #header>
              <h2 class="font-semibold text-slate-900">Available Brands</h2>
            </template>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="brand in standard.available_brands"
                :key="brand"
                class="px-2 py-1 bg-slate-100 rounded text-sm text-slate-700"
              >
                {{ brand }}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </template>

    <!-- Delete Standard Modal -->
    <Modal :open="showDeleteModal" title="Delete Component Standard" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600">
        Are you sure you want to delete this component standard? This will also remove all brand mappings.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>

    <!-- Delete Mapping Modal -->
    <Modal :open="showDeleteMappingModal" title="Delete Brand Mapping" size="sm" @update:open="showDeleteMappingModal = $event">
      <p class="text-slate-600">
        Are you sure you want to delete the <strong>{{ mappingToDelete?.brand }}</strong> mapping?
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteMappingModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMappingMutation.isPending.value" @click="handleDeleteMapping">Delete</Button>
      </template>
    </Modal>

    <!-- Add Mapping Modal -->
    <Modal :open="showAddMappingModal" title="Add Brand Mapping" @update:open="showAddMappingModal = $event">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Brand *</label>
          <Select v-model="newMapping.brand" :options="brandOptions" placeholder="Select brand" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Product *</label>
          <Input v-model="productSearch" placeholder="Search product..." />
          <div v-if="products.length && productSearch" class="mt-2 border rounded-lg max-h-40 overflow-y-auto">
            <button
              v-for="product in products"
              :key="product.id"
              type="button"
              class="w-full px-3 py-2 text-left hover:bg-slate-50 border-b last:border-b-0"
              @click="selectProduct(product.id, product.name)"
            >
              <div class="font-medium">{{ product.name }}</div>
              <div class="text-sm text-slate-500">{{ product.sku }} - {{ formatCurrency(product.selling_price) }}</div>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Brand SKU *</label>
          <Input v-model="newMapping.brand_sku" placeholder="e.g., A9F74116" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Price Factor</label>
          <Input v-model.number="newMapping.price_factor" type="number" step="0.01" min="0.1" max="10" />
          <p class="text-xs text-slate-500 mt-1">Multiplier for price calculation (default: 1.0)</p>
        </div>
        <div>
          <label class="flex items-center gap-2">
            <input v-model="newMapping.is_preferred" type="checkbox" class="rounded" />
            <span class="text-sm text-slate-700">Set as preferred for this brand</span>
          </label>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Notes</label>
          <Input v-model="newMapping.notes" placeholder="Optional notes..." />
        </div>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showAddMappingModal = false; resetMappingForm()">Cancel</Button>
        <Button :loading="addMappingMutation.isPending.value" @click="handleAddMapping">
          Add Mapping
        </Button>
      </template>
    </Modal>
  </div>
</template>
