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
import BarChart from '@/components/charts/BarChart.vue'
import LocationMapPicker, { type LocationData, type SolarData } from '@/components/maps/LocationMapPicker.vue'
import { useToast } from '@/components/ui/Toast/useToast'
import { formatCurrency, formatNumber, formatSolarOffset } from '@/utils/format'
import CapacityCalculatorModal from '@/components/solar/CapacityCalculatorModal.vue'
import { Calculator } from 'lucide-vue-next'
import { useContacts, type Contact } from '@/api/useContacts'
import { useBomVariantGroups, type BomVariantGroup } from '@/api/useComponentStandards'
import {
  useSolarProposal,
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
  roof_polygon: undefined as GeoJSON.Polygon | undefined,
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

// Capacity calculator modal
const showCalculatorModal = ref(false)

// ============================================
// Data Fetching
// ============================================

// Edit mode: load existing proposal
const { data: existingProposal, isLoading: isLoadingProposal } = useSolarProposal(proposalId)

// Contacts for customer selection
const contactFilters = ref({ type: 'customer' as const, per_page: 100, is_active: true })
const { data: contactsData } = useContacts(contactFilters)
const contacts = computed(() => contactsData.value?.data || [])

// Location data for map picker
const locationData = computed({
  get: () => ({
    latitude: form.value.latitude,
    longitude: form.value.longitude,
    province: form.value.province,
    city: form.value.city,
    roofArea: form.value.roof_area_m2,
    roofPolygon: form.value.roof_polygon,
  }),
  set: (val: LocationData) => {
    form.value.latitude = val.latitude
    form.value.longitude = val.longitude
    form.value.province = val.province
    form.value.city = val.city
    form.value.roof_area_m2 = val.roofArea
    form.value.roof_polygon = val.roofPolygon

    // Clear location errors when values are set
    if (val.province) delete errors.value.province
    if (val.city) delete errors.value.city
  }
})

// Solar data from map (for display and form population)
const solarData = ref<SolarData | null>(null)

function onSolarDataLoaded(data: SolarData) {
  solarData.value = data
  // Auto-populate form fields
  form.value.peak_sun_hours = data.peak_sun_hours
  form.value.solar_irradiance = data.solar_irradiance_kwh_m2_day
  form.value.roof_tilt_degrees = data.optimal_tilt_angle
}

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

const variantGroupOptions = computed(() => [
  { value: '', label: '— None —' }, // Allow clearing selection
  ...variantGroups.value.map((vg: BomVariantGroup) => ({
    value: vg.id,
    label: vg.name,
  })),
])

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
  return (monthlyProduction.value / form.value.monthly_consumption_kwh) * 100
})

const solarOffsetFormatted = computed(() => formatSolarOffset(solarOffsetPercent.value))

