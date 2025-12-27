<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/utils/cn'

type InputSize = 'sm' | 'md' | 'lg'

interface Props {
  modelValue?: string | number
  size?: InputSize
  error?: boolean
  disabled?: boolean
  leadingAddon?: string
  trailingAddon?: string
  type?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  size: 'md',
  error: false,
  disabled: false,
  type: 'text',
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const attrs = useAttrs()

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-8 text-sm px-3',
  md: 'h-10 text-sm px-3',
  lg: 'h-12 text-base px-4',
}

const inputClasses = computed(() =>
  cn(
    // Base styles
    'w-full rounded-sm border bg-white transition-colors duration-150',
    'placeholder:text-slate-400',
    'focus:outline-none focus:ring-1',
    // Size
    sizeClasses[props.size],
    // State: default
    !props.error && !props.disabled && 'border-slate-300 focus:border-orange-500 focus:ring-orange-500',
    // State: error
    props.error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
    // State: disabled
    props.disabled && 'bg-slate-50 cursor-not-allowed text-slate-500',
    // Addons
    props.leadingAddon && 'rounded-l-none',
    props.trailingAddon && 'rounded-r-none'
  )
)

const addonClasses = computed(() =>
  cn(
    'inline-flex items-center border bg-slate-50 text-slate-500',
    sizeClasses[props.size],
    props.error ? 'border-red-500' : 'border-slate-300'
  )
)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="flex">
    <!-- Leading addon -->
    <span
      v-if="leadingAddon"
      :class="[addonClasses, 'rounded-l-sm border-r-0']"
    >
      {{ leadingAddon }}
    </span>

    <!-- Input field -->
    <input
      :type="type"
      :value="modelValue"
      :disabled="disabled"
      :class="inputClasses"
      v-bind="attrs"
      @input="handleInput"
    />

    <!-- Trailing addon -->
    <span
      v-if="trailingAddon"
      :class="[addonClasses, 'rounded-r-sm border-l-0']"
    >
      {{ trailingAddon }}
    </span>
  </div>
</template>
