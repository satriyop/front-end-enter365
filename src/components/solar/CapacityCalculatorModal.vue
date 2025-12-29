<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import FormField from '@/components/ui/FormField.vue'
import { formatNumber } from '@/utils/format'
import { Calculator, Zap, Sun, TrendingUp } from 'lucide-vue-next'

interface Props {
  open: boolean
  /** Pre-fill monthly consumption */
  monthlyConsumption?: number
  /** Pre-fill peak sun hours from location */
  peakSunHours?: number
  /** Pre-fill performance ratio */
  performanceRatio?: number
}

const props = withDefaults(defineProps<Props>(), {
  monthlyConsumption: undefined,
  peakSunHours: 4.5,
  performanceRatio: 0.8,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'apply': [capacity: number]
}>()

// Local form state
const consumption = ref(props.monthlyConsumption || 0)
const psh = ref(props.peakSunHours)
const pr = ref(props.performanceRatio)
const targetOffset = ref(100) // Default 100% offset

// Sync props when modal opens
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    consumption.value = props.monthlyConsumption || consumption.value || 0
    psh.value = props.peakSunHours || 4.5
    pr.value = props.performanceRatio || 0.8
  }
})

// Calculations
const annualConsumption = computed(() => consumption.value * 12)

const yieldPerKwp = computed(() => psh.value * 365 * pr.value)

const recommendedCapacity = computed(() => {
  if (!consumption.value || !psh.value || !pr.value) return 0
  const raw = (annualConsumption.value * (targetOffset.value / 100)) / yieldPerKwp.value
  return Math.round(raw * 2) / 2 // Round to 0.5 kWp
})

const annualProduction = computed(() => recommendedCapacity.value * yieldPerKwp.value)

const monthlyProduction = computed(() => annualProduction.value / 12)

const actualOffset = computed(() => {
  if (!annualConsumption.value) return 0
  return (annualProduction.value / annualConsumption.value) * 100
})

// Quick offset presets
const offsetPresets = [
  { value: 50, label: '50%' },
  { value: 75, label: '75%' },
  { value: 100, label: '100%' },
  { value: 120, label: '120%' },
]

function handleApply() {
  if (recommendedCapacity.value > 0) {
    emit('apply', recommendedCapacity.value)
    emit('update:open', false)
  }
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="open"
    title="Capacity Calculator"
    size="md"
    @update:open="$emit('update:open', $event)"
  >
    <template #icon>
      <Calculator class="w-5 h-5" />
    </template>

    <div class="space-y-6">
      <!-- Input Section -->
      <div class="grid grid-cols-2 gap-4">
        <FormField label="Monthly Consumption" hint="kWh/month">
          <Input
            v-model.number="consumption"
            type="number"
            placeholder="e.g., 1500"
            min="0"
            :leading-icon="Zap"
          />
        </FormField>

        <FormField label="Peak Sun Hours" hint="Hours/day (location-based)">
          <Input
            v-model.number="psh"
            type="number"
            placeholder="4.5"
            min="1"
            max="8"
            step="0.1"
            :leading-icon="Sun"
          />
        </FormField>
      </div>

      <!-- Target Offset -->
      <FormField label="Target Offset">
        <div class="space-y-2">
          <div class="flex gap-2">
            <button
              v-for="preset in offsetPresets"
              :key="preset.value"
              type="button"
              class="flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all"
              :class="targetOffset === preset.value
                ? 'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-400'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'"
              @click="targetOffset = preset.value"
            >
              {{ preset.label }}
            </button>
          </div>
          <input
            v-model.number="targetOffset"
            type="range"
            min="25"
            max="150"
            step="5"
            class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
          />
          <div class="text-center text-sm text-slate-500 dark:text-slate-400">
            {{ targetOffset }}% of consumption
          </div>
        </div>
      </FormField>

      <!-- Results Card -->
      <div v-if="consumption > 0" class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
        <div class="text-center mb-4">
          <div class="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
            Recommended System Size
          </div>
          <div class="text-4xl font-bold text-green-700 dark:text-green-300">
            {{ recommendedCapacity }} <span class="text-xl">kWp</span>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2">
            <div class="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {{ formatNumber(Math.round(annualProduction)) }}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">kWh/year</div>
          </div>
          <div class="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2">
            <div class="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {{ formatNumber(Math.round(monthlyProduction)) }}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">kWh/month</div>
          </div>
          <div class="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2">
            <div class="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {{ actualOffset.toFixed(0) }}%
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400">Offset</div>
          </div>
        </div>

        <!-- Formula explanation -->
        <div class="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
          <details class="text-xs text-green-700 dark:text-green-400">
            <summary class="cursor-pointer hover:text-green-800 dark:hover:text-green-300">
              How is this calculated?
            </summary>
            <div class="mt-2 p-2 bg-white/50 dark:bg-slate-800/50 rounded text-slate-600 dark:text-slate-400 font-mono">
              <div>Annual Yield = {{ psh }} PSH × 365 days × {{ pr }} PR</div>
              <div>= {{ formatNumber(Math.round(yieldPerKwp)) }} kWh/kWp/year</div>
              <div class="mt-1">kWp = ({{ formatNumber(consumption) }} × 12 × {{ targetOffset }}%) / {{ formatNumber(Math.round(yieldPerKwp)) }}</div>
              <div>= {{ recommendedCapacity }} kWp</div>
            </div>
          </details>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8 text-slate-500 dark:text-slate-400">
        <TrendingUp class="w-12 h-12 mx-auto mb-2 opacity-30" />
        <p>Enter consumption to calculate recommended capacity</p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button variant="ghost" @click="handleClose">Cancel</Button>
        <Button
          :disabled="recommendedCapacity <= 0"
          @click="handleApply"
        >
          Apply {{ recommendedCapacity }} kWp
        </Button>
      </div>
    </template>
  </Modal>
</template>
