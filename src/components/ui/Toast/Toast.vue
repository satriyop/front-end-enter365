<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/utils/cn'
import type { Toast, ToastVariant } from './useToast'

interface Props {
  toast: Toast
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: [id: string]
}>()

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: string; iconPath: string }> = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-500',
    iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-500',
    iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-500',
    iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-500',
    iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
}

const styles = computed(() => variantStyles[props.toast.variant])

const toastClasses = computed(() =>
  cn(
    'flex items-start gap-3 w-full max-w-sm p-4 rounded-lg border shadow-lg',
    styles.value.bg,
    styles.value.border
  )
)

function handleClose() {
  emit('close', props.toast.id)
}

function handleAction() {
  props.toast.action?.onClick()
  handleClose()
}
</script>

<template>
  <div
    :class="toastClasses"
    role="alert"
    aria-live="polite"
  >
    <!-- Icon -->
    <svg
      :class="['w-5 h-5 flex-shrink-0', styles.icon]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        :d="styles.iconPath"
      />
    </svg>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p
        v-if="toast.title"
        class="text-sm font-medium text-slate-900"
      >
        {{ toast.title }}
      </p>
      <p
        :class="[
          'text-sm text-slate-600',
          toast.title && 'mt-1'
        ]"
      >
        {{ toast.message }}
      </p>

      <!-- Action button -->
      <button
        v-if="toast.action"
        type="button"
        class="mt-2 text-sm font-medium text-orange-600 hover:text-orange-500 transition-colors"
        @click="handleAction"
      >
        {{ toast.action.label }}
      </button>
    </div>

    <!-- Close button -->
    <button
      type="button"
      class="flex-shrink-0 p-1 text-slate-400 hover:text-slate-500 rounded transition-colors"
      @click="handleClose"
    >
      <span class="sr-only">Close</span>
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>
  </div>
</template>
