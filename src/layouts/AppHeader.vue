<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import NotificationsDropdown from '@/components/NotificationsDropdown.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
import { Search } from 'lucide-vue-next'

defineEmits<{
  toggleSidebar: []
  openCommandPalette: []
}>()

const auth = useAuthStore()
const showUserMenu = ref(false)

async function handleLogout() {
  await auth.logout()
}
</script>

<template>
  <header class="sticky top-0 z-10 flex items-center h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
    <!-- Toggle Sidebar -->
    <button
      class="p-2 -ml-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 lg:hidden"
      @click="$emit('toggleSidebar')"
    >
      <span class="text-xl">☰</span>
    </button>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Global Search Trigger -->
    <div class="hidden md:block mr-4 w-64">
      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
        @click="$emit('openCommandPalette')"
      >
        <Search class="w-4 h-4" />
        <span class="flex-1 text-left">Search...</span>
        <kbd class="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-mono bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400">
          <span class="text-xs">⌘</span>K
        </kbd>
      </button>
    </div>

    <!-- Theme Toggle -->
    <ThemeToggle size="sm" class="mr-2" />

    <!-- Notifications -->
    <NotificationsDropdown />

    <!-- User Menu -->
    <div class="relative ml-2">
      <button
        class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        @click="showUserMenu = !showUserMenu"
      >
        <div class="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-medium text-primary-700 dark:text-primary-400">
          {{ auth.user?.name?.charAt(0) ?? 'U' }}
        </div>
        <span class="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-200">
          {{ auth.user?.name ?? 'User' }}
        </span>
        <span class="text-slate-400 dark:text-slate-500">▼</span>
      </button>

      <!-- Dropdown -->
      <div
        v-if="showUserMenu"
        class="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1"
        @click="showUserMenu = false"
      >
        <div class="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
          <div class="text-sm font-medium text-slate-900 dark:text-slate-100">{{ auth.user?.name }}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400">{{ auth.user?.email }}</div>
        </div>
        <RouterLink to="/settings" class="block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
          Settings
        </RouterLink>
        <button
          class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-700"
          @click="handleLogout"
        >
          Logout
        </button>
      </div>
    </div>
  </header>
</template>
