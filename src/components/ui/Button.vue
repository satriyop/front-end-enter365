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
   transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
   focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50
   [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`,
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        success: 'bg-success text-success-foreground shadow-sm hover:bg-success/90',
        warning: 'bg-warning text-warning-foreground shadow-sm hover:bg-warning/90',
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
