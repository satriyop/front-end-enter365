<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useForm, useFieldArray } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  useRecurringTemplate,
  useCreateRecurringTemplate,
  useUpdateRecurringTemplate,
  frequencyOptions,
  type CreateRecurringTemplateData,
  type UpdateRecurringTemplateData,
} from '@/api/useRecurringTemplates'
import { useContactsLookup } from '@/api/useContacts'
import { useAccountsLookup } from '@/api/useAccounts'
import { getErrorMessage } from '@/api/client'
import { recurringTemplateSchema, type RecurringTemplateFormData, type RecurringTemplateItemFormData } from '@/utils/validation'
import { setServerErrors } from '@/composables/useValidatedForm'
import { useFormShortcuts } from '@/composables/useFormShortcuts'
import {
  Button,
  Input,
  FormField,
  Textarea,
  Select,
  Card,
  PageSkeleton,
  useToast,
} from '@/components/ui'
import { Plus, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Determine if editing
const templateId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : null
})
const isEditing = computed(() => templateId.value !== null)
const pageTitle = computed(() => isEditing.value ? 'Edit Recurring Template' : 'New Recurring Template')

// Fetch existing template if editing
const tplIdRef = computed(() => templateId.value ?? 0)
const { data: existingTemplate, isLoading: loadingTemplate } = useRecurringTemplate(tplIdRef)

// Lookups
const { data: customers } = useContactsLookup('customer')
const { data: suppliers } = useContactsLookup('supplier')
const { data: revenueAccounts } = useAccountsLookup('revenue')
const { data: expenseAccounts } = useAccountsLookup('expense')

// Form setup
const { values: form, errors, handleSubmit, setValues, setErrors, meta, validateField, defineField } = useForm<RecurringTemplateFormData>({
  validationSchema: toTypedSchema(recurringTemplateSchema),
  initialValues: {
    name: '',
    type: 'invoice',
    contact_id: undefined as unknown as number,
    frequency: 'monthly',
    interval: 1,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    occurrences_limit: null,
    description: '',
    reference: '',
    tax_rate: 0,
    discount_amount: 0,
    payment_term_days: 30,
    currency: 'IDR',
    is_active: true,
    auto_post: false,
    auto_send: false,
    items: [{ description: '', quantity: 1, unit: '', unit_price: 0, revenue_account_id: null, expense_account_id: null }],
  },
})

const [name] = defineField('name')
const [type] = defineField('type')
const [contactId] = defineField('contact_id')
const [frequency] = defineField('frequency')
const [interval] = defineField('interval')
const [startDate] = defineField('start_date')
const [endDate] = defineField('end_date')
const [occurrencesLimit] = defineField('occurrences_limit')
const [description] = defineField('description')
const [reference] = defineField('reference')
const [taxRate] = defineField('tax_rate')
const [discountAmount] = defineField('discount_amount')
const [paymentTermDays] = defineField('payment_term_days')
const [isActive] = defineField('is_active')
const [autoPost] = defineField('auto_post')
const [autoSend] = defineField('auto_send')

// Line items via useFieldArray
const { fields: items, push: addItem, remove: removeItem } = useFieldArray<RecurringTemplateItemFormData>('items')

