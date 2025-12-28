import { ref, computed, onMounted } from 'vue'
import { useWebSocket } from './useWebSocket'
import { useToast } from '@/components/ui'

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

// Singleton state
const notifications = ref<Notification[]>([])
const isLoading = ref(false)
let initialized = false

/**
 * Composable for managing notifications with real-time updates
 *
 * @example
 * const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
 */
export function useNotifications() {
  const { isConnected, on } = useWebSocket()
  const toast = useToast()

  // Computed
  const unreadCount = computed(() =>
    notifications.value.filter((n) => !n.read).length
  )

  const hasUnread = computed(() => unreadCount.value > 0)

  /**
   * Fetch notifications from API
   */
  async function fetchNotifications() {
    if (isLoading.value) return

    isLoading.value = true
    try {
      const response = await fetch('/api/v1/notifications', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        notifications.value = data.data || []
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Add a notification
   */
  function addNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date().toISOString(),
    }

    notifications.value.unshift(newNotification)

    // Show toast for new notifications
    const toastMethod = toast[notification.type] || toast.info
    toastMethod({
      title: notification.title,
      message: notification.message,
    })

    return newNotification
  }

  /**
   * Mark notification as read
   */
  async function markAsRead(id: string) {
    const notification = notifications.value.find((n) => n.id === id)
    if (notification) {
      notification.read = true

      // Sync with server
      try {
        await fetch(`/api/v1/notifications/${id}/read`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        })
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }
  }

  /**
   * Mark all notifications as read
   */
  async function markAllAsRead() {
    notifications.value.forEach((n) => {
      n.read = true
    })

    // Sync with server
    try {
      await fetch('/api/v1/notifications/read-all', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  /**
   * Clear a notification
   */
  function clearNotification(id: string) {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  /**
   * Clear all notifications
   */
  function clearAll() {
    notifications.value = []
  }

  // Setup WebSocket listener
  onMounted(() => {
    if (!initialized) {
      // Listen for new notifications via WebSocket
      on('notification.new', (data) => {
        const notification = data as Omit<Notification, 'id' | 'read' | 'createdAt'>
        addNotification(notification)
      })

      // Initial fetch
      fetchNotifications()

      initialized = true
    }
  })

  return {
    /** List of notifications */
    notifications,
    /** Count of unread notifications */
    unreadCount,
    /** Whether there are unread notifications */
    hasUnread,
    /** Whether notifications are loading */
    isLoading,
    /** Whether WebSocket is connected */
    isConnected,
    /** Fetch notifications from server */
    fetchNotifications,
    /** Add a local notification */
    addNotification,
    /** Mark a notification as read */
    markAsRead,
    /** Mark all notifications as read */
    markAllAsRead,
    /** Clear a notification */
    clearNotification,
    /** Clear all notifications */
    clearAll,
  }
}
