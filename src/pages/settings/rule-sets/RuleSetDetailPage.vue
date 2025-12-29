<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import {
  useSpecRuleSet,
  useRuleSetMetadata,
  useAddRule,
  useUpdateRule,
  useDeleteRule,
  useSetDefaultRuleSet,
  type RuleInput,
  type SpecValidationRule,
} from '@/api/useSpecRuleSets'
import { Button, Input, Select, Modal, Badge, FormField, Card, useToast } from '@/components/ui'
import { ArrowLeft, Plus, Pencil, Trash2, Star, GripVertical } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const ruleSetId = computed(() => Number(route.params.id))
const { data: ruleSet, isLoading, error, refetch } = useSpecRuleSet(ruleSetId)
const { data: metadata } = useRuleSetMetadata()

// Mutations
const addRuleMutation = useAddRule()
const updateRuleMutation = useUpdateRule()
const deleteRuleMutation = useDeleteRule()
const setDefaultMutation = useSetDefaultRuleSet()

// Rule modal state
const showRuleModal = ref(false)
const editingRule = ref<SpecValidationRule | null>(null)
const ruleForm = ref<RuleInput>({
  category: '',
  spec_key: '',
  validation_type: 'exact_match',
  allowed_values: [],
  tolerance_percent: undefined,
  severity: 'error',
  error_message: '',
  is_active: true,
})
const ruleFormErrors = ref<Record<string, string>>({})

// Delete modal state
const showDeleteModal = ref(false)
const ruleToDelete = ref<SpecValidationRule | null>(null)

// Computed options
const categoryOptions = computed(() => {
  if (!metadata.value?.categories) return []
  return Object.entries(metadata.value.categories).map(([value, label]) => ({
    value,
    label: label as string
  }))
})

const validationTypeOptions = computed(() => {
  if (!metadata.value?.validation_types) return []
  return Object.entries(metadata.value.validation_types).map(([value, label]) => ({
    value,
    label: label as string
  }))
})

const severityOptions = computed(() => {
  if (!metadata.value?.severity_levels) return []
  return Object.entries(metadata.value.severity_levels).map(([value, label]) => ({
    value,
    label: label as string
  }))
})

const specKeyOptions = computed(() => {
  if (!metadata.value?.common_spec_keys || !ruleForm.value.category) return []
  const keys = metadata.value.common_spec_keys[ruleForm.value.category] ?? []
  return keys.map(key => ({ value: key, label: key }))
})

const showToleranceField = computed(() =>
  ['tolerance', 'min_value'].includes(ruleForm.value.validation_type)
)

const showAllowedValuesField = computed(() =>
  ['exact_match', 'one_of'].includes(ruleForm.value.validation_type)
)

// Group rules by category
const groupedRules = computed(() => {
  if (!ruleSet.value?.rules) return {}
  const groups: Record<string, SpecValidationRule[]> = {}
  for (const rule of ruleSet.value.rules) {
    if (!groups[rule.category]) {
      groups[rule.category] = []
    }
    const arr = groups[rule.category]
    if (arr) arr.push(rule)
  }
  return groups
})

// Rule form handlers
function openAddRule() {
  editingRule.value = null
  ruleForm.value = {
    category: '',
    spec_key: '',
    validation_type: 'exact_match',
    allowed_values: [],
    tolerance_percent: undefined,
    severity: 'error',
    error_message: '',
    is_active: true,
  }
  ruleFormErrors.value = {}
  showRuleModal.value = true
}

function openEditRule(rule: SpecValidationRule) {
  editingRule.value = rule
  ruleForm.value = {
    category: rule.category,
    spec_key: rule.spec_key,
    validation_type: rule.validation_type,
    allowed_values: rule.allowed_values ?? [],
    tolerance_percent: rule.tolerance_percent ?? undefined,
    severity: rule.severity,
    error_message: rule.error_message ?? '',
    is_active: rule.is_active,
  }
  ruleFormErrors.value = {}
  showRuleModal.value = true
}

function validateRuleForm(): boolean {
  ruleFormErrors.value = {}

  if (!ruleForm.value.category) {
    ruleFormErrors.value.category = 'Category is required'
  }
  if (!ruleForm.value.spec_key) {
    ruleFormErrors.value.spec_key = 'Specification key is required'
  }
  if (!ruleForm.value.validation_type) {
    ruleFormErrors.value.validation_type = 'Validation type is required'
  }
  if (!ruleForm.value.severity) {
    ruleFormErrors.value.severity = 'Severity is required'
  }
  if (showToleranceField.value && (ruleForm.value.tolerance_percent === undefined || ruleForm.value.tolerance_percent < 0)) {
    ruleFormErrors.value.tolerance_percent = 'Valid tolerance percentage is required'
  }

  return Object.keys(ruleFormErrors.value).length === 0
}

