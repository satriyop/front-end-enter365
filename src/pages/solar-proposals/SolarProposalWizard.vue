<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from '@/components/ui/Card.vue'
import Button from '@/components/ui/Button.vue'
import FormField from '@/components/ui/FormField.vue'
import Input from '@/components/ui/Input.vue'
import Select from '@/components/ui/Select.vue'
import Textarea from '@/components/ui/Textarea.vue'
import LineChart from '@/components/charts/LineChart.vue'
import { useToast } from '@/components/ui/Toast/useToast'
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format'
import { useContacts, type Contact } from '@/api/useContacts'
import { useBomVariantGroups, type BomVariantGroup } from '@/api/useComponentStandards'
import {
  useSolarProposal,
  useSolarProvinces,
  useSolarCities,
  useSolarDataLookup,
  usePlnTariffs,
  useCreateSolarProposal,
  useUpdateSolarProposal,
  useCalculateSolarProposal,
  useAttachSolarVariants,
  useSelectSolarBom,
  type SolarProposal,
  type PlnTariff,
} from '@/api/useSolarProposals'

// ============================================
// Route & Props
// ============================================

const route = useRoute()
const router = useRouter()
const toast = useToast()

const proposalId = computed(() => {
  const id = route.params.id
  return id ? Number(id) : 0
})

const isEditMode = computed(() => proposalId.value > 0)
const pageTitle = computed(() => isEditMode.value ? 'Edit Solar Proposal' : 'New Solar Proposal')

// ============================================
// Form State
// ============================================

const currentStep = ref(1)
const totalSteps = 4

// Step 1: Site & Customer
const form = ref({
  // Step 1
  contact_id: undefined as number | undefined,
  site_name: '',
  site_address: '',
  province: '',
  city: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
  roof_area_m2: undefined as number | undefined,
  roof_type: 'flat' as 'flat' | 'sloped' | 'carport',
  roof_orientation: 'south' as 'north' | 'south' | 'east' | 'west',
  roof_tilt_degrees: 10,
  shading_percentage: 0,
  // Step 2
  monthly_consumption_kwh: undefined as number | undefined,
  pln_tariff_category: '',
  electricity_rate: undefined as number | undefined,
  tariff_escalation_percent: 3,
  // Step 3
  peak_sun_hours: undefined as number | undefined,
  solar_irradiance: undefined as number | undefined,
  performance_ratio: 0.8,
  variant_group_id: undefined as number | undefined,
  selected_bom_id: undefined as number | undefined,
  system_capacity_kwp: undefined as number | undefined,
  // Step 4
  valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  notes: '',
})

const errors = ref<Record<string, string>>({})

// ============================================
// Data Fetching
// ============================================

// Edit mode: load existing proposal
const { data: existingProposal, isLoading: isLoadingProposal } = useSolarProposal(proposalId)

// Contacts for customer selection
const contactFilters = ref({ type: 'customer' as const, per_page: 100, is_active: true })
const { data: contactsData } = useContacts(contactFilters)
const contacts = computed(() => contactsData.value?.data || [])

// Provinces and cities
const { data: provinces } = useSolarProvinces()
const selectedProvince = computed(() => form.value.province)
const { data: cities } = useSolarCities(selectedProvince)

// Solar data lookup
const solarLookupParams = computed(() => ({
  province: form.value.province,
  city: form.value.city,
}))
const { data: solarData } = useSolarDataLookup(solarLookupParams)

// PLN tariffs
const { data: plnTariffs } = usePlnTariffs()

// Variant groups for system selection
const variantGroupFilters = ref({ per_page: 50 })
const { data: variantGroupsData } = useBomVariantGroups(variantGroupFilters)
const variantGroups = computed(() => variantGroupsData.value?.data || [])

// ============================================
// Mutations
// ============================================

const createMutation = useCreateSolarProposal()
const updateMutation = useUpdateSolarProposal()
const calculateMutation = useCalculateSolarProposal()
// Note: attachVariantsMutation and selectBomMutation available for future use
void useAttachSolarVariants
void useSelectSolarBom

const isSubmitting = computed(() =>
  createMutation.isPending.value ||
  updateMutation.isPending.value ||
  calculateMutation.isPending.value
)

// ============================================
// Computed Options
// ============================================

const contactOptions = computed(() =>
  contacts.value.map((c: Contact) => ({ value: c.id, label: `${c.code} - ${c.name}` }))
)

