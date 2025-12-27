<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProducts, useDeleteProduct, type ProductFilters } from '@/api/useProducts'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const toast = useToast()

const filters = ref<ProductFilters>({
  page: 1,
  per_page: 10,
  type: undefined,
  search: '',
})

const { data, isLoading, error } = useProducts(filters)

const products = computed(() => data.value?.data ?? [])
const pagination = computed(() => data.value?.meta)

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'product', label: 'Products' },
  { value: 'service', label: 'Services' },
]

function handlePageChange(page: number) {
  filters.value.page = page
}

function handleSearch(value: string | number) {
  filters.value.search = String(value)
  filters.value.page = 1
}

// Delete handling
const deleteMutation = useDeleteProduct()
const showDeleteModal = ref(false)
const productToDelete = ref<number | null>(null)

function confirmDelete(id: number) {
  productToDelete.value = id
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!productToDelete.value) return
  try {
    await deleteMutation.mutateAsync(productToDelete.value)
    showDeleteModal.value = false
    productToDelete.value = null
    toast.success('Product deleted')
  } catch {
    toast.error('Failed to delete product')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Products</h1>
        <p class="text-slate-500">Manage products and services</p>
      </div>
      <RouterLink to="/products/new">
        <Button variant="primary">
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Product
        </Button>
      </RouterLink>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search by name, SKU..."
            @update:model-value="handleSearch"
          />
        </div>
        <div class="w-40">
          <Select v-model="filters.type" :options="typeOptions" placeholder="All Types" />
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <p class="text-red-500">Failed to load products</p>
    </div>

    <div v-else-if="isLoading" class="bg-white rounded-xl border border-slate-200 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <div v-else-if="products.length === 0" class="bg-white rounded-xl border border-slate-200">
      <EmptyState
        title="No products found"
        description="Add products to manage your inventory"
        action-label="New Product"
        @action="$router.push('/products/new')"
      />
    </div>

    <div v-else class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SKU</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Price</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Stock</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          <tr v-for="product in products" :key="product.id" class="hover:bg-slate-50">
            <td class="px-6 py-4">
              <span class="font-mono text-sm text-slate-600">{{ product.sku }}</span>
            </td>
            <td class="px-6 py-4">
              <RouterLink :to="`/products/${product.id}`" class="text-orange-600 hover:text-orange-700 font-medium">
                {{ product.name }}
              </RouterLink>
            </td>
            <td class="px-6 py-4">
              <Badge :variant="product.type === 'product' ? 'info' : 'warning'">
                {{ product.type_label }}
              </Badge>
            </td>
            <td class="px-6 py-4 text-right font-medium">
              {{ formatCurrency(product.selling_price) }}
            </td>
            <td class="px-6 py-4 text-right">
              {{ product.type === 'product' ? product.current_stock : '-' }}
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <RouterLink :to="`/products/${product.id}/edit`">
                  <Button variant="ghost" size="xs">Edit</Button>
                </RouterLink>
                <Button variant="ghost" size="xs" class="text-red-500 hover:text-red-600" @click="confirmDelete(product.id)">
                  Delete
                </Button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

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

    <Modal :open="showDeleteModal" title="Delete Product" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600">Are you sure you want to delete this product?</p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="danger" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
