<script setup lang="ts">
/**
 * Electrical-panel-only Target Brand card on Create BOM from Template wizard.
 * Core page gates with electrical_panel and owns brand coverage logic.
 */
import { Card, FormField, Select } from '@/components/ui'
import { AlertTriangle, Palette } from 'lucide-vue-next'

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

interface AvailableBrand {
  code: string
  name: string
  coverage_percent: number
}

interface BrandCoverage {
  name: string
  coverage_percent: number
}

withDefaults(
  defineProps<{
    modelValue: string
    brandOptions: Option[]
    loading?: boolean
    availableBrands?: AvailableBrand[] | null
    isLowCoverageBrand?: boolean
    selectedBrandCoverage?: BrandCoverage | null
    lowCoverageThreshold?: number
  }>(),
  {
    loading: false,
    availableBrands: null,
    isLowCoverageBrand: false,
    selectedBrandCoverage: null,
    lowCoverageThreshold: 30,
  },
)

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <Card>
    <template #header>
      <div class="flex items-center gap-2">
        <Palette class="w-5 h-5 text-purple-500" />
        <h2 class="font-medium text-slate-900 dark:text-slate-100">Target Brand (Optional)</h2>
      </div>
    </template>

    <div class="space-y-4">
      <FormField
        label="Preferred Brand"
        hint="Components will be resolved to this brand where possible"
      >
        <Select
          :model-value="modelValue"
          :options="brandOptions"
          :loading="loading"
          @update:model-value="$emit('update:modelValue', String($event ?? ''))"
        />
      </FormField>

      <!-- Low Coverage Warning (P1) -->
      <div
        v-if="isLowCoverageBrand"
        class="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg"
      >
        <AlertTriangle class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div class="text-sm">
          <p class="font-medium text-amber-800 dark:text-amber-200">Low Coverage Warning</p>
          <p class="text-amber-700 dark:text-amber-300">
            {{ selectedBrandCoverage?.name }} only covers {{ selectedBrandCoverage?.coverage_percent }}% of components.
            Many items may not have mappings for this brand.
          </p>
        </div>
      </div>

      <!-- Brand Coverage Info -->
      <div v-if="availableBrands && availableBrands.length > 0" class="text-sm text-slate-500 dark:text-slate-400">
        <p class="mb-2">Available brands for this template:</p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="brand in availableBrands"
            :key="brand.code"
            class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs"
            :class="brand.coverage_percent < lowCoverageThreshold
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-slate-700'"
          >
            {{ brand.name }}
            <span :class="brand.coverage_percent < lowCoverageThreshold ? '' : 'text-slate-400 dark:text-slate-500'">
              ({{ brand.coverage_percent }}%)
            </span>
          </span>
        </div>
      </div>
    </div>
  </Card>
</template>
