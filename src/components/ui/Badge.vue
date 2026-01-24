<script setup lang="ts">
import { computed } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/cn'

/**
 * Badge variants using class-variance-authority
 * Provides consistent styling for labels and status indicators
 */
const badgeVariants = cva(
  // Base styles
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        primary: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        destructive: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        outline: 'border border-slate-200 dark:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

type BadgeVariants = VariantProps<typeof badgeVariants>

// Domain-specific status types for business logic
export type StatusType =
  | 'draft'
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'approved'
  | 'completed'
  | 'on_hold'
  | 'cancelled'
  | 'rejected'
  | 'overdue'
  | 'sent'
  | 'partial'
  | 'paid'
  | 'expired'
  | 'converted'
  | 'posted'
  | 'void'

interface Props {
  /** Visual style variant */
  variant?: NonNullable<BadgeVariants['variant']>
  /** Domain-specific status (overrides variant) */
  status?: string | Record<string, any>
  /** Show status dot indicator */
  dot?: boolean
  /** Animate dot with pulse effect */
  pulse?: boolean
  /** Additional classes */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  dot: false,
  pulse: false,
})

// Domain-specific status colors (fixed meaning, don't change with theme)
const statusStyles: Record<string, { badge: string; dot: string }> = {
  draft: { badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' },
  pending: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
  submitted: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
  in_progress: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' },
  approved: { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500' },
  completed: { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500' },
  paid: { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500' },
  on_hold: { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', dot: 'bg-violet-500' },
  cancelled: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
  rejected: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
  overdue: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
  sent: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' },
  partial: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
  expired: { badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', dot: 'bg-slate-400' },
  converted: { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', dot: 'bg-green-500' },
  posted: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', dot: 'bg-blue-500' },
  void: { badge: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 line-through', dot: 'bg-slate-500' },
}

const badgeClasses = computed(() => {
  const statusValue = props.status && typeof props.status === 'object' ? props.status.value : props.status
  if (statusValue && statusStyles[statusValue]) {
    return cn(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
      statusStyles[statusValue].badge,
      props.class
    )
  }
  return cn(badgeVariants({ variant: props.variant }), props.class)
})

const dotClasses = computed(() => {
  if (!props.dot) return ''
  const statusValue = props.status && typeof props.status === 'object' ? props.status.value : props.status
  const style = statusValue ? statusStyles[statusValue] : null
  const dotColor = style ? style.dot : 'bg-current'
  return cn('h-1.5 w-1.5 rounded-full', dotColor)
})
</script>

<template>
  <span :class="badgeClasses">
    <span
      v-if="dot"
      :class="[dotClasses, { 'animate-pulse': pulse }]"
    />
    <slot />
  </span>
</template>
