<script setup lang="ts">
import { computed, type Component } from 'vue'

type TrendDirection = 'up' | 'down' | 'neutral'

interface Props {
  label: string
  value: string | number
  icon?: Component
  trend?: {
    value: string
    direction: TrendDirection
  }
  alert?: boolean
}

const props = defineProps<Props>()

const trendClasses = computed(() => {
  if (!props.trend) return ''

  switch (props.trend.direction) {
    case 'up':
      return 'text-green-600 dark:text-green-400'
    case 'down':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-slate-500 dark:text-slate-400'
  }
})

const trendIcon = computed(() => {
  if (!props.trend) return ''

  switch (props.trend.direction) {
    case 'up':
      return '↑'
    case 'down':
      return '↓'
    default:
      return '→'
  }
})
</script>

<template>
  <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <!-- Icon -->
        <div v-if="icon" class="mb-2">
          <component :is="icon" class="w-6 h-6 text-slate-400 dark:text-slate-500" />
        </div>

        <!-- Label -->
        <p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          {{ label }}
        </p>

        <!-- Value -->
        <p class="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">
          {{ value }}
        </p>

        <!-- Trend -->
        <p
          v-if="trend"
          :class="['mt-1 text-xs font-medium', trendClasses]"
        >
          <span>{{ trendIcon }}</span>
          {{ trend.value }}
        </p>
      </div>

      <!-- Alert badge -->
      <span
        v-if="alert"
        class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold"
      >
        !
      </span>
    </div>
  </div>
</template>
