<script setup lang="ts">
import { computed, ref, watch, useAttrs } from 'vue'
import { cn } from '@/utils/cn'

type InputSize = 'sm' | 'md' | 'lg'

interface Props {
  modelValue?: number | null
  size?: InputSize
  error?: boolean
  disabled?: boolean
  currency?: string
  min?: number
  max?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  size: 'md',
  error: false,
  disabled: false,
  currency: 'Rp',
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

// Internal display value (formatted string)
const displayValue = ref('')
const isFocused = ref(false)

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-8 text-sm px-3',
  md: 'h-10 text-sm px-3',
  lg: 'h-12 text-base px-4',
}

const inputClasses = computed(() =>
  cn(
    'flex-1 w-full rounded-r-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 transition-colors duration-150 text-right tabular-nums min-w-0',
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
    'focus:outline-none focus:ring-1',
    sizeClasses[props.size],
    // State: default
    !props.error && !props.disabled && 'border-slate-300 dark:border-slate-600 focus:border-orange-500 focus:ring-orange-500',
    // State: error
    props.error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
    // State: disabled
    props.disabled && 'bg-slate-50 dark:bg-slate-900 cursor-not-allowed text-slate-500 dark:text-slate-400'
  )
)

const addonClasses = computed(() =>
  cn(
    'inline-flex items-center border border-r-0 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-l-sm',
    sizeClasses[props.size],
    props.error ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'
  )
)

/**
 * Format number to Indonesian currency format
 * e.g., 1250000 -> "1.250.000"
 */
function formatNumber(value: number | null): string {
  if (value === null || value === undefined || isNaN(value)) {
    return ''
  }
  return value.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/**
 * Parse formatted string back to number
 * e.g., "1.250.000" -> 1250000
 */
function parseNumber(value: string): number | null {
  if (!value || value.trim() === '') {
    return null
  }
  // Remove thousand separators (dots for Indonesian format)
  const cleanValue = value.replace(/\./g, '').replace(/,/g, '.')
  const parsed = parseFloat(cleanValue)
  return isNaN(parsed) ? null : Math.round(parsed)
}

// Sync display value with model value
watch(
  () => props.modelValue,
  (newValue) => {
    if (!isFocused.value) {
      displayValue.value = formatNumber(newValue)
    }
  },
  { immediate: true }
)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const cleanValue = target.value.replace(/[^\d.]/g, '')
  
  if (target.value !== cleanValue) {
    target.value = cleanValue
  }
  
  displayValue.value = cleanValue
  emit('update:modelValue', parseNumber(cleanValue))
}

function handleBlur(event: Event) {
  isFocused.value = false
  const target = event.target as HTMLInputElement
  let value = parseNumber(target.value)

  // Apply min/max constraints
  if (value !== null) {
    if (props.min !== undefined && value < props.min) {
      value = props.min
    }
    if (props.max !== undefined && value > props.max) {
      value = props.max
    }
  }

  displayValue.value = formatNumber(value)
  emit('update:modelValue', value)
}

function handleFocus(event: Event) {
  isFocused.value = true
  const target = event.target as HTMLInputElement
  // Select all text on focus for easy replacement
  target.select()
}
</script>

<template>
  <div class="flex w-full">
    <!-- Currency prefix -->
    <span :class="addonClasses">
      {{ currency }}
    </span>

    <!-- Input field -->
    <input
      type="text"
      inputmode="numeric"
      :value="displayValue"
      :disabled="disabled"
      :class="inputClasses"
      v-bind="attrs"
      @input="handleInput"
      @blur="handleBlur"
      @focus="handleFocus"
    />
  </div>
</template>
