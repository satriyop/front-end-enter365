<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useAnalyticAccount,
  useCreateAnalyticAccount,
  useUpdateAnalyticAccount,
} from '@/api/useAnalyticAccounts'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft, Save, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const accountId = computed(() => (route.params.id ? String(route.params.id) : null))
const isEditing = computed(() => !!accountId.value)
const pageTitle = computed(() => (isEditing.value ? 'Edit Analytic Account' : 'New Analytic Account'))

const { data: existing, isLoading: loadingAccount } = useAnalyticAccount(
  computed(() => accountId.value ?? ''),
)

const code = ref('')
const name = ref('')
const isActive = ref(true)

watch(existing, (account) => {
  if (!account) return
  code.value = account.code
  name.value = account.name
  isActive.value = account.is_active
}, { immediate: true })

const createMutation = useCreateAnalyticAccount()
const updateMutation = useUpdateAnalyticAccount()
const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const statusOptions = [
  { value: '1', label: 'Active' },
  { value: '0', label: 'Inactive' },
]

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
    is_active: isActive.value,
  }

  try {
    if (isEditing.value && accountId.value) {
      await updateMutation.mutateAsync({ id: accountId.value, data: payload })
      toast.success('Analytic account updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Analytic account created')
    }
    router.push('/accounting/analytic-accounts')
  } catch {
    toast.error(isEditing.value ? 'Failed to update analytic account' : 'Failed to create analytic account')
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
      <RouterLink to="/accounting/analytic-accounts" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
        <ArrowLeft class="w-4 h-4" />
        Analytic Accounts
      </RouterLink>
      <span>/</span>
      <span class="text-slate-900 dark:text-slate-100">{{ pageTitle }}</span>
    </div>

    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
      <p class="text-slate-500 dark:text-slate-400">Used as the journal entry Analytic Distribution picker</p>
    </div>

    <div v-if="isEditing && loadingAccount" class="py-12 text-center text-slate-500">
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
            <Input v-model="code" data-testid="analytic-account-code" placeholder="e.g. MKT" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Name <span class="text-red-500">*</span>
            </label>
            <Input v-model="name" data-testid="analytic-account-name" placeholder="e.g. Marketing" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <Select
              :model-value="isActive ? '1' : '0'"
              :options="statusOptions"
              :test-id="'analytic-account-active'"
              @update:model-value="(v) => isActive = String(v) === '1'"
            />
          </div>
        </div>
      </Card>

      <div class="flex items-center gap-3">
        <Button type="submit" data-testid="analytic-account-submit" :disabled="isSubmitting">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
          <Save v-else class="w-4 h-4 mr-2" />
          {{ isEditing ? 'Save' : 'Create' }}
        </Button>
        <Button type="button" variant="ghost" @click="router.push('/accounting/analytic-accounts')">Cancel</Button>
      </div>
    </form>
  </div>
</template>