async function handleSaveRule() {
  if (!validateRuleForm()) return

  try {
    if (editingRule.value) {
      await updateRuleMutation.mutateAsync({
        ruleSetId: ruleSetId.value,
        ruleId: editingRule.value.id,
        data: ruleForm.value,
      })
      toast.success('Rule updated')
    } else {
      await addRuleMutation.mutateAsync({
        ruleSetId: ruleSetId.value,
        data: ruleForm.value,
      })
      toast.success('Rule added')
    }
    showRuleModal.value = false
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save rule'
    toast.error(message)
  }
}

function confirmDeleteRule(rule: SpecValidationRule) {
  ruleToDelete.value = rule
  showDeleteModal.value = true
}

async function handleDeleteRule() {
  if (!ruleToDelete.value) return

  try {
    await deleteRuleMutation.mutateAsync({
      ruleSetId: ruleSetId.value,
      ruleId: ruleToDelete.value.id,
    })
    toast.success('Rule deleted')
    showDeleteModal.value = false
    ruleToDelete.value = null
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete rule'
    toast.error(message)
  }
}

async function handleSetDefault() {
  try {
    await setDefaultMutation.mutateAsync(ruleSetId.value)
    toast.success('Rule set set as default')
    refetch()
  } catch (err: unknown) {
    const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to set default'
    toast.error(message)
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    case 'warning': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
  }
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    circuit_breaker: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    contactor: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    cable: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    busbar: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    enclosure: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    relay: 'bg-pink-50 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400',
  }
  return colors[category] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
}

function formatAllowedValues(values: unknown[] | null): string {
  if (!values || values.length === 0) return '-'
  return values.join(', ')
}
</script>

