<script setup lang="ts">
import { ref } from 'vue'
import Modal from './Modal.vue'
import Button from './Button.vue'

interface Props {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'destructive' | 'warning' | 'info'
}

withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'destructive',
})

const isOpen = ref(false)
const isLoading = ref(false)
let resolvePromise: ((value: boolean) => void) | null = null

const variantStyles = {
  destructive: {
    icon: '⚠️',
    buttonVariant: 'destructive' as const,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: '⚠️',
    buttonVariant: 'default' as const,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  info: {
    icon: 'ℹ️',
    buttonVariant: 'default' as const,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
}

function open(): Promise<boolean> {
  isOpen.value = true
  isLoading.value = false
  return new Promise(resolve => {
    resolvePromise = resolve
  })
}

function confirm() {
  isLoading.value = true
  resolvePromise?.(true)
  isOpen.value = false
}

function cancel() {
  resolvePromise?.(false)
  isOpen.value = false
}

defineExpose({ open })
</script>

<template>
  <Modal
    :open="isOpen"
    :title="title"
    size="sm"
    :close-on-backdrop="!isLoading"
    :close-on-escape="!isLoading"
    :show-close="!isLoading"
    @update:open="cancel"
  >
    <div class="flex gap-4">
      <div
        class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg"
        :class="[variantStyles[variant].iconBg]"
      >
        {{ variantStyles[variant].icon }}
      </div>
      <p class="text-slate-600 pt-2">{{ message }}</p>
    </div>

    <template #footer>
      <Button
        variant="ghost"
        :disabled="isLoading"
        @click="cancel"
      >
        {{ cancelText }}
      </Button>
      <Button
        :variant="variantStyles[variant].buttonVariant"
        :loading="isLoading"
        @click="confirm"
      >
        {{ confirmText }}
      </Button>
    </template>
  </Modal>
</template>
