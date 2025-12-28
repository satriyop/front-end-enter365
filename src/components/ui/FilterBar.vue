<script setup lang="ts">
import { cn } from '@/utils/cn'

interface Props {
  /** Additional classes */
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div
    :class="
      cn(
        'rounded-lg border bg-card p-4',
        'flex flex-wrap items-end gap-4',
        props.class
      )
    "
  >
    <slot />
  </div>
</template>
