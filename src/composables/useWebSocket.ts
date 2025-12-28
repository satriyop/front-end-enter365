import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/auth'

export interface WebSocketOptions {
  /** WebSocket server URL */
  url?: string
  /** Auto-connect on mount */
  autoConnect?: boolean
  /** Reconnect on disconnect */
  autoReconnect?: boolean
  /** Max reconnection attempts */
  maxReconnectAttempts?: number
  /** Base delay for reconnection (ms) */
  reconnectDelay?: number
  /** Enable debug logging */
  debug?: boolean
}

export interface WebSocketMessage {
  event: string
  channel?: string
  data: unknown
}

type MessageHandler = (data: unknown) => void

// Singleton state
const socket = ref<WebSocket | null>(null)
const isConnected = ref(false)
const isConnecting = ref(false)
const connectionError = ref<string | null>(null)
const reconnectAttempts = ref(0)

// Channel subscriptions
const subscriptions = new Map<string, Set<MessageHandler>>()

// Event handlers
const eventHandlers = new Map<string, Set<MessageHandler>>()

let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let pingInterval: ReturnType<typeof setInterval> | null = null

/**
 * Composable for WebSocket real-time updates
 *
 * @example
 * const { isConnected, subscribe, on, send } = useWebSocket()
 *
 * // Subscribe to a channel
 * subscribe('quotations.123', (data) => {
 *   console.log('Quotation updated:', data)
 * })
 *
 * // Listen for specific events
 * on('notification', (data) => {
 *   showToast(data.message)
 * })
 */