<template>
  <div>
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

    <!-- Error -->
    <div v-else-if="error" class="text-center py-8">
      <p class="text-red-500 dark:text-red-400">Failed to load rule set</p>
      <Button variant="outline" class="mt-4" @click="router.back()">Go Back</Button>
    </div>

    <!-- Content -->
    <template v-else-if="ruleSet">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <RouterLink to="/settings/rule-sets">
            <Button variant="ghost" size="sm">
              <ArrowLeft class="w-4 h-4 mr-2" />
              Back
            </Button>
          </RouterLink>
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ ruleSet.name }}</h1>
              <Badge v-if="ruleSet.is_default" variant="warning" class="gap-1">
                <Star class="w-3 h-3" />
                Default
              </Badge>
              <Badge :variant="ruleSet.is_active ? 'success' : 'default'">
                {{ ruleSet.is_active ? 'Active' : 'Inactive' }}
              </Badge>
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400 font-mono">{{ ruleSet.code }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button
            v-if="!ruleSet.is_default"
            variant="outline"
            :loading="setDefaultMutation.isPending.value"
            @click="handleSetDefault"
          >
            <Star class="w-4 h-4 mr-2" />
            Set as Default
          </Button>
          <RouterLink :to="`/settings/rule-sets/${ruleSet.id}/edit`">
            <Button variant="outline">
              <Pencil class="w-4 h-4 mr-2" />
              Edit
            </Button>
          </RouterLink>
        </div>
      </div>

      <!-- Info Card -->
      <Card class="mb-6">
        <div class="grid grid-cols-4 gap-6">
          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Total Rules</div>
            <div class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {{ ruleSet.rules?.length ?? 0 }}
            </div>
          </div>
          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">BOMs Using</div>
            <div class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {{ ruleSet.boms_count ?? 0 }}
            </div>
          </div>
          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Categories</div>
            <div class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {{ Object.keys(groupedRules).length }}
            </div>
          </div>
          <div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Created By</div>
            <div class="text-lg font-medium text-slate-900 dark:text-slate-100">
              {{ ruleSet.creator?.name ?? '-' }}
            </div>
          </div>
        </div>
        <div v-if="ruleSet.description" class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-1">Description</div>
          <p class="text-slate-700 dark:text-slate-300">{{ ruleSet.description }}</p>
        </div>
      </Card>

      <!-- Rules Section -->
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Validation Rules</h2>
        <Button @click="openAddRule">
          <Plus class="w-4 h-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <!-- Rules by Category -->
      <div v-if="Object.keys(groupedRules).length > 0" class="space-y-6">
        <Card v-for="(rules, category) in groupedRules" :key="category">
          <template #header>
            <div class="flex items-center gap-2">
              <span
                class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                :class="getCategoryColor(category)"
              >
                {{ metadata?.categories?.[category] ?? category }}
              </span>
              <span class="text-sm text-slate-500 dark:text-slate-400">
                {{ rules.length }} rule{{ rules.length !== 1 ? 's' : '' }}
              </span>
            </div>
          </template>

          <div class="divide-y divide-slate-100 dark:divide-slate-800">
            <div
              v-for="rule in rules"
              :key="rule.id"
              class="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
            >
              <GripVertical class="w-4 h-4 text-slate-400 dark:text-slate-600 cursor-move" />

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">
                    {{ rule.spec_key }}
                  </span>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="getSeverityColor(rule.severity)"
                  >
                    {{ rule.severity_label }}
                  </span>
                  <Badge v-if="!rule.is_active" variant="default">Inactive</Badge>
                </div>
                <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {{ rule.validation_type_label }}
                  <template v-if="rule.tolerance_percent !== null">
                    (±{{ rule.tolerance_percent }}%)
                  </template>
                  <template v-if="rule.allowed_values && rule.allowed_values.length > 0">
                    : {{ formatAllowedValues(rule.allowed_values) }}
                  </template>
                </div>
                <div v-if="rule.error_message" class="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">
                  "{{ rule.error_message }}"
                </div>
              </div>

              <div class="flex items-center gap-1">
                <Button variant="ghost" size="xs" @click="openEditRule(rule)">
                  <Pencil class="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  class="text-red-500 hover:text-red-600"
                  @click="confirmDeleteRule(rule)"
                >
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- Empty Rules -->
      <Card v-else class="text-center py-12">
        <div class="text-slate-500 dark:text-slate-400">
          <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p class="font-medium">No rules defined</p>
          <p class="text-sm mt-1">Add validation rules to control component swap behavior</p>
          <Button class="mt-4" @click="openAddRule">
            <Plus class="w-4 h-4 mr-2" />
            Add First Rule
          </Button>
        </div>
      </Card>
    </template>

    <!-- Rule Modal -->
    <Modal
      :open="showRuleModal"
      :title="editingRule ? 'Edit Rule' : 'Add Rule'"
      size="md"
      @update:open="showRuleModal = $event"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <FormField label="Category" required :error="ruleFormErrors.category">
            <Select
              v-model="ruleForm.category"
              :options="categoryOptions"
              placeholder="Select category"
            />
          </FormField>

          <FormField label="Specification Key" required :error="ruleFormErrors.spec_key">
            <div v-if="specKeyOptions.length > 0">
              <Select
                v-model="ruleForm.spec_key"
                :options="specKeyOptions"
                placeholder="Select spec key"
              />
            </div>
            <Input
              v-else
              v-model="ruleForm.spec_key"
              placeholder="e.g., rating_amps"
            />
          </FormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormField label="Validation Type" required :error="ruleFormErrors.validation_type">
            <Select
              v-model="ruleForm.validation_type"
              :options="validationTypeOptions"
              placeholder="Select type"
            />
          </FormField>

          <FormField label="Severity" required :error="ruleFormErrors.severity">
            <Select
              v-model="ruleForm.severity"
              :options="severityOptions"
              placeholder="Select severity"
            />
          </FormField>
        </div>

        <FormField
          v-if="showToleranceField"
          label="Tolerance %"
          :error="ruleFormErrors.tolerance_percent"
        >
          <Input
            v-model.number="ruleForm.tolerance_percent"
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g., 10"
          />
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Percentage tolerance for numeric values
          </p>
        </FormField>

        <FormField
          v-if="showAllowedValuesField"
          label="Allowed Values"
          hint="Comma-separated list of allowed values"
        >
          <Input
            :model-value="(ruleForm.allowed_values ?? []).join(', ')"
            placeholder="e.g., B, C, D"
            @update:model-value="(v: string | number) => ruleForm.allowed_values = String(v).split(',').map(s => s.trim()).filter(Boolean)"
          />
        </FormField>

        <FormField label="Custom Error Message">
          <Input
            v-model="ruleForm.error_message"
            placeholder="e.g., Rating amps must match exactly"
          />
        </FormField>
      </div>

      <template #footer>
        <Button variant="ghost" @click="showRuleModal = false">Cancel</Button>
        <Button
          :loading="addRuleMutation.isPending.value || updateRuleMutation.isPending.value"
          @click="handleSaveRule"
        >
          {{ editingRule ? 'Update' : 'Add' }} Rule
        </Button>
      </template>
    </Modal>

    <!-- Delete Rule Modal -->
    <Modal
      :open="showDeleteModal"
      title="Delete Rule"
      size="sm"
      @update:open="showDeleteModal = $event"
    >
      <p class="text-slate-600 dark:text-slate-400">
        Are you sure you want to delete the rule for
        <strong class="text-slate-900 dark:text-slate-100">{{ ruleToDelete?.spec_key }}</strong>?
      </p>
      <template #footer>
        <Button variant="ghost" @click="showDeleteModal = false">Cancel</Button>
        <Button
          variant="destructive"
          :loading="deleteRuleMutation.isPending.value"
          @click="handleDeleteRule"
        >
          Delete
        </Button>
      </template>
    </Modal>
  </div>
</template>
