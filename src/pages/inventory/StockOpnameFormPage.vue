<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateStockOpname, type CreateStockOpnameData } from '@/api/useStockOpnames'
import { useStockLevels, useWarehousesLookup } from '@/api/useInventory'
import { useProductsLookup } from '@/api/useProducts'
import {
  Button,
  Card,
  Input,
  Select,
  useToast,
} from '@/components/ui'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-vue-next'
import { opnameLineDifference } from './stockOpname'

interface CountLine {
  product_id: number | null
  book_qty: number
  counted_qty: number | null
  unit: string
}

const router = useRouter()
const toast = useToast()

const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehousesLookup()
const { data: products } = useProductsLookup()
const createMutation = useCreateStockOpname()

const form = ref<CreateStockOpnameData>({
  warehouse_id: 0,
  opname_date: new Date().toISOString().split('T')[0],
  name: '',
  notes: '',
})

const lines = ref<CountLine[]>([])

const stockFilters = computed(() => ({
  warehouse_id: form.value.warehouse_id || undefined,
  per_page: 100,
}))
const { data: stockPage, refetch: refetchStock } = useStockLevels(stockFilters)

const stockByProductId = computed(() => {
  const map = new Map<number, { quantity: number; unit: string }>()
  for (const row of stockPage.value?.data ?? []) {
    map.set(row.product_id, {
      quantity: Number(row.quantity ?? 0),
      unit: row.product?.unit ?? 'pcs',
    })
  }
  return map
})

const productOptions = computed(() => {
  const chosen = new Set(lines.value.map((line) => line.product_id).filter(Boolean))
  return (products.value ?? [])
    .filter((product) => product.track_inventory && !chosen.has(product.id))
    .map((product) => ({
      value: String(product.id),
      label: `${product.sku} - ${product.name}`,
    }))
})

watch(warehouses, (list) => {
  if (!list?.length || form.value.warehouse_id) {
    return
  }
  const defaultWarehouse = list.find((warehouse) => warehouse.is_default) ?? list[0]
  form.value.warehouse_id = defaultWarehouse.id
}, { immediate: true })

watch(() => form.value.warehouse_id, () => {
  lines.value = []
  if (form.value.warehouse_id) {
    refetchStock()
  }
})

function emptyLine(): CountLine {
  return { product_id: null, book_qty: 0, counted_qty: null, unit: 'pcs' }
}

function addLine() {
  lines.value = [...lines.value, emptyLine()]
}

function removeLine(index: number) {
  lines.value = lines.value.filter((_, i) => i !== index)
}

function setLineProduct(index: number, value: string | number | null) {
  const productId = value ? Number(value) : null
  const product = products.value?.find((row) => row.id === productId)
  const stock = productId ? stockByProductId.value.get(productId) : undefined
  const book = stock?.quantity ?? 0
  lines.value[index] = {
    product_id: productId,
    book_qty: book,
    counted_qty: lines.value[index].counted_qty ?? book,
    unit: stock?.unit ?? product?.unit ?? 'pcs',
  }
}

function loadOnHandLines() {
  const rows = stockPage.value?.data ?? []
  if (!rows.length) {
    toast.error('No on-hand products in this warehouse')
    return
  }
  lines.value = rows.map((row) => ({
    product_id: row.product_id,
    book_qty: Number(row.quantity ?? 0),
    counted_qty: Number(row.quantity ?? 0),
    unit: row.product?.unit ?? 'pcs',
  }))
}