export function useWebSocket(options: WebSocketOptions = {}) {
  const {
    url = import.meta.env.VITE_WS_URL || 'wss://enter365.test/ws',
    autoConnect = true,
    autoReconnect = true,
    maxReconnectAttempts = 10,
    reconnectDelay = 1000,
    debug = import.meta.env.DEV,
  } = options

  const authStore = useAuthStore()
  const queryClient = useQueryClient()

  function log(...args: unknown[]) {
    if (debug) {
      console.log('[WebSocket]', ...args)
    }
  }

  /**
   * Connect to WebSocket server
   */
  function connect() {
    if (socket.value?.readyState === WebSocket.OPEN) {
      log('Already connected')
      return
    }

    if (isConnecting.value) {
      log('Connection in progress')
      return
    }

    isConnecting.value = true
    connectionError.value = null

    try {
      // Add auth token to URL if available
      const wsUrl = new URL(url)
      const token = authStore.token
      if (token) {
        wsUrl.searchParams.set('token', token)
      }

      log('Connecting to', wsUrl.toString())
      socket.value = new WebSocket(wsUrl.toString())

      socket.value.onopen = handleOpen
      socket.value.onclose = handleClose
      socket.value.onerror = handleError
      socket.value.onmessage = handleMessage
    } catch (error) {
      isConnecting.value = false
      connectionError.value = error instanceof Error ? error.message : 'Connection failed'
      log('Connection error:', error)

      if (autoReconnect) {
        scheduleReconnect()
      }
    }
  }

  /**
   * Handle connection open
   */
  function handleOpen() {
    log('Connected')
    isConnected.value = true
    isConnecting.value = false
    reconnectAttempts.value = 0
    connectionError.value = null

    // Re-subscribe to all channels
    for (const channel of subscriptions.keys()) {
      sendSubscribe(channel)
    }

    // Start ping interval to keep connection alive
    startPing()
  }

  /**
   * Handle connection close
   */
  function handleClose(event: CloseEvent) {
    log('Disconnected:', event.code, event.reason)
    isConnected.value = false
    isConnecting.value = false
    socket.value = null

    stopPing()

    if (autoReconnect && event.code !== 1000) {
      scheduleReconnect()
    }
  }

  /**
   * Handle connection error
   */
  function handleError(event: Event) {
    log('Error:', event)
    connectionError.value = 'WebSocket error'
  }

  /**
   * Handle incoming message
   */
  function handleMessage(event: MessageEvent) {
    try {
      const message: WebSocketMessage = JSON.parse(event.data)
      log('Message received:', message)

      // Handle channel messages
      if (message.channel) {
        const handlers = subscriptions.get(message.channel)
        if (handlers) {
          handlers.forEach((handler) => handler(message.data))
        }
      }

      // Handle event messages
      if (message.event) {
        const handlers = eventHandlers.get(message.event)
        if (handlers) {
          handlers.forEach((handler) => handler(message.data))
        }

        // Auto-invalidate queries based on event type
        handleQueryInvalidation(message)
      }
    } catch (error) {
      log('Failed to parse message:', error)
    }
  }

  /**
   * Automatically invalidate queries based on WebSocket events
   */
  function handleQueryInvalidation(message: WebSocketMessage) {
    const { event, data } = message

    // Map events to query keys
    const queryKeyMap: Record<string, string[]> = {
      'quotation.created': ['quotations'],
      'quotation.updated': ['quotations', 'quotation'],
      'quotation.deleted': ['quotations'],
      'invoice.created': ['invoices'],
      'invoice.updated': ['invoices', 'invoice'],
      'invoice.deleted': ['invoices'],
      'contact.updated': ['contacts', 'contact'],
      'notification.new': ['notifications'],
    }

    const queryKeys = queryKeyMap[event]
    if (queryKeys) {
      queryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
        log('Invalidated query:', key)
      })
    }

    // If data has an ID, also invalidate specific queries
    if (data && typeof data === 'object' && 'id' in data) {
      const id = (data as { id: number }).id
      const entityType = event.split('.')[0]
      if (entityType) {
        queryClient.invalidateQueries({ queryKey: [entityType, id] })
      }
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  function scheduleReconnect() {
    if (reconnectAttempts.value >= maxReconnectAttempts) {
      log('Max reconnection attempts reached')
      connectionError.value = 'Connection failed after multiple attempts'
      return
    }

    // Exponential backoff with jitter
    const delay = Math.min(
      reconnectDelay * Math.pow(2, reconnectAttempts.value) + Math.random() * 1000,
      30000 // Max 30 seconds
    )

    log(`Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts.value + 1})`)

    reconnectTimeout = setTimeout(() => {
      reconnectAttempts.value++
      connect()
    }, delay)
  }

  /**
   * Start ping interval
   */
  function startPing() {
    stopPing()
    pingInterval = setInterval(() => {
      if (socket.value?.readyState === WebSocket.OPEN) {
        socket.value.send(JSON.stringify({ event: 'ping' }))
      }
    }, 30000) // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  function stopPing() {
    if (pingInterval) {
      clearInterval(pingInterval)
      pingInterval = null
    }
  }

  /**
   * Send subscribe message
   */
  function sendSubscribe(channel: string) {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({
        event: 'subscribe',
        channel,
      }))
      log('Subscribed to:', channel)
    }
  }

  /**
   * Send unsubscribe message
   */
  function sendUnsubscribe(channel: string) {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({
        event: 'unsubscribe',
        channel,
      }))
      log('Unsubscribed from:', channel)
    }
  }

  /**
   * Subscribe to a channel
   */
  function subscribe(channel: string, handler: MessageHandler) {
    if (!subscriptions.has(channel)) {
      subscriptions.set(channel, new Set())
      // Subscribe on server if connected
      if (isConnected.value) {
        sendSubscribe(channel)
      }
    }

    subscriptions.get(channel)!.add(handler)

    // Return unsubscribe function
    return () => {
      const handlers = subscriptions.get(channel)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          subscriptions.delete(channel)
          sendUnsubscribe(channel)
        }
      }
    }
  }

  /**
   * Listen for specific events
   */
  function on(event: string, handler: MessageHandler) {
    if (!eventHandlers.has(event)) {
      eventHandlers.set(event, new Set())
    }

    eventHandlers.get(event)!.add(handler)

    // Return off function
    return () => {
      eventHandlers.get(event)?.delete(handler)
    }
  }

  /**
   * Send a message
   */
  function send(event: string, data?: unknown) {
    if (socket.value?.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify({ event, data }))
      return true
    }
    log('Cannot send: not connected')
    return false
  }

  /**
   * Disconnect from server
   */
  function disconnect() {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = null
    }

    stopPing()

    if (socket.value) {
      socket.value.close(1000, 'User disconnect')
      socket.value = null
    }

    isConnected.value = false
    isConnecting.value = false
    reconnectAttempts.value = 0
  }

  // Auto-connect on mount
  onMounted(() => {
    if (autoConnect && authStore.isAuthenticated) {
      connect()
    }
  })

  // Disconnect on unmount
  onUnmounted(() => {
    // Don't disconnect if other components are still using it
    // This is a singleton, so we keep the connection alive
  })

  // Watch for auth changes
  watch(
    () => authStore.isAuthenticated,
    (isAuthenticated) => {
      if (isAuthenticated && autoConnect) {
        connect()
      } else if (!isAuthenticated) {
        disconnect()
      }
    }
  )

  return {
    /** Whether currently connected */
    isConnected,
    /** Whether connection is in progress */
    isConnecting,
    /** Last connection error */
    connectionError,
    /** Number of reconnection attempts */
    reconnectAttempts,
    /** Connect to server */
    connect,
    /** Disconnect from server */
    disconnect,
    /** Subscribe to a channel */
    subscribe,
    /** Listen for events */
    on,
    /** Send a message */
    send,
  }
}
