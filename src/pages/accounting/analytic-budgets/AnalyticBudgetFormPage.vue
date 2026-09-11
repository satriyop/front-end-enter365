<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAnalyticAccountsLookup } from '@/api/useAnalyticAccounts'
import {
  useAnalyticBudget,
  useCreateAnalyticBudget,
  useUpdateAnalyticBudget,
} from '@/api/useAnalyticDimensions'
import { formatCurrency } from '@/utils/format'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const budgetId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!budgetId.value)
const { data: existing } = useAnalyticBudget(budgetId)
const { data: analyticAccounts } = useAnalyticAccountsLookup()

const name = ref('')
const dateFrom = ref(new Date().toISOString().slice(0, 10))
const dateTo = ref(new Date().toISOString().slice(0, 10))
const analyticId = ref('')
const plannedAmount = ref('')

watch(existing, (budget) => {
  if (!budget) return
  name.value = budget.name
  dateFrom.value = budget.date_from
  dateTo.value = budget.date_to
  analyticId.value = budget.lines?.[0] ? String(budget.lines[0].analytic_account_id) : ''
  plannedAmount.value = budget.lines?.[0] ? String(budget.lines[0].planned_amount) : ''
}, { immediate: true })

const accountOptions = computed(() =>
  (analyticAccounts.value ?? []).map((account) => ({
    value: String(account.id),
    label: account.code + ' · ' + account.name,
  })),
)

const createMutation = useCreateAnalyticBudget()
const updateMutation = useUpdateAnalyticBudget()

function goBack() {
  router.push('/accounting/analytic-budgets')
}

async function handleSubmit() {
  if (!name.value.trim() || !analyticId.value || !plannedAmount.value) {
    toast.error('Name, analytic account, and planned amount are required')
    return
  }

  const payload = {
    name: name.value.trim(),
    date_from: dateFrom.value,
    date_to: dateTo.value,
    lines: [{
      analytic_account_id: Number(analyticId.value),
      planned_amount: Number(plannedAmount.value),
    }],
  }

  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: budgetId.value, data: payload })
      toast.success('Analytic budget updated')
      router.push('/accounting/analytic-budgets/' + budgetId.value)
    } else {
      const created = await createMutation.mutateAsync(payload)
      toast.success('Analytic budget created')
      router.push('/accounting/analytic-budgets/' + created.id)
    }
  } catch {
    toast.error('Failed to save analytic budget')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goBack">
        <ArrowLeft class="w-4 h-4" />
        Analytic Budgets
      </button>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Analytic Budget' : 'New Analytic Budget' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="name" data-testid="analytic-budget-name" placeholder="Name" />
        <Input v-model="dateFrom" type="date" />
        <Input v-model="dateTo" type="date" />
        <Select
          :model-value="analyticId"
          :options="accountOptions"
          placeholder="Analytic account"
          @update:model-value="(v) => { analyticId = v ? String(v) : '' }"
        />
        <Input v-model="plannedAmount" type="number" data-testid="analytic-budget-planned" placeholder="Planned amount" />
      </Card>
      <Button type="submit" data-testid="analytic-budget-save">Save</Button>
    </form>

    <Card v-if="existing?.lines?.length" class="mt-6 max-w-xl">
      <div class="p-4 font-semibold">Plan vs actual</div>
      <div v-for="line in existing.lines" :key="line.analytic_account_id" class="px-4 pb-4 text-sm">
        Planned {{ formatCurrency(line.planned_amount) }}
        · Actual {{ formatCurrency(line.actual_amount ?? 0) }}
        · Variance {{ formatCurrency(line.variance ?? 0) }}
      </div>
    </Card>
  </div>
</template>
