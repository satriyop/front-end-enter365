<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  useWarehouse,
  useDeleteWarehouse,
  useSetDefaultWarehouse,
  useWarehouseStockSummary
} from '@/api/useWarehouses'
import { formatCurrency } from '@/utils/format'
import { Button, Card, Badge, Modal, useToast } from '@/components/ui'
import { Pencil, Trash2, Star, ArrowLeft, Package, Boxes, DollarSign } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const warehouseId = computed(() => Number(route.params.id))
const { data: warehouse, isLoading } = useWarehouse(warehouseId)
const { data: stockSummary, isLoading: loadingStockSummary } = useWarehouseStockSummary(warehouseId)

const deleteMutation = useDeleteWarehouse()
const setDefaultMutation = useSetDefaultWarehouse()

// Delete modal
const showDeleteModal = ref(false)

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(warehouseId.value)
    toast.success('Warehouse deleted')
    router.push('/settings/warehouses')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete warehouse'
    toast.error(message)
  } finally {
    showDeleteModal.value = false
  }
}

async function handleSetDefault() {
  try {
    await setDefaultMutation.mutateAsync(warehouseId.value)
    toast.success('Warehouse set as default')
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to set default warehouse'
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
        <span>Loading warehouse...</span>
      </div>
    </div>

    <template v-else-if="warehouse">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-semibold text-foreground">{{ warehouse.name }}</h1>
            <Badge v-if="warehouse.is_default" variant="info">Default</Badge>
            <Badge :variant="warehouse.is_active ? 'success' : 'default'">
              {{ warehouse.is_active ? 'Active' : 'Inactive' }}
            </Badge>
          </div>
          <p class="text-muted-foreground font-mono">{{ warehouse.code }}</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="ghost" @click="router.push('/settings/warehouses')">
            <ArrowLeft class="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            v-if="!warehouse.is_default"
            variant="secondary"
            :loading="setDefaultMutation.isPending.value"
            @click="handleSetDefault"
          >
            <Star class="w-4 h-4 mr-2" />
            Set as Default
          </Button>
          <RouterLink :to="`/settings/warehouses/${warehouse.id}/edit`">
            <Button variant="secondary">
              <Pencil class="w-4 h-4 mr-2" />
              Edit
            </Button>
          </RouterLink>
          <Button
            variant="destructive"
            :disabled="warehouse.is_default"
            @click="showDeleteModal = true"
          >
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
              <h2 class="font-medium text-foreground">Basic Information</h2>
            </template>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-muted-foreground">Code</dt>
                <dd class="font-mono text-foreground">{{ warehouse.code }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Name</dt>
                <dd class="text-foreground">{{ warehouse.name }}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Contact Details</h2>
            </template>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="col-span-2">
                <dt class="text-sm text-muted-foreground">Address</dt>
                <dd class="text-foreground whitespace-pre-line">{{ warehouse.address || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Phone</dt>
                <dd class="text-foreground">{{ warehouse.phone || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">Contact Person</dt>
                <dd class="text-foreground">{{ warehouse.contact_person || '-' }}</dd>
              </div>
            </dl>
          </Card>

          <Card v-if="warehouse.notes">
            <template #header>
              <h2 class="font-medium text-foreground">Notes</h2>
            </template>
            <p class="text-foreground whitespace-pre-line">{{ warehouse.notes }}</p>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Status</h2>
            </template>
            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Default Warehouse</dt>
                <dd>
                  <Badge :variant="warehouse.is_default ? 'info' : 'default'">
                    {{ warehouse.is_default ? 'Yes' : 'No' }}
                  </Badge>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Active</dt>
                <dd>
                  <Badge :variant="warehouse.is_active ? 'success' : 'destructive'">
                    {{ warehouse.is_active ? 'Active' : 'Inactive' }}
                  </Badge>
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Stock Summary</h2>
            </template>
            <div v-if="loadingStockSummary" class="flex items-center justify-center py-4 text-muted-foreground">
              <svg class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading...
            </div>
            <dl v-else-if="stockSummary" class="space-y-4">
              <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div class="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Package class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <dt class="text-sm text-muted-foreground">Total Products</dt>
                  <dd class="text-lg font-semibold text-foreground">
                    {{ stockSummary.summary.total_products }}
                  </dd>
                </div>
              </div>
              <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div class="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Boxes class="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <dt class="text-sm text-muted-foreground">Total Quantity</dt>
                  <dd class="text-lg font-semibold text-foreground">
                    {{ stockSummary.summary.total_quantity.toLocaleString() }}
                  </dd>
                </div>
              </div>
              <div class="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <DollarSign class="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <dt class="text-sm text-muted-foreground">Total Value</dt>
                  <dd class="text-lg font-semibold text-foreground">
                    {{ formatCurrency(stockSummary.summary.total_value) }}
                  </dd>
                </div>
              </div>
            </dl>
            <div v-else class="text-center py-4 text-muted-foreground">
              <p class="text-sm">No stock data available</p>
            </div>
          </Card>

          <Card>
            <template #header>
              <h2 class="font-medium text-foreground">Timestamps</h2>
            </template>
            <dl class="space-y-3 text-sm">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Created</dt>
                <dd class="text-foreground">
                  {{ new Date(warehouse.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">Updated</dt>
                <dd class="text-foreground">
                  {{ new Date(warehouse.updated_at).toLocaleDateString('id-ID', { dateStyle: 'medium' }) }}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </template>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete Warehouse" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-muted-foreground">
        Are you sure you want to delete <strong class="text-foreground">{{ warehouse?.name }}</strong>?
        This action cannot be undone.
      </p>
      <p class="text-sm text-amber-600 dark:text-amber-500 mt-2">
        Note: Warehouses with existing stock cannot be deleted.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button variant="destructive" :loading="deleteMutation.isPending.value" @click="handleDelete">Delete</Button>
      </template>
    </Modal>
  </div>
</template>
