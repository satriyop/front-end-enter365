<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useAnalyticPlan,
  useCreateAnalyticPlan,
  useUpdateAnalyticPlan,
} from '@/api/useAnalyticDimensions'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const planId = computed(() => (route.params.id ? String(route.params.id) : ''))
const isEditing = computed(() => !!planId.value)
const { data: existing } = useAnalyticPlan(planId)

const code = ref('')
const name = ref('')
const applicability = ref('optional')
const isActive = ref(true)

watch(existing, (plan) => {
  if (!plan) return
  code.value = plan.code
  name.value = plan.name
  applicability.value = plan.default_applicability
  isActive.value = plan.is_active
}, { immediate: true })

const createMutation = useCreateAnalyticPlan()
const updateMutation = useUpdateAnalyticPlan()

function goBack() {
  router.push('/accounting/analytic-plans')
}

async function handleSubmit() {
  if (!code.value.trim() || !name.value.trim()) {
    toast.error('Code and name are required')
    return
  }

  const payload = {
    code: code.value.trim(),
    name: name.value.trim(),
    default_applicability: applicability.value as 'optional' | 'mandatory' | 'unavailable',
    is_active: isActive.value,
  }

  try {
    if (isEditing.value) {
      await updateMutation.mutateAsync({ id: planId.value, data: payload })
      toast.success('Analytic plan updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Analytic plan created')
    }
    goBack()
  } catch {
    toast.error('Failed to save analytic plan')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 mb-4">
      <button type="button" class="hover:text-slate-700 flex items-center gap-1" @click="goBack">
        <ArrowLeft class="w-4 h-4" />
        Analytic Plans
      </button>
    </div>
    <h1 class="text-2xl font-semibold mb-6">{{ isEditing ? 'Edit Analytic Plan' : 'New Analytic Plan' }}</h1>
    <form class="max-w-xl space-y-4" @submit.prevent="handleSubmit">
      <Card class="space-y-4 p-4">
        <Input v-model="code" data-testid="analytic-plan-code" placeholder="Code" />
        <Input v-model="name" data-testid="analytic-plan-name" placeholder="Name" />
        <Select
          :model-value="applicability"
          :options="[
            { value: 'optional', label: 'Optional' },
            { value: 'mandatory', label: 'Mandatory' },
            { value: 'unavailable', label: 'Unavailable' },
          ]"
          @update:model-value="(v) => { applicability = v ? String(v) : 'optional' }"
        />
        <Select
          :model-value="isActive ? '1' : '0'"
          :options="[
            { value: '1', label: 'Active' },
            { value: '0', label: 'Inactive' },
          ]"
          @update:model-value="(v) => { isActive = String(v) === '1' }"
        />
      </Card>
      <Button type="submit" data-testid="analytic-plan-save">Save</Button>
    </form>
  </div>
</template>
