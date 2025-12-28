<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/cn'

interface Props {
  /** Visual style variant */
  variant?: 'default' | 'elevated' | 'outlined'
  /** Apply default padding */
  padding?: boolean
  /** Show hover shadow effect */
  hoverable?: boolean
  /** Show pointer cursor */
  clickable?: boolean
  /** Additional classes */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: true,
  hoverable: false,
  clickable: false,
})

const cardClasses = computed(() =>
  cn(
    // Base styles with design system tokens
    'rounded-lg border bg-card text-card-foreground',
    // Variant styles
    props.variant === 'elevated' && 'shadow-md border-transparent',
    props.variant === 'outlined' && 'border-2',
    // Padding
    props.padding && 'p-6',
    // Interactive states
    props.hoverable && 'hover:shadow-lg transition-shadow duration-200',
    props.clickable && 'cursor-pointer',
    // Custom classes
    props.class
  )
)
</script>

<template>
  <div :class="cardClasses">
    <!-- Header slot -->
    <div
      v-if="$slots.header"
      class="flex items-center justify-between pb-4 border-b border-border -mx-6 px-6 -mt-6 pt-6 mb-4"
    >
      <slot name="header" />
    </div>

    <!-- Default content -->
    <slot />

    <!-- Footer slot -->
    <div
      v-if="$slots.footer"
      class="flex items-center justify-end gap-3 pt-4 border-t border-border -mx-6 px-6 -mb-6 pb-6 mt-4"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
