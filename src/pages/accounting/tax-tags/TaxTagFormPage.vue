<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  TAX_TAG_APPLICABILITY_OPTIONS,
  useCreateTaxTag,
  useTaxTag,
  useUpdateTaxTag,
  type TaxTagApplicability,
} from '@/api/useTaxTags'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft, Save, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const tagId = computed(() => (route.params.id ? String(route.params.id) : null))
const isEditing = computed(() => !!tagId.value)
const pageTitle = computed(() => (isEditing.value ? 'Edit Tax Tag' : 'New Tax Tag'))

const { data: existing, isLoading: loadingTag } = useTaxTag(
  computed(() => tagId.value ?? ''),
)

const code = ref('')
const name = ref('')
const applicability = ref<TaxTagApplicability>('tax')
const isActive = ref(true)

watch(existing, (tag) => {
  if (!tag) return
  code.value = tag.code
  name.value = tag.name
  applicability.value = tag.applicability
  isActive.value = tag.is_active
}, { immediate: true })

const createMutation = useCreateTaxTag()
const updateMutation = useUpdateTaxTag()
const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const statusOptions = [
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
]

const applicabilityOptions = TAX_TAG_APPLICABILITY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}))

async function handleSubmit() {
  if (!code.value.trim()) {
    toast.error('Code is required')
    return
  }
  if (!name.value.trim()) {
    toast.error('Name is required')
    return
  }

  const payload = {
    code: code.value.trim(),
    name: name.value.trim(),
    applicability: applicability.value,
    is_active: isActive.value,
  }

  try {
    if (isEditing.value && tagId.value) {
      await updateMutation.mutateAsync({ id: tagId.value, data: payload })
      toast.success('Tax tag updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Tax tag created')
    }
    router.push('/accounting/tax-tags')
  } catch {
    toast.error(isEditing.value ? 'Failed to update tax tag' : 'Failed to create tax tag')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
      <RouterLink to="/accounting/tax-tags" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
        <ArrowLeft class="w-4 h-4" />
        Tax Tags
      </RouterLink>
      <span>/</span>
      <span class="text-slate-900 dark:text-slate-100">{{ pageTitle }}</span>
    </div>

    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
      <p class="text-slate-500 dark:text-slate-400">Used as the journal entry Tax Grids picker</p>
    </div>

    <div v-if="isEditing && loadingTag" class="py-12 text-center text-slate-500">
      <Loader2 class="w-5 h-5 animate-spin inline mr-2" />
      Loading...
    </div>

    <form v-else @submit.prevent="handleSubmit">
      <Card class="mb-6 max-w-2xl">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Code <span class="text-red-500">*</span>
            </label>
            <Input v-model="code" data-testid="tax-tag-code" placeholder="e.g. PPN-OUT" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Name <span class="text-red-500">*</span>
            </label>
            <Input v-model="name" data-testid="tax-tag-name" placeholder="e.g. PPN Keluaran" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grid</label>
            <Select
              :model-value="applicability"
              :options="applicabilityOptions"
              :test-id="'tax-tag-applicability'"
              @update:model-value="(v) => applicability = String(v) as TaxTagApplicability"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <Select
              :model-value="isActive ? '1' : '0'"
              :options="statusOptions"
              :test-id="'tax-tag-active'"
              @update:model-value="(v) => isActive = String(v) === '1'"
            />
          </div>
        </div>
      </Card>

      <div class="flex items-center gap-3">
        <Button type="submit" data-testid="tax-tag-submit" :disabled="isSubmitting">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          <Save v-else class="w-4 h-4 mr-2" />
          {{ isEditing ? 'Save' : 'Create' }}
        </Button>
        <Button type="button" variant="ghost" @click="router.push('/accounting/tax-tags')">Cancel</Button>
      </div>
    </form>
  </div>
</template>
