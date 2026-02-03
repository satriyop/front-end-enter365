<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Select from '@/components/ui/Select.vue'
import Input from '@/components/ui/Input.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import FormField from '@/components/ui/FormField.vue'
import { useActiveBoms, type Bom } from '@/api/useBoms'
import { useContactsLookup } from '@/api/useContacts'
import { useCreateQuotationFromBom, type CreateQuotationFromBomData } from '@/api/useQuotations'
import { useToast } from '@/components/ui/Toast/useToast'
import { formatCurrency, formatPercent } from '@/utils/format'

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: [quotationId: number]
}>()

const router = useRouter()
const toast = useToast()

// API hooks
const { data: bomsData, isLoading: bomsLoading } = useActiveBoms()
const { data: contactsData, isLoading: contactsLoading } = useContactsLookup('customer')
const createFromBom = useCreateQuotationFromBom()

// Form state
const selectedBomId = ref<number | null>(null)
const selectedContactId = ref<number | null>(null)
const pricingMode = ref<'margin' | 'price'>('margin')
const marginPercent = ref(20)
const sellingPrice = ref<number | null>(null)
const expandItems = ref(false)
const showAdvanced = ref(false)
const quotationDate = ref('')
const validUntil = ref('')
const subject = ref('')
const taxRate = ref<number | undefined>(11)
const notes = ref('')

// Validation errors
const errors = ref<Record<string, string>>({})

// Computed values
const boms = computed(() => bomsData.value ?? [])
const contacts = computed(() => contactsData.value ?? [])

const bomOptions = computed(() =>
  boms.value.map((bom: Bom) => ({
    value: bom.id,
    label: bom.variant_name
      ? `${bom.bom_number} - ${bom.name} (${bom.variant_name})`
      : `${bom.bom_number} - ${bom.name}`,
  }))
)

const contactOptions = computed(() =>
  contacts.value.map((contact) => ({
    value: contact.id,
    label: contact.name,
  }))
)

const selectedBom = computed(() =>
  boms.value.find((b: Bom) => b.id === selectedBomId.value)
)

const bomTotalCost = computed(() => {
  if (!selectedBom.value) return 0
  return selectedBom.value.total_cost || 0
})

const calculatedPrice = computed(() => {
  if (pricingMode.value === 'price' && sellingPrice.value) {
    return sellingPrice.value
  }
  return Math.round(bomTotalCost.value * (1 + marginPercent.value / 100))
})

const calculatedMargin = computed(() => {
  if (pricingMode.value === 'margin') {
    return marginPercent.value
  }
  if (!sellingPrice.value || bomTotalCost.value === 0) return 0
  return ((sellingPrice.value - bomTotalCost.value) / bomTotalCost.value) * 100
})

const profit = computed(() => calculatedPrice.value - bomTotalCost.value)

const isSubmitting = computed(() => createFromBom.isPending.value)

// Reset form when modal opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetForm()
    }
  }
)

function resetForm() {
  selectedBomId.value = null
  selectedContactId.value = null
  pricingMode.value = 'margin'
  marginPercent.value = 20
  sellingPrice.value = null
  expandItems.value = false
  showAdvanced.value = false
  quotationDate.value = ''
  validUntil.value = ''
  subject.value = ''
  taxRate.value = 11
  notes.value = ''
  errors.value = {}
}

