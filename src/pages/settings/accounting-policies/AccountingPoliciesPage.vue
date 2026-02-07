<script setup lang="ts">
import { computed, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { Button, Select, FormField, Card, useToast } from '@/components/ui'
import { useAccountingPolicies, useUpdateAccountingPolicies } from '@/api/useAccountingPolicies'
import { setServerErrors } from '@/composables/useValidatedForm'
import { AlertTriangle } from 'lucide-vue-next'

const toast = useToast()
const { data: policiesData, isLoading } = useAccountingPolicies()
const updateMutation = useUpdateAccountingPolicies()

const schema = toTypedSchema(
  z.object({
    inventory_method: z.string(),
    cogs_recognition: z.string(),
    return_accounting: z.string(),
    manufacturing_costing: z.string(),
    closing_strategy: z.string(),
  })
)

const {
  values,
  errors,
  handleSubmit,
  setErrors,
  resetForm,
} = useForm({
  validationSchema: schema,
  initialValues: {
    inventory_method: 'hybrid',
    cogs_recognition: 'on_invoice',
    return_accounting: 'full_journal',
    manufacturing_costing: 'project_based',
    closing_strategy: 'direct',
  },
})

// Sync form when data loads
watch(() => policiesData.value, (data) => {
  if (data?.data) {
    resetForm({
      values: {
        inventory_method: data.data.inventory_method,
        cogs_recognition: data.data.cogs_recognition,
        return_accounting: data.data.return_accounting,
        manufacturing_costing: data.data.manufacturing_costing,
        closing_strategy: data.data.closing_strategy,
      },
    })
  }
}, { immediate: true })

// Build Select options from API metadata
const buildOptions = (key: string) => {
  const optionValues = policiesData.value?.meta.available_options[key] ?? []
  return optionValues.map(v => ({
    value: v,
    label: formatLabel(v),
  }))
}

// Convert snake_case to Title Case for option labels
function formatLabel(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Get description for the currently selected value
function getDescription(key: string): string {
  const descriptions = policiesData.value?.meta.descriptions[key] ?? {}
  const currentValue = values[key as keyof typeof values]
  return descriptions[currentValue ?? ''] ?? ''
}

const inventoryOptions = computed(() => buildOptions('inventory_method'))
const cogsOptions = computed(() => buildOptions('cogs_recognition'))
const returnOptions = computed(() => buildOptions('return_accounting'))
const manufacturingOptions = computed(() => buildOptions('manufacturing_costing'))
const closingOptions = computed(() => buildOptions('closing_strategy'))

const onSubmit = handleSubmit((formValues) => {
  updateMutation.mutate(formValues, {
    onSuccess: () => {
      toast.success('Kebijakan akuntansi berhasil diperbarui')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
      if (err.response?.data?.errors) {
        setServerErrors({ setErrors }, err.response.data.errors)
      }
      toast.error(err.response?.data?.message || 'Gagal memperbarui kebijakan akuntansi')
    },
  })
})

const isSaving = computed(() => updateMutation.isPending.value)

// Policy section config for the template
const policySections = [
  {
    key: 'inventory_method',
    title: 'Inventory Method',
    subtitle: 'Metode pencatatan persediaan',
  },
  {
    key: 'cogs_recognition',
    title: 'COGS Recognition',
    subtitle: 'Kapan Harga Pokok Penjualan diakui',
  },
  {
    key: 'return_accounting',
    title: 'Return Accounting',
    subtitle: 'Perlakuan akuntansi untuk retur',
  },
  {
    key: 'manufacturing_costing',
    title: 'Manufacturing Costing',
    subtitle: 'Metode akumulasi biaya produksi',
  },
  {
    key: 'closing_strategy',
    title: 'Closing Strategy',
    subtitle: 'Metode penutupan buku akhir periode',
  },
] as const

const optionsMap = computed(() => ({
  inventory_method: inventoryOptions.value,
  cogs_recognition: cogsOptions.value,
  return_accounting: returnOptions.value,
  manufacturing_costing: manufacturingOptions.value,
  closing_strategy: closingOptions.value,
}))
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-foreground">Accounting Policies</h1>
      <p class="text-muted-foreground">Konfigurasi strategi akuntansi yang aktif</p>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="space-y-4">
      <div v-for="i in 5" :key="i" class="h-32 bg-muted animate-pulse rounded-lg" />
    </div>

    <form v-else novalidate @submit.prevent="onSubmit" class="space-y-6">
      <!-- Warning banner -->
      <div class="flex gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
        <AlertTriangle class="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div class="text-sm text-amber-800 dark:text-amber-200">
          Perubahan kebijakan hanya berlaku untuk transaksi baru. Jurnal yang sudah dibuat tidak akan dimodifikasi.
        </div>
      </div>

      <!-- Policy sections -->
      <Card v-for="section in policySections" :key="section.key">
        <template #header>
          <div>
            <h2 class="font-medium text-foreground">{{ section.title }}</h2>
            <p class="text-sm text-muted-foreground mt-0.5">{{ section.subtitle }}</p>
          </div>
        </template>
        <div class="space-y-3">
          <FormField :label="section.title" :error="errors[section.key]">
            <Select
              :model-value="values[section.key]"
              :options="optionsMap[section.key]"
              :error="!!errors[section.key]"
              @update:model-value="(v: string | number | null) => (values[section.key] = String(v))"
            />
          </FormField>
          <p
            v-if="getDescription(section.key)"
            class="text-sm text-muted-foreground pl-0.5"
          >
            {{ getDescription(section.key) }}
          </p>
        </div>
      </Card>

      <!-- Save button -->
      <div class="flex justify-end">
        <Button type="submit" :loading="isSaving">
          Save Changes
        </Button>
      </div>
    </form>
  </div>
</template>
