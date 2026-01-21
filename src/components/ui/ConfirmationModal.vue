<script setup lang="ts">
/**
 * ConfirmationModal Component
 *
 * Reusable confirmation dialog for destructive or important actions.
 *
 * @example
 * ```vue
 * <ConfirmationModal
 *   v-model:open="showDeleteModal"
 *   title="Delete Quotation"
 *   message="Are you sure you want to delete this quotation? This action cannot be undone."
 *   variant="destructive"
 *   confirm-label="Delete"
 *   :is-loading="isDeleting"
 *   @confirm="handleDelete"
 *   @cancel="showDeleteModal = false"
 * />
 * ```
 */

import { computed } from 'vue'
import Modal from './Modal.vue'
import Button from './Button.vue'
import { AlertTriangle, Loader2, Info } from 'lucide-vue-next'

interface Props {
  open: boolean
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive' | 'warning' | 'info'
  isLoading?: boolean
  showIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  message: 'Are you sure you want to proceed?',
  confirmLabel: 'Confirm',
  cancelLabel: 'Cancel',
  variant: 'default',
  isLoading: false,
  showIcon: true,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
  cancel: []
}>()

const confirmVariant = computed(() => {
  switch (props.variant) {
    case 'destructive':
      return 'destructive'
    case 'warning':
      return 'warning'
    default:
      return 'default'
  }
})

const iconClass = computed(() => {
  switch (props.variant) {
    case 'destructive':
      return 'text-destructive'
    case 'warning':
      return 'text-warning'
    case 'info':
      return 'text-info'
    default:
      return 'text-muted-foreground'
  }
})

const IconComponent = computed(() => {
  if (props.variant === 'info') return Info
  return AlertTriangle
})

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
  emit('update:open', false)
}
</script>

<template>
  <Modal :open="open" :title="title" @update:open="emit('update:open', $event)">
    <div class="space-y-4">
      <div class="flex gap-4">
        <component
          :is="IconComponent"
          v-if="showIcon && variant !== 'default'"
          :class="['h-6 w-6 flex-shrink-0', iconClass]"
        />
        <p class="text-muted-foreground">{{ message }}</p>
      </div>

      <!-- Additional content slot -->
      <slot />

      <div class="flex justify-end gap-3 pt-2">
        <Button variant="outline" :disabled="isLoading" @click="handleCancel">
          {{ cancelLabel }}
        </Button>
        <Button :variant="confirmVariant" :disabled="isLoading" @click="handleConfirm">
          <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
          {{ confirmLabel }}
        </Button>
      </div>
    </div>
  </Modal>
</template>
