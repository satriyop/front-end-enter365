<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useBom,
  useActivateBom,
  useDeactivateBom,
  useDuplicateBom,
  useDeleteBom,
} from '@/api/useBoms'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Badge, Modal, Card, useToast } from '@/components/ui'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const bomId = computed(() => Number(route.params.id))

const { data: bom, isLoading, error } = useBom(bomId)

// Mutations
const activateMutation = useActivateBom()
const deactivateMutation = useDeactivateBom()
const duplicateMutation = useDuplicateBom()
const deleteMutation = useDeleteBom()

// Modal states
const showDeleteModal = ref(false)

// Action handlers
async function handleActivate() {
  try {
    await activateMutation.mutateAsync(bomId.value)
    toast.success('BOM activated successfully')
  } catch {
    toast.error('Failed to activate BOM')
  }
}

async function handleDeactivate() {
  try {
    await deactivateMutation.mutateAsync(bomId.value)
    toast.success('BOM deactivated')
  } catch {
    toast.error('Failed to deactivate BOM')
  }
}

async function handleDuplicate() {
  try {
    const newBom = await duplicateMutation.mutateAsync(bomId.value)
    toast.success('BOM duplicated')
    router.push(`/boms/${newBom.id}/edit`)
  } catch {
    toast.error('Failed to duplicate BOM')
  }
}

async function handleDelete() {
  try {
    await deleteMutation.mutateAsync(bomId.value)
    showDeleteModal.value = false
    toast.success('BOM deleted')
    router.push('/boms')
  } catch {
    toast.error('Failed to delete BOM')
  }
}

// Status-based action availability
const canEdit = computed(() => bom.value?.status === 'draft')
const canActivate = computed(() => bom.value?.status === 'draft')
const canDeactivate = computed(() => bom.value?.status === 'active')
const canDelete = computed(() => bom.value?.status === 'draft')

function getStatusVariant(status: string): 'default' | 'success' | 'warning' | 'error' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
    draft: 'default',
    active: 'success',
    inactive: 'warning',
  }
  return map[status] || 'default'
}

function getTypeColor(type: string): string {
  const map: Record<string, string> = {
    material: 'text-blue-600 bg-blue-50',
    labor: 'text-purple-600 bg-purple-50',
    overhead: 'text-orange-600 bg-orange-50',
  }
  return map[type] || 'text-slate-600 bg-slate-50'
}

