<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import {
  useJournal,
  useCreateJournal,
  useUpdateJournal,
  JOURNAL_TYPE_OPTIONS,
  type CreateJournalData,
  type JournalType,
} from '@/api/useJournals'
import { useAccountsLookup } from '@/api/useAccounts'
import { setServerErrors } from '@/composables/useValidatedForm'
import { Button, Card, Input, Select, useToast } from '@/components/ui'
import { ArrowLeft, Save, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const journalId = computed(() => (route.params.id ? String(route.params.id) : null))
const isEditing = computed(() => !!journalId.value)
const pageTitle = computed(() => (isEditing.value ? 'Edit Journal' : 'New Journal'))

const { data: existingJournal, isLoading: loadingJournal } = useJournal(
  computed(() => journalId.value ?? ''),
)

const { data: accounts, isLoading: accountsLoading } = useAccountsLookup()

const accountOptions = computed(() => {
  const options = [{ value: '', label: 'None' }]
  const list = Array.isArray(accounts.value)
    ? accounts.value
    : ((accounts.value as { data?: { id: number; code: string; name: string }[] } | undefined)?.data ?? [])
  list.forEach((acc) => {
    options.push({ value: String(acc.id), label: `${acc.code} - ${acc.name}` })
  })
  return options
})

const typeOptions = JOURNAL_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))

const currencyOptions = [
  { value: '', label: 'Company Default' },
  { value: 'IDR', label: 'IDR' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'SGD', label: 'SGD' },
  { value: 'JPY', label: 'JPY' },
  { value: 'CNY', label: 'CNY' },
]

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(['sales', 'purchase', 'bank', 'cash', 'miscellaneous']),
  sequence_prefix: z.string().min(1, 'Sequence prefix is required').max(32),
  default_account_id: z.string().optional(),
  currency: z.string().optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const { errors, handleSubmit, setValues, setErrors, defineField } = useForm<FormValues>({
  validationSchema: toTypedSchema(schema),
  initialValues: {
    name: '',
    type: 'miscellaneous',
    sequence_prefix: '',
    default_account_id: '',
    currency: '',
    is_active: true,
  },
})

const [name] = defineField('name')
const [type] = defineField('type')
const [sequencePrefix] = defineField('sequence_prefix')
const [defaultAccountId] = defineField('default_account_id')
const [currency] = defineField('currency')
const [isActive] = defineField('is_active')

watch(existingJournal, (journal) => {
  if (!journal) return
  setValues({
    name: journal.name,
    type: journal.type,
    sequence_prefix: journal.sequence_prefix,
    default_account_id: journal.default_account_id ? String(journal.default_account_id) : '',
    currency: journal.currency ?? '',
    is_active: journal.is_active,
  })
}, { immediate: true })

const createMutation = useCreateJournal()
const updateMutation = useUpdateJournal()
const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const onSubmit = handleSubmit(async (values) => {
  const payload: CreateJournalData = {
    name: values.name,
    type: values.type as JournalType,
    sequence_prefix: values.sequence_prefix,
    default_account_id: values.default_account_id ? Number(values.default_account_id) : null,
    currency: values.currency || null,
    is_active: values.is_active,
  }

  try {
    if (isEditing.value && journalId.value) {
      await updateMutation.mutateAsync({ id: journalId.value, data: payload })
      toast.success('Journal updated')
    } else {
      await createMutation.mutateAsync(payload)
      toast.success('Journal created')
    }
    router.push('/accounting/journals')
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } }
    if (axiosErr.response?.data?.errors) {
      setServerErrors({ setErrors }, axiosErr.response.data.errors)
    }
    toast.error(isEditing.value ? 'Failed to update journal' : 'Failed to create journal')
  }
})
</script>

<template>
  <div>
    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
      <RouterLink to="/accounting/journals" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
        <ArrowLeft class="w-4 h-4" />
        Journals
      </RouterLink>
      <span>/</span>
      <span class="text-slate-900 dark:text-slate-100">{{ pageTitle }}</span>
    </div>

    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h1>
      <p class="text-slate-500 dark:text-slate-400">Set journal type, sequence prefix, and optional default account</p>
    </div>

    <div v-if="isEditing && loadingJournal" class="py-12 text-center text-slate-500">
      <Loader2 class="w-5 h-5 animate-spin inline mr-2" />
      Loading...
    </div>

    <form v-else novalidate @submit.prevent="onSubmit">
      <Card class="mb-6 max-w-2xl">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Name <span class="text-red-500">*</span>
            </label>
            <Input v-model="name" data-testid="journal-name" placeholder="e.g. Bank BCA" />
            <p v-if="errors.name" class="text-sm text-red-500 mt-1">{{ errors.name }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Type <span class="text-red-500">*</span>
            </label>
            <Select
              :model-value="type"
              :options="typeOptions"
              :test-id="'journal-type'"
              @update:model-value="(v) => type = String(v) as JournalType"
            />
            <p v-if="errors.type" class="text-sm text-red-500 mt-1">{{ errors.type }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Sequence Prefix <span class="text-red-500">*</span>
            </label>
            <Input v-model="sequencePrefix" data-testid="journal-prefix" placeholder="e.g. BCA-" />
            <p class="text-xs text-slate-500 mt-1">Used when numbering journal entries (e.g. BCA-202609-0001)</p>
            <p v-if="errors.sequence_prefix" class="text-sm text-red-500 mt-1">{{ errors.sequence_prefix }}</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Default Account
            </label>
            <Select
              :model-value="defaultAccountId ?? ''"
              :options="accountOptions"
              :loading="accountsLoading"
              :test-id="'journal-default-account'"
              @update:model-value="(v) => defaultAccountId = v ? String(v) : ''"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Currency
            </label>
            <Select
              :model-value="currency ?? ''"
              :options="currencyOptions"
              :test-id="'journal-currency'"
              @update:model-value="(v) => currency = v ? String(v) : ''"
            />
            <p class="text-xs text-slate-500 mt-1">Natural for bank/cash journals</p>
          </div>

          <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input v-model="isActive" type="checkbox" class="rounded border-slate-300" data-testid="journal-active" />
            Active
          </label>
        </div>
      </Card>

      <div class="flex gap-3">
        <Button type="button" variant="ghost" @click="router.push('/accounting/journals')">Cancel</Button>
        <Button type="submit" data-testid="journal-save" :disabled="isSubmitting">
          <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-1 animate-spin" />
          <Save v-else class="w-4 h-4 mr-1" />
          Save
        </Button>
      </div>
    </form>
  </div>
</template>