// Populate form when editing
watch(existingTemplate, (tpl) => {
  if (!tpl) return
  const mappedItems = (tpl.items as any[] || []).map((item: any) => ({
    description: item.description || '',
    quantity: Number(item.quantity) || 1,
    unit: item.unit || '',
    unit_price: Number(item.unit_price) || 0,
    revenue_account_id: item.revenue_account_id ?? null,
    expense_account_id: item.expense_account_id ?? null,
  }))

  setValues({
    name: tpl.name,
    type: tpl.type as 'invoice' | 'bill',
    contact_id: tpl.contact_id,
    frequency: tpl.frequency as RecurringTemplateFormData['frequency'],
    interval: tpl.interval,
    start_date: tpl.start_date?.split('T')[0] ?? '',
    end_date: tpl.end_date?.split('T')[0] ?? '',
    occurrences_limit: tpl.occurrences_limit ?? null,
    description: tpl.description || '',
    reference: tpl.reference || '',
    tax_rate: tpl.tax_rate ?? 0,
    discount_amount: tpl.discount_amount ?? 0,
    payment_term_days: tpl.payment_term_days ?? 30,
    currency: tpl.currency ?? 'IDR',
    is_active: tpl.is_active,
    auto_post: tpl.auto_post,
    auto_send: tpl.auto_send,
    items: mappedItems.length > 0 ? mappedItems : [{ description: '', quantity: 1, unit: '', unit_price: 0, revenue_account_id: null, expense_account_id: null }],
  })
}, { immediate: true })

// Dynamic options
const typeOptions = [
  { value: 'invoice', label: 'Recurring Invoice' },
  { value: 'bill', label: 'Recurring Bill' },
]

const contacts = computed(() =>
  form.type === 'invoice' ? customers.value : suppliers.value
)
const contactOptions = computed(() =>
  (contacts.value ?? []).map(c => ({ value: c.id, label: c.name }))
)

const revenueAccountOptions = computed(() =>
  (revenueAccounts.value ?? []).map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))
)
const expenseAccountOptions = computed(() =>
  (expenseAccounts.value ?? []).map(a => ({ value: a.id, label: `${a.code} - ${a.name}` }))
)

// Reset contact when type changes (create mode only)
watch(() => form.type, (newType, oldType) => {
  if (!isEditing.value && oldType && newType !== oldType) {
    setValues({ ...form, contact_id: undefined as unknown as number })
  }
})

function addLineItem() {
  addItem({ description: '', quantity: 1, unit: '', unit_price: 0, revenue_account_id: null, expense_account_id: null })
}

// Subtotal
const subtotal = computed(() =>
  form.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0) ?? 0
)

// Submit
const createMutation = useCreateRecurringTemplate()
const updateMutation = useUpdateRecurringTemplate()
const isSubmitting = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

const onSubmit = handleSubmit(async (formValues) => {
  const itemsPayload = formValues.items.map(item => ({
    description: item.description,
    quantity: item.quantity,
    unit: item.unit || undefined,
    unit_price: item.unit_price,
    revenue_account_id: item.revenue_account_id ?? undefined,
    expense_account_id: item.expense_account_id ?? undefined,
  }))

  try {
    if (isEditing.value && templateId.value) {
      const payload: UpdateRecurringTemplateData = {
        name: formValues.name,
        frequency: formValues.frequency,
        interval: formValues.interval,
        end_date: formValues.end_date || null,
        occurrences_limit: formValues.occurrences_limit ?? null,
        description: formValues.description || null,
        reference: formValues.reference || null,
        tax_rate: formValues.tax_rate,
        discount_amount: formValues.discount_amount,
        payment_term_days: formValues.payment_term_days,
        currency: formValues.currency,
        is_active: formValues.is_active,
        auto_post: formValues.auto_post,
        auto_send: formValues.auto_send,
        items: itemsPayload,
      }
      await updateMutation.mutateAsync({ id: templateId.value, data: payload })
      toast.success('Template updated')
      router.push(`/accounting/recurring-templates/${templateId.value}`)
    } else {
      const payload: CreateRecurringTemplateData = {
        name: formValues.name,
        type: formValues.type,
        contact_id: formValues.contact_id,
        frequency: formValues.frequency,
        interval: formValues.interval,
        start_date: formValues.start_date,
        end_date: formValues.end_date || null,
        occurrences_limit: formValues.occurrences_limit ?? null,
        description: formValues.description || null,
        reference: formValues.reference || null,
        tax_rate: formValues.tax_rate,
        discount_amount: formValues.discount_amount,
        payment_term_days: formValues.payment_term_days,
        currency: formValues.currency,
        is_active: formValues.is_active,
        auto_post: formValues.auto_post,
        auto_send: formValues.auto_send,
        items: itemsPayload,
      }
      const result = await createMutation.mutateAsync(payload)
      toast.success('Template created')
      router.push(`/accounting/recurring-templates/${result.id}`)
    }
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    if (error.response?.data?.errors) {
      setServerErrors({ setErrors } as any, error.response.data.errors)
    }
    toast.error(getErrorMessage(err, 'Failed to save template'))
  }
})

