<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useProduct, useDeleteProduct, useDuplicateProduct, useAdjustProductStock, type StockAdjustmentData } from '@/api/useProducts'
import { useWarehousesLookup } from '@/api/useWarehouses'
import { Button, Card, Badge, Modal, FormField, Input, Select, Textarea, useToast } from '@/components/ui'
import { formatCurrency } from '@/utils/format'
import { Pencil, Trash2, Copy, ArrowLeft, Scale } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const productId = computed(() => Number(route.params.id))
const { data: product, isLoading } = useProduct(productId)

// Lookups for stock adjustment modal
const { data: warehouses } = useWarehousesLookup()

const warehouseOptions = computed(() =>
  warehouses.value?.map(w => ({ value: w.id, label: w.name })) ?? []
)

// Mutations
const deleteMutation = useDeleteProduct()
const duplicateMutation = useDuplicateProduct()
const adjustStockMutation = useAdjustProductStock()

// Delete modal
const showDeleteModal = ref(false)

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(productId.value)
    toast.success('Product deleted')
    router.push('/products')
  } catch {
    toast.error('Failed to delete product')
  } finally {
    showDeleteModal.value = false
  }
}

// Duplicate
async function handleDuplicate() {
  try {
    const newProduct = await duplicateMutation.mutateAsync(productId.value)
    toast.success('Product duplicated')
    router.push(`/products/${newProduct.id}/edit`)
  } catch {
    toast.error('Failed to duplicate product')
  }
}

// Stock Adjustment Modal
const showStockAdjustModal = ref(false)
const stockAdjustData = ref<StockAdjustmentData>({
  warehouse_id: 0,
  quantity_change: 0,
  reason: '',
})

function openStockAdjustModal() {
  stockAdjustData.value = {
    warehouse_id: warehouses.value?.[0]?.id ?? 0,
    quantity_change: 0,
    reason: '',
  }
  showStockAdjustModal.value = true
}

