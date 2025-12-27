<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/cn'

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
type StatusType = 'draft' | 'pending' | 'in_progress' | 'submitted' | 'approved' | 'completed' | 'on_hold' | 'cancelled' | 'rejected' | 'overdue' | 'sent' | 'partial' | 'paid' | 'expired' | 'converted'

interface Props {
  variant?: BadgeVariant
  status?: StatusType
  dot?: boolean
  pulse?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  dot: false,
  pulse: false,
})

// Map status to colors following design system
const statusColors: Record<StatusType, string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  submitted: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  completed: 'bg-green-100 text-green-700',
  paid: 'bg-green-100 text-green-700',
  on_hold: 'bg-violet-100 text-violet-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  overdue: 'bg-red-100 text-red-700',
  sent: 'bg-blue-100 text-blue-700',
  partial: 'bg-amber-100 text-amber-700',
  expired: 'bg-slate-100 text-slate-700',
  converted: 'bg-green-100 text-green-700',
}

const statusDotColors: Record<StatusType, string> = {
  draft: 'bg-slate-400',
  pending: 'bg-amber-500',
  submitted: 'bg-amber-500',
  in_progress: 'bg-blue-500',
  approved: 'bg-green-500',
  completed: 'bg-green-500',
  paid: 'bg-green-500',
  on_hold: 'bg-violet-500',
  cancelled: 'bg-red-500',
  rejected: 'bg-red-500',
  overdue: 'bg-red-500',
  sent: 'bg-blue-500',
  partial: 'bg-amber-500',
  expired: 'bg-slate-400',
  converted: 'bg-green-500',
}

const variantColors: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-orange-100 text-orange-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
}

const badgeClasses = computed(() =>
  cn(
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
    props.status ? statusColors[props.status] : variantColors[props.variant]
  )
)

const dotClasses = computed(() => {
  if (!props.dot) return ''
  const baseColor = props.status ? statusDotColors[props.status] : 'bg-current'
  return cn('w-1.5 h-1.5 rounded-full', baseColor)
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
