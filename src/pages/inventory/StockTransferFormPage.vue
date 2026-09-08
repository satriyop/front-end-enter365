<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useCreateStockTransfer } from '@/api/useStockTransfers'
import { useWarehousesLookup } from '@/api/useWarehouses'
import { useContactsLookup } from '@/api/useContacts'
import { Button, Input, FormField, Textarea, Select, Card, useToast } from '@/components/ui'
import { Plus, Trash2 } from 'lucide-vue-next'

interface Line {
  product_id: number | null
  quantity: number
  unit: string
}

const router = useRouter()
const toast = useToast()
const createMutation = useCreateStockTransfer()

const form = ref({
  operation_type: 'internal' as 'internal' | 'receipt' | 'delivery',
  from_warehouse_id: null as number | null,
  to_warehouse_id: null as number | null,
  contact_id: null as number | null,
  scheduled_date: new Date().toISOString().split('T')[0],
  source_document: '',
  notes: '',
})
const lines = ref<Line[]>([{ product_id: null, quantity: 1, unit: 'pcs' }])
const errors = ref<Record<string, string>>({})

const { data: productsData } = useQuery({
  queryKey: ['products', 'inventory-lookup'],
  queryFn: async () => {
    const response = await api.get<{
      data: Array<{ id: number; sku: string; name: string; track_inventory: boolean; unit: string }>
    }>('/products?per_page=200&track_inventory=true')
    return response.data.data.filter((p) => p.track_inventory)
  },
})
const { data: warehousesData } = useWarehousesLookup()
const { data: contacts } = useContactsLookup()

const productOptions = computed(() =>
  (productsData.value ?? []).map((p) => ({ value: String(p.id), label: `${p.sku} - ${p.name}` })),
)
const warehouseOptions = computed(() =>
  (warehousesData.value ?? []).map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` })),
)
const contactOptions = computed(() => [
  { value: '', label: 'No contact' },
  ...((contacts.value ?? []).map((c) => ({ value: String(c.id), label: `${c.code} - ${c.name}` }))),
])
const operationOptions = [
  { value: 'internal', label: 'Internal Transfer' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'delivery', label: 'Delivery' },
]

function addLine() {
  lines.value = [...lines.value, { product_id: null, quantity: 1, unit: 'pcs' }]
}
function removeLine(index: number) {
  lines.value = lines.value.filter((_, i) => i !== index)
}

async function handleSubmit() {
  errors.value = {}
  const items = lines.value.filter((line) => line.product_id && line.quantity > 0)
  if (!items.length) {
    errors.value.items = 'Add at least one product line'
    return
  }
  if (form.value.operation_type !== 'receipt' && !form.value.from_warehouse_id) {
    errors.value.from_warehouse_id = 'Source warehouse is required'
  }
  if (form.value.operation_type !== 'delivery' && !form.value.to_warehouse_id) {
    errors.value.to_warehouse_id = 'Destination warehouse is required'
  }
  if (Object.keys(errors.value).length) return

  try {
    const created = await createMutation.mutateAsync({
      operation_type: form.value.operation_type,
      from_warehouse_id: form.value.from_warehouse_id,
      to_warehouse_id: form.value.to_warehouse_id,
      contact_id: form.value.contact_id,
      scheduled_date: form.value.scheduled_date,
      source_document: form.value.source_document || null,
      notes: form.value.notes || null,
      items: items.map((line) => ({
        product_id: Number(line.product_id),
        quantity: line.quantity,
        unit: line.unit,
      })),
    })
    toast.success('Draft transfer created')
    router.push(`/inventory/transfer/${created.id}`)
  } catch (err: unknown) {
    toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create transfer')
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">New Stock Transfer</h1>
        <p class="text-muted-foreground">Draft document with product lines — confirm later to move stock</p>
      </div>
      <Button variant="ghost" @click="router.push('/inventory/transfer')">Back to list</Button>
    </div>

    <form novalidate class="space-y-6" @submit.prevent="handleSubmit">
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Transfer</h2>
        </template>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Operation type" required>
            <Select v-model="form.operation_type" :options="operationOptions" />
          </FormField>
          <FormField label="Scheduled date">
            <Input v-model="form.scheduled_date" type="date" />
          </FormField>
          <FormField v-if="form.operation_type !== 'receipt'" label="From warehouse" required :error="errors.from_warehouse_id">
            <Select v-model="form.from_warehouse_id" :options="warehouseOptions" placeholder="Source..." />
          </FormField>
          <FormField v-if="form.operation_type !== 'delivery'" label="To warehouse" required :error="errors.to_warehouse_id">
            <Select v-model="form.to_warehouse_id" :options="warehouseOptions" placeholder="Destination..." />
          </FormField>
          <FormField label="Contact">
            <Select
              :model-value="form.contact_id ? String(form.contact_id) : ''"
              :options="contactOptions"
              @update:model-value="(v) => form.contact_id = v ? Number(v) : null"
            />
          </FormField>
          <FormField label="Source document">
            <Input v-model="form.source_document" placeholder="PO / DO number" />
          </FormField>
          <FormField label="Notes" class="md:col-span-2">
            <Textarea v-model="form.notes" :rows="2" />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-foreground">Product lines</h2>
            <Button type="button" variant="outline" size="sm" @click="addLine">
              <Plus class="h-4 w-4 mr-1" />
              Add line
            </Button>
          </div>
        </template>
        <p v-if="errors.items" class="text-sm text-destructive mb-2">{{ errors.items }}</p>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-muted-foreground border-b border-border">
              <th class="py-2">Product</th>
              <th class="py-2 w-28">Qty</th>
              <th class="py-2 w-24">UoM</th>
              <th class="py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, index) in lines" :key="index" class="border-b border-border">
              <td class="py-2 pr-2">
                <Select
                  :model-value="line.product_id ? String(line.product_id) : ''"
                  :options="productOptions"
                  placeholder="Select product..."
                  @update:model-value="(v) => line.product_id = v ? Number(v) : null"
                />
              </td>
              <td class="py-2 pr-2">
                <Input v-model.number="line.quantity" type="number" min="1" />
              </td>
              <td class="py-2 pr-2">
                <Input v-model="line.unit" />
              </td>
              <td>
                <Button type="button" variant="ghost" size="sm" @click="removeLine(index)">
                  <Trash2 class="h-4 w-4" />
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <div class="flex justify-end gap-2">
        <Button type="button" variant="ghost" @click="router.push('/inventory/transfer')">Cancel</Button>
        <Button type="submit" :loading="createMutation.isPending.value">Create draft</Button>
      </div>
    </form>
  </div>
</template>