async function handleStockAdjust() {
  if (!stockAdjustData.value.warehouse_id) {
    toast.error('Please select a warehouse')
    return
  }
  if (stockAdjustData.value.quantity_change === 0) {
    toast.error('Quantity change cannot be zero')
    return
  }
  if (!stockAdjustData.value.reason.trim()) {
    toast.error('Please provide a reason')
    return
  }

  try {
    await adjustStockMutation.mutateAsync({
      productId: productId.value,
      data: stockAdjustData.value,
    })
    toast.success('Stock adjusted successfully')
    showStockAdjustModal.value = false
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to adjust stock'
    toast.error(message)
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12">
      <div class="flex items-center justify-center gap-2 text-muted-foreground">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading product...</span>
      </div>
    </div>

    <template v-else-if="product">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-foreground">{{ product.name }}</h1>
            <Badge :variant="product.type === 'product' ? 'info' : 'warning'">
              {{ product.type_label }}
            </Badge>
          </div>
          <p class="text-muted-foreground font-mono">{{ product.sku }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="ghost" @click="router.push('/products')">
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="secondary" :loading="duplicateMutation.isPending.value" @click="handleDuplicate">
            <Copy class="w-4 h-4 mr-2" />
            Duplicate
          </Button>
          <Button
            v-if="product.type === 'product' && product.track_inventory"
            variant="secondary"
            @click="openStockAdjustModal"
          >
            <Scale class="w-4 h-4 mr-2" />
            Adjust Stock
          </Button>
          <RouterLink :to="`/products/${product.id}/edit`">
            <Button variant="secondary">
              <Pencil class="w-4 h-4 mr-2" />
              Edit
            </Button>
          </RouterLink>
          <Button variant="destructive" @click="showDeleteModal = true">
            <Trash2 class="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Info -->
        <div class="lg:col-span-2 space-y-6">
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Product Information</h2>
            </template>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-muted-foreground">SKU</dt>
                <dd class="font-mono text-foreground">{{ product.sku }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Type</dt>
                <dd class="text-foreground">{{ product.type_label }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Category</dt>
                <dd class="text-foreground">{{ product.category?.name ?? '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Unit</dt>
                <dd class="text-foreground">{{ product.unit }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Barcode</dt>
                <dd class="font-mono text-foreground">{{ product.barcode || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Brand</dt>
                <dd class="text-foreground">{{ product.brand || '-' }}</dd>
              </div>
              <div class="col-span-2">
                <dt class="text-sm text-muted-foreground">Description</dt>
                <dd class="text-foreground whitespace-pre-line">{{ product.description || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Pricing</h2>
            </template>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-muted-foreground">Purchase Price</dt>
                <dd class="text-lg font-medium text-foreground">{{ formatCurrency(product.purchase_price) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Selling Price</dt>
                <dd class="text-lg font-medium text-foreground">{{ formatCurrency(product.selling_price) }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Tax Rate</dt>
                <dd class="text-foreground">{{ product.tax_rate }}%</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Selling Price (incl. Tax)</dt>
                <dd class="font-medium text-foreground">{{ product.selling_price_with_tax }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Profit Margin</dt>
                <dd class="text-green-600 dark:text-green-400">{{ product.profit_margin }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Markup</dt>
                <dd class="text-foreground">{{ product.markup }}</dd>
              </div>
            </dl>
          </Card>

          <!-- Accounting Card (only for products) -->
          <Card v-if="product.type === 'product'">
            <template #header>
              <h2 class="font-medium text-foreground">Accounting</h2>
            </template>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-muted-foreground">Inventory Account</dt>
                <dd class="text-foreground">
                  {{ product.inventory_account ? `${product.inventory_account.code} - ${product.inventory_account.name}` : 'Default' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">COGS Account</dt>
                <dd class="text-foreground">
                  {{ product.cogs_account ? `${product.cogs_account.code} - ${product.cogs_account.name}` : 'Default' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Sales Account</dt>
                <dd class="text-foreground">
                  {{ product.sales_account ? `${product.sales_account.code} - ${product.sales_account.name}` : 'Default' }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Purchase Account</dt>
                <dd class="text-foreground">
                  {{ product.purchase_account ? `${product.purchase_account.code} - ${product.purchase_account.name}` : 'Default' }}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <Card v-if="product.type === 'product'">
            <template #header>
              <h2 class="font-medium text-foreground">Inventory</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Total Stock</dt>
                <dd class="font-medium text-foreground">{{ product.current_stock ?? 0 }} {{ product.unit }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Min Stock</dt>
                <dd class="text-foreground">{{ product.min_stock ?? 0 }} {{ product.unit }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Track Inventory</dt>
                <dd>
                  <Badge :variant="product.track_inventory ? 'success' : 'default'">
                    {{ product.track_inventory ? 'Yes' : 'No' }}
                  </Badge>
                </dd>
              </div>
              <div v-if="product.is_low_stock" class="pt-2">
                <Badge variant="warning" class="w-full justify-center">Low Stock</Badge>
              </div>
              <div v-if="product.is_out_of_stock" class="pt-2">
                <Badge variant="destructive" class="w-full justify-center">Out of Stock</Badge>
              </div>
            </dl>
          </Card>

          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Status</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Active</dt>
                <dd>
                  <Badge :variant="product.is_active ? 'success' : 'destructive'">
                    {{ product.is_active ? 'Active' : 'Inactive' }}
                  </Badge>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Taxable</dt>
                <dd>
                  <Badge :variant="product.is_taxable ? 'info' : 'default'">
                    {{ product.is_taxable ? 'Yes' : 'No' }}
                  </Badge>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Sellable</dt>
                <dd>
                  <Badge :variant="product.is_sellable ? 'success' : 'default'">
                    {{ product.is_sellable ? 'Yes' : 'No' }}
                  </Badge>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Purchasable</dt>
                <dd>
                  <Badge :variant="product.is_purchasable ? 'success' : 'default'">
                    {{ product.is_purchasable ? 'Yes' : 'No' }}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Timestamps</h2>
            </template>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Created</dt>
                <dd class="text-foreground">
                  {{ new Date(product.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Updated</dt>
                <dd class="text-foreground">
                  {{ new Date(product.updated_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) }}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </template>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Product" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-muted-foreground">
        Are you sure you want to delete <strong class="text-foreground">{{ product?.name }}</strong>?
        This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>

    <!-- Stock Adjust Modal -->
    <Modal :open="showStockAdjustModal" title="Adjust Stock" size="md" @update:open="showStockAdjustModal = $event">
      <div class="space-y-4">
        <div class="p-3 bg-muted/50 rounded-lg">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Current Stock</span>
            <span class="font-medium text-foreground">{{ product?.current_stock ?? 0 }} {{ product?.unit }}</span>
          </div>
        </div>

        <FormField label="Warehouse" required>
          <Select
            v-model="stockAdjustData.warehouse_id"
            :options="warehouseOptions"
            placeholder="Select warehouse"
          />
        </FormField>

        <FormField label="Quantity Change" required hint="Use positive for increase, negative for decrease">
          <Input
            v-model.number="stockAdjustData.quantity_change"
            type="number"
            placeholder="e.g., 10 or -5"
          />
        </FormField>

        <FormField label="Reason" required>
          <Textarea
            v-model="stockAdjustData.reason"
            :rows="3"
            placeholder="e.g., Inventory count correction, damaged goods, etc."
          />
        </FormField>
      </div>
      <template #footer>
        <Button variant="ghost" @click="showStockAdjustModal = false">Cancel</Button>
        <Button :loading="adjustStockMutation.isPending.value" @click="handleStockAdjust">
          Adjust Stock
        </Button>
      </template>
    </Modal>
  </div>
</template>
