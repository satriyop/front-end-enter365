<script setup lang="ts">
import { ref, onMounted } from 'vue'

const needRefresh = ref(false)
const updateServiceWorker = ref<(() => Promise<void>) | null>(null)

onMounted(async () => {
  // Only register in production
  if (import.meta.env.PROD) {
    try {
      const { useRegisterSW } = await import('virtual:pwa-register/vue')

      const { needRefresh: swNeedRefresh, updateServiceWorker: swUpdate } =
        useRegisterSW({
          onRegistered(registration) {
            // Check for updates every hour
            if (registration) {
              setInterval(() => {
                registration.update()
              }, 60 * 60 * 1000)
            }
          },
          onRegisterError(error) {
            console.error('SW registration error:', error)
          },
        })

      // Sync refs
      needRefresh.value = swNeedRefresh.value
      updateServiceWorker.value = swUpdate

      // Watch for changes
      const unwatch = setInterval(() => {
        needRefresh.value = swNeedRefresh.value
      }, 1000)

      // Cleanup
      return () => clearInterval(unwatch)
    } catch (error) {
      // PWA not available in dev mode
      console.log('PWA not available:', error)
    }
  }
})

async function handleUpdate() {
  if (updateServiceWorker.value) {
    await updateServiceWorker.value()
    needRefresh.value = false
  }
}

function handleDismiss() {
  needRefresh.value = false
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="needRefresh"
      class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-4 z-50"
    >
      <div class="flex items-start gap-3">
        <!-- Icon -->
        <div class="flex-shrink-0">
          <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <svg
              class="w-5 h-5 text-primary-600 dark:text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-medium text-slate-900 dark:text-slate-100">
            Update Available
          </h3>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A new version of Enter365 is available. Refresh to get the latest features.
          </p>

          <!-- Actions -->
          <div class="mt-3 flex gap-2">
            <button
              type="button"
              class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
              @click="handleUpdate"
            >
              Refresh Now
            </button>
            <button
              type="button"
              class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
              @click="handleDismiss"
            >
              Later
            </button>
          </div>
        </div>

        <!-- Close button -->
        <button
          type="button"
          class="flex-shrink-0 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300"
          @click="handleDismiss"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
