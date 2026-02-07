<script setup lang="ts">
import { computed, useAttrs, type Component } from 'vue'
import { cn } from '@/utils/cn'

interface Props {
  /** Input value for v-model */
  modelValue?: string | number
  /** Input type */
  type?: string
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
  /** Show error state (accepts boolean or truthy string) */
  error?: boolean | string
  /** Disable the input */
  disabled?: boolean
  /** Leading addon text */
  leadingAddon?: string
  /** Trailing addon text */
  trailingAddon?: string
  /** Leading icon component */
  leadingIcon?: Component
  /** Trailing icon component */
  trailingIcon?: Component
  /** Additional classes */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  size: 'default',
  error: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

const sizeStyles = {
  sm: 'h-8 text-xs px-3',
  default: 'h-9 px-3 py-1 text-sm',
  lg: 'h-11 px-4 text-base',
}

const inputClasses = computed(() =>
  cn(
    // Base styles
    'flex w-full rounded-md border bg-transparent file:border-0 file:bg-transparent',
    'file:text-sm file:font-medium',
    'text-slate-900 dark:text-slate-100',
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'transition-colors',
    // Hide number input spinners
    '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
    // Size
    sizeStyles[props.size],
    // States
    props.error
      ? 'border-destructive focus-visible:ring-destructive'
      : 'border-input',
    // Addons/Icons adjustments
    props.leadingAddon && 'rounded-l-none',
    props.trailingAddon && 'rounded-r-none',
    props.leadingIcon && 'pl-9',
    props.trailingIcon && 'pr-9',
    // Custom classes
    props.class
  )
)

const addonClasses = computed(() =>
  cn(
    'inline-flex items-center border bg-muted px-3 text-sm text-muted-foreground',
    sizeStyles[props.size],
    props.error ? 'border-destructive' : 'border-input'
  )
)

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="relative flex">
    <!-- Leading addon -->
    <span
      v-if="leadingAddon"
      :class="[addonClasses, 'rounded-l-md border-r-0']"
    >
      {{ leadingAddon }}
    </span>

    <!-- Leading icon -->
    <span
      v-if="leadingIcon && !leadingAddon"
      class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground"
    >
      <component :is="leadingIcon" class="h-4 w-4" />
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

    <!-- Trailing icon -->
    <span
      v-if="trailingIcon && !trailingAddon"
      class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
    >
      <component :is="trailingIcon" class="h-4 w-4" />
    </span>

    <!-- Trailing addon -->
    <span
      v-if="trailingAddon"
      :class="[addonClasses, 'rounded-r-md border-l-0']"
    >
      {{ trailingAddon }}
    </span>
  </div>
</template>
