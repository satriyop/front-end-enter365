<script setup lang="ts">
/**
 * WorkflowActions Component
 *
 * Renders workflow action buttons based on available transitions.
 * Handles confirmation for destructive actions.
 *
 * @example
 * ```vue
 * <WorkflowActions
 *   :actions="workflowActions"
 *   :can-execute="can"
 *   :is-transitioning="isTransitioning"
 *   @action="handleAction"
 * />
 * ```
 */

import { ref, computed, type Component } from 'vue'
import { Button, ConfirmationModal } from '@/components/ui'
import { Loader2 } from 'lucide-vue-next'

export interface WorkflowAction {
  /** Event type to send */
  event: string
  /** Button label */
  label: string
  /** Lucide icon component */
  icon?: Component
  /** Button variant */
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'outline'
  /** Show confirmation dialog */
  requiresConfirmation?: boolean
  /** Confirmation dialog title */
  confirmationTitle?: string
  /** Confirmation dialog message */
  confirmationMessage?: string
}

interface Props {
  actions: WorkflowAction[]
  canExecute: (event: string) => boolean
  isTransitioning?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isTransitioning: false,
})

const emit = defineEmits<{
  action: [event: string]
}>()

// Filter to only available actions
const availableActions = computed(() =>
  props.actions.filter((action) => props.canExecute(action.event))
)

// Confirmation modal state
const confirmingAction = ref<WorkflowAction | null>(null)

function handleActionClick(action: WorkflowAction) {
  if (action.requiresConfirmation) {
    confirmingAction.value = action
  } else {
    emit('action', action.event)
  }
}

function confirmAction() {
  if (confirmingAction.value) {
    emit('action', confirmingAction.value.event)
    confirmingAction.value = null
  }
}

function cancelConfirmation() {
  confirmingAction.value = null
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <Button
      v-for="action in availableActions"
      :key="action.event"
      :variant="action.variant ?? 'outline'"
      size="sm"
      :disabled="isTransitioning"
      @click="handleActionClick(action)"
    >
      <Loader2 v-if="isTransitioning" class="h-4 w-4 mr-2 animate-spin" />
      <component
        :is="action.icon"
        v-else-if="action.icon"
        class="h-4 w-4 mr-2"
      />
      {{ action.label }}
    </Button>
  </div>

  <!-- Confirmation Modal -->
  <ConfirmationModal
    :open="!!confirmingAction"
    :title="confirmingAction?.confirmationTitle ?? 'Confirm Action'"
    :message="confirmingAction?.confirmationMessage ?? 'Are you sure you want to perform this action?'"
    :variant="confirmingAction?.variant === 'destructive' ? 'destructive' : 'default'"
    :is-loading="isTransitioning"
    @update:open="cancelConfirmation"
    @confirm="confirmAction"
    @cancel="cancelConfirmation"
  />
</template>
