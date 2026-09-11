<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAccountsLookup } from '@/api/useAccounts'
import {
  useAssetModel,
  useCreateAssetModel,
  useUpdateAssetModel,
  type AssetDepreciationMethod,
  type AssetDepreciationPeriod,
} from '@/api/useAssetModels'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const modelId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!modelId.value)
const { data: existing } = useAssetModel(modelId)
const { data: accounts } = useAccountsLookup()

const code = ref('')
const name = ref('')
const method = ref<AssetDepreciationMethod>('linear')
const methodNumber = ref('60')
const methodPeriod = ref<AssetDepreciationPeriod>('month')
const salvagePercent = ref('0')
const assetAccountId = ref('')
const depreciationAccountId = ref('')
const expenseAccountId = ref('')
const isActive = ref(true)

watch(existing, (model) => {
  if (!model) return
  code.value = model.code
  name.value = model.name
  method.value = model.method
  methodNumber.value = String(model.method_number)
  methodPeriod.value = model.method_period
  salvagePercent.value = String(model.salvage_value_percent ?? 0)
  assetAccountId.value = String(model.asset_account_id)
  depreciationAccountId.value = String(model.depreciation_account_id)
  expenseAccountId.value = String(model.expense_account_id)
  isActive.value = model.is_active
}, { immediate: true })

const accountOptions = computed(() =>
  (accounts.value ?? []).map((account) => ({
    value: String(account.id),
    label: `${account.code} · ${account.name}`,
  })),
)

const createMutation = useCreateAssetModel()
const updateMutation = useUpdateAssetModel()

async function handleSubmit() {
  if (!code.value.trim() || !name.value.trim() || !assetAccountId.value) {
    toast.error('Code, name, and accounts are required')
    return
  }

  const payload = {
    code: code.value.trim(),
    name: name.value.trim(),
    method: method.value,
    method_number: Number(methodNumber.value),
    method_period: methodPeriod.value,
    salvage_value_percent: Number(salvagePercent.value),
    asset_account_id: Number(assetAccountId.value),
    depreciation_account_id: Number(depreciationAccountId.value),
    expense_account_id: Number(expenseAccountId.value),
    is_active: isActive.value,
  }

  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: modelId.value, data: payload })
      toast.success('Asset model updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Asset model created')
    }
    router.push('/accounting/asset-models')
  } catch {
    toast.error('Failed to save asset model')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <RouterLink to="/accounting/asset-models" class="hover:text-slate-700 flex items-center gap-1">
        <ArrowLeft class="w-4 h-4" />
        Asset Models
      </RouterLink>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Asset Model' : 'New Asset Model' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="code" data-testid="asset-model-code" placeholder="Code" />
        <Input v-model="name" data-testid="asset-model-name" placeholder="Name" />
        <Select
          v-model="method"
          :options="[
            { value: 'linear', label: 'Linear' },
            { value: 'degressive', label: 'Degressive' },
          ]"
        />
        <Input v-model="methodNumber" type="number" min="1" data-testid="asset-model-periods" placeholder="Number of periods" />
        <Select
          v-model="methodPeriod"
          :options="[
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
          ]"
        />
        <Input v-model="salvagePercent" type="number" min="0" max="99.99" step="0.01" placeholder="Salvage %" />
        <Select
          :model-value="assetAccountId"
          :options="accountOptions"
          placeholder="Asset account"
          @update:model-value="(v) => { assetAccountId = v ? String(v) : '' }"
        />
        <Select
          :model-value="depreciationAccountId"
          :options="accountOptions"
          placeholder="Accumulated depreciation account"
          @update:model-value="(v) => { depreciationAccountId = v ? String(v) : '' }"
        />
        <Select
          :model-value="expenseAccountId"
          :options="accountOptions"
          placeholder="Depreciation expense account"
          @update:model-value="(v) => { expenseAccountId = v ? String(v) : '' }"
        />
        <label class="flex items-center gap-2 text-sm">
          <input v-model="isActive" type="checkbox" />
          Active
        </label>
      </Card>
      <Button type="submit" data-testid="asset-model-save">Save</Button>
    </form>
  </div>
</template>
