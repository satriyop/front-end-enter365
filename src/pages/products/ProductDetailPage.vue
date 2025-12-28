<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProduct, useDeleteProduct } from '@/api/useProducts'
import { Button, Card, Badge, useToast } from '@/components/ui'
import { formatCurrency } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const productId = computed(() => Number(route.params.id))
const { data: product, isLoading } = useProduct(productId)

const deleteMutation = useDeleteProduct()

async function handleDelete() {
  if (!confirm('Are you sure you want to delete this product?')) return
  try {
    await deleteMutation.mutateAsync(productId.value)
    toast.success('Product deleted')
    router.push('/products')
  } catch {
    toast.error('Failed to delete product')
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="text-slate-500">Loading product...</div>
    </div>

    <template v-else-if="product">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-slate-900">{{ product.name }}</h1>
            <Badge :variant="product.type === 'product' ? 'info' : 'warning'">
              {{ product.type_label }}
            </Badge>
          </div>
          <p class="text-slate-500 font-mono">{{ product.sku }}</p>
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" @click="router.back()">Back</Button>
          <RouterLink :to="`/products/${product.id}/edit`">
            <Button variant="secondary">Edit</Button>
          </RouterLink>
          <Button variant="destructive" @click="handleDelete" :loading="deleteMutation.isPending.value">
            Delete
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Info -->
        <div class="lg:col-span-2 space-y-6">
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Product Information</h2>
            </template>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500">SKU</dt>
                <dd class="font-mono">{{ product.sku }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Type</dt>
                <dd>{{ product.type_label }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Category</dt>
                <dd>{{ product.category?.name ?? '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Unit</dt>
                <dd>{{ product.unit }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-slate-500">Description</dt>
                <dd>{{ product.description || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Pricing</h2>
            </template>
            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500">Purchase Price</dt>
                <dd class="text-lg font-medium">{{ formatCurrency(product.purchase_price) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Selling Price</dt>
                <dd class="text-lg font-medium">{{ formatCurrency(product.selling_price) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Tax Rate</dt>
                <dd>{{ product.tax_rate }}%</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Selling Price (incl. Tax)</dt>
                <dd class="font-medium">{{ product.selling_price_with_tax }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Profit Margin</dt>
                <dd class="text-green-600">{{ product.profit_margin }}</dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Markup</dt>
                <dd>{{ product.markup }}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Inventory</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500">Total Stock</dt>
                <dd class="font-medium">{{ product.current_stock ?? 0 }} {{ product.unit }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Min Stock</dt>
                <dd>{{ product.min_stock ?? 0 }} {{ product.unit }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Track Inventory</dt>
                <dd>
                  <Badge :variant="product.track_inventory ? 'success' : 'default'">
                    {{ product.track_inventory ? 'Yes' : 'No' }}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <template #header>
              <h2 class="font-medium text-slate-900">Status</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500">Active</dt>
                <dd>
                  <Badge :variant="product.is_active ? 'success' : 'destructive'">
                    {{ product.is_active ? 'Active' : 'Inactive' }}
                  </Badge>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500">Taxable</dt>
                <dd>
                  <Badge :variant="product.is_taxable ? 'info' : 'default'">
                    {{ product.is_taxable ? 'Yes' : 'No' }}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </template>
  </div>
</template>