useFormShortcuts({
  onSave: async () => { await onSubmit() },
  onCancel: () => router.back(),
})
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-semibold text-foreground">{{ pageTitle }}</h1>
        <p class="text-muted-foreground">
          {{ isEditing ? 'Update recurring template' : 'Set up automatic invoice or bill generation' }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <kbd class="hidden sm:inline-flex px-2 py-1 text-xs text-muted-foreground bg-muted rounded border border-border">
          Ctrl+S to save
        </kbd>
        <Button variant="ghost" @click="router.back()">Cancel</Button>
      </div>
    </div>

    <PageSkeleton v-if="isEditing && loadingTemplate" type="form" />

    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <!-- Basic Info -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Template Details</h2>
        </template>
        <div class="space-y-4">
          <FormField label="Template Name" required :error="errors.name">
            <Input v-model="name" placeholder="e.g., Monthly hosting invoice" @blur="validateField('name')" />
          </FormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Type" required :error="errors.type">
              <Select
                :model-value="type"
                :options="typeOptions"
                :disabled="isEditing"
                @update:model-value="(v) => type = v as RecurringTemplateFormData['type']"
              />
            </FormField>

            <FormField label="Contact" required :error="errors.contact_id">
              <Select
                :model-value="contactId ?? ''"
                :options="[{ value: '', label: form.type === 'invoice' ? 'Select customer...' : 'Select vendor...' }, ...contactOptions]"
                :disabled="isEditing"
                @update:model-value="(v) => contactId = v ? Number(v) : (undefined as unknown as number)"
              />
            </FormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Description" :error="errors.description">
              <Textarea v-model="description" :rows="2" placeholder="Appears on generated documents" />
            </FormField>
            <FormField label="Reference" :error="errors.reference">
              <Input v-model="reference" placeholder="e.g., Contract #123" />
            </FormField>
          </div>
        </div>
      </Card>

      <!-- Schedule -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Schedule</h2>
        </template>
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Frequency" required :error="errors.frequency">
              <Select
                :model-value="frequency"
                :options="frequencyOptions as any"
                @update:model-value="(v) => frequency = v as RecurringTemplateFormData['frequency']"
              />
            </FormField>
            <FormField label="Every" :error="errors.interval" hint="e.g., every 2 months">
              <Input v-model.number="interval" type="number" min="1" />
            </FormField>
            <FormField label="Start Date" required :error="errors.start_date">
              <Input v-model="startDate" type="date" :disabled="isEditing" @blur="validateField('start_date')" />
            </FormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="End Date" :error="errors.end_date" hint="Leave empty for no end date">
              <Input v-model="endDate" type="date" />
            </FormField>
            <FormField label="Max Occurrences" :error="errors.occurrences_limit" hint="Leave empty for unlimited">
              <Input
                :model-value="occurrencesLimit ?? ''"
                type="number"
                min="1"
                placeholder="Unlimited"
                @update:model-value="(v) => occurrencesLimit = v ? Number(v) : null"
              />
            </FormField>
          </div>
        </div>
      </Card>

      <!-- Line Items -->
      <Card>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="font-medium text-foreground">Line Items</h2>
            <Button type="button" variant="secondary" size="sm" @click="addLineItem">
              <Plus class="w-4 h-4 mr-1" />
              Add Item
            </Button>
          </div>
        </template>

        <div v-if="errors.items" class="text-sm text-destructive mb-4">{{ errors.items }}</div>

        <div class="space-y-4">
          <div
            v-for="(item, index) in items"
            :key="item.key"
            class="p-4 border border-border rounded-lg space-y-3"
          >
            <div class="flex items-start justify-between">
              <span class="text-sm font-medium text-muted-foreground">Item {{ index + 1 }}</span>
              <Button
                v-if="items.length > 1"
                type="button"
                variant="ghost"
                size="xs"
                class="text-destructive"
                @click="removeItem(index)"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>

            <FormField label="Description" required :error="(errors as any)[`items[${index}].description`]">
              <Input v-model="item.value.description" placeholder="Item description" />
            </FormField>

            <div class="grid grid-cols-3 gap-3">
              <FormField label="Qty" :error="(errors as any)[`items[${index}].quantity`]">
                <Input v-model.number="item.value.quantity" type="number" min="0" step="1" />
              </FormField>
              <FormField label="Unit">
                <Input v-model="item.value.unit" placeholder="e.g., pcs" />
              </FormField>
              <FormField label="Unit Price" :error="(errors as any)[`items[${index}].unit_price`]">
                <Input v-model.number="item.value.unit_price" type="number" min="0" step="0.01" />
              </FormField>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <FormField v-if="form.type === 'invoice'" label="Revenue Account">
                <Select
                  :model-value="item.value.revenue_account_id ?? ''"
                  :options="[{ value: '', label: 'Default' }, ...revenueAccountOptions]"
                  @update:model-value="(v) => item.value.revenue_account_id = v ? Number(v) : null"
                />
              </FormField>
              <FormField v-else label="Expense Account">
                <Select
                  :model-value="item.value.expense_account_id ?? ''"
                  :options="[{ value: '', label: 'Default' }, ...expenseAccountOptions]"
                  @update:model-value="(v) => item.value.expense_account_id = v ? Number(v) : null"
                />
              </FormField>
            </div>
          </div>
        </div>

        <!-- Subtotal -->
        <div class="mt-4 pt-4 border-t border-border flex justify-end">
          <div class="text-right">
            <span class="text-sm text-muted-foreground mr-4">Subtotal</span>
            <span class="text-lg font-semibold text-foreground">
              {{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(subtotal) }}
            </span>
          </div>
        </div>
      </Card>

      <!-- Settings -->
      <Card>
        <template #header>
          <h2 class="font-medium text-foreground">Settings</h2>
        </template>
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Tax Rate (%)" :error="errors.tax_rate">
              <Input v-model.number="taxRate" type="number" min="0" max="100" step="0.1" />
            </FormField>
            <FormField label="Discount Amount" :error="errors.discount_amount">
              <Input v-model.number="discountAmount" type="number" min="0" step="0.01" />
            </FormField>
            <FormField label="Payment Terms (days)" :error="errors.payment_term_days">
              <Input v-model.number="paymentTermDays" type="number" min="0" />
            </FormField>
          </div>

          <!-- Toggles -->
          <div class="space-y-4 pt-2">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-foreground">Active</h3>
                <p class="text-sm text-muted-foreground">Enable automatic generation</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="isActive" type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-foreground">Auto Post</h3>
                <p class="text-sm text-muted-foreground">Automatically post generated documents</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="autoPost" type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-medium text-foreground">Auto Send</h3>
                <p class="text-sm text-muted-foreground">Automatically send to contact after generation</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="autoSend" type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </Card>

      <!-- Form status -->
      <div v-if="meta.dirty" class="text-sm text-amber-600 dark:text-amber-500">
        You have unsaved changes
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <Button type="button" variant="ghost" @click="router.back()">Cancel</Button>
        <Button type="submit" :loading="isSubmitting">
          {{ isEditing ? 'Update Template' : 'Create Template' }}
        </Button>
      </div>
    </form>
  </div>
</template>
