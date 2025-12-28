<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  /** Label for the filter */
  label?: string
  /** Expand to fill available space */
  grow?: boolean
  /** Minimum width */
  minWidth?: string
  /** Additional classes */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  grow: false,
  minWidth: '200px',
})
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col gap-1.5',
        grow && 'flex-1',
        props.class
      )
    "
    :style="{ minWidth: props.minWidth }"
  >
    <label
      v-if="label"
      class="text-sm font-medium text-muted-foreground"
    >
      {{ label }}
    </label>
    <slot />
  </div>
</template>
