<script setup lang="ts">
import { computed, type Component } from 'vue'
import { cn } from '@/utils/cn'

type AlertVariant = 'info' | 'success' | 'warning' | 'destructive'

// Note: 'destructive' replaces the old 'error' variant

interface Props {
  variant?: AlertVariant
  title?: string
  dismissible?: boolean
  icon?: Component
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  dismissible: false,
})

const emit = defineEmits<{
  dismiss: []
}>()

const variantClasses: Record<AlertVariant, { bg: string; border: string; text: string; icon: string }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-500',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'text-blue-500',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-500',
    text: 'text-green-700 dark:text-green-300',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-500',
  },
  destructive: {
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-500',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-500',
  },
}

const classes = computed(() => variantClasses[props.variant])

const alertClasses = computed(() =>
  cn(
    'rounded-md p-4 border-l-4',
    classes.value.bg,
    classes.value.border
  )
)

// Default icons for each variant
const defaultIcons: Record<AlertVariant, string> = {
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  destructive: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
}
</script>

<template>
  <div :class="alertClasses" role="alert">
    <div class="flex">
      <!-- Icon -->
      <div class="flex-shrink-0">
        <component
          v-if="icon"
          :is="icon"
          :class="['w-5 h-5', classes.icon]"
        />
        <svg
          v-else
          :class="['w-5 h-5', classes.icon]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            :d="defaultIcons[variant]"
          />
        </svg>
      </div>

      <!-- Content -->
      <div class="ml-3 flex-1">
        <h3
          v-if="title"
          :class="['text-sm font-medium', classes.text]"
        >
          {{ title }}
        </h3>
        <div
          :class="[
            'text-sm',
            classes.text,
            title && 'mt-1'
          ]"
        >
          <slot />
        </div>

        <!-- Actions slot -->
        <div
          v-if="$slots.actions"
          class="mt-3"
        >
          <slot name="actions" />
        </div>
      </div>

      <!-- Dismiss button -->
      <div
        v-if="dismissible"
        class="ml-auto pl-3"
      >
        <button
          type="button"
          :class="[
            'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
            classes.text,
            'hover:bg-white/50'
          ]"
          @click="emit('dismiss')"
        >
          <span class="sr-only">Dismiss</span>
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>
