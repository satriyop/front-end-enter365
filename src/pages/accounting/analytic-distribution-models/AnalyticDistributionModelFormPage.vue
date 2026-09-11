<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnalyticAccountsLookup, analyticDistributionFromRows, analyticDistributionRows } from '@/api/useAnalyticAccounts'
import {
  useAnalyticDistributionModel,
  useCreateAnalyticDistributionModel,
  useUpdateAnalyticDistributionModel,
} from '@/api/useAnalyticDimensions'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const modelId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!modelId.value)
const { data: existing } = useAnalyticDistributionModel(modelId)
const { data: analyticAccounts } = useAnalyticAccountsLookup()

const name = ref('')
const accountPrefix = ref('')
const sequence = ref('10')
const analyticId = ref('')
const percentage = ref('100')

watch(existing, (model) => {
  if (!model) return
  name.value = model.name
  accountPrefix.value = model.account_prefix ?? ''
  sequence.value = String(model.sequence)
  const rows = analyticDistributionRows(model.analytic_distribution)
  analyticId.value = rows[0]?.id ?? ''
  percentage.value = String(rows[0]?.percentage ?? 100)
}, { immediate: true })

const accountOptions = computed(() =>
  (analyticAccounts.value ?? []).map((account) => ({
    value: String(account.id),
    label: account.code + ' · ' + account.name,
  })),
)

const createMutation = useCreateAnalyticDistributionModel()
const updateMutation = useUpdateAnalyticDistributionModel()

function goBack() {
  router.push('/accounting/analytic-distribution-models')
}

async function handleSubmit() {
  if (!name.value.trim() || !analyticId.value) {
    toast.error('Name and analytic account are required')
    return
  }

  const distribution = analyticDistributionFromRows([
    { id: analyticId.value, percentage: Number(percentage.value) || 100 },
  ])
  if (!distribution) {
    toast.error('Analytic distribution is required')
    return
  }

  const payload = {
    name: name.value.trim(),
    account_prefix: accountPrefix.value.trim() || null,
    sequence: Number(sequence.value) || 10,
    analytic_distribution: distribution,
    is_active: true,
  }

  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: modelId.value, data: payload })
      toast.success('Distribution model updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Distribution model created')
    }
    goBack()
  } catch {
    toast.error('Failed to save distribution model')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goBack">
        <ArrowLeft class="w-4 h-4" />
        Analytic Distribution Models
      </button>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Distribution Model' : 'New Distribution Model' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="name" data-testid="analytic-distribution-model-name" placeholder="Name" />
        <Input v-model="accountPrefix" placeholder="GL account prefix (e.g. 5-)" />
        <Input v-model="sequence" type="number" min="0" placeholder="Sequence" />
        <Select
          :model-value="analyticId"
          :options="accountOptions"
          placeholder="Analytic account"
          @update:model-value="(v) => { analyticId = v ? String(v) : '' }"
        />
        <Input v-model="percentage" type="number" min="0" max="100" placeholder="Percentage" />
      </Card>
      <Button type="submit" data-testid="analytic-distribution-model-save">Save</Button>
    </form>
  </div>
</template>
