<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useConfirmFixedAsset,
  useFixedAsset,
  usePostAssetDepreciation,
} from '@/api/useFixedAssets'
import { formatCurrency, formatDate } from '@/utils/format'
import { Button, Card, ResponsiveTable, useToast, type ResponsiveColumn } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const assetId = computed(() => String(route.params.id ?? ''))
const { data: asset, isLoading, error } = useFixedAsset(assetId)
const confirmMutation = useConfirmFixedAsset()
const postMutation = usePostAssetDepreciation()

const columns: ResponsiveColumn[] = [
  { key: 'sequence', label: '#', mobilePriority: 1 },
  { key: 'depreciation_date', label: 'Date', mobilePriority: 2 },
  { key: 'amount', label: 'Amount', mobilePriority: 3 },
  { key: 'remaining_value', label: 'Remaining', showInMobile: false },
  { key: 'status', label: 'Status', mobilePriority: 4 },
]

async function confirm() {
  try {
    await confirmMutation.mutateAsync(assetId.value)
    toast.success('Asset confirmed and schedule generated')
  } catch {
    toast.error('Failed to confirm asset')
  }
}

async function postNext() {
  try {
    await postMutation.mutateAsync(assetId.value)
    toast.success('Depreciation posted')
  } catch {
    toast.error('Failed to post depreciation')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <RouterLink to="/accounting/assets" class="hover:text-slate-700 flex items-center gap-1">
        <ArrowLeft class="w-4 h-4" />
        Assets
      </RouterLink>
    </div>

    <div v-if="error" class="text-red-500">Failed to load asset</div>
    <div v-else-if="isLoading || !asset" class="text-slate-500">Loading…</div>
    <template v-else>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold">{{ asset.code }} · {{ asset.name }}</h1>
          <p class="text-slate-500">{{ asset.status }} · book {{ formatCurrency(asset.book_value) }}</p>
        </div>
        <div class="flex gap-2">
          <Button v-if="asset.status === 'draft'" variant="secondary" @click="router.push(`/accounting/assets/${asset.id}/edit')">
            Edit
          </Button>
          <Button v-if="asset.status === 'draft'" data-testid="asset-confirm" @click="confirm">
            Confirm
          </Button>
          <Button v-if="asset.status === 'running'" data-testid="asset-post-depreciation" @click="postNext">
            Post next depreciation
          </Button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card class="p-4">
          <div class="text-sm text-slate-500">Original</div>
          <div class="font-semibold">{{ formatCurrency(asset.original_value) }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Accumulated</div>
          <div class="font-semibold">{{ formatCurrency(asset.accumulated_depreciation) }}</div>
        </Card>
        <Card class="p-4">
          <div class="text-sm text-slate-500">Acquired</div>
          <div class="font-semibold">{{ formatDate(asset.acquisition_date) }}</div>
        </Card>
      </div>

      <Card>
        <div class="p-4 font-semibold">Depreciation schedule</div>
        <div v-if="!asset.depreciation_lines?.length" class="py-8 text-center text-slate-500">
          Confirm the asset to generate the schedule.
        </div>
        <ResponsiveTable
          v-else
          :items="asset.depreciation_lines"
          :columns="columns"
          row-key="id"
        >
          <template #cell-depreciation_date="{ item }">{{ formatDate(item.depreciation_date) }}</template>
          <template #cell-amount="{ item }">{{ formatCurrency(item.amount) }}</template>
          <template #cell-remaining_value="{ item }">{{ formatCurrency(item.remaining_value) }}</template>
        </ResponsiveTable>
      </Card>
    </template>
  </div>
</template>
