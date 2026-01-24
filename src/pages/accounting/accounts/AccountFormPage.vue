<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import {
  useAccount,
  useCreateAccount,
  useUpdateAccount,
  useAccountsLookup,
  type CreateAccountData,
  type Account,
} from '@/api/useAccounts'
import { Button, Card, Input, Select, useToast, CurrencyInput } from '@/components/ui'
import { ArrowLeft, Save, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if editing
const accountId = computed(() => route.params.id ? String(route.params.id) : null)
const isEditing = computed(() => !!accountId.value)

// Fetch existing account if editing
const { data: existingAccount, isLoading: accountLoading } = useAccount(
  computed(() => accountId.value ?? '')
)

// Fetch accounts for parent dropdown
const { data: allAccountsData, isLoading: accountsLoading } = useAccountsLookup()
const allAccounts = computed(() => (allAccountsData.value as any)?.data as Account[] || [])

// Parent account options (exclude current account and its children if editing)
const parentOptions = computed(() => {
  const options = [{ value: '', label: 'None (Top Level)' }]

  if (!allAccounts.value.length) return options

  allAccounts.value
    .filter((acc: Account) => {
      // Exclude current account when editing
      if (isEditing.value && String(acc.id) === String(accountId.value)) return false
      // Could also exclude children, but that requires tree traversal
      return true
    })
    .forEach((acc: Account) => {
      options.push({
        value: String(acc.id),
        label: `${acc.code} - ${acc.name}`,
      })
    })

  return options
})

// Account type options
const typeOptions = [
  { value: 'asset', label: 'Aset (Asset)' },
  { value: 'liability', label: 'Kewajiban (Liability)' },
  { value: 'equity', label: 'Ekuitas (Equity)' },
  { value: 'revenue', label: 'Pendapatan (Revenue)' },
  { value: 'expense', label: 'Beban (Expense)' },
]

// Subtype options by type
const subtypeOptions: Record<string, { value: string; label: string }[]> = {
  asset: [
    { value: '', label: 'None' },
    { value: 'current', label: 'Aset Lancar' },
    { value: 'fixed', label: 'Aset Tetap' },
    { value: 'intangible', label: 'Aset Tidak Berwujud' },
    { value: 'other', label: 'Aset Lainnya' },
  ],
  liability: [
    { value: '', label: 'None' },
    { value: 'current', label: 'Kewajiban Jangka Pendek' },
    { value: 'long_term', label: 'Kewajiban Jangka Panjang' },
  ],
  equity: [
    { value: '', label: 'None' },
    { value: 'capital', label: 'Modal' },
    { value: 'retained_earnings', label: 'Laba Ditahan' },
  ],
  revenue: [
    { value: '', label: 'None' },
    { value: 'operating', label: 'Pendapatan Operasional' },
    { value: 'other', label: 'Pendapatan Lain-lain' },
  ],
  expense: [
    { value: '', label: 'None' },
    { value: 'operating', label: 'Beban Operasional' },
    { value: 'cost_of_sales', label: 'Harga Pokok Penjualan' },
    { value: 'other', label: 'Beban Lain-lain' },
  ],
}

// Form validation schema
const accountSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20, 'Code must be at most 20 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  type: z.enum(['asset', 'liability', 'equity', 'revenue', 'expense'], {
    required_error: 'Type is required',
  }),
  subtype: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  parent_id: z.string().optional().nullable().transform(val => {
    if (!val || val === '') return null
    return val
  }),
  is_active: z.boolean().default(true),
  opening_balance: z.union([z.number(), z.string()]).default(0).transform(val => {
    if (typeof val === 'string') return parseFloat(val) || 0
    return val
  }),
})

type AccountFormValues = z.infer<typeof accountSchema>

// Form setup
const { values: form, errors, handleSubmit, setValues, setFieldValue, defineField } = useForm<AccountFormValues>({
  validationSchema: toTypedSchema(accountSchema),
  initialValues: {
    code: '',
    name: '',
    type: 'asset',
    subtype: '',
    description: '',
    parent_id: null,
    is_active: true,
    opening_balance: 0,
  },
})

const [code] = defineField('code')
const [name] = defineField('name')
const [type] = defineField('type')
const [subtype] = defineField('subtype')
const [description] = defineField('description')
const [parentId] = defineField('parent_id')
const [isActive] = defineField('is_active')
const [openingBalance] = defineField('opening_balance')

// Watch for existing account data
watch(existingAccount, (account) => {
  if (account) {
    setValues({
      code: account.code,
      name: account.name,
      type: account.type as AccountFormValues['type'],
      subtype: account.subtype || '',
      description: account.description || '',
      parent_id: account.parent_id,
      is_active: account.is_active === '1' || account.is_active === 'true' || (typeof account.is_active === 'boolean' && account.is_active),
      opening_balance: typeof account.opening_balance === 'string' ? parseFloat(account.opening_balance) : (account.opening_balance || 0),
    })
  }
}, { immediate: true })

// Current subtype options based on selected type
const currentSubtypeOptions = computed(() => {
  return subtypeOptions[values.type] || []
})

// Reset subtype when type changes
watch(() => values.type, () => {
  setFieldValue('subtype', '')
})

// Mutations
const createMutation = useCreateAccount()
const updateMutation = useUpdateAccount()

const isSubmitting = computed(() =>
  createMutation.isPending.value || updateMutation.isPending.value
)

