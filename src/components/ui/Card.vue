<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/cn'

type CardVariant = 'default' | 'stat' | 'list'

interface Props {
  variant?: CardVariant
  padding?: boolean
  hoverable?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: true,
  hoverable: false,
  clickable: false,
})

const cardClasses = computed(() =>
  cn(
    'bg-white rounded-lg border border-slate-200',
    props.padding && 'p-6',
    props.hoverable && 'hover:shadow-md transition-shadow duration-200',
    props.clickable && 'cursor-pointer'
  )
)
</script>

<template>
  <div :class="cardClasses">
    <!-- Header slot -->
    <div
      v-if="$slots.header"
      class="flex items-center justify-between pb-4 border-b border-slate-200 -mx-6 px-6 -mt-6 pt-6 mb-4"
    >
      <slot name="header" />
    </div>

    <!-- Default content -->
    <slot />

    <!-- Footer slot -->
    <div
      v-if="$slots.footer"
      class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 -mx-6 px-6 -mb-6 pb-6 mt-4"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
