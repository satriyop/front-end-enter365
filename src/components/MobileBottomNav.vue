<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

interface NavItem {
  name: string
  label: string
  icon: 'home' | 'search' | 'plus' | 'bell' | 'menu' | 'document' | 'chart' | 'user'
  route?: string
  action?: () => void
  badge?: number
}

interface Props {
  /** Navigation items to display */
  items?: NavItem[]
  /** Notification count */
  notificationCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [
    { name: 'home', label: 'Home', icon: 'home', route: '/dashboard' },
    { name: 'documents', label: 'Docs', icon: 'document', route: '/quotations' },
    { name: 'create', label: 'Create', icon: 'plus' },
    { name: 'reports', label: 'Reports', icon: 'chart', route: '/reports' },
    { name: 'menu', label: 'Menu', icon: 'menu' },
  ],
  notificationCount: 0,
})

const emit = defineEmits<{
  'create': []
  'menu': []
}>()

const route = useRoute()
const router = useRouter()

// Check if nav item is active
function isActive(item: NavItem): boolean {
  if (!item.route) return false
  return route.path.startsWith(item.route)
}

// Handle nav item click
function handleClick(item: NavItem) {
  if (item.action) {
    item.action()
  } else if (item.name === 'create') {
    emit('create')
  } else if (item.name === 'menu') {
    emit('menu')
  } else if (item.route) {
    router.push(item.route)
  }
}

// Get badge count for item
function getBadge(item: NavItem): number | undefined {
  if (item.badge !== undefined) return item.badge
  if (item.name === 'notifications' || item.icon === 'bell') {
    return props.notificationCount > 0 ? props.notificationCount : undefined
  }
  return undefined
}
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 lg:hidden safe-area-bottom"
  >
    <div class="flex items-center justify-around h-16">
      <button
        v-for="item in items"
        :key="item.name"
        type="button"
        class="flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors relative"
        :class="[
          isActive(item)
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
          item.name === 'create' ? 'relative -mt-4' : '',
        ]"
        @click="handleClick(item)"
      >
        <!-- Special "Create" button with floating effect -->
        <template v-if="item.name === 'create'">
          <span
            class="flex items-center justify-center w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-colors"
          >
            <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </span>
        </template>

        <!-- Regular nav items -->
        <template v-else>
          <!-- Badge -->
          <span
            v-if="getBadge(item)"
            class="absolute top-1 right-1/4 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full px-1"
          >
            {{ getBadge(item)! > 99 ? '99+' : getBadge(item) }}
          </span>

          <!-- Icon -->
          <span class="mb-1">
            <!-- Home -->
            <svg v-if="item.icon === 'home'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>

            <!-- Search -->
            <svg v-else-if="item.icon === 'search'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            <!-- Bell (Notifications) -->
            <svg v-else-if="item.icon === 'bell'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>

            <!-- Menu (Hamburger) -->
            <svg v-else-if="item.icon === 'menu'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>

            <!-- Document -->
            <svg v-else-if="item.icon === 'document'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>

            <!-- Chart -->
            <svg v-else-if="item.icon === 'chart'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>

            <!-- User -->
            <svg v-else-if="item.icon === 'user'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>

            <!-- Plus (fallback) -->
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </span>

          <!-- Label -->
          <span class="text-[10px] font-medium">{{ item.label }}</span>
        </template>
      </button>
    </div>
  </nav>

  <!-- Spacer to prevent content from being hidden behind the nav -->
  <div class="h-16 lg:hidden" />
</template>

<style scoped>
/* Safe area for devices with home indicator (iPhone X+) */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 0);
}
</style>
