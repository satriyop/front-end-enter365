<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
const isOpen = ref(false)

const {
  notifications,
  unreadCount,
  hasUnread,
  isLoading,
  isConnected,
  markAsRead,
  markAllAsRead,
  clearNotification,
} = useNotifications()

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function handleNotificationClick(notification: { id: string; link?: string }) {
  markAsRead(notification.id)

  if (notification.link) {
    router.push(notification.link)
    close()
  }
}

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return date.toLocaleDateString()
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'success':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    case 'warning':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    case 'destructive':
      return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'success':
      return 'text-green-500'
    case 'warning':
      return 'text-amber-500'
    case 'destructive':
      return 'text-red-500'
    default:
      return 'text-blue-500'
  }
}
</script>

<template>
  <div class="relative">
    <!-- Trigger Button -->
    <button
      type="button"
      class="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
      @click="toggle"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      <!-- Badge -->
      <span
        v-if="hasUnread"
        class="absolute top-0 right-0 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full px-1"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>

      <!-- Connection indicator -->
      <span
        v-if="isConnected"
        class="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full"
        title="Real-time updates active"
      />
    </button>

    <!-- Dropdown -->
    <Transition name="scale-fade">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 class="font-medium text-slate-900 dark:text-slate-100">
            Notifications
          </h3>
          <button
            v-if="hasUnread"
            type="button"
            class="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
            @click="markAllAsRead"
          >
            Mark all as read
          </button>
        </div>

        <!-- Content -->
        <div class="max-h-96 overflow-y-auto">
          <!-- Loading -->
          <div
            v-if="isLoading && notifications.length === 0"
            class="p-4 text-center text-slate-500 dark:text-slate-400"
          >
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2" />
            Loading...
          </div>

          <!-- Empty -->
          <div
            v-else-if="notifications.length === 0"
            class="p-8 text-center text-slate-500 dark:text-slate-400"
          >
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            No notifications
          </div>

          <!-- List -->
          <div v-else>
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
              :class="{ 'bg-primary-50/50 dark:bg-primary-900/10': !notification.read }"
              @click="handleNotificationClick(notification)"
            >
              <!-- Icon -->
              <div class="flex-shrink-0 mt-0.5">
                <svg
                  class="w-5 h-5"
                  :class="getTypeColor(notification.type)"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    :d="getTypeIcon(notification.type)"
                  />
                </svg>
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <p
                  class="text-sm font-medium text-slate-900 dark:text-slate-100"
                  :class="{ 'font-semibold': !notification.read }"
                >
                  {{ notification.title }}
                </p>
                <p class="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {{ notification.message }}
                </p>
                <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {{ formatTime(notification.createdAt) }}
                </p>
              </div>

              <!-- Clear button -->
              <button
                type="button"
                class="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                title="Clear notification"
                @click.stop="clearNotification(notification.id)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div
          v-if="notifications.length > 0"
          class="px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-center"
        >
          <button
            type="button"
            class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            @click="close"
          >
            View all notifications
          </button>
        </div>
      </div>
    </Transition>

    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="close"
    />
  </div>
</template>