// Cost breakdown percentages
const costBreakdown = computed(() => {
  if (!bom.value || bom.value.total_cost === 0) return null
  const total = bom.value.total_cost
  return {
    material: ((bom.value.total_material_cost / total) * 100).toFixed(1),
    labor: ((bom.value.total_labor_cost / total) * 100).toFixed(1),
    overhead: ((bom.value.total_overhead_cost / total) * 100).toFixed(1),
  }
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="text-center py-12 text-slate-500">
      Loading...
    </div>

    <!-- Error -->
    <div v-else-if="error" class="text-center py-12 text-red-500">
      Failed to load BOM
    </div>

    <!-- Content -->
    <template v-else-if="bom">
      <!-- Breadcrumb -->
      <div class="text-sm text-slate-500 mb-4">
        <RouterLink to="/boms" class="hover:text-slate-700">Bill of Materials</RouterLink>
        <span class="mx-2">/</span>
        <span class="text-slate-900">{{ bom.bom_number }}</span>
      </div>

      <!-- Header -->
      <Card class="mb-6">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-semibold text-slate-900">
                {{ bom.bom_number }}
              </h1>
              <Badge :variant="getStatusVariant(bom.status)">
                {{ bom.status }}
              </Badge>
              <span v-if="bom.version > 1" class="text-sm text-slate-500">
                v{{ bom.version }}
              </span>
            </div>
            <p class="text-slate-500">{{ bom.name }}</p>
            <p v-if="bom.product" class="text-sm text-slate-600 mt-1">
              Product: <span class="font-medium">{{ bom.product.name }}</span>
              <span v-if="bom.product.sku" class="text-slate-400">({{ bom.product.sku }})</span>
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              :loading="duplicateMutation.isPending.value"
              @click="handleDuplicate"
            >
              Duplicate
            </Button>

            <RouterLink v-if="canEdit" :to="`/boms/${bomId}/edit`">
              <Button variant="secondary" size="sm">Edit</Button>
            </RouterLink>

            <Button
              v-if="canActivate"
              variant="success"
              size="sm"
              :loading="activateMutation.isPending.value"
              @click="handleActivate"
            >
              Activate
            </Button>

            <Button
              v-if="canDeactivate"
              variant="secondary"
              size="sm"
              :loading="deactivateMutation.isPending.value"
              @click="handleDeactivate"
            >
              Deactivate
            </Button>

            <Button
              v-if="canDelete"
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
          <!-- Details Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Details</h2>
            </template>

            <dl class="grid grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-slate-500">Output Quantity</dt>
                <dd class="font-medium text-slate-900">
                  {{ bom.output_quantity }} {{ bom.output_unit }}
                </dd>
              </div>
              <div>
                <dt class="text-sm text-slate-500">Unit Cost</dt>
                <dd class="font-medium text-slate-900">{{ formatCurrency(bom.unit_cost) }}</dd>
              </div>
              <div v-if="bom.variant_label">
                <dt class="text-sm text-slate-500">Variant</dt>
                <dd class="font-medium text-slate-900">{{ bom.variant_label }}</dd>
              </div>
              <div v-if="bom.creator">
                <dt class="text-sm text-slate-500">Created By</dt>
                <dd class="font-medium text-slate-900">{{ bom.creator.name }}</dd>
              </div>
              <div v-if="bom.description" class="col-span-2">
                <dt class="text-sm text-slate-500">Description</dt>
                <dd class="font-medium text-slate-900">{{ bom.description }}</dd>
              </div>
            </dl>
          </Card>

          <!-- BOM Items Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">BOM Items</h2>
            </template>

            <div class="overflow-x-auto -mx-6">
              <table class="w-full">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Qty</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Unit Cost</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-200">
                  <tr v-for="item in bom.items" :key="item.id">
                    <td class="px-6 py-4">
                      <span
                        class="inline-flex items-center px-2 py-1 rounded text-xs font-medium capitalize"
                        :class="getTypeColor(item.type)"
                      >
                        {{ item.type }}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="font-medium text-slate-900">
                        {{ item.product?.name || item.description }}
                      </div>
                      <div v-if="item.product?.sku" class="text-sm text-slate-500">
                        {{ item.product.sku }}
                      </div>
                      <div v-if="item.waste_percentage > 0" class="text-xs text-orange-600">
                        +{{ item.waste_percentage }}% waste allowance
                      </div>
                    </td>
                    <td class="px-6 py-4 text-right text-slate-900">
                      {{ item.quantity }} {{ item.unit }}
                    </td>
                    <td class="px-6 py-4 text-right text-slate-900">
                      {{ formatCurrency(item.unit_cost) }}
                    </td>
                    <td class="px-6 py-4 text-right font-medium text-slate-900">
                      {{ formatCurrency(item.total_cost) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="!bom.items?.length" class="py-8 text-center text-slate-500">
              No items in this BOM
            </div>
          </Card>

          <!-- Notes -->
          <Card v-if="bom.notes">
            <template #header>
              <h2 class="font-semibold text-slate-900">Notes</h2>
            </template>
            <p class="text-slate-600 whitespace-pre-line">{{ bom.notes }}</p>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Cost Summary Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Cost Summary</h2>
            </template>

            <dl class="space-y-3">
              <div class="flex justify-between">
                <dt class="text-slate-500 flex items-center gap-2">
                  <span class="w-3 h-3 rounded bg-blue-500"></span>
                  Materials
                </dt>
                <dd class="font-medium text-slate-900">
                  {{ formatCurrency(bom.total_material_cost) }}
                  <span v-if="costBreakdown" class="text-sm text-slate-500">
                    ({{ costBreakdown.material }}%)
                  </span>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 flex items-center gap-2">
                  <span class="w-3 h-3 rounded bg-purple-500"></span>
                  Labor
                </dt>
                <dd class="font-medium text-slate-900">
                  {{ formatCurrency(bom.total_labor_cost) }}
                  <span v-if="costBreakdown" class="text-sm text-slate-500">
                    ({{ costBreakdown.labor }}%)
                  </span>
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-slate-500 flex items-center gap-2">
                  <span class="w-3 h-3 rounded bg-orange-500"></span>
                  Overhead
                </dt>
                <dd class="font-medium text-slate-900">
                  {{ formatCurrency(bom.total_overhead_cost) }}
                  <span v-if="costBreakdown" class="text-sm text-slate-500">
                    ({{ costBreakdown.overhead }}%)
                  </span>
                </dd>
              </div>
              <hr class="border-slate-200" />
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900">Total Cost</dt>
                <dd class="font-bold text-lg text-slate-900">
                  {{ formatCurrency(bom.total_cost) }}
                </dd>
              </div>
              <div class="flex justify-between">
                <dt class="font-semibold text-slate-900">Unit Cost</dt>
                <dd class="font-bold text-lg text-orange-600">
                  {{ formatCurrency(bom.unit_cost) }}
                </dd>
              </div>
            </dl>

            <!-- Cost Breakdown Bar -->
            <div v-if="costBreakdown" class="mt-4">
              <div class="h-3 rounded-full overflow-hidden flex bg-slate-100">
                <div
                  class="bg-blue-500"
                  :style="{ width: `${costBreakdown.material}%` }"
                ></div>
                <div
                  class="bg-purple-500"
                  :style="{ width: `${costBreakdown.labor}%` }"
                ></div>
                <div
                  class="bg-orange-500"
                  :style="{ width: `${costBreakdown.overhead}%` }"
                ></div>
              </div>
            </div>
          </Card>

          <!-- Activity Card -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900">Activity</h2>
            </template>
            <ul class="space-y-3 text-sm">
              <li v-if="bom.approved_at" class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                <div>
                  <p class="text-slate-900">Activated</p>
                  <p class="text-slate-500">{{ formatDate(bom.approved_at) }}</p>
                </div>
              </li>
              <li class="flex gap-3">
                <div class="w-2 h-2 mt-1.5 rounded-full bg-slate-300"></div>
                <div>
                  <p class="text-slate-900">Created</p>
                  <p class="text-slate-500">{{ formatDate(bom.created_at) }}</p>
                </div>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </template>

    <!-- Delete Modal -->
    <Modal :open="showDeleteModal" title="Delete BOM" size="sm" @update:open="showDeleteModal = $event">
      <p class="text-slate-600">
        Are you sure you want to delete this BOM? This action cannot be undone.
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button
          variant="danger"
          :loading="deleteMutation.isPending.value"
          @click="handleDelete"
        >
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
