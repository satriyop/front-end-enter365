<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTaxRecords, type TaxRecord } from '@/api/useTaxRecords'
import { Button, Card, ResponsiveTable, type ResponsiveColumn } from '@/components/ui'
import { Plus } from 'lucide-vue-next'

const router = useRouter()
const { data: taxes, isLoading, error } = useTaxRecords()

const columns: ResponsiveColumn[] = [
  { key: 'code', label: 'Code', mobilePriority: 1 },
  { key: 'name', label: 'Name', mobilePriority: 2 },
  { key: 'rate', label: 'Rate', mobilePriority: 3 },
  { key: 'applicability', label: 'Type', mobilePriority: 4 },
  { key: 'is_active', label: 'Status', showInMobile: false },
]

function editTax(tax: TaxRecord) {
  router.push(`/accounting/tax-records/${tax.id}/edit`)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">Taxes</h1>
        <p class="text-slate-500 dark:text-slate-400">
          Tax master (percentage computation). Multiple product taxes stack.
        </p>
      </div>
      <Button data-testid="tax-record-create" @click="router.push('/accounting/tax-records/new')">
        <Plus class="w-4 h-4 mr-1" />
        New Tax
      </Button>
    </div>

    <Card>
      <div v-if="error" class="py-12 text-center text-red-500">Failed to load taxes</div>
      <div v-else-if="!isLoading && !taxes?.length" class="py-12 text-center text-slate-500">No taxes found</div>
      <ResponsiveTable
        v-else
        :items="taxes ?? []"
        :columns="columns"
        :loading="isLoading"
        row-key="id"
        @row-click="editTax"
      >
        <template #cell-rate="{ item }">{{ item.rate }}%</template>
        <template #cell-applicability="{ item }">{{ item.applicability }}</template>
        <template #cell-is_active="{ item }">{{ item.is_active ? 'Active' : 'Inactive' }}</template>
      </ResponsiveTable>
    </Card>
  </div>
</template>
