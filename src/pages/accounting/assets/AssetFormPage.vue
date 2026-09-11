<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsLookup } from '@/api/useAccounts'
import { useAssetModelsLookup } from '@/api/useAssetModels'
import { useCreateFixedAsset, useFixedAsset, useUpdateFixedAsset } from '@/api/useFixedAssets'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const assetId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!assetId.value)
const { data: existing } = useFixedAsset(assetId)
const { data: models } = useAssetModelsLookup()
const { data: accounts } = useAccountsLookup()

const code = ref('')
const name = ref('')
const assetModelId = ref('')
const originalValue = ref('')
const salvageValue = ref('0')
const acquisitionDate = ref(new Date().toISOString().slice(0, 10))
const methodNumber = ref('60')
const assetAccountId = ref('')
const depreciationAccountId = ref('')
const expenseAccountId = ref('')

watch(existing, (asset) => {
  if (!asset) return
  code.value = asset.code
  name.value = asset.name
  assetModelId.value = asset.asset_model_id ? String(asset.asset_model_id) : ''
  originalValue.value = String(asset.original_value)
  salvageValue.value = String(asset.salvage_value)
  acquisitionDate.value = asset.acquisition_date
  methodNumber.value = String(asset.method_number)
  assetAccountId.value = String(asset.asset_account_id)
  depreciationAccountId.value = String(asset.depreciation_account_id)
  expenseAccountId.value = String(asset.expense_account_id)
}, { immediate: true })

const modelOptions = computed(() => [
  { value: '', label: 'None (set accounts manually)' },
  ...(models.value ?? []).map((model) => ({
    value: String(model.id),
    label: `${model.code} · ${model.name}`,
  })),
])
const accountOptions = computed(() =>
  (accounts.value ?? []).map((account) => ({
    value: String(account.id),
    label: `${account.code} · ${account.name}`,
  })),
)

const createMutation = useCreateFixedAsset()
const updateMutation = useUpdateFixedAsset()

async function handleSubmit() {
  if (!code.value.trim() || !name.value.trim() || !originalValue.value) {
    toast.error('Code, name, and original value are required')
    return
  }

  const payload: Record<string, unknown> = {
    code: code.value.trim(),
    name: name.value.trim(),
    original_value: Number(originalValue.value),
    salvage_value: Number(salvageValue.value) || 0,
    acquisition_date: acquisitionDate.value,
    asset_model_id: assetModelId.value ? Number(assetModelId.value) : null,
  }

  if (!assetModelId.value) {
    payload.method = 'linear'
    payload.method_number = Number(methodNumber.value)
    payload.method_period = 'month'
    payload.asset_account_id = Number(assetAccountId.value)
    payload.depreciation_account_id = Number(depreciationAccountId.value)
    payload.expense_account_id = Number(expenseAccountId.value)
  }

  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: assetId.value, data: payload })
      toast.success('Asset updated')
      router.push(`/accounting/assets/${assetId.value}`)
    } else {
      const created = await createMutation.mutateAsync(payload as never)
      toast.success('Asset created')
      router.push(`/accounting/assets/${created.id}`)
    }
  } catch {
    toast.error('Failed to save asset')
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
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Asset' : 'New Asset' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="code" data-testid="asset-code" placeholder="Code" />
        <Input v-model="name" data-testid="asset-name" placeholder="Name" />
        <Select
          :model-value="assetModelId"
          :options="modelOptions"
          placeholder="Asset model"
          test-id="asset-model"
          @update:model-value="(v) => { assetModelId = v ? String(v) : '' }"
        />
        <Input v-model="originalValue" type="number" min="1" data-testid="asset-original-value" placeholder="Original value" />
        <Input v-model="salvageValue" type="number" min="0" placeholder="Salvage value" />
        <Input v-model="acquisitionDate" type="date" data-testid="asset-acquisition-date" />
        <template v-if="!assetModelId">
          <Input v-model="methodNumber" type="number" min="1" placeholder="Number of periods" />
          <Select
            :model-value="assetAccountId"
            :options="accountOptions"
            placeholder="Asset account"
            @update:model-value="(v) => { assetAccountId = v ? String(v) : '' }"
          />
          <Select
            :model-value="depreciationAccountId"
            :options="accountOptions"
            placeholder="Accumulated depreciation"
            @update:model-value="(v) => { depreciationAccountId = v ? String(v) : '' }"
          />
          <Select
            :model-value="expenseAccountId"
            :options="accountOptions"
            placeholder="Depreciation expense"
            @update:model-value="(v) => { expenseAccountId = v ? String(v) : '' }"
          />
        </template>
      </Card>
      <Button type="submit" data-testid="asset-save">Save</Button>
    </form>
  </div>
</template>
