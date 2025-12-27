<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboardSummary } from '@/api/useDashboard'
import { Badge } from '@/components/ui'

const router = useRouter()
const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// Use dashboard summary for real-time alerts
const { data: summary } = useDashboardSummary()

// Generate notifications from dashboard data
const notifications = computed(() => {
  const items: Array<{
    id: string
    type: 'info' | 'warning' | 'danger' | 'success'
    title: string
    message: string
    link?: string
    time?: string
    read: boolean
  }> = []

  if (!summary.value) return items

  const overdueReceivables = Number(summary.value.receivables?.overdue_count) || 0
  const overduePayables = Number(summary.value.payables?.overdue_count) || 0

  if (overdueReceivables > 0) {
    items.push({
      id: 'overdue-invoices',
      type: 'warning',
      title: 'Overdue Invoices',
      message: `${overdueReceivables} invoice${overdueReceivables > 1 ? 's' : ''} need attention`,
      link: '/invoices?status=overdue',
      read: false,
    })
  }

  if (overduePayables > 0) {
    items.push({
      id: 'overdue-bills',
      type: 'danger',
      title: 'Overdue Bills',
      message: `${overduePayables} bill${overduePayables > 1 ? 's' : ''} are past due`,
      link: '/bills?status=overdue',
      read: false,
    })
  }

  // Add recent activity from summary if available
  if (summary.value.recent_activity?.length) {
    summary.value.recent_activity.slice(0, 3).forEach((activity, index) => {
      items.push({
        id: `activity-${index}`,
        type: 'info',
        title: activity.type,
        message: activity.description,
        time: activity.date,
        read: true,
      })
    })
  }

  return items
})

const unreadCount = computed(() =>
  notifications.value.filter(n => !n.read).length
)

const typeColors = {
  info: 'bg-blue-100 text-blue-600',
  warning: 'bg-orange-100 text-orange-600',
  danger: 'bg-red-100 text-red-600',
  success: 'bg-green-100 text-green-600',
}

const typeIcons = {
  info: '📋',
  warning: '⚠️',
  danger: '🚨',
  success: '✅',
}

function handleClick(notification: (typeof notifications.value)[0]) {
  if (notification.link) {
    router.push(notification.link)
    isOpen.value = false
  }
}

// Close on outside click
function handleClickOutside(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div ref="dropdownRef" class="relative">
    <!-- Trigger button -->
    <button
      type="button"
      class="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      @click="isOpen = !isOpen"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 class="font-semibold text-slate-900">Notifications</h3>
          <Badge v-if="unreadCount > 0" variant="error">{{ unreadCount }} new</Badge>
        </div>

        <!-- Notifications list -->
        <div class="max-h-[400px] overflow-y-auto">
          <div v-if="notifications.length === 0" class="px-4 py-8 text-center text-slate-500">
            <span class="text-2xl block mb-2">🎉</span>
            <span class="text-sm">No notifications</span>
          </div>

          <div v-else class="divide-y divide-slate-100">
            <button
              v-for="notification in notifications"
              :key="notification.id"
              type="button"
              class="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
              :class="{ 'bg-slate-50': !notification.read }"
              @click="handleClick(notification)"
            >
              <!-- Icon -->
              <span
                class="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full"
                :class="typeColors[notification.type]"
              >
                {{ typeIcons[notification.type] }}
              </span>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-slate-900 text-sm">{{ notification.title }}</span>
                  <span
                    v-if="!notification.read"
                    class="w-2 h-2 bg-primary-500 rounded-full"
                  />
                </div>
                <p class="text-sm text-slate-500 truncate">{{ notification.message }}</p>
                <span v-if="notification.time" class="text-xs text-slate-400">{{ notification.time }}</span>
              </div>

              <!-- Arrow for clickable items -->
              <svg
                v-if="notification.link"
                class="w-4 h-4 text-slate-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            class="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-1"
            @click="isOpen = false"
          >
            Mark all as read
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
