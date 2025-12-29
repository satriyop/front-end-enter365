<script setup lang="ts">
import { type Component } from 'vue'

interface Props {
  label: string
  value: string | number
  subValue?: string
  icon?: Component
  variant?: 'default' | 'success' | 'warning' | 'info' | 'highlight'
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
})

const variantClasses = {
  default: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    icon: 'text-slate-400 dark:text-slate-500',
    label: 'text-slate-500 dark:text-slate-400',
    value: 'text-slate-900 dark:text-slate-100',
    subValue: 'text-slate-400 dark:text-slate-500',
  },
  success: {
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-500 dark:text-emerald-400',
    label: 'text-emerald-600 dark:text-emerald-400',
    value: 'text-emerald-700 dark:text-emerald-300',
    subValue: 'text-emerald-500 dark:text-emerald-500',
  },
  warning: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500 dark:text-amber-400',
    label: 'text-amber-600 dark:text-amber-400',
    value: 'text-amber-700 dark:text-amber-300',
    subValue: 'text-amber-500 dark:text-amber-500',
  },
  info: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500 dark:text-blue-400',
    label: 'text-blue-600 dark:text-blue-400',
    value: 'text-blue-700 dark:text-blue-300',
    subValue: 'text-blue-500 dark:text-blue-500',
  },
  highlight: {
    bg: 'bg-gradient-to-br from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600',
    border: 'border-orange-400 dark:border-orange-500',
    icon: 'text-white/80',
    label: 'text-white/90',
    value: 'text-white',
    subValue: 'text-white/70',
  },
}

const sizeClasses = {
  sm: { padding: 'p-3', value: 'text-lg', label: 'text-xs', icon: 'w-4 h-4' },
  md: { padding: 'p-4', value: 'text-2xl', label: 'text-sm', icon: 'w-5 h-5' },
  lg: { padding: 'p-5', value: 'text-3xl', label: 'text-base', icon: 'w-6 h-6' },
}
</script>

<template>
  <div
    class="relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md"
    :class="[variantClasses[variant].bg, variantClasses[variant].border, sizeClasses[size].padding]"
  >
    <!-- Decorative gradient orb -->
    <div
      v-if="variant === 'highlight'"
      class="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"
    />

    <div class="relative flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <p :class="[variantClasses[variant].label, sizeClasses[size].label, 'font-medium']">
          {{ label }}
        </p>
        <p :class="[variantClasses[variant].value, sizeClasses[size].value, 'font-bold mt-1 truncate']">
          {{ value }}
        </p>
        <p v-if="subValue" :class="[variantClasses[variant].subValue, 'text-xs mt-0.5']">
          {{ subValue }}
        </p>
      </div>
      <component
        v-if="icon"
        :is="icon"
        :class="[variantClasses[variant].icon, sizeClasses[size].icon, 'flex-shrink-0']"
      />
    </div>
  </div>
</template>