async function handleSubmit() {
  if (!form.value.warehouse_id) {
    toast.error('Please select a warehouse')
    return
  }

  const items = lines.value
    .filter((line) => line.product_id)
    .map((line) => ({
      product_id: Number(line.product_id),
      counted_quantity: line.counted_qty,
    }))

  if (!items.length) {
    toast.error('Add at least one product line with counted qty')
    return
  }

  try {
    const result = await createMutation.mutateAsync({
      ...form.value,
      items,
    })
    toast.success('Stock opname created with count lines')
    router.push(`/inventory/opnames/${result.id}`)
  } catch (error: unknown) {
    const msg = (error as { message?: string })?.message
    toast.error(msg || 'Failed to create stock opname')
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="sm" @click="router.back()">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back
      </Button>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">New Stock Opname</h1>
    </div>

    <form novalidate @submit.prevent="handleSubmit">
      <Card class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Warehouse</label>
            <Select
              v-model="form.warehouse_id"
              :options="warehouses?.map(w => ({ value: w.id, label: `${w.name} (${w.code})` })) || []"
              :loading="isLoadingWarehouses"
              placeholder="Select a warehouse to count"
              required
              testId="opname-warehouse"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Opname Date</label>
            <Input
              v-model="form.opname_date"
              type="date"
              required
              data-testid="opname-date"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Reference Name (Optional)</label>
            <Input
              v-model="form.name"
              placeholder="e.g. Monthly Count - January 2024"
              data-testid="opname-name"
            />
          </div>
          <div class="space-y-2 md:col-span-2">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <textarea
              v-model="form.notes"
              rows="2"
              data-testid="opname-notes"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Additional information..."
            ></textarea>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="text-sm font-semibold text-slate-900 dark:text-slate-100">Count lines</h2>
            <div class="flex gap-2">
              <Button type="button" variant="outline" size="sm" :disabled="!form.warehouse_id" @click="loadOnHandLines">
                Load on-hand products
              </Button>
              <Button type="button" variant="outline" size="sm" @click="addLine">
                <Plus class="h-4 w-4 mr-1" />
                Add product
              </Button>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-border text-left text-muted-foreground">
                  <th class="py-2 pr-2 font-medium">Product</th>
                  <th class="py-2 pr-2 font-medium text-right">On Hand</th>
                  <th class="py-2 pr-2 font-medium text-right">Counted</th>
                  <th class="py-2 pr-2 font-medium text-right">Difference</th>
                  <th class="py-2 pr-2 font-medium">UoM</th>
                  <th class="py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(line, index) in lines" :key="index" class="border-b border-border">
                  <td class="py-2 pr-2 min-w-[220px]">
                    <Select
                      :model-value="line.product_id ? String(line.product_id) : ''"
                      :options="[{ value: '', label: 'Select product' }, ...productOptions]"
                      @update:model-value="(v) => setLineProduct(index, v)"
                    />
                  </td>
                  <td class="py-2 pr-2 text-right font-mono text-slate-500">
                    {{ line.book_qty }}
                  </td>
                  <td class="py-2 pr-2 w-28">
                    <Input v-model.number="line.counted_qty" type="number" min="0" data-testid="opname-counted-qty" />
                  </td>
                  <td
                    class="py-2 pr-2 text-right font-mono"
                    :class="{
                      'text-green-600 dark:text-green-400': (opnameLineDifference(line.book_qty, line.counted_qty) ?? 0) > 0,
                      'text-red-600 dark:text-red-400': (opnameLineDifference(line.book_qty, line.counted_qty) ?? 0) < 0,
                    }"
                  >
                    {{ opnameLineDifference(line.book_qty, line.counted_qty) ?? '—' }}
                  </td>
                  <td class="py-2 pr-2">{{ line.unit }}</td>
                  <td class="py-2">
                    <Button type="button" variant="ghost" size="sm" @click="removeLine(index)">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
                <tr v-if="!lines.length">
                  <td colspan="6" class="py-4 text-muted-foreground">
                    Add products and enter counted qty. On Hand is the book quantity for this warehouse.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <Button variant="ghost" type="button" @click="router.back()">Cancel</Button>
            <Button
              type="submit"
              :loading="createMutation.isPending.value"
              data-testid="opname-submit"
            >
              <Save class="w-4 h-4 mr-2" />
              Create Opname
            </Button>
          </div>
        </template>
      </Card>
    </form>
  </div>
</template>