function validate(): boolean {
  errors.value = {}

  if (!selectedBomId.value) {
    errors.value.bom_id = 'Please select a BOM'
  }

  if (!selectedContactId.value) {
    errors.value.contact_id = 'Please select a customer'
  }

  if (pricingMode.value === 'margin' && (marginPercent.value < 0 || marginPercent.value > 500)) {
    errors.value.margin = 'Margin must be between 0% and 500%'
  }

  if (pricingMode.value === 'price' && sellingPrice.value !== null && sellingPrice.value < 0) {
    errors.value.price = 'Selling price cannot be negative'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  if (!selectedBomId.value || !selectedContactId.value) return

  try {
    const data: CreateQuotationFromBomData = {
      bom_id: selectedBomId.value,
      contact_id: selectedContactId.value,
      expand_items: expandItems.value,
    }

    if (pricingMode.value === 'margin') {
      data.margin_percent = marginPercent.value
    } else if (sellingPrice.value) {
      data.selling_price = sellingPrice.value
    }

    if (quotationDate.value) {
      data.quotation_date = quotationDate.value
    }
    if (validUntil.value) {
      data.valid_until = validUntil.value
    }
    if (subject.value) {
      data.subject = subject.value
    }
    if (taxRate.value !== undefined) {
      data.tax_rate = taxRate.value
    }
    if (notes.value) {
      data.notes = notes.value
    }

    const quotation = await createFromBom.mutateAsync(data)

    toast.success({
      title: 'Quotation Created',
      message: `Quotation ${quotation.quotation_number} has been created`,
    })

    emit('update:open', false)
    emit('success', Number(quotation.id))

    // Navigate to the new quotation
    router.push(`/quotations/${quotation.id}`)
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }
    if (err.response?.data?.errors) {
      // Map Laravel validation errors
      const apiErrors = err.response.data.errors
      for (const [key, messages] of Object.entries(apiErrors)) {
        if (messages[0]) {
          errors.value[key] = messages[0]
        }
      }
    } else {
      toast.error({
        title: 'Error',
        message: err.response?.data?.message || 'Failed to create quotation',
      })
    }
  }
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    size="2xl"
    title="Create Quotation from BOM"
    description="Generate a quotation based on a Bill of Materials with custom pricing"
    @update:open="handleClose"
  >
    <form novalidate class="space-y-6" @submit.prevent="handleSubmit">
      <!-- BOM Selection -->
      <FormField
        label="Bill of Materials"
        :error="errors.bom_id"
        required
      >
        <template #default="{ error }">
          <Select
            v-model="selectedBomId"
            :options="bomOptions"
            placeholder="Select a BOM..."
            :error="error"
            :disabled="bomsLoading"
          />
        </template>
      </FormField>

      <!-- BOM Cost Preview -->
      <div
        v-if="selectedBom"
        class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
      >
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-slate-500 dark:text-slate-400">BOM Name</span>
            <p class="font-medium text-slate-900 dark:text-slate-100">{{ selectedBom.name }}</p>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400">Total Cost</span>
            <p class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(bomTotalCost) }}</p>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400">Material Cost</span>
            <p class="text-slate-700 dark:text-slate-300">{{ formatCurrency(selectedBom.total_material_cost) }}</p>
          </div>
          <div>
            <span class="text-slate-500 dark:text-slate-400">Labor + Overhead</span>
            <p class="text-slate-700 dark:text-slate-300">
              {{ formatCurrency(selectedBom.total_labor_cost + selectedBom.total_overhead_cost) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Customer Selection -->
      <FormField
        label="Customer"
        :error="errors.contact_id"
        required
      >
        <template #default="{ error }">
          <Select
            v-model="selectedContactId"
            :options="contactOptions"
            placeholder="Select a customer..."
            :error="error"
            :disabled="contactsLoading"
          />
        </template>
      </FormField>

      <!-- Pricing Section -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Pricing Method</label>
          <div class="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
            <button
              type="button"
              class="px-3 py-1.5 text-sm transition-colors"
              :class="pricingMode === 'margin' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'"
              @click="pricingMode = 'margin'"
            >
              Margin %
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm transition-colors border-l border-slate-300 dark:border-slate-600"
              :class="pricingMode === 'price' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'"
              @click="pricingMode = 'price'"
            >
              Fixed Price
            </button>
          </div>
        </div>

        <!-- Margin Slider -->
        <div v-if="pricingMode === 'margin'" class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-600 dark:text-slate-400">Margin Percentage</span>
            <span class="text-sm font-medium text-orange-600 dark:text-orange-400">{{ formatPercent(marginPercent, 0) }}</span>
          </div>
          <input
            v-model.number="marginPercent"
            type="range"
            min="0"
            max="100"
            step="5"
            class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div class="flex justify-between text-xs text-slate-400 dark:text-slate-500">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
          <p v-if="errors.margin" class="text-xs text-red-600 dark:text-red-400">{{ errors.margin }}</p>
        </div>

        <!-- Fixed Price Input -->
        <FormField
          v-else
          label="Selling Price"
          :error="errors.price"
        >
          <CurrencyInput v-model="sellingPrice" placeholder="Enter selling price" />
        </FormField>

        <!-- Price Preview -->
        <div
          v-if="selectedBom"
          class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800"
        >
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-green-700 dark:text-green-400">Cost</span>
              <p class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(bomTotalCost) }}</p>
            </div>
            <div>
              <span class="text-green-700 dark:text-green-400">Selling Price</span>
              <p class="font-medium text-green-700 dark:text-green-400 text-lg">{{ formatCurrency(calculatedPrice) }}</p>
            </div>
            <div>
              <span class="text-green-700 dark:text-green-400">Profit ({{ formatPercent(calculatedMargin, 1) }})</span>
              <p class="font-medium text-green-700 dark:text-green-400">{{ formatCurrency(profit) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Item Format -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">Line Items Format</label>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="expandItems"
              type="radio"
              :value="false"
              class="text-orange-500 focus:ring-orange-500"
            />
            <span class="text-sm text-slate-600 dark:text-slate-400">Single line (product only)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="expandItems"
              type="radio"
              :value="true"
              class="text-orange-500 focus:ring-orange-500"
            />
            <span class="text-sm text-slate-600 dark:text-slate-400">Expand all BOM items</span>
          </label>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          {{ expandItems
            ? 'Each BOM component will be shown as a separate line item with individual pricing'
            : 'Quotation will show a single line for the finished product'
          }}
        </p>
      </div>

      <!-- Advanced Options Toggle -->
      <button
        type="button"
        class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
        @click="showAdvanced = !showAdvanced"
      >
        <svg
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-90': showAdvanced }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
        Additional Options
      </button>

      <!-- Advanced Options -->
      <div v-if="showAdvanced" class="space-y-4 pl-6 border-l-2 border-slate-200 dark:border-slate-700">
        <FormField label="Custom Subject">
          <Input
            v-model="subject"
            placeholder="Leave blank to use BOM name"
          />
        </FormField>

        <div class="grid grid-cols-2 gap-4">
          <FormField label="Quotation Date">
            <Input
              v-model="quotationDate"
              type="date"
            />
          </FormField>
          <FormField label="Valid Until">
            <Input
              v-model="validUntil"
              type="date"
            />
          </FormField>
        </div>

        <FormField label="Tax Rate (%)">
          <Input
            v-model.number="taxRate"
            type="number"
            min="0"
            max="100"
            step="0.1"
            trailing-addon="%"
          />
        </FormField>

        <FormField label="Notes">
          <textarea
            v-model="notes"
            rows="3"
            class="w-full px-3 py-2 rounded-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:border-orange-500 focus:ring-orange-500 text-sm"
            placeholder="Additional notes for this quotation..."
          />
        </FormField>
      </div>
    </form>

    <template #footer>
      <Button variant="secondary" @click="handleClose">
        Cancel
      </Button>
      <Button
        :loading="isSubmitting"
        @click="handleSubmit"
      >
        Create Quotation
      </Button>
    </template>
  </Modal>
</template>
