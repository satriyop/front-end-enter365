<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/utils/cn'

type SelectSize = 'sm' | 'md' | 'lg'

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  modelValue?: string | number | null
  options: Option[]
  placeholder?: string
  size?: SelectSize
  error?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Select an option',
  size: 'md',
  error: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const attrs = useAttrs()

const sizeClasses: Record<SelectSize, string> = {
  sm: 'h-8 text-sm pl-3 pr-8',
  md: 'h-10 text-sm pl-3 pr-10',
  lg: 'h-12 text-base pl-4 pr-12',
}

const selectClasses = computed(() =>
  cn(
    'w-full rounded-sm border bg-white appearance-none transition-colors duration-150',
    'focus:outline-none focus:ring-1',
    // Background arrow
    'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236B7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")]',
    'bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat',
    // Size
    sizeClasses[props.size],
    // State: default
    !props.error && !props.disabled && 'border-slate-300 focus:border-orange-500 focus:ring-orange-500',
    // State: error
    props.error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
    // State: disabled
    props.disabled && 'bg-slate-50 cursor-not-allowed text-slate-500'
  )
)

function handleChange(event: Event) {
  const target = event.target as HTMLSelectElement
  const value = target.value === '' ? null : target.value
  emit('update:modelValue', value)
}
</script>

<template>
  <select
    :value="modelValue ?? ''"
    :disabled="disabled"
    :class="selectClasses"
    v-bind="attrs"
    @change="handleChange"
  >
    <option value="" disabled>
      {{ placeholder }}
    </option>
    <option
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :disabled="option.disabled"
    >
      {{ option.label }}
    </option>
  </select>
</template>
