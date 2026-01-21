<script setup lang="ts">
import { computed } from 'vue'
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'radix-vue'
import { Check, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { cn } from '@/utils/cn'

// Internal placeholder for empty string values (Radix doesn't allow empty strings)
const EMPTY_VALUE_PLACEHOLDER = '__empty__'

interface Option {
  value: string | number
  label: string
  disabled?: boolean
}

interface Props {
  /** Selected value for v-model */
  modelValue?: string | number | null
  /** Available options */
  options: Option[]
  /** Placeholder text when nothing selected */
  placeholder?: string
  /** Size variant */
  size?: 'sm' | 'default' | 'lg'
  /** Show error state (accepts boolean or truthy string) */
  error?: boolean | string
  /** Disable the select */
  disabled?: boolean
  /** Additional trigger classes */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  placeholder: 'Select an option',
  size: 'default',
  error: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number | null]
}>()

const sizeStyles = {
  sm: 'h-8 text-xs px-3',
  default: 'h-9 px-3 py-2 text-sm',
  lg: 'h-11 px-4 text-base',
}

const triggerClasses = computed(() =>
  cn(
    'flex w-full items-center justify-between gap-2 rounded-md border bg-transparent',
    'text-slate-900 dark:text-slate-100',
    'placeholder:text-slate-400 dark:placeholder:text-slate-500',
    'focus:outline-none focus:ring-2 focus:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-50',
    '[&>span]:line-clamp-1',
    'transition-colors',
    sizeStyles[props.size],
    props.error
      ? 'border-destructive focus:ring-destructive'
      : 'border-slate-200 dark:border-slate-700',
    props.class
  )
)

// Convert external value to internal Radix value
function toInternalValue(value: string | number | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined
  if (value === '') return EMPTY_VALUE_PLACEHOLDER
  return String(value)
}

// Convert internal Radix value back to external value
function toExternalValue(internalValue: string): string | number | null {
  if (internalValue === EMPTY_VALUE_PLACEHOLDER) return ''

  // Try to find the original option to preserve number types
  const originalOption = props.options.find(
    (o) => String(o.value) === internalValue ||
           (o.value === '' && internalValue === EMPTY_VALUE_PLACEHOLDER)
  )
  if (originalOption) {
    return originalOption.value
  }
  return internalValue || null
}

// Internal value for Radix
const internalValue = computed(() => toInternalValue(props.modelValue))

// Transform options for Radix (replace empty strings with placeholder)
const internalOptions = computed(() =>
  props.options.map((opt) => ({
    ...opt,
    internalValue: opt.value === '' ? EMPTY_VALUE_PLACEHOLDER : String(opt.value),
  }))
)

function handleValueChange(value: string) {
  emit('update:modelValue', toExternalValue(value))
}

// Get label for current value
const selectedLabel = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined) {
    return null
  }
  const option = props.options.find(
    (o) => String(o.value) === String(props.modelValue)
  )
  return option?.label ?? String(props.modelValue)
})
</script>

<template>
  <SelectRoot
    :model-value="internalValue"
    :disabled="disabled"
    @update:model-value="handleValueChange"
  >
    <SelectTrigger :class="triggerClasses">
      <SelectValue :placeholder="placeholder">
        <span v-if="selectedLabel">{{ selectedLabel }}</span>
      </SelectValue>
      <ChevronDown class="h-4 w-4 shrink-0 opacity-50" />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        class="z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        :side-offset="4"
        position="popper"
      >
        <SelectScrollUpButton
          class="flex cursor-default items-center justify-center py-1"
        >
          <ChevronUp class="h-4 w-4" />
        </SelectScrollUpButton>

        <SelectViewport
          class="p-1 w-full min-w-[var(--radix-select-trigger-width)]"
        >
          <SelectGroup>
            <SelectItem
              v-for="option in internalOptions"
              :key="option.internalValue"
              :value="option.internalValue"
              :disabled="option.disabled"
              class="relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-slate-100 focus:bg-slate-100 data-[highlighted]:bg-slate-100 dark:hover:bg-slate-800 dark:focus:bg-slate-800 dark:data-[highlighted]:bg-slate-800 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              <span
                class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center"
              >
                <SelectItemIndicator>
                  <Check class="h-4 w-4" />
                </SelectItemIndicator>
              </span>
              <SelectItemText>{{ option.label }}</SelectItemText>
            </SelectItem>
          </SelectGroup>
        </SelectViewport>

        <SelectScrollDownButton
          class="flex cursor-default items-center justify-center py-1"
        >
          <ChevronDown class="h-4 w-4" />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
