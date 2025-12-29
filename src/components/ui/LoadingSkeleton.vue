<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/cn'

type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded'

interface Props {
  variant?: SkeletonVariant
  width?: string
  height?: string
  lines?: number
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'text',
  lines: 1,
  animated: true,
})

const variantClasses: Record<SkeletonVariant, string> = {
  text: 'h-4 rounded',
  circular: 'rounded-full',
  rectangular: '',
  rounded: 'rounded-lg',
}

const baseClasses = computed(() =>
  cn(
    'bg-slate-200 dark:bg-slate-700',
    props.animated && 'animate-pulse',
    variantClasses[props.variant]
  )
)

// Generate line widths for text variant
const lineWidths = computed(() => {
  if (props.variant !== 'text' || props.lines === 1) return ['100%']

  const widths: string[] = []
  for (let i = 0; i < props.lines; i++) {
    // Last line is shorter
    if (i === props.lines - 1) {
      widths.push('60%')
    } else {
      // Vary widths slightly
      const width = 85 + Math.random() * 15
      widths.push(`${width}%`)
    }
  }
  return widths
})
</script>

<template>
  <!-- Multiple lines for text variant -->
  <div
    v-if="variant === 'text' && lines > 1"
    class="space-y-2"
  >
    <div
      v-for="(lineWidth, index) in lineWidths"
      :key="index"
      :class="baseClasses"
      :style="{ width: lineWidth }"
    />
  </div>

  <!-- Single element -->
  <div
    v-else
    :class="baseClasses"
    :style="{
      width: width ?? (variant === 'circular' ? '40px' : '100%'),
      height: height ?? (variant === 'circular' ? '40px' : variant === 'rectangular' || variant === 'rounded' ? '100px' : undefined),
    }"
  />
</template>
