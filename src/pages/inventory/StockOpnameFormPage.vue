<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCreateStockOpname, type CreateStockOpnameData } from '@/api/useStockOpnames'
import { useWarehousesLookup } from '@/api/useInventory'
import { 
  Button, 
  Card, 
  Input, 
  Select, 
  useToast 
} from '@/components/ui'
import { ArrowLeft, Save } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()

const { data: warehouses, isLoading: isLoadingWarehouses } = useWarehousesLookup()
const createMutation = useCreateStockOpname()

const form = ref<CreateStockOpnameData>({
  warehouse_id: 0,
  opname_date: new Date().toISOString().split('T')[0],
  name: '',
  notes: '',
})

async function handleSubmit() {
  if (!form.value.warehouse_id) {
    toast.error('Please select a warehouse')
    return
  }

  try {
    const result = await createMutation.mutateAsync(form.value)
    toast.success('Stock opname created successfully')
    router.push(`/inventory/opnames/${result.id}`)
  } catch (error: any) {
    toast.error(error.message || 'Failed to create stock opname')
  }
}

// Set default warehouse if available
onMounted(() => {
  if (warehouses.value?.length) {
    const defaultWarehouse = warehouses.value.find(w => w.is_default) || warehouses.value[0]
    form.value.warehouse_id = defaultWarehouse.id
  }
})
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="sm" @click="router.back()">
        <ArrowLeft class="w-4 h-4 mr-2" />
        Back
      </Button>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">New Stock Opname</h1>
    </div>

    <form @submit.prevent="handleSubmit">
      <Card class="space-y-6">
        <!-- Warehouse Selection -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Warehouse</label>
          <Select
            v-model="form.warehouse_id"
            :options="warehouses?.map(w => ({ value: w.id, label: `${w.name} (${w.code})` })) || []"
            :loading="isLoadingWarehouses"
            placeholder="Select a warehouse to count"
            required
          />
          <p class="text-xs text-slate-500">The system will snapshot stock levels for this warehouse.</p>
        </div>

        <!-- Date -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Opname Date</label>
          <Input
            v-model="form.opname_date"
            type="date"
            required
          />
        </div>

        <!-- Reference Name -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Reference Name (Optional)</label>
          <Input
            v-model="form.name"
            placeholder="e.g. Monthly Count - January 2024"
          />
        </div>

        <!-- Notes -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
          <textarea
            v-model="form.notes"
            rows="3"
            class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="Additional information..."
          ></textarea>
        </div>

        <!-- Footer Actions -->
        <template #footer>
          <div class="flex justify-end gap-3">
            <Button variant="ghost" type="button" @click="router.back()">Cancel</Button>
            <Button 
              type="submit" 
              :loading="createMutation.isPending.value"
            >
              <Save class="w-4 h-4 mr-2" />
              Create & Continue
            </Button>
          </div>
        </template>
      </Card>
    </form>
  </div>
</template>
