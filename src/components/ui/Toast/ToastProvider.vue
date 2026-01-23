<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { createToastContext, provideToast } from './useToast'
import Toast from './Toast.vue'
import { eventBus } from '@/infrastructure/events/EventBus'

// Create and provide toast context
const context = createToastContext()
provideToast(context)

function handleClose(id: string) {
  context.remove(id)
}

// Listen for global API errors
onMounted(() => {
  const unsubscribe = eventBus.on('error:api', (event) => {
    context.error({
      title: 'Error',
      message: event.payload.message,
    })
  })
  onUnmounted(unsubscribe)
})
</script>

<template>
  <!-- Render children (the app) -->
  <slot />

  <!-- Toast container -->
  <Teleport to="body">
    <div
      class="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-x-full opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="translate-x-full opacity-0"
        move-class="transition duration-200 ease-out"
      >
        <div
          v-for="toast in context.toasts.value"
          :key="toast.id"
          class="pointer-events-auto"
        >
          <Toast
            :toast="toast"
            @close="handleClose"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
