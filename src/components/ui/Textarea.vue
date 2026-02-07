<script setup lang="ts">
import { computed, useAttrs } from 'vue'
import { cn } from '@/utils/cn'

interface Props {
  modelValue?: string
  error?: boolean
  disabled?: boolean
  rows?: number
  maxLength?: number
  showCount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  error: false,
  disabled: false,
  rows: 4,
  showCount: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()

const textareaClasses = computed(() =>
  cn(
    'w-full rounded-sm border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm transition-colors duration-150',
    'placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-y min-h-[100px]',
    'focus:outline-none focus:ring-1',
    // State: default
    !props.error && !props.disabled && 'border-slate-300 dark:border-slate-600 focus:border-orange-500 focus:ring-orange-500',
    // State: error
    props.error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
    // State: disabled
    props.disabled && 'bg-slate-50 dark:bg-slate-900 cursor-not-allowed text-slate-500 dark:text-slate-400'
  )
)

const charCount = computed(() => props.modelValue?.length ?? 0)

const countText = computed(() => {
  if (props.maxLength) {
    return `${charCount.value}/${props.maxLength}`
  }
  return `${charCount.value} characters`
})

function handleInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div>
    <textarea
      :value="modelValue"
      :disabled="disabled"
      :rows="rows"
      :maxlength="maxLength"
      :class="textareaClasses"
      v-bind="attrs"
      @input="handleInput"
    />
    <p
      v-if="showCount"
      :class="[
        'mt-1 text-xs text-right',
        maxLength && charCount >= maxLength ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'
      ]"
    >
      {{ countText }}
    </p>
  </div>
</template>