const provinceOptions = computed(() =>
  (provinces.value || []).map((p: string) => ({ value: p, label: p }))
)

const cityOptions = computed(() =>
  (cities.value || []).map((c: string) => ({ value: c, label: c }))
)

const tariffOptions = computed(() =>
  (plnTariffs.value || []).map((t: PlnTariff) => ({
    value: t.category_code,
    label: `${t.category_code} - ${t.category_name}`,
  }))
)

const roofTypeOptions = [
  { value: 'flat', label: 'Flat Roof' },
  { value: 'sloped', label: 'Sloped Roof' },
  { value: 'carport', label: 'Carport' },
]

const orientationOptions = [
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South (Recommended)' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
]

const variantGroupOptions = computed(() =>
  variantGroups.value.map((vg: BomVariantGroup) => ({
    value: vg.id,
    label: vg.name,
  }))
)

// ============================================
// Calculations (Client-side preview)
// ============================================

const annualProduction = computed(() => {
  if (!form.value.system_capacity_kwp || !form.value.peak_sun_hours) return 0
  return form.value.system_capacity_kwp * form.value.peak_sun_hours * 365 * form.value.performance_ratio
})

const monthlyProduction = computed(() => annualProduction.value / 12)

const solarOffsetPercent = computed(() => {
  if (!form.value.monthly_consumption_kwh || !monthlyProduction.value) return 0
  return Math.min(100, (monthlyProduction.value / form.value.monthly_consumption_kwh) * 100)
})

const firstYearSavings = computed(() => {
  if (!annualProduction.value || !form.value.electricity_rate) return 0
  return annualProduction.value * form.value.electricity_rate
})

// 25-year projection for chart
const yearlyProjections = computed(() => {
  if (!annualProduction.value || !form.value.electricity_rate) return []

  const projections = []
  let rate = form.value.electricity_rate
  let production = annualProduction.value
  const escalation = 1 + (form.value.tariff_escalation_percent / 100)
  const degradation = 0.995 // 0.5% annual degradation

  for (let year = 1; year <= 25; year++) {
    projections.push({
      year,
      rate: Math.round(rate),
      production: Math.round(production),
      savings: Math.round(production * rate),
    })
    rate *= escalation
    production *= degradation
  }

  return projections
})

const totalLifetimeSavings = computed(() =>
  yearlyProjections.value.reduce((sum, p) => sum + p.savings, 0)
)

// Chart data
const savingsChartData = computed(() => ({
  labels: yearlyProjections.value.map(p => `Year ${p.year}`),
  datasets: [
    {
      label: 'Annual Savings (Rp)',
      data: yearlyProjections.value.map(p => p.savings),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4,
    },
  ],
}))

