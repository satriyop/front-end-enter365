import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

// Session timeout configuration
const SESSION_DURATION_MS = 60 * 60 * 1000 // 60 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000 // Show warning 5 minutes before

/**
 * Parse JWT token to get expiration time
 */
function parseJwtExp(token: string): number | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const decoded = JSON.parse(atob(payload))
    return decoded.exp ? decoded.exp * 1000 : null // Convert to milliseconds
  } catch {
    return null
  }
}

/**
 * Composable to manage session timeout warnings
 *
 * Shows a warning modal before the session expires,
 * allowing users to extend their session or logout.
 */
export function useSessionTimeout() {
  const auth = useAuthStore()

  const showWarning = ref(false)
  const remainingSeconds = ref(0)
  const isRefreshing = ref(false)

  let warningTimer: ReturnType<typeof setTimeout> | null = null
  let logoutTimer: ReturnType<typeof setTimeout> | null = null
  let countdownInterval: ReturnType<typeof setInterval> | null = null

  const remainingTime = computed(() => {
    const minutes = Math.floor(remainingSeconds.value / 60)
    const seconds = remainingSeconds.value % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  })

  function clearTimers() {
    if (warningTimer) {
      clearTimeout(warningTimer)
      warningTimer = null
    }
    if (logoutTimer) {
      clearTimeout(logoutTimer)
      logoutTimer = null
    }
    if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }
  }

  function startCountdown(expiresAt: number) {
    countdownInterval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
      remainingSeconds.value = remaining

      if (remaining <= 0) {
        clearInterval(countdownInterval!)
        countdownInterval = null
      }
    }, 1000)
  }

  function scheduleWarning() {
    clearTimers()

    if (!auth.isAuthenticated) {
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    // Try to get expiration from JWT, fallback to session duration
    const jwtExp = parseJwtExp(token)
    const expiresAt = jwtExp || (Date.now() + SESSION_DURATION_MS)
    const now = Date.now()

    const timeUntilExpiry = expiresAt - now
    const timeUntilWarning = timeUntilExpiry - WARNING_BEFORE_MS

    if (timeUntilWarning <= 0) {
      // Already in warning period
      showWarning.value = true
      remainingSeconds.value = Math.floor(timeUntilExpiry / 1000)
      startCountdown(expiresAt)

      // Schedule auto-logout
      logoutTimer = setTimeout(() => {
        handleLogout()
      }, timeUntilExpiry)
    } else {
      // Schedule warning
      warningTimer = setTimeout(() => {
        showWarning.value = true
        remainingSeconds.value = Math.floor(WARNING_BEFORE_MS / 1000)
        startCountdown(expiresAt)

        // Schedule auto-logout
        logoutTimer = setTimeout(() => {
          handleLogout()
        }, WARNING_BEFORE_MS)
      }, timeUntilWarning)
    }
  }

  async function handleExtendSession() {
    isRefreshing.value = true

    try {
      // Trigger token refresh via the auth store or API
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.token) {
          localStorage.setItem('token', data.token)
        }
        showWarning.value = false
        scheduleWarning() // Reschedule with new token
      } else {
        // Refresh failed, logout
        handleLogout()
      }
    } catch {
      handleLogout()
    } finally {
      isRefreshing.value = false
    }
  }

  function handleLogout() {
    clearTimers()
    showWarning.value = false
    auth.logout()
  }

  function dismissWarning() {
    showWarning.value = false
    // Don't clear timers - session will still expire
  }

  onMounted(() => {
    scheduleWarning()
  })

  onUnmounted(() => {
    clearTimers()
  })

  return {
    showWarning,
    remainingTime,
    remainingSeconds,
    isRefreshing,
    handleExtendSession,
    handleLogout,
    dismissWarning,
    scheduleWarning, // Expose for manual reschedule after login
  }
}
