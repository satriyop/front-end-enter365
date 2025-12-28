<script setup lang="ts">
import { computed } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'radix-vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/utils/cn'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'full'

interface Props {
  /** Controls modal visibility */
  open: boolean
  /** Modal width size */
  size?: ModalSize
  /** Modal title */
  title?: string
  /** Optional description below title */
  description?: string
  /** Close when clicking backdrop */
  closeOnBackdrop?: boolean
  /** Show close button */
  showClose?: boolean
  /** Additional content classes */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'lg',
  closeOnBackdrop: true,
  showClose: true,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  close: []
}>()

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]',
}

const contentClasses = computed(() =>
  cn(
    // Base styles
    'fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2',
    'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700',
    // Max height to fit in viewport with scrolling
    'max-h-[90vh] flex flex-col',
    // Animation
    'data-[state=open]:animate-in data-[state=closed]:animate-out',
    'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
    'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
    'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
    'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
    'duration-200',
    // Size
    sizeClasses[props.size],
    // Custom classes
    props.class
  )
)

function handleOpenChange(value: boolean) {
  emit('update:open', value)
  if (!value) {
    emit('close')
  }
}

function handleBackdropClick(event: Event) {
  if (!props.closeOnBackdrop) {
    event.preventDefault()
  }
}
</script>

<template>
  <DialogRoot
    :open="open"
    @update:open="handleOpenChange"
  >
    <DialogPortal>
      <!-- Backdrop -->
      <DialogOverlay
        class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
        @click="handleBackdropClick"
      />

      <!-- Content -->
      <DialogContent
        :class="contentClasses"
        @pointer-down-outside="handleBackdropClick"
        @escape-key-down="(e) => !closeOnBackdrop && e.preventDefault()"
      >
        <!-- Header -->
        <div
          v-if="title || showClose"
          class="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0"
        >
          <div class="flex-1">
            <DialogTitle
              v-if="title"
              class="text-lg font-semibold leading-none tracking-tight"
            >
              {{ title }}
            </DialogTitle>
            <DialogDescription
              v-if="description"
              class="mt-2 text-sm text-muted-foreground"
            >
              {{ description }}
            </DialogDescription>
          </div>

          <!-- Close button -->
          <DialogClose
            v-if="showClose"
            class="ml-4 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <X class="h-4 w-4" />
            <span class="sr-only">Close</span>
          </DialogClose>
        </div>

        <!-- Body - scrollable -->
        <div class="p-6 overflow-y-auto flex-1 min-h-0">
          <slot />
        </div>

        <!-- Footer -->
        <div
          v-if="$slots.footer"
          class="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg flex-shrink-0"
        >
          <slot name="footer" />
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