// Form submission
const onSubmit = handleSubmit(async (formValues) => {
  try {
    const payload = {
      code: formValues.code,
      name: formValues.name,
      type: formValues.type,
      subtype: formValues.subtype || null,
      description: formValues.description || null,
      parent_id: formValues.parent_id ? parseInt(formValues.parent_id, 10) : null,
      is_active: formValues.is_active,
      opening_balance: formValues.opening_balance,
    }

    if (isEditing.value) {
      await updateMutation.mutateAsync({
        id: accountId.value!,
        data: payload as any,
      })
      toast.success('Account updated')
    } else {
      const result = await createMutation.mutateAsync(payload as any)
      toast.success('Account created')
      router.push(`/accounting/accounts/${result.id}`)
      return
    }

    router.push('/accounting/accounts')
  } catch (error) {
    toast.error(isEditing.value ? 'Failed to update account' : 'Failed to create account')
  }
})
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
      <RouterLink to="/accounting/accounts" class="hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
        <ArrowLeft class="w-4 h-4" />
        Chart of Accounts
      </RouterLink>
      <span>/</span>
      <span class="text-slate-900 dark:text-slate-100">
        {{ isEditing ? 'Edit Account' : 'New Account' }}
      </span>
    </div>

    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {{ isEditing ? 'Edit Account' : 'New Account' }}
      </h1>
      <p class="text-slate-500 dark:text-slate-400">
        {{ isEditing ? 'Update account information' : 'Create a new account in your chart of accounts' }}
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isEditing && accountLoading" class="text-center py-12 text-slate-500 dark:text-slate-400">
      Loading account...
    </div>

    <!-- Form -->
    <form v-else @submit="onSubmit">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Form -->
        <div class="lg:col-span-2 space-y-6">
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Account Information</h2>
            </template>

            <div class="space-y-4">
              <!-- Code & Name Row -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Account Code <span class="text-red-500">*</span>
                  </label>
                  <Input
                    v-model="code"
                    placeholder="e.g., 1-1001"
                    :error="errors.code"
                  />
                  <p v-if="errors.code" class="mt-1 text-sm text-red-500">{{ errors.code }}</p>
                </div>

                <div class="sm:col-span-2">
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Account Name <span class="text-red-500">*</span>
                  </label>
                  <Input
                    v-model="name"
                    placeholder="e.g., Cash in Bank"
                    :error="errors.name"
                  />
                  <p v-if="errors.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
                </div>
              </div>

              <!-- Type & Subtype Row -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Account Type <span class="text-red-500">*</span>
                  </label>
                  <Select
                    v-model="type"
                    :options="typeOptions"
                    :error="errors.type"
                  />
                  <p v-if="errors.type" class="mt-1 text-sm text-red-500">{{ errors.type }}</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subtype
                  </label>
                  <Select
                    v-model="subtype"
                    :options="currentSubtypeOptions"
                    placeholder="Select subtype"
                  />
                </div>
              </div>

              <!-- Parent Account -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Parent Account
                </label>
                <Select
                  :model-value="parentId || ''"
                  :options="parentOptions"
                  :loading="accountsLoading"
                  placeholder="Select parent account"
                  @update:model-value="(v) => setFieldValue('parent_id', v ? String(v) : null)"
                />
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Leave empty for top-level accounts
                </p>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  v-model="description"
                  rows="3"
                  class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Optional description for this account"
                />
              </div>
            </div>
          </Card>

          <!-- Opening Balance -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Opening Balance</h2>
            </template>

            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Opening Balance
              </label>
              <CurrencyInput
                v-model="openingBalance"
                placeholder="0.00"
              />
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                The starting balance for this account. Use positive values for debit-nature accounts
                (assets, expenses) and negative for credit-nature accounts (liabilities, equity, revenue).
              </p>
            </div>
          </Card>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Status -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Status</h2>
            </template>

            <label class="flex items-center gap-3 cursor-pointer">
              <input
                v-model="isActive"
                type="checkbox"
                class="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-orange-500 focus:ring-orange-500"
              />
              <div>
                <span class="font-medium text-slate-900 dark:text-slate-100">Active</span>
                <p class="text-sm text-slate-500 dark:text-slate-400">
                  Inactive accounts cannot be used in transactions
                </p>
              </div>
            </label>
          </Card>

          <!-- Account Code Guide -->
          <Card>
            <template #header>
              <h2 class="font-semibold text-slate-900 dark:text-slate-100">Code Guide</h2>
            </template>

            <div class="text-sm text-slate-600 dark:text-slate-400 space-y-2">
              <p>Standard Indonesian COA prefixes:</p>
              <ul class="space-y-1 font-mono text-xs">
                <li><span class="text-blue-600 dark:text-blue-400">1xxx</span> - Aset</li>
                <li><span class="text-red-600 dark:text-red-400">2xxx</span> - Kewajiban</li>
                <li><span class="text-purple-600 dark:text-purple-400">3xxx</span> - Ekuitas</li>
                <li><span class="text-green-600 dark:text-green-400">4xxx</span> - Pendapatan</li>
                <li><span class="text-amber-600 dark:text-amber-400">5xxx</span> - Harga Pokok</li>
                <li><span class="text-amber-600 dark:text-amber-400">6xxx</span> - Beban</li>
              </ul>
            </div>
          </Card>

          <!-- Actions -->
          <Card>
            <div class="flex flex-col gap-3">
              <Button type="submit" :disabled="isSubmitting" class="w-full">
                <Loader2 v-if="isSubmitting" class="w-4 h-4 mr-2 animate-spin" />
                <Save v-else class="w-4 h-4 mr-2" />
                {{ isEditing ? 'Update Account' : 'Create Account' }}
              </Button>
              <Button
                type="button"
                variant="ghost"
                class="w-full"
                @click="router.push('/accounting/accounts')"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </form>
  </div>
</template>
