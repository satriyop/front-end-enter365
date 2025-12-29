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
import WizardStepIndicator from '@/components/solar/WizardStepIndicator.vue'
import StatsCard from '@/components/solar/StatsCard.vue'
import {
  Calculator,
  Sun,
  Zap,
  TrendingUp,
  Leaf,
  DollarSign,
  Calendar,
  Building2,
  MapPin,
  Gauge,
  Battery,
  ArrowRight,
  ChevronLeft,
  Save,
  Send,
  Sparkles,
} from 'lucide-vue-next'
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
// Priority: 1) existing proposal's selected_bom, 2) frontend variant group's BOM
const systemCost = computed(() => {
  // First check if we have the cost from existing proposal (edit mode)
  if (existingProposal.value?.selected_bom?.total_cost) {
    return existingProposal.value.selected_bom.total_cost
  }

  // Otherwise, try to get from the selected variant group in frontend data
  if (form.value.variant_group_id) {
    const selectedGroup = variantGroups.value.find(
      (vg: BomVariantGroup) => vg.id === form.value.variant_group_id
    )
    if (selectedGroup?.boms?.length) {
      // If a specific BOM is selected, use its cost
      if (form.value.selected_bom_id) {
        const selectedBom = selectedGroup.boms.find(b => b.id === form.value.selected_bom_id)
        if (selectedBom) return selectedBom.total_cost
      }
      // Otherwise use the primary BOM's cost
      const primaryBom = selectedGroup.boms.find(b => b.is_primary_variant) || selectedGroup.boms[0]
      if (primaryBom) return primaryBom.total_cost
    }
  }

  return 0
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
  <div class="max-w-6xl mx-auto">
    <!-- Premium Header -->
    <div class="relative mb-8 overflow-hidden">
      <!-- Background decoration -->
      <div class="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-yellow-500/5 dark:from-orange-500/10 dark:via-amber-500/10 dark:to-yellow-500/10 rounded-2xl" />
      <div class="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-orange-400/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div class="relative px-6 py-8 sm:px-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/30">
                <Sun class="w-5 h-5 text-white" />
              </div>
              <h1 class="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
                {{ pageTitle }}
              </h1>
            </div>
            <p class="text-slate-600 dark:text-slate-400 max-w-xl">
              Design a comprehensive solar investment proposal with detailed financial projections
            </p>
          </div>

          <!-- Quick Stats Preview (shows when data available) -->
          <div v-if="form.system_capacity_kwp && firstYearSavings" class="flex items-center gap-3">
            <div class="hidden sm:block text-right">
              <div class="text-xs text-slate-500 dark:text-slate-400">Est. Annual Savings</div>
              <div class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(firstYearSavings) }}</div>
            </div>
            <div class="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            <div class="hidden sm:block text-right">
              <div class="text-xs text-slate-500 dark:text-slate-400">System Size</div>
              <div class="text-lg font-bold text-orange-600 dark:text-orange-400">{{ form.system_capacity_kwp }} kWp</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Premium Step Indicator -->
    <div class="mb-10 px-4">
      <WizardStepIndicator
        :steps="steps"
        :current-step="currentStep"
        @go-to-step="goToStep"
      />
    </div>

    <!-- Loading state -->
    <div v-if="isLoadingProposal && isEditMode" class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto" />
      <p class="mt-2 text-sm text-slate-500">Loading proposal...</p>
    </div>

    <!-- Step Content -->
    <form v-else @submit.prevent="handleSubmit">
      <!-- Step 1: Site & Customer Information -->
      <div v-show="currentStep === 1" class="space-y-6">
        <!-- Customer Selection Card -->
        <Card>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                <Building2 class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Customer Information</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">Select the client for this proposal</p>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Customer" required :error="errors.contact_id" class="md:col-span-2">
              <Select
                v-model="form.contact_id"
                :options="contactOptions"
                placeholder="Select a customer..."
                :error="!!errors.contact_id"
              />
            </FormField>

            <FormField label="Site Name" required :error="errors.site_name">
              <Input
                v-model="form.site_name"
                placeholder="e.g., Main Office Building"
                :error="!!errors.site_name"
              />
            </FormField>

            <FormField label="Site Address" :error="errors.site_address">
              <Input
                v-model="form.site_address"
                placeholder="Full address (optional)"
                :error="!!errors.site_address"
              />
            </FormField>
          </div>
        </Card>

        <!-- Location Map Card -->
        <Card>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <MapPin class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Installation Location</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">Pin the site and draw roof boundaries for solar data</p>
              </div>
            </div>
          </template>

          <div class="space-y-4">
            <LocationMapPicker
              v-model="locationData"
              :show-draw-tools="true"
              @solar-data-loaded="onSolarDataLoaded"
            />
            <div v-if="errors.province || errors.city" class="text-sm text-red-600 dark:text-red-400">
              Please select a location on the map
            </div>

            <!-- Solar Data Preview -->
            <div v-if="solarData" class="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div class="text-center">
                <Sun class="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <div class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ solarData.peak_sun_hours }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Peak Sun Hours</div>
              </div>
              <div class="text-center">
                <Zap class="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <div class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ solarData.solar_irradiance_kwh_m2_day }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">kWh/m²/day</div>
              </div>
              <div class="text-center">
                <Gauge class="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <div class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ solarData.optimal_tilt_angle }}°</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Optimal Tilt</div>
              </div>
              <div class="text-center">
                <MapPin class="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <div class="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{{ form.city }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400">Location</div>
              </div>
            </div>
          </div>
        </Card>

        <!-- Roof Configuration Card -->
        <Card>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Building2 class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Roof Configuration</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">Specify roof characteristics for accurate calculations</p>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField v-if="!form.roof_polygon" label="Roof Area (m²)" hint="Or draw on map">
              <Input
                v-model.number="form.roof_area_m2"
                type="number"
                placeholder="e.g., 100"
                min="0"
              />
            </FormField>
            <div v-else class="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div class="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Measured Area</div>
              <div class="text-xl font-bold text-emerald-700 dark:text-emerald-300">{{ form.roof_area_m2?.toFixed(1) }} m²</div>
            </div>

            <FormField label="Roof Type">
              <Select v-model="form.roof_type" :options="roofTypeOptions" />
            </FormField>

            <FormField label="Orientation">
              <Select v-model="form.roof_orientation" :options="orientationOptions" />
            </FormField>

            <FormField label="Tilt (degrees)">
              <Input v-model.number="form.roof_tilt_degrees" type="number" min="0" max="90" />
            </FormField>

            <FormField label="Shading (%)" hint="Shadow impact">
              <Input v-model.number="form.shading_percentage" type="number" min="0" max="100" />
            </FormField>
          </div>
        </Card>
      </div>

      <!-- Step 2: Electricity Profile -->
      <div v-show="currentStep === 2" class="space-y-6">
        <!-- Consumption Input Card -->
        <Card>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                <Zap class="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Electricity Consumption</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">Enter current electricity usage from PLN bill</p>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Monthly Consumption"
              required
              :error="errors.monthly_consumption_kwh"
              hint="Check your PLN bill for kWh usage"
            >
              <div class="relative">
                <Input
                  v-model.number="form.monthly_consumption_kwh"
                  type="number"
                  placeholder="e.g., 1500"
                  min="0"
                  :error="!!errors.monthly_consumption_kwh"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">kWh/mo</span>
              </div>
            </FormField>

            <FormField label="PLN Tariff Category" required :error="errors.pln_tariff_category">
              <Select
                v-model="form.pln_tariff_category"
                :options="tariffOptions"
                placeholder="Select tariff..."
                :error="!!errors.pln_tariff_category"
              />
            </FormField>

            <FormField
              label="Electricity Rate"
              required
              :error="errors.electricity_rate"
              hint="Auto-filled from tariff"
            >
              <div class="relative">
                <Input
                  v-model.number="form.electricity_rate"
                  type="number"
                  placeholder="e.g., 1444"
                  min="0"
                  :error="!!errors.electricity_rate"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Rp/kWh</span>
              </div>
            </FormField>

            <FormField
              label="Annual Rate Escalation"
              hint="Expected yearly increase"
            >
              <div class="relative">
                <Input
                  v-model.number="form.tariff_escalation_percent"
                  type="number"
                  min="0"
                  max="20"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%/year</span>
              </div>
            </FormField>
          </div>
        </Card>

        <!-- Current Bill Analysis -->
        <div v-if="form.monthly_consumption_kwh && form.electricity_rate" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            label="Current Monthly Bill"
            :value="formatCurrency(form.monthly_consumption_kwh * form.electricity_rate)"
            sub-value="Before solar installation"
            variant="warning"
            :icon="DollarSign"
          />
          <StatsCard
            label="Annual Electricity Cost"
            :value="formatCurrency(form.monthly_consumption_kwh * form.electricity_rate * 12)"
            sub-value="Total yearly expense"
            variant="warning"
            :icon="Calendar"
          />
          <StatsCard
            label="Annual Consumption"
            :value="`${formatNumber(form.monthly_consumption_kwh * 12)} kWh`"
            sub-value="Total yearly usage"
            variant="info"
            :icon="Zap"
          />
        </div>

        <!-- Bill Projection Notice -->
        <div v-if="form.monthly_consumption_kwh && form.electricity_rate && form.tariff_escalation_percent" class="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <div class="flex items-start gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex-shrink-0">
              <TrendingUp class="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h4 class="font-semibold text-red-800 dark:text-red-300">Without Solar: Rising Costs</h4>
              <p class="text-sm text-red-600 dark:text-red-400 mt-1">
                With {{ form.tariff_escalation_percent }}% annual rate increase, your electricity bill will be
                <span class="font-bold">{{ formatCurrency(form.monthly_consumption_kwh * form.electricity_rate * Math.pow(1 + form.tariff_escalation_percent / 100, 5)) }}/month</span>
                in 5 years and
                <span class="font-bold">{{ formatCurrency(form.monthly_consumption_kwh * form.electricity_rate * Math.pow(1 + form.tariff_escalation_percent / 100, 10)) }}/month</span>
                in 10 years.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: System Selection - Investment Dashboard -->
      <div v-show="currentStep === 3" class="space-y-6">
        <!-- System Configuration Card -->
        <Card>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                <Sun class="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Solar System Configuration</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">Define system capacity and select equipment package</p>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Capacity Input with Calculator -->
            <div class="lg:col-span-2 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="System Capacity" required :error="errors.system_capacity_kwp">
                  <div class="flex gap-2">
                    <div class="relative flex-1">
                      <Input
                        v-model.number="form.system_capacity_kwp"
                        type="number"
                        placeholder="e.g., 50.0"
                        min="0"
                        step="0.5"
                        :error="!!errors.system_capacity_kwp"
                      />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">kWp</span>
                    </div>
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
                </FormField>

                <FormField label="Performance Ratio" hint="Typical: 0.75-0.85">
                  <Input
                    v-model.number="form.performance_ratio"
                    type="number"
                    min="0.5"
                    max="1"
                    step="0.01"
                  />
                </FormField>
              </div>

              <!-- Recommended Capacity Banner -->
              <div v-if="recommendedCapacity" class="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div class="flex items-center gap-3">
                  <Sparkles class="w-5 h-5 text-emerald-500" />
                  <div>
                    <span class="text-sm text-emerald-700 dark:text-emerald-300">
                      AI Recommended: <span class="font-bold">{{ recommendedCapacity }} kWp</span>
                    </span>
                    <span class="text-xs text-emerald-600 dark:text-emerald-400 ml-2">(100% consumption offset)</span>
                  </div>
                </div>
                <Button
                  v-if="form.system_capacity_kwp !== recommendedCapacity"
                  variant="success"
                  size="sm"
                  type="button"
                  @click="form.system_capacity_kwp = recommendedCapacity"
                >
                  Apply
                </Button>
              </div>

              <!-- BOM Package Selection -->
              <FormField label="Equipment Package" hint="Select pre-configured system components">
                <Select
                  v-model="form.variant_group_id"
                  :options="variantGroupOptions"
                  placeholder="Select equipment package..."
                />
              </FormField>
            </div>

            <!-- System Preview Card -->
            <div v-if="form.system_capacity_kwp" class="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
              <div class="text-center mb-4">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg shadow-orange-500/30 mb-3">
                  <Battery class="w-8 h-8 text-white" />
                </div>
                <div class="text-3xl font-bold text-slate-900 dark:text-slate-100">{{ form.system_capacity_kwp }} kWp</div>
                <div class="text-sm text-slate-500 dark:text-slate-400">System Capacity</div>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-500 dark:text-slate-400">Est. Panels</span>
                  <span class="font-medium text-slate-900 dark:text-slate-100">~{{ Math.ceil((form.system_capacity_kwp || 0) / 0.55) }} units</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500 dark:text-slate-400">Roof Area Needed</span>
                  <span class="font-medium text-slate-900 dark:text-slate-100">~{{ Math.ceil((form.system_capacity_kwp || 0) * 6) }} m²</span>
                </div>
                <div v-if="systemCost" class="pt-2 mt-2 border-t border-slate-200 dark:border-slate-700">
                  <div class="flex justify-between">
                    <span class="text-slate-500 dark:text-slate-400">Investment</span>
                    <span class="font-bold text-orange-600 dark:text-orange-400">{{ formatCurrency(systemCost) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <!-- Production Metrics -->
        <div v-if="form.system_capacity_kwp && form.peak_sun_hours" class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            label="Annual Production"
            :value="`${formatNumber(annualProduction)} kWh`"
            sub-value="Estimated yearly output"
            variant="warning"
            :icon="Sun"
          />
          <StatsCard
            label="Monthly Production"
            :value="`${formatNumber(monthlyProduction)} kWh`"
            sub-value="Average per month"
            variant="info"
            :icon="Zap"
          />
          <StatsCard
            :label="solarOffsetFormatted.label"
            :value="solarOffsetFormatted.value"
            :sub-value="solarOffsetFormatted.isSurplus ? 'Energy surplus!' : 'Of consumption'"
            :variant="solarOffsetFormatted.isSurplus ? 'success' : 'default'"
            :icon="Gauge"
          />
          <StatsCard
            label="First Year Savings"
            :value="formatCurrency(firstYearSavings)"
            sub-value="Year 1 estimate"
            variant="success"
            :icon="TrendingUp"
          />
        </div>

        <!-- Investment Dashboard -->
        <div v-if="yearlyProjections.length > 0" class="space-y-6">
          <!-- Dashboard Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/30">
                <TrendingUp class="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100">Investment Analysis</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">25-year financial projection</p>
              </div>
            </div>
          </div>

          <!-- Key Investment Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label="Total 25-Year Savings"
              :value="formatCurrency(totalLifetimeSavings)"
              sub-value="Lifetime value"
              variant="highlight"
              size="lg"
              :icon="DollarSign"
            />
            <StatsCard
              label="Payback Period"
              :value="paybackPeriod ? `${paybackPeriod} years` : (systemCost ? '> 25 years' : 'Select BOM')"
              :sub-value="paybackPeriod ? 'Return on investment' : 'Configure system'"
              :variant="paybackPeriod && paybackPeriod <= 5 ? 'success' : 'default'"
              size="lg"
              :icon="Calendar"
            />
            <StatsCard
              v-if="systemCost && totalLifetimeSavings"
              label="ROI"
              :value="`${Math.round((totalLifetimeSavings - systemCost) / systemCost * 100)}%`"
              sub-value="25-year return"
              variant="success"
              size="lg"
              :icon="TrendingUp"
            />
            <StatsCard
              label="Environmental Impact"
              :value="`${formatNumber(annualProduction * 0.0007 * 25)} tons`"
              sub-value="CO₂ offset (25 years)"
              variant="success"
              size="lg"
              :icon="Leaf"
            />
          </div>

          <!-- Charts Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Payback Period Chart -->
            <Card>
              <template #header>
                <div class="flex items-center justify-between">
                  <h4 class="font-semibold text-slate-900 dark:text-slate-100">Break-Even Analysis</h4>
                  <span v-if="paybackPeriod" class="text-xs font-medium px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full">
                    {{ paybackPeriod }} years payback
                  </span>
                </div>
              </template>
              <LineChart
                :labels="paybackChartData.labels"
                :datasets="paybackChartData.datasets"
                :height="280"
              />
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
                Green area: cumulative savings · Red line: investment cost
              </p>
            </Card>

            <!-- Monthly Bill Impact Chart -->
            <Card>
              <template #header>
                <h4 class="font-semibold text-slate-900 dark:text-slate-100">Monthly Bill Transformation</h4>
              </template>
              <BarChart
                :labels="monthlyBillChartData.labels"
                :datasets="monthlyBillChartData.datasets"
                :height="280"
              />
              <div v-if="form.monthly_consumption_kwh && form.electricity_rate" class="mt-4 grid grid-cols-3 gap-3">
                <div class="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div class="text-lg font-bold text-red-600 dark:text-red-400">{{ formatCurrency(form.monthly_consumption_kwh * form.electricity_rate) }}</div>
                  <div class="text-xs text-red-500 dark:text-red-400">Current Bill</div>
                </div>
                <div class="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <div class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(Math.max(0, (form.monthly_consumption_kwh - monthlyProduction) * form.electricity_rate)) }}</div>
                  <div class="text-xs text-emerald-500 dark:text-emerald-400">After Solar</div>
                </div>
                <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ formatCurrency(monthlyProduction * form.electricity_rate) }}</div>
                  <div class="text-xs text-blue-500 dark:text-blue-400">Monthly Savings</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <!-- Step 4: Review & Submit - Executive Summary -->
      <div v-show="currentStep === 4" class="space-y-6">
        <!-- Success Header Banner -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-6 text-white">
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          <div class="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="flex items-center justify-center w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm">
                <Sparkles class="w-7 h-7" />
              </div>
              <div>
                <h2 class="text-2xl font-bold">Proposal Ready for Review</h2>
                <p class="text-emerald-100 mt-1">All calculations complete. Review details before submission.</p>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <div class="text-right">
                <div class="text-emerald-100 text-xs uppercase tracking-wider">Total Investment</div>
                <div class="text-2xl font-bold">{{ systemCost ? formatCurrency(systemCost) : 'Not configured' }}</div>
              </div>
              <div class="w-px h-12 bg-white/30" />
              <div class="text-right">
                <div class="text-emerald-100 text-xs uppercase tracking-wider">25-Year Return</div>
                <div class="text-2xl font-bold">{{ formatCurrency(totalLifetimeSavings) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Key Metrics Highlights -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            label="System Capacity"
            :value="`${form.system_capacity_kwp || 0} kWp`"
            sub-value="Solar installation size"
            variant="warning"
            :icon="Sun"
          />
          <StatsCard
            label="Annual Production"
            :value="`${formatNumber(annualProduction)} kWh`"
            sub-value="Yearly energy output"
            variant="info"
            :icon="Zap"
          />
          <StatsCard
            label="Payback Period"
            :value="paybackPeriod ? `${paybackPeriod} years` : 'N/A'"
            sub-value="Investment recovery"
            :variant="paybackPeriod && paybackPeriod <= 5 ? 'success' : 'default'"
            :icon="Calendar"
          />
          <StatsCard
            label="First Year Savings"
            :value="formatCurrency(firstYearSavings)"
            sub-value="Year 1 estimate"
            variant="success"
            :icon="TrendingUp"
          />
        </div>

        <!-- Detailed Summary Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Customer & Site Card -->
          <Card>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                  <Building2 class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 class="font-semibold text-slate-900 dark:text-slate-100">Customer & Site</h3>
              </div>
            </template>

            <div class="space-y-4">
              <!-- Customer Info -->
              <div class="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {{ contacts.find((c: Contact) => c.id === form.contact_id)?.name?.charAt(0) || '?' }}
                </div>
                <div>
                  <div class="font-medium text-slate-900 dark:text-slate-100">
                    {{ contacts.find((c: Contact) => c.id === form.contact_id)?.name || 'No customer selected' }}
                  </div>
                  <div class="text-sm text-slate-500 dark:text-slate-400">
                    {{ contacts.find((c: Contact) => c.id === form.contact_id)?.code || '' }}
                  </div>
                </div>
              </div>

              <!-- Site Details -->
              <dl class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Site Name</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ form.site_name || '-' }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Location</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ form.city }}, {{ form.province }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Roof Type</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100 capitalize">{{ form.roof_type }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Roof Area</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ form.roof_area_m2 ? `${form.roof_area_m2} m²` : '-' }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Orientation</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100 capitalize">{{ form.roof_orientation }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Tilt Angle</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ form.roof_tilt_degrees }}°</dd>
                </div>
              </dl>
            </div>
          </Card>

          <!-- Electricity Profile Card -->
          <Card>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                  <Zap class="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 class="font-semibold text-slate-900 dark:text-slate-100">Electricity Profile</h3>
              </div>
            </template>

            <div class="space-y-4">
              <dl class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Monthly Consumption</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatNumber(form.monthly_consumption_kwh || 0) }} kWh</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Annual Consumption</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatNumber((form.monthly_consumption_kwh || 0) * 12) }} kWh</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">PLN Tariff</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ form.pln_tariff_category || '-' }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Electricity Rate</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatCurrency(form.electricity_rate || 0) }}/kWh</dd>
                </div>
              </dl>

              <!-- Current vs After Solar Comparison -->
              <div class="mt-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl">
                <div class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Monthly Bill Comparison</div>
                <div class="flex items-center justify-between gap-4">
                  <div class="text-center flex-1">
                    <div class="text-lg font-bold text-red-600 dark:text-red-400">
                      {{ formatCurrency((form.monthly_consumption_kwh || 0) * (form.electricity_rate || 0)) }}
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">Before Solar</div>
                  </div>
                  <ArrowRight class="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div class="text-center flex-1">
                    <div class="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {{ formatCurrency(Math.max(0, ((form.monthly_consumption_kwh || 0) - monthlyProduction) * (form.electricity_rate || 0))) }}
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400">After Solar</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <!-- Solar System Card -->
          <Card>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                  <Sun class="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 class="font-semibold text-slate-900 dark:text-slate-100">Solar System</h3>
              </div>
            </template>

            <div class="space-y-4">
              <dl class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">System Capacity</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ form.system_capacity_kwp }} kWp</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Est. Panel Count</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">~{{ Math.ceil((form.system_capacity_kwp || 0) / 0.55) }} units</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Annual Production</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatNumber(annualProduction) }} kWh</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Monthly Production</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ formatNumber(monthlyProduction) }} kWh</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Peak Sun Hours</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ form.peak_sun_hours }} hrs/day</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Performance Ratio</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ (form.performance_ratio * 100).toFixed(0) }}%</dd>
                </div>
              </dl>

              <!-- Solar Offset Badge -->
              <div class="p-4 rounded-xl" :class="solarOffsetFormatted.isSurplus ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30' : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30'">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm" :class="solarOffsetFormatted.isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'">{{ solarOffsetFormatted.label }}</div>
                    <div class="text-2xl font-bold" :class="solarOffsetFormatted.isSurplus ? 'text-emerald-700 dark:text-emerald-300' : 'text-blue-700 dark:text-blue-300'">{{ solarOffsetFormatted.value }}</div>
                  </div>
                  <Gauge class="w-8 h-8" :class="solarOffsetFormatted.isSurplus ? 'text-emerald-500' : 'text-blue-500'" />
                </div>
              </div>
            </div>
          </Card>

          <!-- Financial Summary Card -->
          <Card>
            <template #header>
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                  <DollarSign class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 class="font-semibold text-slate-900 dark:text-slate-100">Financial Summary</h3>
              </div>
            </template>

            <div class="space-y-4">
              <dl class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Investment</dt>
                  <dd class="font-medium text-slate-900 dark:text-slate-100">{{ systemCost ? formatCurrency(systemCost) : 'Not set' }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">Payback Period</dt>
                  <dd class="font-medium" :class="paybackPeriod && paybackPeriod <= 5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'">
                    {{ paybackPeriod ? `${paybackPeriod} years` : 'N/A' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">First Year Savings</dt>
                  <dd class="font-medium text-emerald-600 dark:text-emerald-400">{{ formatCurrency(firstYearSavings) }}</dd>
                </div>
                <div>
                  <dt class="text-slate-500 dark:text-slate-400">25-Year Savings</dt>
                  <dd class="font-medium text-emerald-600 dark:text-emerald-400">{{ formatCurrency(totalLifetimeSavings) }}</dd>
                </div>
              </dl>

              <!-- ROI Highlight -->
              <div v-if="systemCost && totalLifetimeSavings" class="p-4 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl text-white">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-emerald-100 text-xs uppercase tracking-wider">25-Year Return on Investment</div>
                    <div class="text-3xl font-bold">{{ Math.round((totalLifetimeSavings - systemCost) / systemCost * 100) }}%</div>
                  </div>
                  <TrendingUp class="w-10 h-10 text-white/50" />
                </div>
              </div>

              <!-- Environmental Impact -->
              <div class="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <div class="flex items-center gap-3">
                  <Leaf class="w-6 h-6 text-green-500" />
                  <div>
                    <div class="text-sm text-green-700 dark:text-green-300 font-medium">Environmental Impact</div>
                    <div class="text-xs text-green-600 dark:text-green-400">
                      {{ formatNumber(annualProduction * 0.0007 * 25) }} tons CO₂ offset over 25 years
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <!-- Proposal Settings -->
        <Card>
          <template #header>
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Calendar class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 dark:text-slate-100">Proposal Settings</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">Set validity and add notes</p>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Proposal Valid Until" required :error="errors.valid_until">
              <Input
                v-model="form.valid_until"
                type="date"
                :error="!!errors.valid_until"
              />
            </FormField>

            <FormField label="Additional Notes" hint="Optional comments for this proposal">
              <Textarea
                v-model="form.notes"
                placeholder="Add any special terms, conditions, or notes for the customer..."
                :rows="3"
              />
            </FormField>
          </div>
        </Card>
      </div>

      <!-- Navigation Buttons -->
      <div class="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <!-- Left Side: Back/Cancel -->
          <div>
            <Button
              v-if="currentStep > 1"
              variant="outline"
              @click="prevStep"
              class="gap-2"
            >
              <ChevronLeft class="w-4 h-4" />
              Previous Step
            </Button>
            <Button
              v-else
              variant="ghost"
              @click="router.push('/solar-proposals')"
            >
              Cancel
            </Button>
          </div>

          <!-- Right Side: Save Draft + Next/Submit -->
          <div class="flex items-center gap-3">
            <Button
              variant="ghost"
              @click="handleSaveAsDraft"
              :loading="isSubmitting"
              class="gap-2"
            >
              <Save class="w-4 h-4" />
              <span class="hidden sm:inline">Save as Draft</span>
              <span class="sm:hidden">Draft</span>
            </Button>

            <Button
              v-if="currentStep < totalSteps"
              @click="nextStep"
              class="gap-2 min-w-[140px]"
            >
              Continue
              <ArrowRight class="w-4 h-4" />
            </Button>
            <Button
              v-else
              type="submit"
              :loading="isSubmitting"
              class="gap-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/30"
            >
              <Send class="w-4 h-4" />
              {{ isEditMode ? 'Update Proposal' : 'Create Proposal' }}
            </Button>
          </div>
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
