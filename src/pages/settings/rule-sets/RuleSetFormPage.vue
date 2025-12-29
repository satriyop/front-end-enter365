<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  useSpecRuleSet,
  useCreateRuleSet,
  useUpdateRuleSet,
  type RuleSetInput,
} from '@/api/useSpecRuleSets'
import { Button, Input, FormField, Card, useToast } from '@/components/ui'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const ruleSetId = computed(() => route.params.id ? Number(route.params.id) : null)
const isEditing = computed(() => ruleSetId.value !== null)

// Fetch existing rule set if editing
const { data: existingRuleSet, isLoading: isLoadingRuleSet } = useSpecRuleSet(
  computed(() => ruleSetId.value ?? 0)
)

// Mutations
const createMutation = useCreateRuleSet()
const updateMutation = useUpdateRuleSet()

// Form state
const form = ref<RuleSetInput>({
  code: '',
  name: '',
  description: '',
  is_default: false,
  is_active: true,
})
const errors = ref<Record<string, string>>({})

// Populate form when editing
watch(existingRuleSet, (ruleSet) => {
  if (ruleSet) {
    form.value = {
      code: ruleSet.code,
      name: ruleSet.name,
      description: ruleSet.description ?? '',
      is_default: ruleSet.is_default,
      is_active: ruleSet.is_active,
    }
  }
}, { immediate: true })

const isLoading = computed(() => isLoadingRuleSet.value)
const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

function validateForm(): boolean {
  errors.value = {}

  if (!form.value.code.trim()) {
    errors.value.code = 'Code is required'
  } else if (!/^[A-Z0-9_-]+$/.test(form.value.code)) {
    errors.value.code = 'Code must be uppercase letters, numbers, hyphens, or underscores'
  }

  if (!form.value.name.trim()) {
    errors.value.name = 'Name is required'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return

  try {
    if (isEditing.value && ruleSetId.value) {
      await updateMutation.mutateAsync({
        id: ruleSetId.value,
        data: form.value,
      })
      toast.success('Rule set updated')
      router.push(`/settings/rule-sets/${ruleSetId.value}`)
    } else {
      const newRuleSet = await createMutation.mutateAsync(form.value)
      toast.success('Rule set created')
      router.push(`/settings/rule-sets/${newRuleSet.id}`)
    }
  } catch (err: unknown) {
    const response = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data
    if (response?.errors) {
      const fieldErrors: Record<string, string> = {}
      Object.entries(response.errors).forEach(([key, msgs]) => {
        const msg = msgs[0]
        if (msg) fieldErrors[key] = msg
      })
      errors.value = fieldErrors
    }
    toast.error(response?.message || 'Failed to save rule set')
  }
}

function generateCode() {
  if (!form.value.name) return
  form.value.code = form.value.name
    .toUpperCase()
    .replace(/[^A-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 20)
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <RouterLink to="/settings/rule-sets">
        <Button variant="ghost" size="sm">
          <ArrowLeft class="w-4 h-4 mr-2" />
          Back
        </Button>
      </RouterLink>
      <div>
        <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {{ isEditing ? 'Edit Rule Set' : 'New Rule Set' }}
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          {{ isEditing ? 'Update rule set details' : 'Create a new validation rule set' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center h-64">
      <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>Loading...</span>
      </div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Basic Information</h2>
        </template>

        <div class="space-y-4">
          <FormField label="Name" required :error="errors.name">
            <Input
              v-model="form.name"
              placeholder="e.g., Standard IEC Validation"
              @blur="!form.code && generateCode()"
            />
          </FormField>

          <FormField
            label="Code"
            required
            :error="errors.code"
            hint="Unique identifier (uppercase, no spaces)"
          >
            <div class="flex gap-2">
              <Input
                v-model="form.code"
                placeholder="e.g., STANDARD_IEC"
                class="flex-1 font-mono"
              />
              <Button type="button" variant="outline" @click="generateCode">
                Generate
              </Button>
            </div>
          </FormField>

          <FormField label="Description" :error="errors.description">
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Describe what this rule set validates..."
            />
          </FormField>
        </div>
      </Card>

      <Card>
        <template #header>
          <h2 class="font-medium text-slate-900 dark:text-slate-100">Settings</h2>
        </template>

        <div class="space-y-4">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.is_active"
              type="checkbox"
              class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-500"
            />
            <div>
              <span class="font-medium text-slate-900 dark:text-slate-100">Active</span>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                Only active rule sets can be assigned to BOMs
              </p>
            </div>
          </label>

          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="form.is_default"
              type="checkbox"
              class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-500"
            />
            <div>
              <span class="font-medium text-slate-900 dark:text-slate-100">Set as Default</span>
              <p class="text-sm text-slate-500 dark:text-slate-400">
                This rule set will be used when no specific rule set is selected
              </p>
            </div>
          </label>
        </div>
      </Card>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <RouterLink to="/settings/rule-sets">
          <Button type="button" variant="ghost">Cancel</Button>
        </RouterLink>
        <Button type="submit" :loading="isSaving">
          {{ isEditing ? 'Update Rule Set' : 'Create Rule Set' }}
        </Button>
      </div>
    </form>
  </div>
</template>
