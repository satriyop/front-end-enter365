<script setup lang="ts">
import { useProducts, useDeleteProduct, type ProductFilters, type Product } from '@/api/useProducts'
import { useResourceList } from '@/composables/useResourceList'
import { Button, Input, Select, Pagination, EmptyState, Modal, Badge, useToast, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const toast = useToast()

// Resource list with filters, pagination, and delete confirmation
const {
  items: products,
  pagination,
  isLoading,
  error,
  isEmpty,
  filters,
  updateFilter,
  goToPage,
  deleteConfirmation,
} = useResourceList<Product, ProductFilters>({
  useListHook: useProducts,
  initialFilters: {
    page: 1,
    per_page: 10,
    type: undefined,
    search: '',
  },
})

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'product', label: 'Products' },
  { value: 'service', label: 'Services' },
]

// Table columns with mobile priorities
const columns: ResponsiveColumn[] = [
  { key: 'sku', label: 'SKU', mobilePriority: 2 },
  { key: 'name', label: 'Name', mobilePriority: 1 },
  { key: 'type', label: 'Type', mobilePriority: 4 },
  { key: 'selling_price', label: 'Price', align: 'right', mobilePriority: 3, format: (v) => formatCurrency(v as number) },
  { key: 'current_stock', label: 'Stock', align: 'right', showInMobile: false },
]

// Delete handling
const deleteMutation = useDeleteProduct()

async function handleDelete() {
  const id = deleteConfirmation.executeDelete()
  if (!id) return

  try {
    await deleteMutation.mutateAsync(id as number)
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
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Products</h1>
        <p class="text-slate-500 dark:text-slate-400">Manage products and services</p>
      </div>
      <RouterLink to="/products/new">
        <Button>
          <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Product
        </Button>
      </RouterLink>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <Input
            :model-value="filters.search"
            placeholder="Search by name, SKU..."
            @update:model-value="(v) => updateFilter('search', String(v))"
          />
        </div>
        <div class="w-40">
          <Select v-model="filters.type" :options="typeOptions" placeholder="All Types" />
        </div>
      </div>
    </div>

    <div v-if="error" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <p class="text-red-500">Failed to load products</p>
    </div>

    <div v-else-if="isLoading" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
      <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <div v-else-if="isEmpty" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
      <EmptyState
        title="No products found"
        description="Add products to manage your inventory"
        action-label="New Product"
        @action="$router.push('/products/new')"
      />
    </div>

    <div v-else class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <ResponsiveTable
        :items="products"
        :columns="columns"
        :loading="isLoading"
        title-field="name"
        subtitle-field="sku"
        @row-click="(item) => $router.push(`/products/${item.id}`)"
      >
        <!-- Custom cell: SKU -->
        <template #cell-sku="{ item }">
          <span class="font-mono text-sm text-slate-600 dark:text-slate-400">{{ item.sku }}</span>
        </template>

        <!-- Custom cell: Name with link styling -->
        <template #cell-name="{ item }">
          <span class="text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 font-medium">
            {{ item.name }}
          </span>
        </template>

        <!-- Custom cell: Type badge -->
        <template #cell-type="{ item }">
          <Badge :variant="item.type === 'product' ? 'info' : 'warning'">
            {{ item.type_label }}
          </Badge>
        </template>

        <!-- Custom cell: Stock -->
        <template #cell-current_stock="{ item }">
          {{ item.type === 'product' ? item.current_stock : '-' }}
        </template>

        <!-- Mobile title slot -->
        <template #mobile-title="{ item }">
          <span class="text-orange-600 dark:text-orange-400 font-medium">
            {{ item.name }}
          </span>
        </template>

        <!-- Actions -->
        <template #actions="{ item }">
          <div class="flex items-center justify-end gap-2">
            <RouterLink :to="`/products/${item.id}/edit`">
              <Button variant="ghost" size="xs">Edit</Button>
            </RouterLink>
            <Button variant="ghost" size="xs" class="text-red-500 hover:text-red-600" @click.stop="deleteConfirmation.confirmDelete(item.id)">
              Delete
            </Button>
          </div>
        </template>
      </ResponsiveTable>

      <div v-if="pagination" class="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
        <Pagination
          :current-page="pagination.current_page"
          :total-pages="pagination.last_page"
          :total="pagination.total"
          :per-page="pagination.per_page"
          @page-change="goToPage"
        />
      </div>
    </div>

    <Modal :open="deleteConfirmation.showModal.value" title="Delete Product" size="sm" @update:open="deleteConfirmation.showModal.value = $event">
      <p class="text-slate-600 dark:text-slate-400">Are you sure you want to delete this product?</p>
      <template #footer>
        <Button variant="ghost" @click="deleteConfirmation.cancelDelete()">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
