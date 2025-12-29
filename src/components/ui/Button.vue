<script setup lang="ts">
import { computed, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-vue-next'

/**
 * Button variants using class-variance-authority
 * Provides consistent styling across all button types
 */
const buttonVariants = cva(
  // Base styles applied to all buttons
  `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium
   transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
   focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
   [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // TIER 1: PRIMARY ACTIONS - Bold, prominent, for main CTAs
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        default: 'bg-orange-600 text-white shadow-sm hover:bg-orange-700 hover:shadow active:bg-orange-800 active:shadow-none dark:bg-orange-600 dark:hover:bg-orange-500',
        success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:shadow active:bg-emerald-800 active:shadow-none dark:bg-emerald-600 dark:hover:bg-emerald-500',
        warning: 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 hover:shadow active:bg-amber-700 active:shadow-none dark:bg-amber-500 dark:hover:bg-amber-400',

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // TIER 2: SECONDARY ACTIONS - Clear buttons, less prominent
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        secondary: 'bg-slate-100 text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-200 hover:border-slate-300 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-600',
        outline: 'border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-500',

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // TIER 3: TERTIARY - Subtle but ALWAYS recognizable as buttons
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // Ghost: Soft tinted background - clearly a button without being loud
        ghost: 'bg-slate-100/70 text-slate-600 border border-slate-200/80 hover:bg-slate-200 hover:text-slate-900 hover:border-slate-300 active:bg-slate-300 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700/80 dark:hover:bg-slate-700 dark:hover:text-slate-100 dark:hover:border-slate-600',
        // Link: For inline text actions only (underline on hover)
        link: 'text-orange-600 underline-offset-4 hover:underline hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300',

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // DESTRUCTIVE - Red tinted, clearly dangerous
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        destructive: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:border-red-300 hover:text-red-700 active:bg-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/50 dark:hover:border-red-700 dark:hover:text-red-300',
      },
      size: {
        default: 'h-9 px-4 py-2',
        xs: 'h-7 rounded-md px-2 text-xs',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        xl: 'h-12 rounded-md px-10 text-base',
        icon: 'h-9 w-9',
        'icon-sm': 'h-8 w-8',
        'icon-xs': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

type ButtonVariants = VariantProps<typeof buttonVariants>

interface Props {
  /** Visual style variant */
  variant?: NonNullable<ButtonVariants['variant']>
  /** Size of the button */
  size?: NonNullable<ButtonVariants['size']>
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset'
  /** Disable the button */
  disabled?: boolean
  /** Show loading spinner */
  loading?: boolean
  /** Icon component to display */
  icon?: Component
  /** Icon position */
  iconPosition?: 'left' | 'right'
  /** Full width button */
  fullWidth?: boolean
  /** Render as child (for composition) */
  asChild?: boolean
  /** Render as a different element (e.g., 'router-link', 'a') */
  as?: 'button' | 'router-link' | 'a'
  /** Router link destination (when as="router-link") */
  to?: string
  /** Anchor href (when as="a") */
  href?: string
  /** Additional classes */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  type: 'button',
  disabled: false,
  loading: false,
  iconPosition: 'left',
  fullWidth: false,
  asChild: false,
  as: 'button',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const computedClass = computed(() =>
  cn(
    buttonVariants({ variant: props.variant, size: props.size }),
    props.fullWidth && 'w-full',
    props.class
  )
)

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <!-- Router Link variant -->
  <RouterLink
    v-if="as === 'router-link' && to"
    :to="to"
    :class="computedClass"
  >
    <Loader2 v-if="loading" class="animate-spin" />
    <component v-else-if="icon && iconPosition === 'left'" :is="icon" />
    <slot />
    <component v-if="icon && iconPosition === 'right' && !loading" :is="icon" />
  </RouterLink>

  <!-- Anchor variant -->
  <a
    v-else-if="as === 'a'"
    :href="href"
    :class="computedClass"
    @click="handleClick"
  >
    <Loader2 v-if="loading" class="animate-spin" />
    <component v-else-if="icon && iconPosition === 'left'" :is="icon" />
    <slot />
    <component v-if="icon && iconPosition === 'right' && !loading" :is="icon" />
  </a>

  <!-- Default button -->
  <button
    v-else
    :type="type"
    :class="computedClass"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <Loader2 v-if="loading" class="animate-spin" />
    <component v-else-if="icon && iconPosition === 'left'" :is="icon" />
    <slot />
    <component v-if="icon && iconPosition === 'right' && !loading" :is="icon" />
  </button>
</template>