// ============================================
// Recommended System Capacity (Industry Best Practice)
// ============================================
// Formula: kWp = Annual Consumption / Annual Yield per kWp
// Annual Yield = PSH × 365 × Performance Ratio
// This calculates the system size needed for 100% consumption offset
const recommendedCapacity = computed(() => {
  const monthlyKwh = form.value.monthly_consumption_kwh
  const psh = form.value.peak_sun_hours
  const pr = form.value.performance_ratio

  if (!monthlyKwh || !psh || !pr) return null

  // Annual consumption
  const annualKwh = monthlyKwh * 12

  // Annual yield per kWp = PSH × 365 days × Performance Ratio
  const yieldPerKwp = psh * 365 * pr

  // Recommended capacity for 100% offset
  // Round to 0.5 kWp increments (common panel sizing)
  const rawCapacity = annualKwh / yieldPerKwp
  return Math.round(rawCapacity * 2) / 2  // Round to nearest 0.5
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

// System cost from selected BOM
const systemCost = computed(() => {
  return existingProposal.value?.selected_bom?.total_cost ?? 0
})

// Payback period calculation
const paybackPeriod = computed(() => {
  if (!systemCost.value || !firstYearSavings.value) return null

  let cumulative = 0
  for (let year = 1; year <= 25; year++) {
    const projection = yearlyProjections.value[year - 1]
    if (projection) {
      cumulative += projection.savings
      if (cumulative >= systemCost.value) {
        // Interpolate for more accurate payback
        const prevCumulative = cumulative - projection.savings
        const fraction = (systemCost.value - prevCumulative) / projection.savings
        return Math.round((year - 1 + fraction) * 10) / 10
      }
    }
  }
  return null // Payback > 25 years
})

// Chart data: Payback Period - Cumulative savings vs Investment
const paybackChartData = computed(() => {
  if (!yearlyProjections.value.length) return { labels: [], datasets: [] }

  let cumulative = 0
  const cumulativeData = yearlyProjections.value.map(p => {
    cumulative += p.savings
    return cumulative
  })

  const investmentLine = yearlyProjections.value.map(() => systemCost.value)

  return {
    labels: yearlyProjections.value.map(p => `Year ${p.year}`),
    datasets: [
      {
        label: 'Cumulative Savings (Rp)',
        data: cumulativeData,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Investment Cost (Rp)',
        data: investmentLine,
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
    ],
  }
})

// Chart data: Monthly Bill Comparison (Before vs After Solar)
const monthlyBillChartData = computed(() => {
  if (!form.value.monthly_consumption_kwh || !form.value.electricity_rate) {
    return { labels: [], datasets: [] }
  }

  const monthlyBillBefore = form.value.monthly_consumption_kwh * form.value.electricity_rate
  const monthlySolarProduction = monthlyProduction.value
  const monthlyBillAfter = Math.max(0, (form.value.monthly_consumption_kwh - monthlySolarProduction) * form.value.electricity_rate)
  const monthlySavings = monthlyBillBefore - monthlyBillAfter

  return {
    labels: ['Current Bill', 'After Solar', 'Monthly Savings'],
    datasets: [
      {
        label: 'Amount (Rp)',
        data: [monthlyBillBefore, monthlyBillAfter, monthlySavings],
        backgroundColor: ['#ef4444', '#22c55e', '#3b82f6'],
        borderRadius: 8,
      },
    ],
  }
})

// ============================================
// Watchers
// ============================================

// Load existing proposal data (immediate: true ensures it runs if data is already cached)
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
      roof_polygon: (proposal as any).roof_polygon ?? undefined,
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
}, { immediate: true })

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

// Auto-populate system capacity when entering Step 3 (if not already set)
watch(currentStep, (newStep, oldStep) => {
  if (newStep === 3 && oldStep === 2 && !form.value.system_capacity_kwp && recommendedCapacity.value) {
    form.value.system_capacity_kwp = recommendedCapacity.value
  }
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
    roof_polygon: form.value.roof_polygon,
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
    variant_group_id: form.value.variant_group_id || undefined,
    selected_bom_id: form.value.selected_bom_id || undefined,
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
  // Save without full validation - include all current form data
  const payload = {
    contact_id: form.value.contact_id!,
    site_name: form.value.site_name || undefined,
    site_address: form.value.site_address || undefined,
    province: form.value.province || undefined,
    city: form.value.city || undefined,
    latitude: form.value.latitude,
    longitude: form.value.longitude,
    roof_area_m2: form.value.roof_area_m2,
    roof_polygon: form.value.roof_polygon,
    roof_type: form.value.roof_type,
    roof_orientation: form.value.roof_orientation,
    roof_tilt_degrees: form.value.roof_tilt_degrees,
    shading_percentage: form.value.shading_percentage,
    monthly_consumption_kwh: form.value.monthly_consumption_kwh,
    pln_tariff_category: form.value.pln_tariff_category || undefined,
    electricity_rate: form.value.electricity_rate,
    tariff_escalation_percent: form.value.tariff_escalation_percent,
    peak_sun_hours: form.value.peak_sun_hours,
    solar_irradiance: form.value.solar_irradiance,
    performance_ratio: form.value.performance_ratio,
    variant_group_id: form.value.variant_group_id || undefined,
    selected_bom_id: form.value.selected_bom_id || undefined,
    system_capacity_kwp: form.value.system_capacity_kwp,
    valid_until: form.value.valid_until,
    notes: form.value.notes || undefined,
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
          <FormField label="Site Address" :error="errors.site_address">
            <Input
              v-model="form.site_address"
              placeholder="Full address (optional - use map below)"
              :error="!!errors.site_address"
            />
          </FormField>

          <!-- Interactive Location Map -->
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-slate-700 mb-2">
              Site Location <span class="text-red-500">*</span>
            </label>
            <p class="text-sm text-slate-500 mb-3">
              Click on the map or search to select the installation site. Switch to Satellite view and draw the roof outline for accurate area calculation.
            </p>
            <LocationMapPicker
              v-model="locationData"
              :show-draw-tools="true"
              @solar-data-loaded="onSolarDataLoaded"
            />
            <div v-if="errors.province || errors.city" class="mt-2 text-sm text-red-600">
              Please select a location on the map
            </div>
          </div>

          <!-- Manual Roof Area (fallback if not drawn) -->
          <FormField
            v-if="!form.roof_polygon"
            label="Roof Area (m²)"
            hint="Or draw on the map for accurate measurement"
          >
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
          <div v-if="form.monthly_consumption_kwh && form.electricity_rate" class="md:col-span-2 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 class="font-medium text-blue-800 dark:text-blue-300 mb-2">Current Electricity Cost</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-blue-600 dark:text-blue-400">Monthly Bill:</span>
                <span class="ml-1 font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(form.monthly_consumption_kwh * form.electricity_rate) }}</span>
              </div>
              <div>
                <span class="text-blue-600 dark:text-blue-400">Annual Bill:</span>
                <span class="ml-1 font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(form.monthly_consumption_kwh * form.electricity_rate * 12) }}</span>
              </div>
              <div>
                <span class="text-blue-600 dark:text-blue-400">Annual Consumption:</span>
                <span class="ml-1 font-medium text-slate-900 dark:text-slate-100">{{ formatNumber(form.monthly_consumption_kwh * 12) }} kWh</span>
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
            >
              <template #default>
                <div class="space-y-2">
                  <div class="flex gap-2">
                    <Input
                      v-model.number="form.system_capacity_kwp"
                      type="number"
                      placeholder="e.g., 5.0"
                      min="0"
                      step="0.5"
                      :error="!!errors.system_capacity_kwp"
                      class="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      title="Open Capacity Calculator"
                      @click="showCalculatorModal = true"
                    >
                      <Calculator class="w-4 h-4" />
                    </Button>
                  </div>
                  <!-- Recommendation Badge -->
                  <div v-if="recommendedCapacity" class="flex items-center gap-2">
                    <span class="text-xs text-slate-500 dark:text-slate-400">
                      Recommended: <span class="font-semibold text-green-600 dark:text-green-400">{{ recommendedCapacity }} kWp</span>
                      <span class="text-slate-400">(100% offset)</span>
                    </span>
                    <button
                      v-if="form.system_capacity_kwp !== recommendedCapacity"
                      type="button"
                      class="text-xs px-2 py-0.5 bg-green-100 text-green-700 hover:bg-green-200 rounded dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 transition-colors"
                      @click="form.system_capacity_kwp = recommendedCapacity"
                    >
                      Apply
                    </button>
                  </div>
                  <p v-else class="text-xs text-slate-500 dark:text-slate-400">
                    Enter consumption & location data to see recommendation
                  </p>
                </div>
              </template>
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
          <div v-if="form.system_capacity_kwp && form.peak_sun_hours" class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <h4 class="font-medium text-amber-800 dark:text-amber-300 mb-3">Estimated Production</h4>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span class="text-amber-600 dark:text-amber-400">Annual Production:</span>
                <div class="font-medium text-lg text-slate-900 dark:text-slate-100">{{ formatNumber(annualProduction) }} kWh</div>
              </div>
              <div>
                <span class="text-amber-600 dark:text-amber-400">Monthly Production:</span>
                <div class="font-medium text-lg text-slate-900 dark:text-slate-100">{{ formatNumber(monthlyProduction) }} kWh</div>
              </div>
              <div>
                <span class="text-amber-600 dark:text-amber-400">{{ solarOffsetFormatted.label }}:</span>
                <div class="font-medium text-lg" :class="solarOffsetFormatted.isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'">{{ solarOffsetFormatted.value }}</div>
              </div>
              <div>
                <span class="text-amber-600 dark:text-amber-400">First Year Savings:</span>
                <div class="font-medium text-lg text-slate-900 dark:text-slate-100">{{ formatCurrency(firstYearSavings) }}</div>
              </div>
            </div>
          </div>

          <!-- Financial Projection Charts -->
          <div v-if="yearlyProjections.length > 0" class="space-y-6">
            <div class="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h3 class="text-lg font-medium text-slate-900 dark:text-slate-100 mb-4">25-Year Financial Projection</h3>

              <!-- Summary Cards -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div class="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-center border border-green-200 dark:border-green-800">
                  <div class="text-lg md:text-xl font-bold text-green-700 dark:text-green-400 truncate">{{ formatCurrency(totalLifetimeSavings) }}</div>
                  <div class="text-xs text-green-600 dark:text-green-500">Total 25-Year Savings</div>
                </div>
                <div class="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-center border border-orange-200 dark:border-orange-800">
                  <div class="text-lg md:text-xl font-bold text-orange-700 dark:text-orange-400 truncate">{{ formatCurrency(firstYearSavings) }}</div>
                  <div class="text-xs text-orange-600 dark:text-orange-500">First Year Savings</div>
                </div>
                <div class="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-center border border-blue-200 dark:border-blue-800">
                  <div class="text-lg md:text-xl font-bold text-blue-700 dark:text-blue-400 truncate">{{ formatNumber(annualProduction) }}</div>
                  <div class="text-xs text-blue-600 dark:text-blue-500">kWh/Year Production</div>
                </div>
                <div
                  class="p-3 rounded-lg text-center border"
                  :class="solarOffsetFormatted.isSurplus
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'
                    : 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800'"
                >
                  <div class="text-lg md:text-xl font-bold truncate" :class="solarOffsetFormatted.isSurplus ? 'text-emerald-700 dark:text-emerald-400' : 'text-purple-700 dark:text-purple-400'">{{ solarOffsetFormatted.value }}</div>
                  <div class="text-xs" :class="solarOffsetFormatted.isSurplus ? 'text-emerald-600 dark:text-emerald-500' : 'text-purple-600 dark:text-purple-500'">{{ solarOffsetFormatted.label }}</div>
                </div>
              </div>

              <!-- Charts -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Payback Period Chart -->
                <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300">Payback Period</h4>
                    <span v-if="paybackPeriod" class="text-xs font-medium px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 rounded-full">
                      {{ paybackPeriod }} years
                    </span>
                    <span v-else-if="systemCost" class="text-xs font-medium px-2 py-1 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-full">
                      &gt; 25 years
                    </span>
                    <span v-else class="text-xs text-slate-500 dark:text-slate-400">
                      Select BOM to calculate
                    </span>
                  </div>
                  <LineChart
                    :labels="paybackChartData.labels"
                    :datasets="paybackChartData.datasets"
                    :height="250"
                  />
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                    Green line crosses red dashed line at break-even point
                  </p>
                </div>

                <!-- Monthly Bill Comparison Chart -->
                <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Monthly Bill Impact</h4>
                  <BarChart
                    :labels="monthlyBillChartData.labels"
                    :datasets="monthlyBillChartData.datasets"
                    :height="250"
                  />
                  <div v-if="form.monthly_consumption_kwh && form.electricity_rate" class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div class="font-medium text-red-600 dark:text-red-400">{{ formatCurrency(form.monthly_consumption_kwh * form.electricity_rate) }}</div>
                      <div class="text-slate-500 dark:text-slate-400">Current</div>
                    </div>
                    <div>
                      <div class="font-medium text-green-600 dark:text-green-400">{{ formatCurrency(Math.max(0, (form.monthly_consumption_kwh - monthlyProduction) * form.electricity_rate)) }}</div>
                      <div class="text-slate-500 dark:text-slate-400">After Solar</div>
                    </div>
                    <div>
                      <div class="font-medium text-blue-600 dark:text-blue-400">{{ formatCurrency(monthlyProduction * form.electricity_rate) }}</div>
                      <div class="text-slate-500 dark:text-slate-400">Savings/mo</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- Step 4: Review & Submit -->
      <Card v-show="currentStep === 4">
        <template #header>
          <h2 class="text-lg font-medium text-slate-900 dark:text-slate-100">Review & Submit</h2>
        </template>

        <div class="space-y-6">
          <!-- Summary Sections -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Site Summary -->
            <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 class="font-medium text-slate-800 dark:text-slate-200 mb-3">Site Information</h4>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Site:</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ form.site_name }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Location:</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ form.city }}, {{ form.province }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Roof Type:</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100 capitalize">{{ form.roof_type }}</dd>
                </div>
                <div v-if="form.roof_area_m2" class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Roof Area:</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ form.roof_area_m2 }} m²</dd>
                </div>
              </dl>
            </div>

            <!-- Electricity Summary -->
            <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 class="font-medium text-slate-800 dark:text-slate-200 mb-3">Electricity Profile</h4>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Monthly Usage:</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatNumber(form.monthly_consumption_kwh || 0) }} kWh</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Tariff:</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ form.pln_tariff_category }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Rate:</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(form.electricity_rate || 0) }}/kWh</dd>
                </div>
              </dl>
            </div>

            <!-- System Summary -->
            <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <h4 class="font-medium text-slate-800 dark:text-slate-200 mb-3">Solar System</h4>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Capacity:</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ form.system_capacity_kwp }} kWp</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">Annual Production:</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatNumber(annualProduction) }} kWh</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-slate-500 dark:text-slate-400">{{ solarOffsetFormatted.label }}:</dt>
                  <dd class="font-medium" :class="solarOffsetFormatted.isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'">{{ solarOffsetFormatted.value }}</dd>
                </div>
              </dl>
            </div>

            <!-- Financial Summary -->
            <div class="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
              <h4 class="font-medium text-green-800 dark:text-green-300 mb-3">Financial Summary</h4>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <dt class="text-green-600 dark:text-green-400">First Year Savings:</dt>
                  <dd class="font-medium text-green-800 dark:text-green-300">{{ formatCurrency(firstYearSavings) }}</dd>
                </div>
                <div class="flex justify-between">
                  <dt class="text-green-600 dark:text-green-400">25-Year Savings:</dt>
                  <dd class="font-medium text-green-800 dark:text-green-300">{{ formatCurrency(totalLifetimeSavings) }}</dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- Proposal Settings -->
          <div class="border-t border-slate-200 dark:border-slate-700 pt-6">
            <h4 class="font-medium text-slate-800 dark:text-slate-200 mb-4">Proposal Settings</h4>
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

    <!-- Capacity Calculator Modal -->
    <CapacityCalculatorModal
      v-model:open="showCalculatorModal"
      :monthly-consumption="form.monthly_consumption_kwh"
      :peak-sun-hours="form.peak_sun_hours"
      :performance-ratio="form.performance_ratio"
      @apply="(capacity) => form.system_capacity_kwp = capacity"
    />
  </div>
</template>
