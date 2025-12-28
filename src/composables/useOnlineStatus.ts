import { ref, onMounted, onUnmounted } from 'vue'

// Singleton state
const isOnline = ref(true)
const wasOffline = ref(false)
let initialized = false

/**
 * Composable for tracking online/offline status
 *
 * @example
 * const { isOnline, wasOffline, checkConnection } = useOnlineStatus()
 *
 * <div v-if="!isOnline" class="offline-banner">
 *   You are currently offline
 * </div>
 */
export function useOnlineStatus() {
  function handleOnline() {
    isOnline.value = true
    // Set wasOffline to true so we can show "Back online" message
    if (wasOffline.value) {
      // Reset after 3 seconds
      setTimeout(() => {
        wasOffline.value = false
      }, 3000)
    }
  }

  function handleOffline() {
    isOnline.value = false
    wasOffline.value = true
  }

  /**
   * Manually check connection by making a small request
   */
  async function checkConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
      })
      isOnline.value = response.ok
      return response.ok
    } catch {
      isOnline.value = false
      wasOffline.value = true
      return false
    }
  }

  onMounted(() => {
    if (!initialized) {
      // Set initial state
      isOnline.value = navigator.onLine

      // Add event listeners
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      initialized = true
    }
  })

  onUnmounted(() => {
    // Don't remove listeners since state is singleton
    // Other components may still need them
  })

  return {
    /** Whether the browser is currently online */
    isOnline,
    /** Whether the user was recently offline (for showing "back online" message) */
    wasOffline,
    /** Manually check connection status */
    checkConnection,
  }
}