const cumulativeSavingsChartData = computed(() => {
  let cumulative = 0
  const data = yearlyProjections.value.map(p => {
    cumulative += p.savings
    return cumulative
  })

  return {
    labels: yearlyProjections.value.map(p => `Year ${p.year}`),
    datasets: [
      {
        label: 'Cumulative Savings (Rp)',
        data,
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }
})

// ============================================
// Watchers
// ============================================

// Load existing proposal data
watch(existingProposal, (proposal) => {
  if (proposal) {
    form.value = {
      contact_id: proposal.contact_id,
      site_name: proposal.site_name || '',
      site_address: proposal.site_address || '',
      province: proposal.province || '',
      city: proposal.city || '',
      latitude: proposal.latitude ?? undefined,
      longitude: proposal.longitude ?? undefined,
      roof_area_m2: proposal.roof_area_m2 ?? undefined,
      roof_type: (proposal.roof_type as 'flat' | 'sloped' | 'carport') || 'flat',
      roof_orientation: (proposal.roof_orientation as 'north' | 'south' | 'east' | 'west') || 'south',
      roof_tilt_degrees: proposal.roof_tilt_degrees || 10,
      shading_percentage: proposal.shading_percentage || 0,
      monthly_consumption_kwh: proposal.monthly_consumption_kwh ?? undefined,
      pln_tariff_category: proposal.pln_tariff_category || '',
      electricity_rate: proposal.electricity_rate ?? undefined,
      tariff_escalation_percent: proposal.tariff_escalation_percent || 3,
      peak_sun_hours: proposal.peak_sun_hours ?? undefined,
      solar_irradiance: proposal.solar_irradiance ?? undefined,
      performance_ratio: proposal.performance_ratio || 0.8,
      variant_group_id: proposal.variant_group_id ?? undefined,
      selected_bom_id: proposal.selected_bom_id ?? undefined,
      system_capacity_kwp: proposal.system_capacity_kwp ?? undefined,
      valid_until: proposal.valid_until?.split('T')[0] || form.value.valid_until,
      notes: proposal.notes || '',
    }
  }
})

// Auto-fill solar data when location is selected
watch(solarData, (data) => {
  if (data) {
    form.value.peak_sun_hours = data.peak_sun_hours
    form.value.solar_irradiance = data.solar_irradiance_kwh_m2_day
    form.value.latitude = data.latitude
    form.value.longitude = data.longitude
  }
})

// Auto-fill electricity rate when tariff is selected
watch(() => form.value.pln_tariff_category, (category) => {
  if (category && plnTariffs.value) {
    const tariff = plnTariffs.value.find((t: PlnTariff) => t.category_code === category)
    if (tariff) {
      form.value.electricity_rate = tariff.rate_per_kwh
    }
  }
})

// Reset city when province changes
watch(() => form.value.province, () => {
  form.value.city = ''
})

// ============================================
// Step Validation
// ============================================

function validateStep(step: number): boolean {
  errors.value = {}

  if (step === 1) {
    if (!form.value.contact_id) errors.value.contact_id = 'Please select a customer'
    if (!form.value.site_name) errors.value.site_name = 'Site name is required'
    if (!form.value.site_address) errors.value.site_address = 'Site address is required'
    if (!form.value.province) errors.value.province = 'Province is required'
    if (!form.value.city) errors.value.city = 'City is required'
  }

  if (step === 2) {
    if (!form.value.monthly_consumption_kwh || form.value.monthly_consumption_kwh <= 0) {
      errors.value.monthly_consumption_kwh = 'Monthly consumption is required'
    }
    if (!form.value.pln_tariff_category) errors.value.pln_tariff_category = 'PLN tariff is required'
    if (!form.value.electricity_rate || form.value.electricity_rate <= 0) {
      errors.value.electricity_rate = 'Electricity rate is required'
    }
  }

  if (step === 3) {
    if (!form.value.system_capacity_kwp || form.value.system_capacity_kwp <= 0) {
      errors.value.system_capacity_kwp = 'System capacity is required'
    }
  }

  if (step === 4) {
    if (!form.value.valid_until) errors.value.valid_until = 'Valid until date is required'
  }

  return Object.keys(errors.value).length === 0
}

// ============================================
// Navigation
// ============================================

function nextStep() {
  if (validateStep(currentStep.value)) {
    if (currentStep.value < totalSteps) {
      currentStep.value++
    }
  }
}

function prevStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function goToStep(step: number) {
  // Only allow going to previous steps or current step
  if (step <= currentStep.value) {
    currentStep.value = step
  }
}

// ============================================
// Form Submission
// ============================================

async function handleSubmit() {
  if (!validateStep(currentStep.value)) return

  const payload = {
    contact_id: form.value.contact_id!,
    site_name: form.value.site_name,
    site_address: form.value.site_address,
    province: form.value.province,
    city: form.value.city,
    latitude: form.value.latitude,
    longitude: form.value.longitude,
    roof_area_m2: form.value.roof_area_m2,
    roof_type: form.value.roof_type,
    roof_orientation: form.value.roof_orientation,
    roof_tilt_degrees: form.value.roof_tilt_degrees,
    shading_percentage: form.value.shading_percentage,
    monthly_consumption_kwh: form.value.monthly_consumption_kwh,
    pln_tariff_category: form.value.pln_tariff_category,
    electricity_rate: form.value.electricity_rate,
    tariff_escalation_percent: form.value.tariff_escalation_percent,
    peak_sun_hours: form.value.peak_sun_hours,
    solar_irradiance: form.value.solar_irradiance,
    performance_ratio: form.value.performance_ratio,
    variant_group_id: form.value.variant_group_id,
    selected_bom_id: form.value.selected_bom_id,
    system_capacity_kwp: form.value.system_capacity_kwp,
    valid_until: form.value.valid_until,
    notes: form.value.notes || undefined,
  }

  try {
    let result: SolarProposal

    if (isEditMode.value) {
      result = await updateMutation.mutateAsync({ id: proposalId.value, data: payload })
      toast.success('Proposal updated successfully')
    } else {
      result = await createMutation.mutateAsync(payload)
      toast.success('Proposal created successfully')
    }

    // Calculate after save
    await calculateMutation.mutateAsync(result.id)

    router.push(`/solar-proposals/${result.id}`)
  } catch (err) {
    toast.error('Failed to save proposal')
    console.error(err)
  }
}

async function handleSaveAsDraft() {
  // Save without full validation
  const payload = {
    contact_id: form.value.contact_id!,
    site_name: form.value.site_name || undefined,
    site_address: form.value.site_address || undefined,
    province: form.value.province || undefined,
    city: form.value.city || undefined,
    valid_until: form.value.valid_until,
  }

  if (!form.value.contact_id) {
    toast.error('Please select a customer first')
    return
  }

  try {
    if (isEditMode.value) {
      await updateMutation.mutateAsync({ id: proposalId.value, data: payload })
      toast.success('Draft saved')
    } else {
      const result = await createMutation.mutateAsync(payload)
      toast.success('Draft saved')
      router.push(`/solar-proposals/${result.id}/edit`)
    }
  } catch (err) {
    toast.error('Failed to save draft')
  }
}

// ============================================
// Step Configuration
// ============================================

const steps = computed(() => [
  { number: 1, title: 'Site Info', description: 'Customer & location details' },
  { number: 2, title: 'Electricity', description: 'Consumption & tariff' },
  { number: 3, title: 'System', description: 'Solar system selection' },
  { number: 4, title: 'Review', description: 'Finalize proposal' },
])
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-slate-900">{{ pageTitle }}</h1>
      <p class="mt-1 text-sm text-slate-500">
        Create a solar proposal with financial projections for your customer
      </p>
    </div>

    <!-- Step Indicator -->
    <div class="mb-8">
      <nav aria-label="Progress">
        <ol class="flex items-center">
          <li
            v-for="(step, index) in steps"
            :key="step.number"
            :class="[
              'relative',
              index !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''
            ]"
          >
            <!-- Step connector line -->
            <div
              v-if="index !== steps.length - 1"
              class="absolute top-4 left-7 -ml-px mt-0.5 h-0.5 w-full bg-slate-200"
              :class="{ 'bg-orange-500': currentStep > step.number }"
            />

            <!-- Step circle and label -->
            <button
              type="button"
              class="group relative flex items-start"
              @click="goToStep(step.number)"
              :disabled="step.number > currentStep"
            >
              <span class="flex h-9 items-center">
                <span
                  :class="[
                    'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                    currentStep === step.number
                      ? 'bg-orange-500 text-white'
                      : currentStep > step.number
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-200 text-slate-500'
                  ]"
                >
                  <svg
                    v-if="currentStep > step.number"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span v-else>{{ step.number }}</span>
                </span>
              </span>
              <span class="ml-3 hidden sm:block min-w-0">
                <span
                  :class="[
                    'text-sm font-medium',
                    currentStep >= step.number ? 'text-slate-900' : 'text-slate-500'
                  ]"
                >
                  {{ step.title }}
                </span>
                <span class="block text-xs text-slate-500">{{ step.description }}</span>
              </span>
            </button>
          </li>
        </ol>
      </nav>
    </div>

    <!-- Loading state -->
    <div v-if="isLoadingProposal && isEditMode" class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto" />
      <p class="mt-2 text-sm text-slate-500">Loading proposal...</p>
    </div>

    <!-- Step Content -->
    <form v-else @submit.prevent="handleSubmit">
      <!-- Step 1: Site & Customer Information -->
      <Card v-show="currentStep === 1">
        <template #header>
          <h2 class="text-lg font-medium text-slate-900">Site & Customer Information</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Customer Selection -->
          <FormField label="Customer" required :error="errors.contact_id" class="md:col-span-2">
            <Select
              v-model="form.contact_id"
              :options="contactOptions"
              placeholder="Select a customer..."
              :error="!!errors.contact_id"
            />
          </FormField>

          <!-- Site Name -->
          <FormField label="Site Name" required :error="errors.site_name">
            <Input
              v-model="form.site_name"
              placeholder="e.g., Main Office Building"
              :error="!!errors.site_name"
            />
          </FormField>

          <!-- Site Address -->
          <FormField label="Site Address" required :error="errors.site_address">
            <Input
              v-model="form.site_address"
              placeholder="Full address"
              :error="!!errors.site_address"
            />
          </FormField>

          <!-- Province -->
          <FormField label="Province" required :error="errors.province">
            <Select
              v-model="form.province"
              :options="provinceOptions"
              placeholder="Select province..."
              :error="!!errors.province"
            />
          </FormField>

          <!-- City -->
          <FormField label="City" required :error="errors.city">
            <Select
              v-model="form.city"
              :options="cityOptions"
              placeholder="Select city..."
              :disabled="!form.province"
              :error="!!errors.city"
            />
          </FormField>

          <!-- Solar Data Info -->
          <div v-if="solarData" class="md:col-span-2 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 class="font-medium text-green-800 mb-2">Solar Data for {{ form.city }}</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-green-600">Peak Sun Hours:</span>
                <span class="ml-1 font-medium">{{ solarData.peak_sun_hours }} h/day</span>
              </div>
              <div>
                <span class="text-green-600">Irradiance:</span>
                <span class="ml-1 font-medium">{{ solarData.solar_irradiance_kwh_m2_day }} kWh/m²/day</span>
              </div>
              <div>
                <span class="text-green-600">Optimal Tilt:</span>
                <span class="ml-1 font-medium">{{ solarData.optimal_tilt_angle }}°</span>
              </div>
              <div>
                <span class="text-green-600">Avg Temp:</span>
                <span class="ml-1 font-medium">{{ solarData.temperature_avg }}°C</span>
              </div>
            </div>
          </div>

          <!-- Roof Area -->
          <FormField label="Roof Area (m²)" hint="Available area for solar panels">
            <Input
              v-model.number="form.roof_area_m2"
              type="number"
              placeholder="e.g., 100"
              min="0"
            />
          </FormField>

          <!-- Roof Type -->
          <FormField label="Roof Type">
            <Select
              v-model="form.roof_type"
              :options="roofTypeOptions"
            />
          </FormField>

          <!-- Roof Orientation -->
          <FormField label="Roof Orientation">
            <Select
              v-model="form.roof_orientation"
              :options="orientationOptions"
            />
          </FormField>

          <!-- Roof Tilt -->
          <FormField label="Roof Tilt (degrees)">
            <Input
              v-model.number="form.roof_tilt_degrees"
              type="number"
              min="0"
              max="90"
            />
          </FormField>

          <!-- Shading -->
          <FormField label="Shading (%)" hint="Percentage of roof affected by shadows">
            <Input
              v-model.number="form.shading_percentage"
              type="number"
              min="0"
              max="100"
            />
          </FormField>
        </div>
      </Card>

      <!-- Step 2: Electricity Profile -->
      <Card v-show="currentStep === 2">
        <template #header>
          <h2 class="text-lg font-medium text-slate-900">Electricity Profile</h2>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Monthly Consumption -->
          <FormField
            label="Monthly Electricity Consumption (kWh)"
            required
            :error="errors.monthly_consumption_kwh"
            hint="Check your PLN bill for this value"
          >
            <Input
              v-model.number="form.monthly_consumption_kwh"
              type="number"
              placeholder="e.g., 1500"
              min="0"
              :error="!!errors.monthly_consumption_kwh"
            />
          </FormField>

          <!-- PLN Tariff Category -->
          <FormField label="PLN Tariff Category" required :error="errors.pln_tariff_category">
            <Select
              v-model="form.pln_tariff_category"
              :options="tariffOptions"
              placeholder="Select tariff..."
              :error="!!errors.pln_tariff_category"
            />
          </FormField>

          <!-- Electricity Rate -->
          <FormField
            label="Electricity Rate (Rp/kWh)"
            required
            :error="errors.electricity_rate"
            hint="Auto-filled from tariff selection"
          >
            <Input
              v-model.number="form.electricity_rate"
              type="number"
              placeholder="e.g., 1444"
              min="0"
              :error="!!errors.electricity_rate"
            />
          </FormField>

          <!-- Tariff Escalation -->
          <FormField
            label="Annual Tariff Escalation (%)"
            hint="Expected annual increase in electricity rates"
          >
            <Input
              v-model.number="form.tariff_escalation_percent"
              type="number"
              min="0"
              max="20"
            />
          </FormField>

          <!-- Current Monthly Bill Info -->
          <div v-if="form.monthly_consumption_kwh && form.electricity_rate" class="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 class="font-medium text-blue-800 mb-2">Current Electricity Cost</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-blue-600">Monthly Bill:</span>
                <span class="ml-1 font-medium">{{ formatCurrency(form.monthly_consumption_kwh * form.electricity_rate) }}</span>
              </div>
              <div>
                <span class="text-blue-600">Annual Bill:</span>
                <span class="ml-1 font-medium">{{ formatCurrency(form.monthly_consumption_kwh * form.electricity_rate * 12) }}</span>
              </div>
              <div>
                <span class="text-blue-600">Annual Consumption:</span>
                <span class="ml-1 font-medium">{{ formatNumber(form.monthly_consumption_kwh * 12) }} kWh</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Step 3: System Selection -->
      <Card v-show="currentStep === 3">
        <template #header>
          <h2 class="text-lg font-medium text-slate-900">Solar System Selection</h2>
        </template>

        <div class="space-y-6">
          <!-- System Capacity Input -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="System Capacity (kWp)"
              required
              :error="errors.system_capacity_kwp"
              hint="Recommended based on your consumption"
            >
              <Input
                v-model.number="form.system_capacity_kwp"
                type="number"
                placeholder="e.g., 5.0"
                min="0"
                step="0.5"
                :error="!!errors.system_capacity_kwp"
              />
            </FormField>

            <FormField label="Performance Ratio" hint="System efficiency factor (0.75-0.85 typical)">
              <Input
                v-model.number="form.performance_ratio"
                type="number"
                min="0.5"
                max="1"
                step="0.01"
              />
            </FormField>
          </div>

          <!-- Variant Group Selection (Optional) -->
          <FormField label="BOM Variant Group (Optional)" hint="Select pre-configured system packages">
            <Select
              v-model="form.variant_group_id"
              :options="variantGroupOptions"
              placeholder="Select variant group..."
            />
          </FormField>

          <!-- Production Estimates -->
          <div v-if="form.system_capacity_kwp && form.peak_sun_hours" class="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 class="font-medium text-yellow-800 mb-3">Estimated Production</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-yellow-600">Annual Production:</span>
                <div class="font-medium text-lg">{{ formatNumber(annualProduction) }} kWh</div>
              </div>
              <div>
                <span class="text-yellow-600">Monthly Production:</span>
                <div class="font-medium text-lg">{{ formatNumber(monthlyProduction) }} kWh</div>
              </div>
              <div>
                <span class="text-yellow-600">Solar Offset:</span>
                <div class="font-medium text-lg">{{ formatPercent(solarOffsetPercent) }}</div>
              </div>
              <div>
                <span class="text-yellow-600">First Year Savings:</span>
                <div class="font-medium text-lg">{{ formatCurrency(firstYearSavings) }}</div>
              </div>
            </div>
          </div>

          <!-- Financial Projection Charts -->
          <div v-if="yearlyProjections.length > 0" class="space-y-6">
            <div class="border-t pt-6">
              <h3 class="text-lg font-medium text-slate-900 mb-4">25-Year Financial Projection</h3>

              <!-- Summary Cards -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="p-4 bg-green-50 rounded-lg text-center">
                  <div class="text-2xl font-bold text-green-700">{{ formatCurrency(totalLifetimeSavings) }}</div>
                  <div class="text-sm text-green-600">Total 25-Year Savings</div>
                </div>
                <div class="p-4 bg-orange-50 rounded-lg text-center">
                  <div class="text-2xl font-bold text-orange-700">{{ formatCurrency(firstYearSavings) }}</div>
                  <div class="text-sm text-orange-600">First Year Savings</div>
                </div>
                <div class="p-4 bg-blue-50 rounded-lg text-center">
                  <div class="text-2xl font-bold text-blue-700">{{ formatNumber(annualProduction) }}</div>
                  <div class="text-sm text-blue-600">kWh/Year Production</div>
                </div>
                <div class="p-4 bg-purple-50 rounded-lg text-center">
                  <div class="text-2xl font-bold text-purple-700">{{ formatPercent(solarOffsetPercent) }}</div>
                  <div class="text-sm text-purple-600">Energy Offset</div>
                </div>
              </div>

              <!-- Charts -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white p-4 rounded-lg border">
                  <h4 class="text-sm font-medium text-slate-700 mb-3">Annual Savings</h4>
                  <LineChart
                    :labels="savingsChartData.labels"
                    :datasets="savingsChartData.datasets"
                    :height="250"
                  />
                </div>
                <div class="bg-white p-4 rounded-lg border">
                  <h4 class="text-sm font-medium text-slate-700 mb-3">Cumulative Savings</h4>
                  <LineChart
                    :labels="cumulativeSavingsChartData.labels"
                    :datasets="cumulativeSavingsChartData.datasets"
                    :height="250"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Step 4: Review & Submit -->
      <Card v-show="currentStep === 4">
        <template #header>
          <h2 class="text-lg font-medium text-slate-900">Review & Submit</h2>
        </template>

        <div class="space-y-6">
          <!-- Summary Sections -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Site Summary -->
            <div class="p-4 bg-slate-50 rounded-lg">
              <h4 class="font-medium text-slate-800 mb-3">Site Information</h4>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-slate-500">Site:</dt>
                  <dd class="font-medium">{{ form.site_name }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500">Location:</dt>
                  <dd class="font-medium">{{ form.city }}, {{ form.province }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500">Roof Type:</dt>
                  <dd class="font-medium capitalize">{{ form.roof_type }}</dd>
                </div>
                <div v-if="form.roof_area_m2" class="flex justify-between">
                  <dt class="text-slate-500">Roof Area:</dt>
                  <dd class="font-medium">{{ form.roof_area_m2 }} m²</dd>
                </div>
              </dl>
            </div>

            <!-- Electricity Summary -->
            <div class="p-4 bg-slate-50 rounded-lg">
              <h4 class="font-medium text-slate-800 mb-3">Electricity Profile</h4>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-slate-500">Monthly Usage:</dt>
                  <dd class="font-medium">{{ formatNumber(form.monthly_consumption_kwh || 0) }} kWh</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500">Tariff:</dt>
                  <dd class="font-medium">{{ form.pln_tariff_category }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500">Rate:</dt>
                  <dd class="font-medium">{{ formatCurrency(form.electricity_rate || 0) }}/kWh</dd>
                </div>
              </dl>
            </div>

            <!-- System Summary -->
            <div class="p-4 bg-slate-50 rounded-lg">
              <h4 class="font-medium text-slate-800 mb-3">Solar System</h4>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-slate-500">Capacity:</dt>
                  <dd class="font-medium">{{ form.system_capacity_kwp }} kWp</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500">Annual Production:</dt>
                  <dd class="font-medium">{{ formatNumber(annualProduction) }} kWh</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500">Solar Offset:</dt>
                  <dd class="font-medium">{{ formatPercent(solarOffsetPercent) }}</dd>
                </div>
              </dl>
            </div>

            <!-- Financial Summary -->
            <div class="p-4 bg-green-50 rounded-lg">
              <h4 class="font-medium text-green-800 mb-3">Financial Summary</h4>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-green-600">First Year Savings:</dt>
                  <dd class="font-medium text-green-800">{{ formatCurrency(firstYearSavings) }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-green-600">25-Year Savings:</dt>
                  <dd class="font-medium text-green-800">{{ formatCurrency(totalLifetimeSavings) }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Proposal Settings -->
          <div class="border-t pt-6">
            <h4 class="font-medium text-slate-800 mb-4">Proposal Settings</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="Valid Until" required :error="errors.valid_until">
                <Input
                  v-model="form.valid_until"
                  type="date"
                  :error="!!errors.valid_until"
                />
              </FormField>

              <FormField label="Notes">
                <Textarea
                  v-model="form.notes"
                  placeholder="Additional notes for this proposal..."
                  :rows="3"
                />
              </FormField>
            </div>
          </div>
        </div>
      </Card>

      <!-- Navigation Buttons -->
      <div class="mt-6 flex items-center justify-between">
        <div>
          <Button
            v-if="currentStep > 1"
            variant="secondary"
            @click="prevStep"
          >
            Previous
          </Button>
          <Button
            v-else
            variant="ghost"
            @click="router.push('/solar-proposals')"
          >
            Cancel
          </Button>
        </div>

        <div class="flex items-center gap-3">
          <Button
            variant="ghost"
            @click="handleSaveAsDraft"
            :loading="isSubmitting"
          >
            Save as Draft
          </Button>

          <Button
            v-if="currentStep < totalSteps"
           
            @click="nextStep"
          >
            Next
          </Button>
          <Button
            v-else
           
            type="submit"
            :loading="isSubmitting"
          >
            {{ isEditMode ? 'Update Proposal' : 'Create Proposal' }}
          </Button>
        </div>
      </div>
    </form>
  </div>
</template>
